import { Request, Response, Router } from 'express';
import { z } from 'zod';

import { AuthenticatedRequest } from '../middleware/auth';
import { amountToWords } from '../utils/currency';
import { prisma } from '../utils/db';

const router = Router();

const voucherTypeSchema = z.enum(['EXPENSE', 'ADJUSTMENT']);

const voucherLineSchema = z
  .object({
    description: z.string().optional(),
    unit: z.string().max(100).optional(),
    amount: z.coerce.number().min(0).optional(),
    lineOrder: z.number().int().min(0).optional(),
    isGap: z.boolean().optional()
  })
  .superRefine((data, ctx) => {
    if (data.isGap) {
      return;
    }

    if (!data.description || data.description.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Description is required for non-gap lines'
      });
    }

    if (typeof data.amount !== 'number') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Amount is required for non-gap lines'
      });
    }
  });

type VoucherLineInput = z.infer<typeof voucherLineSchema>;

type NormalizedLine = {
  description: string;
  unit?: string;
  amount: number;
  lineOrder: number;
  isGap: boolean;
};
const createVoucherSchema = z.object({
  serialNumber: z.string().min(1),
  issueDate: z.string().datetime().optional(),
  remarks: z.string().optional(),
  type: voucherTypeSchema.default('EXPENSE'),
  lines: z.array(voucherLineSchema).min(1)
});

const updateVoucherSchema = z.object({
  serialNumber: z.string().min(1).optional(),
  issueDate: z.string().datetime().optional(),
  remarks: z.string().optional(),
  type: voucherTypeSchema.optional(),
  lines: z.array(voucherLineSchema).min(1).optional()
});

const voucherSelect = {
  id: true,
  serialNumber: true,
  issueDate: true,
  remarks: true,
  totalAmount: true,
  totalAmountWords: true,
  type: true,
  createdAt: true,
  updatedAt: true,
  lines: {
    select: {
      id: true,
      description: true,
      unit: true,
      amount: true,
      lineOrder: true,
      isGap: true
    },
    orderBy: { lineOrder: 'asc' }
  }
} as const;

const ensureAuthUser = (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return null;
  }

  return req.user;
};

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const user = ensureAuthUser(req, res);
  if (!user) return;

  const vouchers = await prisma.voucher.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    select: voucherSelect
  });

  return res.json({ vouchers });
});

router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const user = ensureAuthUser(req, res);
  if (!user) return;

  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: 'Invalid voucher id' });
  }

  const voucher = await prisma.voucher.findFirst({
    where: { id, userId: user.id },
    select: voucherSelect
  });

  if (!voucher) {
    return res.status(404).json({ message: 'Voucher not found' });
  }

  return res.json({ voucher });
});

router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  const user = ensureAuthUser(req, res);
  if (!user) return;

  const parsed = createVoucherSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid input', errors: parsed.error.flatten() });
  }

  const { lines, issueDate, serialNumber, remarks, type } = parsed.data;

  const normalizedLines: NormalizedLine[] = lines
    .map((line: VoucherLineInput, index: number): NormalizedLine => ({
      description: line.description?.trim() ?? '',
      unit: line.unit?.trim() || undefined,
      amount: line.isGap ? 0 : line.amount ?? 0,
      lineOrder: line.lineOrder ?? index,
      isGap: line.isGap ?? false
    }))
    .sort((a: NormalizedLine, b: NormalizedLine) => a.lineOrder - b.lineOrder);

  const totalAmount = normalizedLines.reduce<number>(
    (sum: number, line: NormalizedLine) => sum + (line.isGap ? 0 : line.amount),
    0
  );
  const totalAmountWords = amountToWords(totalAmount);

  try {
    const voucher = await prisma.voucher.create({
      data: {
        serialNumber,
        issueDate: issueDate ? new Date(issueDate) : undefined,
        remarks,
        totalAmount: totalAmount.toFixed(2),
        totalAmountWords,
        type,
        userId: user.id,
        lines: {
          create: normalizedLines.map((line: NormalizedLine) => ({
            description: line.description,
            unit: line.unit ?? null,
            amount: line.amount.toFixed(2),
            lineOrder: line.lineOrder,
            isGap: line.isGap
          }))
        }
      },
      select: voucherSelect
    });

    return res.status(201).json({ voucher });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Serial number already exists' });
    }
    console.error('Failed to create voucher', error);
    return res.status(500).json({ message: 'Failed to create voucher' });
  }
});

router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const user = ensureAuthUser(req, res);
  if (!user) return;

  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: 'Invalid voucher id' });
  }

  const parsed = updateVoucherSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid input', errors: parsed.error.flatten() });
  }

  const existing = await prisma.voucher.findFirst({
    where: { id, userId: user.id },
    select: { id: true }
  });

  if (!existing) {
    return res.status(404).json({ message: 'Voucher not found' });
  }

  const { lines, issueDate, serialNumber, remarks, type } = parsed.data;

  const sortedLines = lines
    ?.map((line: VoucherLineInput, index: number): NormalizedLine => ({
      description: line.description?.trim() ?? '',
      unit: line.unit?.trim() || undefined,
      amount: line.isGap ? 0 : line.amount ?? 0,
      lineOrder: line.lineOrder ?? index,
      isGap: line.isGap ?? false
    }))
    .sort((a: NormalizedLine, b: NormalizedLine) => a.lineOrder - b.lineOrder);

  const totalAmount = sortedLines?.reduce<number>(
    (sum: number, line: NormalizedLine) => sum + (line.isGap ? 0 : line.amount),
    0
  );
  const totalAmountWords = typeof totalAmount === 'number' ? amountToWords(totalAmount) : undefined;

  try {
    const voucher = await prisma.voucher.update({
      where: { id },
      data: {
        serialNumber,
        issueDate: issueDate ? new Date(issueDate) : undefined,
        remarks,
        ...(typeof totalAmount === 'number'
          ? {
              totalAmount: totalAmount.toFixed(2),
              totalAmountWords
            }
          : {}),
        ...(sortedLines
          ? {
              lines: {
                deleteMany: { voucherId: id },
                create: sortedLines.map((line: NormalizedLine) => ({
                  description: line.description,
                  unit: line.unit ?? null,
                  amount: line.amount.toFixed(2),
                  lineOrder: line.lineOrder,
                  isGap: line.isGap
                }))
              }
            }
          : {}),
        ...(type ? { type } : {})
      },
      select: voucherSelect
    });

    return res.json({ voucher });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Serial number already exists' });
    }
    console.error('Failed to update voucher', error);
    return res.status(500).json({ message: 'Failed to update voucher' });
  }
});

router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const user = ensureAuthUser(req, res);
  if (!user) return;

  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: 'Invalid voucher id' });
  }

  const existing = await prisma.voucher.findFirst({
    where: { id, userId: user.id },
    select: { id: true }
  });

  if (!existing) {
    return res.status(404).json({ message: 'Voucher not found' });
  }

  try {
    await prisma.$transaction([
      prisma.voucherLine.deleteMany({ where: { voucherId: id } }),
      prisma.voucher.delete({ where: { id } })
    ]);

    return res.status(204).send();
  } catch (error: unknown) {
    console.error('Failed to delete voucher', error);
    return res.status(500).json({ message: 'Failed to delete voucher' });
  }
});

export default router;
