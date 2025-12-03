"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const currency_1 = require("../utils/currency");
const db_1 = require("../utils/db");
const router = (0, express_1.Router)();
const voucherTypeSchema = zod_1.z.enum(['EXPENSE', 'ADJUSTMENT']);
const voucherLineSchema = zod_1.z
    .object({
    description: zod_1.z.string().optional(),
    unit: zod_1.z.string().max(100).optional(),
    amount: zod_1.z.coerce.number().min(0).optional(),
    lineOrder: zod_1.z.number().int().min(0).optional(),
    isGap: zod_1.z.boolean().optional()
})
    .superRefine((data, ctx) => {
    if (data.isGap) {
        return;
    }
    if (!data.description || data.description.trim().length === 0) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: 'Description is required for non-gap lines'
        });
    }
    if (typeof data.amount !== 'number') {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: 'Amount is required for non-gap lines'
        });
    }
});
const createVoucherSchema = zod_1.z.object({
    serialNumber: zod_1.z.string().min(1),
    issueDate: zod_1.z.string().datetime().optional(),
    remarks: zod_1.z.string().optional(),
    type: voucherTypeSchema.default('EXPENSE'),
    lines: zod_1.z.array(voucherLineSchema).min(1)
});
const updateVoucherSchema = zod_1.z.object({
    serialNumber: zod_1.z.string().min(1).optional(),
    issueDate: zod_1.z.string().datetime().optional(),
    remarks: zod_1.z.string().optional(),
    type: voucherTypeSchema.optional(),
    lines: zod_1.z.array(voucherLineSchema).min(1).optional()
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
};
const ensureAuthUser = (req, res) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return null;
    }
    return req.user;
};
router.get('/', async (req, res) => {
    const user = ensureAuthUser(req, res);
    if (!user)
        return;
    const vouchers = await db_1.prisma.voucher.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        select: voucherSelect
    });
    return res.json({ vouchers });
});
router.get('/:id', async (req, res) => {
    const user = ensureAuthUser(req, res);
    if (!user)
        return;
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        return res.status(400).json({ message: 'Invalid voucher id' });
    }
    const voucher = await db_1.prisma.voucher.findFirst({
        where: { id, userId: user.id },
        select: voucherSelect
    });
    if (!voucher) {
        return res.status(404).json({ message: 'Voucher not found' });
    }
    return res.json({ voucher });
});
router.post('/', async (req, res) => {
    const user = ensureAuthUser(req, res);
    if (!user)
        return;
    const parsed = createVoucherSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: 'Invalid input', errors: parsed.error.flatten() });
    }
    const { lines, issueDate, serialNumber, remarks, type } = parsed.data;
    const normalizedLines = lines
        .map((line, index) => ({
        description: line.description?.trim() ?? '',
        unit: line.unit?.trim() || undefined,
        amount: line.isGap ? 0 : line.amount ?? 0,
        lineOrder: line.lineOrder ?? index,
        isGap: line.isGap ?? false
    }))
        .sort((a, b) => a.lineOrder - b.lineOrder);
    const totalAmount = normalizedLines.reduce((sum, line) => sum + (line.isGap ? 0 : line.amount), 0);
    const totalAmountWords = (0, currency_1.amountToWords)(totalAmount);
    try {
        const voucher = await db_1.prisma.voucher.create({
            data: {
                serialNumber,
                issueDate: issueDate ? new Date(issueDate) : undefined,
                remarks,
                totalAmount: totalAmount.toFixed(2),
                totalAmountWords,
                type,
                userId: user.id,
                lines: {
                    create: normalizedLines.map((line) => ({
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
    }
    catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ message: 'Serial number already exists' });
        }
        console.error('Failed to create voucher', error);
        return res.status(500).json({ message: 'Failed to create voucher' });
    }
});
router.put('/:id', async (req, res) => {
    const user = ensureAuthUser(req, res);
    if (!user)
        return;
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        return res.status(400).json({ message: 'Invalid voucher id' });
    }
    const parsed = updateVoucherSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: 'Invalid input', errors: parsed.error.flatten() });
    }
    const existing = await db_1.prisma.voucher.findFirst({
        where: { id, userId: user.id },
        select: { id: true }
    });
    if (!existing) {
        return res.status(404).json({ message: 'Voucher not found' });
    }
    const { lines, issueDate, serialNumber, remarks, type } = parsed.data;
    const sortedLines = lines
        ?.map((line, index) => ({
        description: line.description?.trim() ?? '',
        unit: line.unit?.trim() || undefined,
        amount: line.isGap ? 0 : line.amount ?? 0,
        lineOrder: line.lineOrder ?? index,
        isGap: line.isGap ?? false
    }))
        .sort((a, b) => a.lineOrder - b.lineOrder);
    const totalAmount = sortedLines?.reduce((sum, line) => sum + (line.isGap ? 0 : line.amount), 0);
    const totalAmountWords = typeof totalAmount === 'number' ? (0, currency_1.amountToWords)(totalAmount) : undefined;
    try {
        const voucher = await db_1.prisma.voucher.update({
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
                            create: sortedLines.map((line) => ({
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
    }
    catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ message: 'Serial number already exists' });
        }
        console.error('Failed to update voucher', error);
        return res.status(500).json({ message: 'Failed to update voucher' });
    }
});
router.delete('/:id', async (req, res) => {
    const user = ensureAuthUser(req, res);
    if (!user)
        return;
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        return res.status(400).json({ message: 'Invalid voucher id' });
    }
    const existing = await db_1.prisma.voucher.findFirst({
        where: { id, userId: user.id },
        select: { id: true }
    });
    if (!existing) {
        return res.status(404).json({ message: 'Voucher not found' });
    }
    try {
        await db_1.prisma.$transaction([
            db_1.prisma.voucherLine.deleteMany({ where: { voucherId: id } }),
            db_1.prisma.voucher.delete({ where: { id } })
        ]);
        return res.status(204).send();
    }
    catch (error) {
        console.error('Failed to delete voucher', error);
        return res.status(500).json({ message: 'Failed to delete voucher' });
    }
});
exports.default = router;
