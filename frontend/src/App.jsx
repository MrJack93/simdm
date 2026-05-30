import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import InventoryPage from './pages/InventoryPage';
import DeviceForm from './pages/DeviceForm';
import ProtectedRoute from './components/ProtectedRoute';

function Dashboard({ isDarkMode, setIsDarkMode }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen transition-colors" style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}>
      <header className="border-b px-8 py-4 flex justify-between items-center" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-accent)' }}>SIMDM</h1>
          <nav className="hidden md:flex gap-6">
            <a href="/inventory" className="text-sm font-medium hover:opacity-70 transition-opacity">
              Inventar
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="focusable p-2 rounded-lg hover:opacity-70 transition-opacity"
            aria-label={isDarkMode ? 'Comută la modul clar' : 'Comută la modul închis'}
            title={isDarkMode ? 'Modul clar' : 'Modul închis'}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
          <button onClick={logout} className="btn-danger px-4 py-2 text-sm">
            Deconectare
          </button>
        </div>
      </header>

      <main id="main">
        <Routes>
          <Route path="/inventory" element={<ProtectedRoute><InventoryPage /></ProtectedRoute>} />
          <Route path="/devices/new" element={<ProtectedRoute><DeviceForm /></ProtectedRoute>} />
          <Route path="/devices/:id/edit" element={<ProtectedRoute><DeviceForm /></ProtectedRoute>} />
          <Route path="/" element={
            <ProtectedRoute>
              <div className="container mx-auto p-8">
                <div className="card-base">
                  <p className="text-xl mb-3">
                    Bine ai venit, <span style={{ color: 'var(--color-accent)' }} className="font-bold">{user.username}</span>!
                  </p>
                  <p style={{ color: 'var(--color-text-secondary)' }}>
                    Faza 1 completă ✅ — Autentificare funcțională
                  </p>
                  <p style={{ color: 'var(--color-text-secondary)' }} className="mt-2">
                    Faza 2: <a href="/inventory" style={{ color: 'var(--color-accent)' }} className="hover:underline">Modul Inventar DM</a>
                  </p>
                </div>
              </div>
            </ProtectedRoute>
          } />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('simdm_theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    const html = document.documentElement;
    if (isDarkMode) {
      html.classList.remove('light-mode');
    } else {
      html.classList.add('light-mode');
    }
    localStorage.setItem('simdm_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>Se încarcă…</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <Dashboard isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />;
}
