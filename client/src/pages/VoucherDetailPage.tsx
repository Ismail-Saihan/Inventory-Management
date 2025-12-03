import { useQuery } from '@tanstack/react-query';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { fetchVoucher } from '../api/vouchers';
import { VoucherPreview } from '../components/VoucherPreview';
import { useAuth } from '../hooks/useAuth';
import { formatDate } from '../utils/format';
import { voucherToFormValues } from '../utils/transformers';

export const VoucherDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const voucherRef = useRef<HTMLDivElement | null>(null);
  const [isGeneratingPdf, setGeneratingPdf] = useState(false);
  const [pdfAction, setPdfAction] = useState<'download' | 'print' | null>(null);

  const voucherId = Number(id);

  const { data: voucher, isLoading, isError } = useQuery({
    queryKey: ['voucher', voucherId],
    queryFn: () => fetchVoucher(voucherId),
    enabled: Number.isFinite(voucherId)
  });

  if (!Number.isFinite(voucherId)) {
    return <p>Invalid voucher id.</p>;
  }

  if (isLoading) {
    return <p>Loading voucher...</p>;
  }

  if (isError || !voucher || !user) {
    return <p>Failed to load voucher.</p>;
  }

  const generatePdf = async (action: 'download' | 'print') => {
    if (!voucherRef.current) {
      return;
    }

    try {
      setPdfAction(action);
      setGeneratingPdf(true);
      const canvas = await html2canvas(voucherRef.current, {
        scale: 2,
        backgroundColor: '#ffffff'
      });
      const imageData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10; // match @page margin

      let renderWidth = pageWidth - margin * 2;
      let renderHeight = (canvas.height * renderWidth) / canvas.width;
      const maxHeight = pageHeight - margin * 2;

      if (renderHeight > maxHeight) {
        const ratio = maxHeight / renderHeight;
        renderHeight = maxHeight;
        renderWidth = renderWidth * ratio;
      }

      const xOffset = (pageWidth - renderWidth) / 2;
      const yOffset = margin;

      pdf.addImage(imageData, 'PNG', xOffset, yOffset, renderWidth, renderHeight, undefined, 'FAST');

      if (action === 'download') {
        pdf.save(`voucher-${voucher.serialNumber}.pdf`);
      } else {
        pdf.autoPrint();
        const blob = pdf.output('blob');
        const blobUrl = URL.createObjectURL(blob);
        const printWindow = window.open(blobUrl);

        if (!printWindow) {
          const anchor = document.createElement('a');
          anchor.href = blobUrl;
          anchor.download = `voucher-${voucher.serialNumber}.pdf`;
          document.body.appendChild(anchor);
          anchor.click();
          anchor.remove();
        }

        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
        }, 60_000);
      }
    } finally {
      setGeneratingPdf(false);
      setPdfAction(null);
    }
  };

  return (
    <section className="voucher-detail">
      <header className="voucher-detail__header">
        <div>
          <h1 className="page-title">Voucher #{voucher.serialNumber}</h1>
          <p className="page-subtitle">Issued on {formatDate(voucher.issueDate)}</p>
        </div>
        <div className="voucher-detail__actions">
          <button className="btn btn-secondary" type="button" onClick={() => navigate(-1)}>
            Back
          </button>
          <Link className="btn btn-secondary" to={`/vouchers/${voucher.id}/edit`}>
            Edit
          </Link>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => generatePdf('download')}
            disabled={isGeneratingPdf}
          >
            {isGeneratingPdf && pdfAction === 'download' ? 'Preparing PDF...' : 'Download PDF'}
          </button>
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => generatePdf('print')}
            disabled={isGeneratingPdf}
          >
            {isGeneratingPdf && pdfAction === 'print' ? 'Preparing Print...' : 'Print PDF'}
          </button>
        </div>
      </header>

      <div className="voucher-detail__preview">
        <VoucherPreview ref={voucherRef} user={user} values={voucherToFormValues(voucher)} />
      </div>
    </section>
  );
};
