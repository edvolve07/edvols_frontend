import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(
    Boolean(localStorage.getItem('token') || localStorage.getItem('auth_token')),
  );
  const [revoked, setRevoked] = useState(false);

  const refresh = useCallback(async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    if (!token) {
      setLoading(false);
      return;
    }
    localStorage.setItem('token', token);
    localStorage.setItem('auth_token', token);
    try {
      const data = await apiFetch('/auth/me');
      setUser(data.user);
      setRevoked(false);
    } catch (error) {
      if (error.locked) {
        setRevoked(true);
        setUser(null);
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('auth_token');
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const loginWithToken = useCallback((token, nextUser) => {
    localStorage.setItem('token', token);
    localStorage.setItem('auth_token', token);
    setUser(nextUser);
    setRevoked(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('auth_token');
    setUser(null);
    setRevoked(false);
  }, []);

  const value = useMemo(
    () => ({ user, loading, revoked, loginWithToken, logout, refresh }),
    [user, loading, revoked, loginWithToken, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
