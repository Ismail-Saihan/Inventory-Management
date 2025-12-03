import type {
  Voucher,
  VoucherLine,
  VoucherPayload,
  VoucherType,
  VoucherView,
  VoucherViewLine
} from '../types/api';
import type { VoucherFormValues } from '../types/forms';

const parseAmount = (amount: string): number => parseFloat(amount ?? '0');

const mapLine = (line: VoucherLine): VoucherViewLine => ({
  id: line.id,
  description: line.description,
  unit: line.unit ?? null,
  amount: parseAmount(line.amount),
  lineOrder: line.lineOrder,
  isGap: line.isGap ?? false
});

export const mapVoucher = (voucher: Voucher): VoucherView => ({
  id: voucher.id,
  serialNumber: voucher.serialNumber,
  issueDate: voucher.issueDate,
  remarks: voucher.remarks,
  totalAmount: parseAmount(voucher.totalAmount),
  totalAmountWords: voucher.totalAmountWords,
  type: voucher.type,
  createdAt: voucher.createdAt,
  updatedAt: voucher.updatedAt,
  lines: voucher.lines.map(mapLine)
});

export const mapVouchers = (vouchers: Voucher[]): VoucherView[] => vouchers.map(mapVoucher);

export const voucherToFormValues = (voucher: VoucherView): VoucherFormValues => ({
  serialNumber: voucher.serialNumber,
  issueDate: voucher.issueDate.slice(0, 10),
  remarks: voucher.remarks ?? '',
  voucherType: voucher.type ?? ('EXPENSE' as VoucherType),
  lines: voucher.lines.map((line, index) => ({
    id: line.id,
    description: line.description,
    unit: line.unit ?? '',
    amount: line.amount,
    lineOrder: index,
    isGap: line.isGap ?? false
  }))
});

export const formValuesToPayload = (values: VoucherFormValues): VoucherPayload => ({
  serialNumber: values.serialNumber,
  issueDate: values.issueDate
    ? new Date(values.issueDate).toISOString()
    : undefined,
  remarks: values.remarks || undefined,
  type: values.voucherType,
  lines: values.lines.map((line, index) => ({
    description: line.description,
    unit: line.unit || undefined,
    amount: Number(line.amount || 0),
    lineOrder: index,
    isGap: line.isGap ?? false
  }))
});

export const createEmptyFormValues = (): VoucherFormValues => ({
  serialNumber: '',
  issueDate: new Date().toISOString().slice(0, 10),
  remarks: '',
  voucherType: 'EXPENSE',
  lines: [{ description: '', unit: '', amount: 0, lineOrder: 0, isGap: false }]
});
