import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { Eye, EyeOff, Sun, Moon } from 'lucide-react';
import SkipLink from '../components/SkipLink';

const loginSchema = z.object({
  username: z.string().min(1, 'Utilizatorul este obligatoriu'),
  password: z.string().min(1, 'Parola este obligatorie'),
  rememberMe: z.boolean().optional(),
});

const features = [
  { icon: '📋', title: 'Inventar Centralizat',   desc: 'Gestiune completă a dispozitivelor medicale cu clasificare pe secții și status tracking în timp real' },
  { icon: '🔧', title: 'Planificare Mentenanță',  desc: 'Mentenanță preventivă și corectivă cu calendar inteligent și notificări automate' },
  { icon: '⚠️', title: 'Vigilență și Incidente', desc: 'Raportare incidente și gestionare riscuri medicale conform standardelor' },
];

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const lastSubmitRef = useRef(0);
  const [rateLimited, setRateLimited] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  const countdownIntervalRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'all',
  });

  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  const onSubmit = async ({ username, password, rememberMe }) => {
    const now = Date.now();
    const elapsed = now - lastSubmitRef.current;

    if (elapsed < 3000) {
      const remaining = Math.ceil((3000 - elapsed) / 1000);
      setRateLimitCountdown(remaining);
      setRateLimited(true);

      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

      countdownIntervalRef.current = setInterval(() => {
        setRateLimitCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current);
            setRateLimited(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return;
    }

    lastSubmitRef.current = now;
    setServerError('');
    try {
      await login(username, password, { rememberMe });
      navigate('/');
    } catch (err) {
      setServerError(err.response?.data?.error || 'Eroare de conectare. Încearcă din nou.');
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row overflow-hidden"
      style={{ backgroundColor: 'var(--color-bg-primary)' }}
    >
      <SkipLink />

      {/* ── Theme toggle — fixed top-right ── */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 p-2 rounded-lg
                   hover:opacity-70 active:scale-95
                   transition-all duration-200
                   animate-in fade-in zoom-in-95 duration-500 delay-[800ms]
                   focus-visible:outline-none focus-visible:ring-2"
        aria-label={theme === 'dark' ? 'Comută la modul clar' : 'Comută la modul întunecat'}
        style={{
          color: 'var(--color-text-secondary)',
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          '--tw-ring-color': 'var(--color-accent)',
        }}
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* ── Hero panel — slides in from left ── */}
      <div
        className="hidden md:flex md:w-1/2 flex-col justify-between p-12 relative overflow-hidden
                   animate-in fade-in slide-in-from-left-8 duration-700"
        style={{ backgroundColor: 'var(--color-bg-secondary)' }}
      >
        {/* Breathing radial glow */}
        <div
          className="absolute inset-0 pointer-events-none glow-breathe"
          style={{ background: 'radial-gradient(circle at 30% 50%, var(--color-accent), transparent 55%)' }}
          aria-hidden="true"
        />

        <div className="relative z-10">
          <h1
            className="text-6xl font-extrabold tracking-tight mb-2
                       animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-500 delay-300"
            style={{ color: 'var(--color-accent)' }}
          >
            SIMDM
          </h1>
          <p
            className="text-lg font-medium animate-in fade-in slide-in-from-bottom-4 duration-500 delay-[450ms]"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Sistem Management Dispozitive Medicale
          </p>
          <p
            className="text-sm mt-1 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            Gestionare centralizată pentru spitale
          </p>
        </div>

        {/* Feature list — staggered slide from left */}
        <div className="space-y-6 relative z-10">
          {features.map(({ icon, title, desc }, index) => (
            <div
              key={title}
              className="flex gap-4 animate-in fade-in slide-in-from-left-4 duration-500"
              style={{ animationDelay: `${650 + index * 120}ms` }}
            >
              <div
                className="flex-shrink-0 flex items-center justify-center text-2xl feature-icon"
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--color-accent-subtle)',
                }}
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

        <p
          className="text-xs relative z-10 animate-in fade-in duration-500 delay-[1000ms]"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          © 2026 SIMDM. Toate drepturile rezervate.
        </p>
      </div>

      {/* ── Form panel — slides in from right ── */}
      <div
        id="main"
        tabIndex={-1}
        className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8"
      >
        <div
          className="w-full max-w-md p-8 rounded-2xl border
                     animate-in fade-in slide-in-from-right-8 duration-700 delay-150"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border)',
          }}
        >
          {/* Heading */}
          <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
            <h2
              className="text-3xl font-bold mb-2"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Conectare
            </h2>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Introdu credențialele tale pentru a accesa sistemul
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

            {/* ── Username ── */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-[375ms]">
              <label htmlFor="username" className="label-base">Utilizator</label>
              <input
                {...register('username')}
                id="username"
                type="text"
                className={`input-base input-animated${errors.username ? ' border-[var(--color-error)]' : ''}`}
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
                  aria-live="polite"
                  className="text-sm mt-1 animate-in fade-in slide-in-from-top-2 duration-200"
                  style={{ color: 'var(--color-error)' }}
                >
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* ── Password ── */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-[450ms]">
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="label-base mb-0">Parolă</label>
                <Link
                  to="/reset-password"
                  className="text-sm transition-opacity hover:opacity-70"
                  style={{ color: 'var(--color-accent)' }}
                >
                  Uita parola?
                </Link>
              </div>
              <div className="relative">
                <input
                  {...register('password')}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`input-base input-animated pr-12${errors.password ? ' border-[var(--color-error)]' : ''}`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="password-toggle absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded
                             hover:opacity-70 transition-all duration-200
                             focus-visible:outline-none focus-visible:ring-2"
                  aria-label={showPassword ? 'Ascunde parola' : 'Arată parola'}
                  aria-pressed={showPassword}
                  style={{
                    color: 'var(--color-text-secondary)',
                    '--tw-ring-color': 'var(--color-accent)',
                  }}
                >
                  <span className="toggle-icon-wrap">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </span>
                </button>
              </div>
              {errors.password && (
                <p
                  id="password-error"
                  role="alert"
                  aria-live="polite"
                  className="text-sm mt-1 animate-in fade-in slide-in-from-top-2 duration-200"
                  style={{ color: 'var(--color-error)' }}
                >
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* ── Remember me ── */}
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500">
              <input
                {...register('rememberMe')}
                id="rememberMe"
                type="checkbox"
                className="h-4 w-4 rounded border-[var(--color-border)] bg-[var(--color-bg-primary)] accent-[var(--color-accent)]"
              />
              <label
                htmlFor="rememberMe"
                className="text-sm cursor-pointer select-none remember-me-label"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Ține-mă minte
              </label>
            </div>

            {/* ── Rate limit alert — slides down from top ── */}
            {rateLimited && (
              <div
                role="alert"
                aria-live="assertive"
                className="p-4 rounded-lg border flex items-start gap-3
                           animate-in fade-in slide-in-from-top-2 zoom-in-95 duration-300"
                style={{
                  backgroundColor: 'var(--color-warning-bg)',
                  borderColor: 'var(--color-warning)',
                  color: 'var(--color-warning)',
                }}
              >
                <span className="text-lg mt-0.5" aria-hidden="true">⏳</span>
                <p className="text-sm font-medium">
                  Prea multe încercări. Așteaptă <strong>{rateLimitCountdown}s</strong>.
                </p>
              </div>
            )}

            {/* ── Server error — slides down from top ── */}
            {serverError && (
              <div
                role="alert"
                aria-live="assertive"
                className="p-4 rounded-lg border flex items-start gap-3
                           animate-in fade-in slide-in-from-top-2 zoom-in-95 duration-300"
                style={{
                  backgroundColor: 'var(--color-error-bg)',
                  borderColor: 'var(--color-error)',
                  color: 'var(--color-error)',
                }}
              >
                <span className="text-lg mt-0.5" aria-hidden="true">⚠️</span>
                <p className="text-sm">{serverError}</p>
              </div>
            )}

            {/* ── Submit button ── */}
            <button
              type="submit"
              disabled={isSubmitting || rateLimited}
              aria-busy={isSubmitting}
              className="btn-primary w-full mt-6 flex items-center justify-center gap-2
                         animate-in fade-in slide-in-from-bottom-4 duration-500 delay-[575ms]
                         active:scale-[0.98] transition-transform"
            >
              {isSubmitting ? (
                <>
                  <span
                    className="inline-block w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: 'var(--color-on-primary)' }}
                    aria-hidden="true"
                  />
                  Se conectează…
                </>
              ) : (
                'Conectare'
              )}
            </button>
          </form>

          {import.meta.env.DEV && (
            <div
              className="mt-8 pt-6 border-t text-center text-xs
                         animate-in fade-in duration-500 delay-[700ms]"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            >
              <p className="mb-1">Demo:</p>
              <p className="font-mono" style={{ color: 'var(--color-text-primary)' }}>bioinginer / parola</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        /* ── fill-mode: both ensures elements stay invisible during delay ── */
        .animate-in {
          animation-fill-mode: both;
        }

        /* ── Dark mode contrast fixes ── */
        [data-theme="dark"] .password-toggle {
          color: var(--color-text-primary);
        }
        [data-theme="dark"] .remember-me-label {
          color: var(--color-text-primary);
        }

        /* ── Hero glow: breathing opacity pulse ── */
        @keyframes breathe {
          0%, 100% { opacity: 0.15; }
          50%       { opacity: 0.27; transform: scale(1.06); }
        }
        .glow-breathe {
          animation: breathe 5s ease-in-out infinite;
          will-change: opacity, transform;
        }

        /* ── Input: subtle focus ring glow ── */
        .input-animated {
          transition:
            border-color var(--transition-fast),
            box-shadow var(--transition-fast);
        }
        .input-animated:focus {
          box-shadow: 0 0 0 3px var(--color-accent-muted);
        }

        /* ── Feature icon: lift on hover ── */
        .feature-icon {
          transition: transform var(--transition-fast);
        }
        .feature-icon:hover {
          transform: translateY(-2px) scale(1.05);
        }

        /* ── Password toggle: icon scale on click ── */
        .toggle-icon-wrap {
          display: flex;
          align-items: center;
          transition: transform var(--transition-fast);
        }
        .password-toggle:active .toggle-icon-wrap {
          transform: scale(0.85);
        }

        /* ── Reduced motion: disable all animations ── */
        @media (prefers-reduced-motion: reduce) {
          .animate-in {
            animation: none !important;
          }
          .glow-breathe {
            animation: none !important;
            opacity: 0.18;
          }
          .input-animated {
            transition: none;
          }
          .feature-icon,
          .toggle-icon-wrap {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}
