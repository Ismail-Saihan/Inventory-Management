import type { ReactNode } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';

export const AppLayout = ({ children }: { children?: ReactNode }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__branding">
          <span className="app-header__title">Carrybee Voucher Portal</span>
        </div>
        <nav className="app-header__nav">
          <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'active' : undefined)}>
            Dashboard
          </NavLink>
          <NavLink to="/vouchers/new" className={({ isActive }) => (isActive ? 'active' : undefined)}>
            New Voucher
          </NavLink>
          {user?.role === 'ADMIN' && (
            <NavLink
              to="/admin/user-approvals"
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              User Approvals
            </NavLink>
          )}
        </nav>
        <div className="app-header__user">
          {user && (
            <>
              <div className="app-header__user-info">
                <span className="app-header__user-name">{user.name}</span>
                <span className="app-header__user-meta">
                  {user.designation}
                  {user.role === 'ADMIN' && <span className="badge badge-admin">Admin</span>}
                </span>
              </div>
              <button className="btn btn-secondary" type="button" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}
        </div>
      </header>
      <main className="app-main">{children ?? <Outlet />}</main>
    </div>
  );
};
