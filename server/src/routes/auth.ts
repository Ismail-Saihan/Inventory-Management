import { Request, Response, Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

import { env } from '../env';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../utils/db';
import { normalizeRole, type UserRole } from '../utils/userRole';

const router = Router();

const userProfileSelect = {
  id: true,
  empId: true,
  name: true,
  designation: true,
  department: true,
  cellNo: true,
  email: true,
  role: true,
  isApproved: true,
  createdAt: true,
  updatedAt: true
} as const;

const registerSchema = z.object({
  empId: z.string().min(1),
  name: z.string().min(1),
  password: z.string().min(8),
  designation: z.string().min(1),
  department: z.string().min(1),
  cellNo: z.string().min(4),
  email: z.string().email().optional()
});

const loginSchema = z.object({
  empId: z.string().min(1),
  password: z.string().min(1)
});

const sanitizeUser = (user: {
  id: number;
  empId: string;
  name: string;
  designation: string;
  department: string;
  cellNo: string;
  email: string | null;
  role: UserRole;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: user.id,
  empId: user.empId,
  name: user.name,
  designation: user.designation,
  department: user.department,
  cellNo: user.cellNo,
  email: user.email,
  role: user.role,
  isApproved: user.isApproved,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

const createToken = (userId: number) =>
  jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: '12h' });

const forgotPasswordSchema = z.object({
  empId: z.string().min(1),
  cellNo: z.string().min(4),
  newPassword: z.string().min(8)
});

router.post('/register', async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid input', errors: parsed.error.flatten() });
  }

  const { empId, email, password, ...rest } = parsed.data;

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: email ? [{ empId }, { email }] : [{ empId }]
    }
  });

  if (existingUser) {
    return res.status(409).json({ message: 'User already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      empId,
      email,
      passwordHash,
      role: 'USER',
      isApproved: false,
      ...rest
    }
  });

  return res
    .status(201)
    .json({ message: 'Registration received. An administrator will review your account shortly.' });
});

router.post('/login', async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid input', errors: parsed.error.flatten() });
  }

  const { empId, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { empId },
    select: {
      ...userProfileSelect,
      passwordHash: true
    }
  });

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  if (!user.isApproved) {
    return res
      .status(403)
      .json({ message: 'Your account is awaiting administrator approval. Please try again later.' });
  }

  const token = createToken(user.id);

  return res.json({ token, user: sanitizeUser({ ...user, role: normalizeRole(user.role) }) });
});

router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: userProfileSelect
  });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.json({ user: { ...user, role: normalizeRole(user.role) } });
});

router.post('/forgot-password', async (req: Request, res: Response) => {
  const parsed = forgotPasswordSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid input', errors: parsed.error.flatten() });
  }

  const { empId, cellNo, newPassword } = parsed.data;

  const user = await prisma.user.findUnique({ where: { empId } });

  if (!user || user.cellNo !== cellNo) {
    return res.status(400).json({ message: 'Employee details did not match our records.' });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash }
  });

  return res.json({ message: 'Password updated successfully. You can now log in with your new password.' });
});

export default router;
