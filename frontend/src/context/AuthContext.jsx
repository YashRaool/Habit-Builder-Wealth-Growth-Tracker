import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true); // resolving stored token

  /* Restore session from localStorage on mount */
  useEffect(() => {
    const token = localStorage.getItem('wh-token');
    if (!token) { setLoading(false); return; }

    api.get('/auth/me')
      .then(({ user }) => setUser(user))
      .catch(() => { localStorage.removeItem('wh-token'); })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { token, user } = await api.post('/auth/login', { email, password });
    if (!token || !user) throw { errors: ['Invalid authentication response'] };
    localStorage.setItem('wh-token', token);
    setUser(user);
    return user;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const { token, user } = await api.post('/auth/register', { name, email, password });
    if (!token || !user) throw { errors: ['Invalid authentication response'] };
    localStorage.setItem('wh-token', token);
    setUser(user);
    return user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('wh-token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside <AuthProvider>');
  return ctx;
}
