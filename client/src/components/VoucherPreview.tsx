import { forwardRef } from 'react';

const carrybeeLogo = '/Picture1.jpg';
import type { UserProfile } from '../types/api';
import type { VoucherFormValues } from '../types/forms';
import { amountToWords } from '../utils/format';

interface VoucherPreviewProps {
  user: UserProfile;
  values: VoucherFormValues;
  title?: string;
}

export const VoucherPreview = forwardRef<HTMLDivElement, VoucherPreviewProps>(
  ({ user, values }, ref) => {
    const total = values.lines.reduce(
      (sum, line) => sum + (line.isGap ? 0 : line.amount || 0),
      0
    );
    const totalInWords = total > 0 ? amountToWords(total) : '';

    const formatAmount = (amount?: number | null) => {
      if (typeof amount !== 'number' || !Number.isFinite(amount)) return '';
      return Number(amount.toFixed(2)).toString();
    };

    const isLineFilled = (line: VoucherFormValues['lines'][number] | null | undefined) => {
      if (!line) return false;
      if (line.isGap) {
        return Boolean(line.description?.trim().length);
      }
      const hasDescription = Boolean(line.description?.trim().length);
      const hasUnit = Boolean(line.unit?.trim().length);
      const hasAmount = typeof line.amount === 'number' && line.amount > 0;
      return hasDescription || hasUnit || hasAmount;
    };

    const minimumRows = 8;
    const rowsToRender = Array.from({ length: Math.max(values.lines.length, minimumRows) }).map(
      (_, index) => values.lines[index] ?? null
    );
    const shouldShowSerialNumbers = values.lines.some((line) => line && !line.isGap && isLineFilled(line));

    let serialIndex = 0;
    const renderedRows = rowsToRender.map((line, index) => {
      const isGap = Boolean(line?.isGap);
      const isFilled = isLineFilled(line);
      const showSerial = shouldShowSerialNumbers && isFilled && !isGap;
      if (showSerial) {
        serialIndex += 1;
      }
      const slNumber = showSerial ? `${serialIndex}.` : '';
      return (
        <tr key={line?.id ?? `row-${index}`} className={isGap ? 'voucher__row--gap' : undefined}>
          <td className="col-sl">{slNumber}</td>
          <td className="col-description">
            {line?.description ?? ''}
            {isGap && <div className="voucher__description-gap" />}
          </td>
          <td className="col-unit">{isGap ? '' : line?.unit ?? ''}</td>
          <td className="col-amount">
            {isGap ? '' : line && line.amount ? formatAmount(line.amount) : ''}
          </td>
        </tr>
      );
    });

    const formattedDate = values.issueDate
      ? new Date(values.issueDate).toLocaleDateString('en-GB')
      : '';

    const formattedTotal = total > 0 ? `${formatAmount(total)}/=` : '/=';
    const voucherTypeLabel =
      values.voucherType === 'ADJUSTMENT'
        ? 'Adjustment Voucher Form'
        : 'Expense Voucher Form';

    return (
      <div className="voucher voucher--carrybee" ref={ref}>
        <header className="voucher__header voucher__header--carrybee">
          {values.serialNumber && (
            <span className="voucher__tracking">Voucher No: {values.serialNumber}</span>
          )}
          <img src={carrybeeLogo} alt="Carrybee logo" className="voucher__logo" />
          <div className="voucher__company">
            <p className="voucher__company-name">CARRYBEE EXPRESS LTD.</p>
            <p className="voucher__company-address">
              House: 97, Sohrawardy Ave, Baridhara Diplomatic Zone, Dhaka 1212
            </p>
          </div>
        </header>

        <div className="voucher__title-bar">{voucherTypeLabel} : CARRYBEE EXPRESS LTD.</div>

        <section className="voucher__details">
          <div className="voucher__details-row">
            <div className="voucher__detail">
              <span className="voucher__detail-label">Name:</span>
              <span className="voucher__detail-value">{user.name ?? ''}</span>
            </div>
            <div className="voucher__detail">
              <span className="voucher__detail-label">EMP ID:</span>
              <span className="voucher__detail-value">{user.empId ?? ''}</span>
            </div>
            <div className="voucher__detail">
              <span className="voucher__detail-label">Date:</span>
              <span className="voucher__detail-value">{formattedDate}</span>
            </div>
          </div>
          <div className="voucher__details-row">
            <div className="voucher__detail">
              <span className="voucher__detail-label">Designation:</span>
              <span className="voucher__detail-value">{user.designation ?? ''}</span>
            </div>
            <div className="voucher__detail">
              <span className="voucher__detail-label">Department:</span>
              <span className="voucher__detail-value">{user.department ?? ''}</span>
            </div>
            <div className="voucher__detail">
              <span className="voucher__detail-label">Cell:</span>
              <span className="voucher__detail-value">{user.cellNo ?? ''}</span>
            </div>
          </div>
        </section>

        <table className="voucher__table voucher__table--carrybee">
          <thead>
            <tr>
              <th className="col-sl">Sl. No.</th>
              <th>Particulars / Purpose</th>
              <th className="col-unit">Unit</th>
              <th className="col-amount">Amount</th>
            </tr>
          </thead>
          <tbody>{renderedRows}</tbody>
          <tfoot>
            <tr className="voucher__total-row">
              <td className="text-right" colSpan={3}>
                Total
              </td>
              <td className="col-amount voucher__total-amount-cell">
                {formattedTotal}
              </td>
            </tr>
            <tr className="voucher__amount-row">
              <td colSpan={4}>
                <span className="voucher__amount-label">Tk. (In Words):</span>
                <span className="voucher__amount-value">{totalInWords}</span>
              </td>
            </tr>
          </tfoot>
        </table>

        <footer className="voucher__signatures">
          {[ 'Submitted by', 'Recommended by', 'Approved by', 'Received by' ].map((label) => (
            <div className="voucher__signature" key={label}>
              <span className="voucher__signature-line" />
              <span className="voucher__signature-label">{label}</span>
            </div>
          ))}
        </footer>
      </div>
    );
  }
);

VoucherPreview.displayName = 'VoucherPreview';
