import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';

import { register as registerUser, type RegisterRequest } from '../api/auth';

const DEFAULT_FORM: RegisterRequest & { confirmPassword: string } = {
  empId: '',
  name: '',
  password: '',
  confirmPassword: '',
  designation: '',
  department: '',
  cellNo: '',
  email: ''
};

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(DEFAULT_FORM);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const handleChange = (field: keyof typeof form) => (event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const empId = form.empId.trim();
    const name = form.name.trim();
    const designation = form.designation.trim();
    const department = form.department.trim();
    const cellNo = form.cellNo.trim();
  const email = (form.email ?? '').trim();

    if (!empId || !name || !designation || !department || !cellNo) {
      setError('Please fill out all required fields.');
      return;
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const payload: RegisterRequest = {
      empId,
      name,
      password: form.password,
      designation,
      department,
      cellNo,
      email: email.length > 0 ? email : undefined
    };

    setSubmitting(true);
    try {
      const response = await registerUser(payload);
      setSuccess(response.message);
      setForm({ ...DEFAULT_FORM });
      window.setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      if (isAxiosError(err) && err.response?.data && typeof err.response.data === 'object') {
        const data = err.response.data as {
          message?: string;
          errors?: { fieldErrors?: Record<string, string[]> };
        };
        const firstFieldError = data.errors?.fieldErrors
          ? Object.values(data.errors.fieldErrors).find((messages) => messages.length > 0)?.[0]
          : undefined;

        setError(firstFieldError ?? data.message ?? 'Registration failed. Please try again.');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page winter">
      <form className="login-card frosted auth-card" onSubmit={handleSubmit}>
        <h1 className="login-card__title winter">Create Account</h1>
        <p className="auth-support-text">
          Submit your details to request access. An administrator will approve your account before you
          can log in.
        </p>

        {error && <p className="login-error">{error}</p>}
        {success && <p className="auth-success">{success}</p>}

        <div className="auth-form-grid">
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

          <label className="login-label" htmlFor="name">
            Full Name
            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange('name')}
              required
            />
          </label>

          <label className="login-label" htmlFor="designation">
            Designation
            <input
              id="designation"
              name="designation"
              type="text"
              value={form.designation}
              onChange={handleChange('designation')}
              required
            />
          </label>

          <label className="login-label" htmlFor="department">
            Department
            <input
              id="department"
              name="department"
              type="text"
              value={form.department}
              onChange={handleChange('department')}
              required
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
              minLength={4}
            />
          </label>

          <label className="login-label" htmlFor="email">
            Email (optional)
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              autoComplete="email"
            />
          </label>

          <label className="login-label" htmlFor="password">
            Password
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange('password')}
              required
              autoComplete="new-password"
              minLength={8}
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
              minLength={8}
            />
          </label>
        </div>

        <button className="login-card__submit winter" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
        </button>

        <p className="login-footer">
          Already have an account? <Link to="/login">Back to login</Link>
        </p>
      </form>
    </div>
  );
};
