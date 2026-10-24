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
      .then((res) => {
        const u = res?.user || res?.data?.user || (res?.data && res.data._id ? res.data : null);
        if (u) setUser(u);
      })
      .catch(() => { localStorage.removeItem('wh-token'); })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const token = res.token || res.data?.token;
    const user = res.user || res.data?.user;
    if (!token || !user) throw { errors: ['Invalid authentication response'] };
    localStorage.setItem('wh-token', token);
    setUser(user);
    return user;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    const token = res.token || res.data?.token;
    const user = res.user || res.data?.user;
    if (!token || !user) throw { errors: ['Invalid authentication response'] };
    localStorage.setItem('wh-token', token);
    setUser(user);
    return user;
  }, []);

  const loginWithGoogle = useCallback(async (credential) => {
    const res = await api.post('/auth/google', { credential });
    const token = res.token || res.data?.token;
    const loggedInUser = res.user || res.data?.user;
    if (!token || !loggedInUser) throw { errors: ['Invalid authentication response'] };
    localStorage.setItem('wh-token', token);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('wh-token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside <AuthProvider>');
  return ctx;
}
