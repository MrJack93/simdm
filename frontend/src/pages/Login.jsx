import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Eye, EyeOff } from 'lucide-react';

// Schema validare — mesaje în română, consistente cu restul aplicației
const loginSchema = z.object({
  username: z.string().min(1, 'Utilizatorul este obligatoriu'),
  password: z.string().min(1, 'Parola este obligatorie'),
});

const features = [
  { icon: '📋', title: 'Inventar Centralizat',   desc: 'Gestiune completă a dispozitivelor medicale cu clasificare pe secții și status tracking în timp real' },
  { icon: '🔧', title: 'Planificare Mentenanță',  desc: 'Mentenanță preventivă și corectivă cu calendar inteligent și notificări automate' },
  { icon: '⚠️', title: 'Vigilență și Incidente', desc: 'Raportare incidente și gestionare riscuri medicale conform standardelor' },
];

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  // Erori venite de la server (credențiale greșite, conexiune etc.)
  // Separate de erorile de validare client gestionate de RHF.
  const [serverError, setServerError] = useState('');
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur', // Validare la pierderea focusului — feedback rapid, non-intruziv
  });

  const onSubmit = async ({ username, password }) => {
    setServerError('');
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setServerError(err.response?.data?.error || 'Eroare de conectare. Încearcă din nou.');
    }
  };

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

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

            {/* Username */}
            <div>
              <label htmlFor="username" className="label-base">Utilizator</label>
              <input
                {...register('username')}
                id="username"
                type="text"
                className={`input-base${errors.username ? ' border-[var(--color-error)]' : ''}`}
                placeholder="bioinginer"
                autoComplete="username"
                autoFocus
                disabled={isSubmitting}
                aria-invalid={!!errors.username}
                aria-describedby={errors.username ? 'username-error' : undefined}
              />
              {errors.username && (
                <p
                  id="username-error"
                  role="alert"
                  className="text-sm mt-1"
                  style={{ color: 'var(--color-error)' }}
                >
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="label-base">Parolă</label>
              <div className="relative">
                <input
                  {...register('password')}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`input-base pr-12${errors.password ? ' border-[var(--color-error)]' : ''}`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:opacity-70 transition-opacity focus-visible:outline-none focus-visible:ring-2"
                  aria-label={showPassword ? 'Ascunde parola' : 'Arată parola'}
                  aria-pressed={showPassword}
                  style={{
                    color: 'var(--color-text-secondary)',
                    '--tw-ring-color': 'var(--color-accent)',
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p
                  id="password-error"
                  role="alert"
                  className="text-sm mt-1"
                  style={{ color: 'var(--color-error)' }}
                >
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Eroare server (credențiale invalide, eroare rețea etc.) */}
            {serverError && (
              <div
                role="alert"
                className="p-4 rounded-lg border flex items-start gap-3"
                style={{ backgroundColor: 'var(--color-error-bg)', borderColor: 'var(--color-error)', color: 'var(--color-error)' }}
              >
                <span className="text-lg mt-0.5" aria-hidden="true">⚠️</span>
                <p className="text-sm">{serverError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
            >
              {isSubmitting && <div className="loading-spinner loading-spinner-sm" />}
              {isSubmitting ? 'Se conectează…' : 'Conectare'}
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
