import { Navigate, Route, Routes } from 'react-router-dom';

import './App.css';
import { AppLayout } from './components/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardPage } from './pages/DashboardPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminUserApprovalsPage } from './pages/AdminUserApprovalsPage';
import { VoucherDetailPage } from './pages/VoucherDetailPage';
import { VoucherFormPage } from './pages/VoucherFormPage';

const App = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route
      element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }
    >
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/vouchers/new" element={<VoucherFormPage />} />
      <Route path="/vouchers/:id/edit" element={<VoucherFormPage />} />
      <Route path="/vouchers/:id" element={<VoucherDetailPage />} />
      <Route path="/admin/user-approvals" element={<AdminUserApprovalsPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

export default App;
