import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

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
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: 'var(--color-bg-primary)' }}
    >
      {/* Hero Section — Desktop Only */}
      <div
        className="hidden md:flex md:w-1/2 flex-col justify-between p-12"
        style={{ backgroundColor: 'var(--color-bg-secondary)' }}
      >
        <div>
          <h1
            className="text-5xl font-bold mb-2"
            style={{ color: 'var(--color-accent)' }}
          >
            SIMDM
          </h1>
          <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
            Sistem Management Dispozitive Medicale
          </p>
        </div>

        <div className="space-y-8">
          {/* Feature 1 */}
          <div className="flex gap-4">
            <div className="text-3xl">📋</div>
            <div>
              <h3 className="font-bold mb-1">Inventar Centralizat</h3>
              <p style={{ color: 'var(--color-text-secondary)' }} className="text-sm">
                Gestiune completă a dispozitivelor medicale cu clasificare pe secții
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex gap-4">
            <div className="text-3xl">🔧</div>
            <div>
              <h3 className="font-bold mb-1">Planificare Mentenanță</h3>
              <p style={{ color: 'var(--color-text-secondary)' }} className="text-sm">
                Mentenanță preventivă și corectivă cu calendar și notificări
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex gap-4">
            <div className="text-3xl">⚠️</div>
            <div>
              <h3 className="font-bold mb-1">Vigilență și Incidente</h3>
              <p style={{ color: 'var(--color-text-secondary)' }} className="text-sm">
                Raportare incidente și gestionare riscuri medicale
              </p>
            </div>
          </div>
        </div>

        <p style={{ color: 'var(--color-text-secondary)' }} className="text-xs">
          © 2026 SIMDM. Toate drepturile rezervate.
        </p>
      </div>

      {/* Login Form Section */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4">
        <div
          className="w-full max-w-sm p-8 rounded-2xl"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid',
            borderColor: 'var(--color-border)'
          }}
        >
          <h2 className="text-2xl font-bold text-center mb-1">Conectare</h2>
          <p style={{ color: 'var(--color-text-secondary)' }} className="text-center text-sm mb-8">
            Introdu credențialele tale pentru a continua
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="username" className="label-base">
                Utilizator
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-base"
                placeholder="bioinginer"
                autoComplete="username"
                autoFocus
                disabled={loading}
                required
                aria-required="true"
              />
            </div>

            <div>
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
              <div role="alert" className="alert-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="btn-primary w-full mt-6"
            >
              {loading ? 'Se conectează…' : 'Conectare'}
            </button>
          </form>

          <div style={{ color: 'var(--color-text-secondary)' }} className="text-xs text-center mt-6 pt-6 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <p className="mb-1">Demo: <span style={{ color: 'var(--color-text-primary)' }}>bioinginer</span> / <span style={{ color: 'var(--color-text-primary)' }}>parola</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
