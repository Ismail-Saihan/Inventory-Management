import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { env } from '../env';
import { prisma } from '../utils/db';
import { normalizeRole, type UserRole } from '../utils/userRole';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    empId: string;
    name: string;
    designation: string;
    department: string;
    cellNo: string;
    email?: string | null;
    role: UserRole;
    isApproved: boolean;
  };
}

interface JwtPayload {
  userId: number;
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing authorization header' });
    }

    const token = authHeader.substring('Bearer '.length);
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        empId: true,
        name: true,
        designation: true,
        department: true,
        cellNo: true,
        email: true,
        role: true,
        isApproved: true
      }
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    (req as AuthenticatedRequest).user = {
      ...user,
      role: normalizeRole(user.role)
    };
    next();
  } catch (error) {
    console.error('Authentication error', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authRequest = req as AuthenticatedRequest;

  if (!authRequest.user || authRequest.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  return next();
};
