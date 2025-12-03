import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { createVoucher, fetchVoucher, fetchVouchers, updateVoucher } from '../api/vouchers';
import { VoucherForm } from '../components/VoucherForm';
import { VoucherPreview } from '../components/VoucherPreview';
import { useAuth } from '../hooks/useAuth';
import type { VoucherPayload } from '../types/api';
import type { VoucherFormValues } from '../types/forms';
import {
  createEmptyFormValues,
  formValuesToPayload,
  voucherToFormValues
} from '../utils/transformers';

const deriveNextSerialNumber = (serials: string[]): string => {
  if (serials.length === 0) {
    return '0001';
  }

  let maxValue = 0;
  let maxWidth = 4;
  let maxPrefix = '';

  serials.forEach((serial) => {
    const match = serial.match(/(\d+)(?!.*\d)/);
    if (!match) {
      return;
    }

    const digits = match[1];
    const prefix = serial.slice(0, serial.length - digits.length);
    const value = Number.parseInt(digits, 10);

    if (!Number.isNaN(value) && value >= maxValue) {
      maxValue = value;
      maxWidth = digits.length;
      maxPrefix = prefix;
    }
  });

  if (maxValue === 0 && maxPrefix === '') {
    return '0001';
  }

  const nextValue = (maxValue || serials.length) + 1;
  const width = Math.max(maxWidth, 4);
  return `${maxPrefix}${nextValue.toString().padStart(width, '0')}`;
};

export const VoucherFormPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const params = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const voucherId = params.id ? Number(params.id) : undefined;
  const isEditPath = location.pathname.endsWith('/edit');
  const isEditMode = Boolean(voucherId && (searchParams.get('mode') === 'edit' || isEditPath));

  const [values, setValues] = useState<VoucherFormValues>(() => createEmptyFormValues());
  const previewRef = useRef<HTMLDivElement>(null);

  const { data: existingVouchers } = useQuery({
    queryKey: ['vouchers'],
    queryFn: fetchVouchers,
    enabled: !isEditMode
  });

  const { data: voucher, isLoading: isVoucherLoading } = useQuery({
    queryKey: ['voucher', voucherId],
    queryFn: () => fetchVoucher(voucherId!),
    enabled: isEditMode && Boolean(voucherId)
  });

  useEffect(() => {
    if (isEditMode && voucher) {
      setValues(voucherToFormValues(voucher));
    }
  }, [isEditMode, voucher]);

  useEffect(() => {
    if (isEditMode || !existingVouchers) {
      return;
    }

    setValues((prev) => {
      if (prev.serialNumber.trim().length > 0) {
        return prev;
      }

      const nextSerial = deriveNextSerialNumber(existingVouchers.map((item) => item.serialNumber));
      return { ...prev, serialNumber: nextSerial };
    });
  }, [existingVouchers, isEditMode]);

  const mutation = useMutation({
    mutationFn: (payload: VoucherPayload) => {
      if (isEditMode && voucherId) {
        return updateVoucher(voucherId, payload);
      }
      return createVoucher(payload);
    },
    onSuccess: (createdVoucher) => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['voucher', createdVoucher.id] });
      navigate(`/vouchers/${createdVoucher.id}`);
    }
  });

  const handleSubmit = async (formValues: VoucherFormValues) => {
    await mutation.mutateAsync(formValuesToPayload(formValues));
  };

  const previewValues = useMemo(() => values, [values]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const shouldShowPreview = isEditMode;
  const editorClassName = `voucher-editor ${isEditMode ? 'voucher-editor--edit' : 'voucher-editor--create'}`;

  const goToVoucherList = () => {
    navigate('/vouchers');
  };

  if (!user) {
    return <p>Loading user profile...</p>;
  }

  if (isEditMode && isVoucherLoading) {
    return <p>Loading voucher...</p>;
  }

  return (
    <section className={editorClassName}>
      {isEditMode && (
        <header className="voucher-editor__header">
          <div>
            <h1 className="page-title">Edit Voucher</h1>
            <p className="page-subtitle">
              Employee: {user.name} | {user.empId} | {user.department}
            </p>
          </div>
        </header>
      )}

      <div className="voucher-editor__content">
        <div className="voucher-editor__form">
          {isEditMode ? (
            <VoucherForm
              values={values}
              onChange={setValues}
              onSubmit={handleSubmit}
              submitLabel="Update Voucher"
              isSubmitting={mutation.isPending}
            />
          ) : (
            <div className="voucher-create-card">
              <div className="voucher-create-card__header">
                <h2 className="voucher-create-card__title">Member Voucher</h2>
                <p className="voucher-create-card__subtitle">
                  Enter the details below to create a new voucher.
                </p>
              </div>
              <VoucherForm
                values={values}
                onChange={setValues}
                onSubmit={handleSubmit}
                submitLabel="Create Voucher"
                isSubmitting={mutation.isPending}
              />
              <div className="voucher-create-card__footer">
                <span>Need to review existing vouchers?</span>
                <button className="voucher-create-card__link" type="button" onClick={goToVoucherList}>
                  Open Voucher List
                </button>
              </div>
            </div>
          )}
        </div>
        {shouldShowPreview && (
          <div className="voucher-editor__preview">
            <div className="preview-card">
              <div className="preview-card__header">
                <h2>Preview</h2>
                <button className="btn btn-secondary" type="button" onClick={handlePrint}>
                  Print
                </button>
              </div>
              <VoucherPreview ref={previewRef} user={user} values={previewValues} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
