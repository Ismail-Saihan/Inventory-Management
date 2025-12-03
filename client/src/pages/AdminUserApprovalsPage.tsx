import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';

import { approveUser, fetchPendingUsers } from '../api/auth';
import { useAuth } from '../hooks/useAuth';
import { formatDate } from '../utils/format';

export const AdminUserApprovalsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  if (!user) {
    return null;
  }

  if (user.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  const { data: pendingUsers, isLoading, isError } = useQuery({
    queryKey: ['pending-users'],
    queryFn: fetchPendingUsers
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => approveUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
    }
  });

  return (
    <section className="dashboard">
      <header className="dashboard__header">
        <div>
          <h1 className="page-title">Pending User Approvals</h1>
          <p className="page-subtitle">
            Review and approve newly registered users so they can access the voucher portal.
          </p>
        </div>
      </header>

      {isLoading && <p>Loading pending users...</p>}
      {isError && <p className="error">Unable to load pending users. Please try again.</p>}
      {approveMutation.isError && (
        <p className="error">Failed to approve the user. Please try again.</p>
      )}

      {!isLoading && pendingUsers && pendingUsers.length === 0 && (
        <div className="empty-state">
          <p>All caught up! No users are waiting for approval.</p>
        </div>
      )}

      {!isLoading && pendingUsers && pendingUsers.length > 0 && (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Designation</th>
                <th>Department</th>
                <th>Contact</th>
                <th>Email</th>
                <th>Requested</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.map((pendingUser) => (
                <tr key={pendingUser.id}>
                  <td data-label="Employee ID">{pendingUser.empId}</td>
                  <td data-label="Name">{pendingUser.name}</td>
                  <td data-label="Designation">{pendingUser.designation}</td>
                  <td data-label="Department">{pendingUser.department}</td>
                  <td data-label="Contact">{pendingUser.cellNo}</td>
                  <td data-label="Email">{pendingUser.email ?? 'N/A'}</td>
                  <td data-label="Requested">{formatDate(pendingUser.createdAt)}</td>
                  <td data-label="Actions" className="table-actions">
                    <button
                      className="btn btn-primary"
                      type="button"
                      onClick={() => approveMutation.mutate(pendingUser.id)}
                      disabled={
                        approveMutation.isPending && approveMutation.variables === pendingUser.id
                      }
                    >
                      {approveMutation.isPending && approveMutation.variables === pendingUser.id
                        ? 'Approving...'
                        : 'Approve'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
