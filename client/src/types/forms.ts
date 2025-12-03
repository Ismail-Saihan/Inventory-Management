import type { VoucherType } from './api';

export interface VoucherLineFormValue {
  id?: number;
  description: string;
  unit: string;
  amount: number;
  lineOrder: number;
  isGap?: boolean;
}

export interface VoucherFormValues {
  serialNumber: string;
  issueDate: string;
  remarks: string;
  voucherType: VoucherType;
  lines: VoucherLineFormValue[];
}
