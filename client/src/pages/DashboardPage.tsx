import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { deleteVoucher, fetchVouchers } from '../api/vouchers';
import { useAuth } from '../hooks/useAuth';
import type { VoucherView } from '../types/api';
import { formatCurrency, formatDate } from '../utils/format';

export const DashboardPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: vouchers, isLoading, isError } = useQuery({
    queryKey: ['vouchers'],
    queryFn: fetchVouchers
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteVoucher(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
    }
  });

  const handleDelete = (voucher: VoucherView) => {
    if (
      confirm(
        `Are you sure you want to delete voucher ${voucher.serialNumber}? This cannot be undone.`
      )
    ) {
      deleteMutation.mutate(voucher.id);
    }
  };

  return (
    <section className="dashboard">
      <header className="dashboard__header">
        <div>
          <h1 className="page-title">Voucher Dashboard</h1>
          {user && (
            <p className="page-subtitle">
              Logged in as {user.name} ({user.empId}) | {user.department}
            </p>
          )}
        </div>
        <Link className="btn btn-primary" to="/vouchers/new">
          Create Voucher
        </Link>
      </header>

      {user?.role === 'ADMIN' && (
        <div className="admin-banner">
          <p>New user registrations are awaiting approval.</p>
          <Link className="btn btn-outline" to="/admin/user-approvals">
            Review registrations
          </Link>
        </div>
      )}

      {isLoading && <p>Loading vouchers...</p>}
      {isError && <p className="error">Failed to load vouchers. Please try again.</p>}

      {!isLoading && vouchers && vouchers.length === 0 && (
        <div className="empty-state">
          <p>No vouchers yet. Create your first voucher to get started.</p>
          <Link className="btn btn-primary" to="/vouchers/new">
            Create Voucher
          </Link>
        </div>
      )}

      {!isLoading && vouchers && vouchers.length > 0 && (
        <div className="table-wrapper table-wrapper--dashboard">
          <div className="table-responsive">
            <table className="data-table data-table--vouchers">
              <colgroup>
                <col className="col-serial" />
                <col className="col-date" />
                <col className="col-amount" />
                <col className="col-remarks" />
                <col className="col-actions" />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">Serial</th>
                  <th scope="col">Issued On</th>
                  <th scope="col">Total Amount</th>
                  <th scope="col">Remarks</th>
                  <th scope="col" className="text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {vouchers.map((voucher) => (
                  <tr key={voucher.id}>
                    <td data-label="Serial" className="data-table__serial">
                      <span className="serial-chip">{voucher.serialNumber}</span>
                    </td>
                    <td data-label="Issued On" className="data-table__date">
                      {formatDate(voucher.issueDate)}
                    </td>
                    <td data-label="Total" className="data-table__amount">
                      {formatCurrency(voucher.totalAmount)}
                    </td>
                    <td data-label="Remarks" className="data-table__remarks">
                      {voucher.remarks ? (
                        <span title={voucher.remarks}>{voucher.remarks}</span>
                      ) : (
                        <span className="muted">No remarks</span>
                      )}
                    </td>
                    <td data-label="Actions" className="table-actions">
                      <Link className="table-actions__button" to={`/vouchers/${voucher.id}`}>
                        View
                      </Link>
                      <Link
                        className="table-actions__button"
                        to={`/vouchers/${voucher.id}/edit`}
                      >
                        Edit
                      </Link>
                      <button
                        className="table-actions__button table-actions__button--danger"
                        type="button"
                        onClick={() => handleDelete(voucher)}
                        disabled={deleteMutation.isPending}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};
