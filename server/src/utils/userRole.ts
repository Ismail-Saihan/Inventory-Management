export type UserRole = 'ADMIN' | 'USER';

export const normalizeRole = (role: string | null | undefined): UserRole =>
  role === 'ADMIN' ? 'ADMIN' : 'USER';
