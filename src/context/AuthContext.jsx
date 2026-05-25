import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api/services';
import { unwrapApiData } from '../api/unwrap';

/** Stable fallback so `useAuth()` never returns null (avoids destructuring errors outside provider). */
const authContextDefault = {
  user: null,
  loading: false,
  login: () => {},
  logout: async () => {},
  refreshUser: async () => null,
};

const AuthContext = createContext(authContextDefault);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return null;
    }
    try {
      const response = await authAPI.getMe();
      const userData = unwrapApiData(response);
      setUser(userData);
      return userData;
    } catch (err) {
      // 401 = token invalid/expired — clear everything
      if (err?.response?.status === 401) {
        localStorage.clear();
        setUser(null);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  // ── login: called from OAuthCallbackPage and password/OTP login ──────────
  // Stores tokens FIRST, then optionally seeds user state
  const login = useCallback((tokens, userData) => {
    if (tokens?.accessToken)  localStorage.setItem('accessToken',  tokens.accessToken);
    if (tokens?.refreshToken) localStorage.setItem('refreshToken', tokens.refreshToken);
    // Only seed user if we have real data (not empty {})
    if (userData && Object.keys(userData).length > 0) {
      setUser(userData);
    }
  }, []);

  const logout = async () => {
    try { await authAPI.logout(); } catch {}
    localStorage.clear();
    setUser(null);
  };

  // refreshUser returns the fetched user so callers can use it immediately
  const refreshUser = useCallback(() => fetchMe(), [fetchMe]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  return ctx ?? authContextDefault;
}
