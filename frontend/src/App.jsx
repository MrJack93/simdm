import { Routes, Route } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import InventoryPage from './pages/InventoryPage';
import DeviceForm from './pages/DeviceForm';
import ProtectedRoute from './components/ProtectedRoute';

function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 px-8 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-cyan-400">SIMDM</h1>
        <button onClick={logout} className="btn-danger px-4 py-2 text-sm">
          Deconectare
        </button>
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
                    Bine ai venit, <span className="text-cyan-400 font-bold">{user.username}</span>!
                  </p>
                  <p className="text-gray-400">
                    Faza 1 completă ✅ — Autentificare funcțională
                  </p>
                  <p className="text-gray-400 mt-2">
                    Faza 2: <a href="/inventory" className="text-cyan-400 hover:underline">Modul Inventar DM</a>
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center" role="status">
        <p className="text-gray-400">Se încarcă…</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <Dashboard />;
}
