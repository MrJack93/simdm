import { useState, useEffect } from 'react';
import api from '../api/axios';
import { AuthContext } from './auth.context';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verifică dacă este logat la încărcare
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = sessionStorage.getItem('accessToken');
        if (!token) {
          // Încearcă refresh în caz că cookie-ul există
          try {
            const { data } = await api.post('/auth/refresh');
            sessionStorage.setItem('accessToken', data.accessToken);
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

  const login = async (username, password) => {
    const { data } = await api.post('/auth/login', { username, password });
    sessionStorage.setItem('accessToken', data.accessToken);
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('[AuthContext] Logout error:', error.message);
    }
    sessionStorage.removeItem('accessToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
