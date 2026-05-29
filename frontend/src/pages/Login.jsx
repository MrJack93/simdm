import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      const msg = err.response?.data?.error || 'Eroare de conectare. Încearcă din nou.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 w-full max-w-sm shadow-2xl">
        <h1 className="text-2xl font-bold text-cyan-400 text-center mb-1">SIMDM</h1>
        <p className="text-gray-500 text-center text-sm mb-8">
          Sistem Management Dispozitive Medicale
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label htmlFor="username" className="label-base">
              Utilizator
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-base"
              placeholder="inginer"
              autoComplete="username"
              autoFocus
              disabled={loading}
              required
              aria-required="true"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="label-base">
              Parolă
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-base"
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={loading}
              required
              aria-required="true"
            />
          </div>

          {error && (
            <div role="alert" className="alert-error mb-4">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="btn-primary w-full mt-2"
          >
            {loading ? 'Se conectează…' : 'Conectare'}
          </button>
        </form>
      </div>
    </div>
  );
}
