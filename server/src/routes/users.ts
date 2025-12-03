import { Response, Router } from 'express';

import { AuthenticatedRequest, requireAdmin } from '../middleware/auth';
import { prisma } from '../utils/db';
import { normalizeRole } from '../utils/userRole';

const router = Router();

const userApprovalSelect = {
  id: true,
  empId: true,
  name: true,
  designation: true,
  department: true,
  cellNo: true,
  email: true,
  role: true,
  isApproved: true,
  createdAt: true
} as const;

router.use(requireAdmin);

router.get('/pending', async (_req: AuthenticatedRequest, res: Response) => {
  const users = await prisma.user.findMany({
    where: { isApproved: false },
    orderBy: { createdAt: 'asc' },
    select: userApprovalSelect
  });

  return res.json({
    users: users.map((user: (typeof users)[number]) => ({
      ...user,
      role: normalizeRole(user.role)
    }))
  });
});

router.post('/:id/approve', async (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    return res.status(400).json({ message: 'Invalid user id' });
  }

  const existing = await prisma.user.findUnique({
    where: { id },
    select: userApprovalSelect
  });

  if (!existing) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (normalizeRole(existing.role) === 'ADMIN') {
    return res.status(400).json({ message: 'Cannot modify administrator accounts through this endpoint.' });
  }

  if (existing.isApproved) {
    return res.json({ user: { ...existing, role: normalizeRole(existing.role) } });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { isApproved: true },
    select: userApprovalSelect
  });

  return res.json({ user: { ...updated, role: normalizeRole(updated.role) } });
});

export default router;
