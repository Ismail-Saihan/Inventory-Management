import { api } from './client';
import type { Voucher, VoucherPayload, VoucherView } from '../types/api';
import { mapVoucher, mapVouchers } from '../utils/transformers';

export const fetchVouchers = async (): Promise<VoucherView[]> => {
  const { data } = await api.get<{ vouchers: Voucher[] }>('/vouchers');
  return mapVouchers(data.vouchers);
};

export const fetchVoucher = async (id: number): Promise<VoucherView> => {
  const { data } = await api.get<{ voucher: Voucher }>(`/vouchers/${id}`);
  return mapVoucher(data.voucher);
};

export const createVoucher = async (payload: VoucherPayload): Promise<VoucherView> => {
  const { data } = await api.post<{ voucher: Voucher }>('/vouchers', payload);
  return mapVoucher(data.voucher);
};

export const updateVoucher = async (
  id: number,
  payload: VoucherPayload
): Promise<VoucherView> => {
  const { data } = await api.put<{ voucher: Voucher }>(`/vouchers/${id}`, payload);
  return mapVoucher(data.voucher);
};

export const deleteVoucher = async (id: number): Promise<void> => {
  await api.delete(`/vouchers/${id}`);
};
