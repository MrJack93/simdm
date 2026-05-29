import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';

export default function App() {
  const { user, loading, logout } = useAuth();

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

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 px-8 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-cyan-400">SIMDM</h1>
        <button onClick={logout} className="btn-danger px-4 py-2 text-sm">
          Deconectare
        </button>
      </header>

      <main id="main" className="container mx-auto p-8">
        <div className="card-base">
          <p className="text-xl mb-3">
            Bine ai venit, <span className="text-cyan-400 font-bold">{user.username}</span>!
          </p>
          <p className="text-gray-400">
            Faza 1 completă ✅ — Autentificare funcțională
          </p>
          <p className="text-gray-400 mt-2">
            Faza 2: Modul Inventar DM (în curând…)
          </p>
        </div>
      </main>
    </div>
  );
}
