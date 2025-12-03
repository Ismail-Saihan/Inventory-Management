export type UserRole = 'ADMIN' | 'USER';
export type VoucherType = 'EXPENSE' | 'ADJUSTMENT';

export interface UserProfile {
  id: number;
  empId: string;
  name: string;
  designation: string;
  department: string;
  cellNo: string;
  email?: string | null;
  role: UserRole;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PendingUser {
  id: number;
  empId: string;
  name: string;
  designation: string;
  department: string;
  cellNo: string;
  email?: string | null;
  role: UserRole;
  isApproved: boolean;
  createdAt: string;
}

export interface VoucherLine {
  id?: number;
  description: string;
  unit?: string | null;
  amount: string;
  lineOrder: number;
  isGap?: boolean;
}

export interface VoucherViewLine {
  id?: number;
  description: string;
  unit?: string | null;
  amount: number;
  lineOrder: number;
  isGap?: boolean;
}

export interface Voucher {
  id: number;
  serialNumber: string;
  issueDate: string;
  remarks?: string | null;
  totalAmount: string;
  totalAmountWords: string;
  type: VoucherType;
  createdAt: string;
  updatedAt: string;
  lines: VoucherLine[];
}

export interface VoucherView {
  id: number;
  serialNumber: string;
  issueDate: string;
  remarks?: string | null;
  totalAmount: number;
  totalAmountWords: string;
  type: VoucherType;
  createdAt: string;
  updatedAt: string;
  lines: VoucherViewLine[];
}

export interface VoucherPayload {
  serialNumber: string;
  issueDate?: string;
  remarks?: string;
  type?: VoucherType;
  lines: Array<{
    description: string;
    unit?: string;
    amount: number;
    lineOrder?: number;
    isGap?: boolean;
  }>;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface RegistrationResponse {
  message: string;
}

export interface ForgotPasswordResponse {
  message: string;
}
