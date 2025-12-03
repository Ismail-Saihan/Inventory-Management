import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { isAxiosError } from 'axios';

import { forgotPassword as resetPassword, type ForgotPasswordRequest } from '../api/auth';

export const ForgotPasswordPage = () => {
  const [form, setForm] = useState<ForgotPasswordRequest & { confirmPassword: string }>({
    empId: '',
    cellNo: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const handleChange = (field: keyof typeof form) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const payload: ForgotPasswordRequest = {
      empId: form.empId.trim(),
      cellNo: form.cellNo.trim(),
      newPassword: form.newPassword
    };

    setSubmitting(true);
    try {
  const response = await resetPassword(payload);
      setSuccess(response.message);
      setForm({ empId: '', cellNo: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      if (isAxiosError(err) && err.response?.data && typeof err.response.data === 'object') {
        const message = (err.response.data as { message?: string }).message;
        setError(message ?? 'Password reset failed. Please try again.');
      } else {
        setError('Password reset failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page winter">
      <form className="login-card frosted auth-card" onSubmit={handleSubmit}>
        <h1 className="login-card__title winter">Reset Password</h1>
        <p className="auth-support-text">
          Enter your employee ID, registered contact number, and a new password. Make sure your
          details match our records.
        </p>

        {error && <p className="login-error">{error}</p>}
        {success && <p className="auth-success">{success}</p>}

        <label className="login-label" htmlFor="empId">
          Employee ID
          <input
            id="empId"
            name="empId"
            type="text"
            value={form.empId}
            onChange={handleChange('empId')}
            required
            autoComplete="username"
          />
        </label>

        <label className="login-label" htmlFor="cellNo">
          Contact Number
          <input
            id="cellNo"
            name="cellNo"
            type="tel"
            value={form.cellNo}
            onChange={handleChange('cellNo')}
            required
          />
        </label>

        <label className="login-label" htmlFor="newPassword">
          New Password
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            value={form.newPassword}
            onChange={handleChange('newPassword')}
            required
            autoComplete="new-password"
          />
        </label>

        <label className="login-label" htmlFor="confirmPassword">
          Confirm Password
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange('confirmPassword')}
            required
            autoComplete="new-password"
          />
        </label>

        <button className="login-card__submit winter" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Updating...' : 'Update Password'}
        </button>

        <p className="login-footer">
          Remembered your password? <Link to="/login">Back to login</Link>
        </p>
      </form>
    </div>
  );
};
