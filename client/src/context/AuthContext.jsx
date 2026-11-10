import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('fht_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Verify token on mount and merge stored profile details
  useEffect(() => {
    const token = localStorage.getItem('fht_token');
    if (token) {
      if (token.startsWith('demo_token_')) {
        setLoading(false);
        return;
      }
      authAPI.getMe()
        .then((res) => {
          try {
            const stored = localStorage.getItem('fht_user');
            const storedUser = stored ? JSON.parse(stored) : {};
            const merged = { ...storedUser, ...res.data.data.user };
            localStorage.setItem('fht_user', JSON.stringify(merged));
            setUser(merged);
          } catch {
            setUser(res.data.data.user);
          }
        })
        .catch(() => {
          // If offline or using client session, preserve stored session if present
          const stored = localStorage.getItem('fht_user');
          if (stored) {
            try {
              setUser(JSON.parse(stored));
            } catch {
              logout();
            }
          } else {
            logout();
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('fht_token', token);
    localStorage.setItem('fht_user', JSON.stringify(userData));
    setUser(userData);
  };

  const loginWithGoogle = async (googleAuthData) => {
    const res = await authAPI.googleLogin(googleAuthData);
    const { token, user: userData } = res.data.data;
    login(token, userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('fht_token');
    localStorage.removeItem('fht_user');
    setUser(null);
  };

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    localStorage.setItem('fht_user', JSON.stringify(updated));
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginWithGoogle,
        logout,
        updateUser,
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
