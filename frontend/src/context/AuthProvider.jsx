import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../api/axios';
import { getToken, setToken, clearToken } from '../api/tokenStore';
import { AuthContext } from './auth.context';

/** @typedef {import('../types').User} User */

/** @param {{ children: React.ReactNode }} props */
export function AuthProvider({ children }) {
  /** @type {[User|null, React.Dispatch<React.SetStateAction<User|null>>]} */
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verifică dacă este logat la încărcare
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = getToken();
        if (!token) {
          // Încearcă refresh în caz că cookie-ul există
          try {
            const { data } = await api.post('/auth/refresh');
            setToken(data.accessToken);
          } catch {
            // Nu e ok, nu sunt logat
            setUser(null);
            setLoading(false);
            return;
          }
        }

        const { data } = await api.get('/auth/me');
        setUser(data.user);
      } catch (error) {
        console.error('[AuthContext] Bootstrap error:', error.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(async (username, password) => {
    const { data } = await api.post('/auth/login', { username, password });
    setToken(data.accessToken);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('[AuthContext] Logout error:', error.message);
    }
    clearToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
