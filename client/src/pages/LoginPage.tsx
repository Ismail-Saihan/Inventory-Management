import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';

import { useAuth } from '../hooks/useAuth';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isLoading, isAuthenticated } = useAuth();
  const REMEMBER_KEY = 'voucher-app-remembered-emp-id';
  const rememberedEmpId = useMemo(
    () => (typeof window !== 'undefined' ? localStorage.getItem(REMEMBER_KEY) : null),
    []
  );
  const [empId, setEmpId] = useState(rememberedEmpId ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState<boolean>(Boolean(rememberedEmpId));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    try {
      await login({ empId, password });
      navigate('/dashboard');
    } catch (err) {
      console.error('Login failed', err);
      if (isAxiosError(err) && err.response?.data && typeof err.response.data === 'object') {
        const message = (err.response.data as { message?: string }).message;
        setError(message ?? 'Login failed. Please check your credentials.');
      } else {
        setError('Login failed. Please check your credentials.');
      }
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (rememberMe && empId) {
      localStorage.setItem(REMEMBER_KEY, empId);
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }
  }, [rememberMe, empId]);

  return (
    <div className="login-page winter">
      <form className="login-card frosted" onSubmit={handleSubmit}>
        <h1 className="login-card__title winter">Login</h1>
        {error && <p className="login-error">{error}</p>}

        <label className="login-label" htmlFor="empId">
          Email
        </label>
        <input
          id="empId"
          name="empId"
          type="text"
          value={empId}
          onChange={(event) => setEmpId(event.target.value)}
          autoComplete="username"
          required
        />

        <label className="login-label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />

        <div className="login-options">
          <label className="remember">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            Remember me
          </label>
          <Link to="/forgot-password">Forgot password?</Link>
        </div>

        <button className="login-card__submit winter" type="submit" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Log in'}
        </button>

        <p className="login-footer">
          Don't have an account?{' '}
          <Link className="login-card__register winter" to="/register">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
};
