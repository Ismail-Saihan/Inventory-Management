import { useMemo } from 'react';

import { useAuthContext } from '../providers/AuthProvider';

export const useAuth = () => {
  const { user, token, isLoading, login, logout, refresh } = useAuthContext();

  return useMemo(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: Boolean(user && token),
      login,
      logout,
      refresh
    }),
    [user, token, isLoading, login, logout, refresh]
  );
};
