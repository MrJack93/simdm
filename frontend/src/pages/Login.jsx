import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  const features = [
    { icon: '📋', title: 'Inventar Centralizat',    desc: 'Gestiune completă a dispozitivelor medicale cu clasificare pe secții și status tracking în timp real' },
    { icon: '🔧', title: 'Planificare Mentenanță',   desc: 'Mentenanță preventivă și corectivă cu calendar inteligent și notificări automate' },
    { icon: '⚠️', title: 'Vigilență și Incidente',  desc: 'Raportare incidente și gestionare riscuri medicale conform standardelor' },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ backgroundColor: 'var(--color-bg-primary)' }}>

      {/* Hero — desktop */}
      <div
        className="hidden md:flex md:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ backgroundColor: 'var(--color-bg-secondary)' }}
      >
        {/* Decorative radial glow */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{ background: 'radial-gradient(circle at 30% 50%, var(--color-accent), transparent 55%)' }}
        />

        <div className="relative z-10">
          <h1 className="text-6xl font-extrabold tracking-tight mb-2" style={{ color: 'var(--color-accent)' }}>
            SIMDM
          </h1>
          <p className="text-lg font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            Sistem Management Dispozitive Medicale
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
            Gestionare centralizată pentru spitale
          </p>
        </div>

        <div className="space-y-6 relative z-10">
          {features.map(({ icon, title, desc }) => (
            <div key={title} className="flex gap-4">
              <div
                className="flex-shrink-0 flex items-center justify-center text-2xl"
                style={{ width: 52, height: 52, borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-accent-subtle)' }}
              >
                {icon}
              </div>
              <div>
                <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>{title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs relative z-10" style={{ color: 'var(--color-text-tertiary)' }}>
          © 2026 SIMDM. Toate drepturile rezervate.
        </p>
      </div>

      {/* Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8">
        <div
          className="w-full max-w-md p-8 rounded-2xl border"
          style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
        >
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Conectare</h2>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Introdu credențialele tale pentru a accesa sistemul
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Username */}
            <div>
              <label htmlFor="username" className="label-base">Utilizator</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="input-base"
                placeholder="bioinginer"
                autoComplete="username"
                autoFocus
                disabled={loading}
                required
                aria-required="true"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="label-base">Parolă</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-base pr-12"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={loading}
                  required
                  aria-required="true"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:opacity-70 transition-opacity"
                  aria-label={showPassword ? 'Ascunde parola' : 'Arată parola'}
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="p-4 rounded-lg border flex items-start gap-3"
                style={{ backgroundColor: 'var(--color-error-bg)', borderColor: 'var(--color-error)', color: 'var(--color-error)' }}
              >
                <span className="text-lg mt-0.5" aria-hidden="true">⚠️</span>
                <p className="text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
            >
              {loading && <div className="loading-spinner loading-spinner-sm" />}
              {loading ? 'Se conectează…' : 'Conectare'}
            </button>
          </form>

          <div
            className="mt-8 pt-6 border-t text-center text-xs"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
          >
            <p className="mb-1">Demo:</p>
            <p className="font-mono" style={{ color: 'var(--color-text-primary)' }}>bioinginer / parola</p>
          </div>
        </div>
      </div>
    </div>
  );
}
