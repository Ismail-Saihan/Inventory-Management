import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react';
import type { ReactNode } from 'react';

import { fetchCurrentUser, login as loginRequest, type LoginRequest } from '../api/auth';
import { setAuthToken } from '../api/client';
import type { UserProfile } from '../types/api';

const TOKEN_STORAGE_KEY = 'voucher-app-token';

interface AuthContextValue {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setTokenState] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_STORAGE_KEY)
  );
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const applyToken = useCallback((value: string | null) => {
    setTokenState(value);
    if (value) {
      localStorage.setItem(TOKEN_STORAGE_KEY, value);
      setAuthToken(value);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setAuthToken(undefined);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const currentUser = await fetchCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Failed to fetch current user', error);
      applyToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [token, applyToken]);

  const login = useCallback(
    async (payload: LoginRequest) => {
      setIsLoading(true);
      try {
        const { token: newToken, user: loggedInUser } = await loginRequest(payload);
        applyToken(newToken);
        setUser(loggedInUser);
      } finally {
        setIsLoading(false);
      }
    },
    [applyToken]
  );

  const logout = useCallback(() => {
    applyToken(null);
    setUser(null);
  }, [applyToken]);

  useEffect(() => {
    if (token) {
      setAuthToken(token);
    }
    refresh().catch((error) => {
      console.error('Initial auth load failed', error);
    });
  }, [token, refresh]);

  const value: AuthContextValue = {
    user,
    token,
    isLoading,
    login,
    logout,
    refresh
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};
