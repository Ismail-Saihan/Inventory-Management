import type { ChangeEvent, FormEvent } from 'react';

import type { VoucherFormValues } from '../types/forms';
import { formatCurrency } from '../utils/format';

interface VoucherFormProps {
  values: VoucherFormValues;
  onChange: (values: VoucherFormValues) => void;
  onSubmit: (values: VoucherFormValues) => Promise<void> | void;
  submitLabel?: string;
  isSubmitting?: boolean;
}

export const VoucherForm = ({
  values,
  onChange,
  onSubmit,
  submitLabel = 'Save Voucher',
  isSubmitting = false
}: VoucherFormProps) => {
  const handleFieldChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    onChange({ ...values, [name]: value });
  };

  const handleVoucherTypeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    onChange({ ...values, voucherType: value as VoucherFormValues['voucherType'] });
  };

  const handleLineChange = (
    index: number,
    field: 'description' | 'unit' | 'amount',
    value: string
  ) => {
    const updatedLines = values.lines.map((line, idx) => {
      if (idx !== index) return line;
      if (field === 'description') {
        return { ...line, description: value };
      }
      if (field === 'unit') {
        return { ...line, unit: value };
      }

      const amount = Number.parseFloat(value);
      return { ...line, amount: Number.isNaN(amount) ? 0 : amount };
    });

    onChange({ ...values, lines: updatedLines });
  };

  const handleAddLine = () => {
    const newLineOrder = values.lines.length;
    onChange({
      ...values,
      lines: [
        ...values.lines,
        { description: '', unit: '', amount: 0, lineOrder: newLineOrder, isGap: false }
      ]
    });
  };

  const handleAddGap = () => {
    const newLineOrder = values.lines.length;
    onChange({
      ...values,
      lines: [
        ...values.lines,
        { description: '', unit: '', amount: 0, lineOrder: newLineOrder, isGap: true }
      ]
    });
  };

  const handleRemoveLine = (index: number) => {
    const filtered = values.lines.filter((_, idx) => idx !== index).map((line, idx) => ({
      ...line,
      lineOrder: idx
    }));

    onChange({ ...values, lines: filtered });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onSubmit(values);
  };

  const total = values.lines.reduce((sum, line) => sum + (line.amount || 0), 0);

  return (
    <form className="voucher-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <span className="form-label">Voucher Type</span>
        <div className="voucher-type-toggle" role="radiogroup" aria-label="Voucher type">
          {[
            { value: 'EXPENSE', label: 'Expense Voucher' },
            { value: 'ADJUSTMENT', label: 'Adjustment Voucher' }
          ].map((option) => {
            const isActive = values.voucherType === option.value;
            return (
              <label
                key={option.value}
                className={`voucher-type-toggle__option${isActive ? ' is-active' : ''}`}
              >
                <input
                  type="radio"
                  name="voucherType"
                  value={option.value}
                  checked={isActive}
                  onChange={handleVoucherTypeChange}
                />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="serialNumber">Serial Number</label>
          <input
            id="serialNumber"
            name="serialNumber"
            type="text"
            value={values.serialNumber}
            onChange={handleFieldChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="issueDate">Date</label>
          <input
            id="issueDate"
            name="issueDate"
            type="date"
            value={values.issueDate}
            onChange={handleFieldChange}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="remarks">Remarks</label>
        <textarea
          id="remarks"
          name="remarks"
          rows={3}
          value={values.remarks}
          onChange={handleFieldChange}
          placeholder="Add any remarks or notes"
        />
      </div>

      <div className="line-items">
        <div className="line-items__header">
          <h3>Particulars</h3>
          <div className="line-items__actions">
            <button className="btn btn-secondary" type="button" onClick={handleAddLine}>
              Add Line
            </button>
            <button className="btn btn-secondary" type="button" onClick={handleAddGap}>
              Add Gap
            </button>
          </div>
        </div>

        <div className="line-items__table">
          <div className="line-items__row line-items__row--head">
            <span>SL</span>
            <span>Particulars / Purpose</span>
            <span>Unit</span>
            <span>Amount (BDT)</span>
            <span />
          </div>

          {values.lines.map((line, index) => (
            <div
              className={`line-items__row${line.isGap ? ' line-items__row--gap' : ''}`}
              key={line.lineOrder}
            >
              <span>{line.isGap ? '' : index + 1}</span>
              {line.isGap ? (
                <textarea
                  value={line.description}
                  onChange={(event) => handleLineChange(index, 'description', event.target.value)}
                  placeholder="Leave blank for an empty gap"
                  rows={3}
                />
              ) : (
                <textarea
                  value={line.description}
                  onChange={(event) => handleLineChange(index, 'description', event.target.value)}
                  placeholder="Describe the expense or adjustment"
                  rows={3}
                  required
                />
              )}
              {line.isGap ? (
                <span className="line-items__gap-placeholder" aria-hidden="true">
                  —
                </span>
              ) : (
                <input
                  type="text"
                  value={line.unit ?? ''}
                  onChange={(event) => handleLineChange(index, 'unit', event.target.value)}
                  placeholder="Unit"
                />
              )}
              {line.isGap ? (
                <span className="line-items__gap-placeholder" aria-hidden="true">
                  —
                </span>
              ) : (
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.amount.toString()}
                  onChange={(event) => handleLineChange(index, 'amount', event.target.value)}
                  required
                />
              )}
              <button
                className="btn btn-icon"
                type="button"
                onClick={() => handleRemoveLine(index)}
                aria-label="Remove line"
                disabled={values.lines.length === 1}
              >
                x
              </button>
            </div>
          ))}
        </div>

        <div className="line-items__footer">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
};
