import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { Moon, Sun, LogOut, User, Lock } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../api/axios';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Parolă curentă obligatorie'),
  newPassword: z.string().min(8, 'Parolă nouă trebuie să aibă minim 8 caractere'),
  confirmPassword: z.string().min(1, 'Confirmare parolă obligatorie'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Parolele nu coincid',
  path: ['confirmPassword'],
});

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [isChanging, setIsChanging] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmitPassword = async (data) => {
    setIsChanging(true);
    try {
      await api.patch('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });
      toast.success('Parolă schimbată cu succes');
      reset();
    } catch (error) {
      const msg = error.response?.data?.error || 'Eroare la schimbarea parolei';
      toast.error(msg);
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <div className="border-b px-8 py-6" style={{ borderColor: 'var(--color-border)' }}>
        <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Setări</h1>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Gestionează preferințele și setările contului
        </p>
      </div>

      <div className="container mx-auto p-8 max-w-2xl space-y-6">
        {/* User Profile */}
        <section className="p-6 rounded-xl border" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-bg-primary)' }}>
              {user?.username?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{user?.username}</h2>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Bioinginer Medical</p>
            </div>
          </div>
          <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              <User size={14} className="inline mr-1.5" />Utilizator
            </p>
            <p className="text-sm font-mono" style={{ color: 'var(--color-text-primary)' }}>{user?.username}</p>
          </div>
        </section>

        {/* Theme */}
        <section className="p-6 rounded-xl border" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
          <h3 className="text-lg font-bold mb-6" style={{ color: 'var(--color-accent)' }}>Preferințe de Afișare</h3>

          <div className="flex items-center justify-between p-4 rounded-lg mb-4" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
            <div className="flex items-center gap-3">
              {theme === 'dark' ? <Moon size={20} style={{ color: 'var(--color-accent)' }} /> : <Sun size={20} style={{ color: 'var(--color-accent)' }} />}
              <div>
                <p className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>Mod {theme === 'dark' ? 'întunecat' : 'clar'}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Schimbă tema de culori a interfeței</p>
              </div>
            </div>
            <button onClick={toggleTheme} className="px-4 py-2 rounded-lg font-semibold text-sm transition-all" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-bg-primary)' }}>
              Comută
            </button>
          </div>

          <div className="p-4 rounded-lg text-sm" style={{ backgroundColor: 'var(--color-accent-subtle)', color: 'var(--color-accent)' }}>
            <p className="font-medium mb-1">💡 Sfat</p>
            <p>{theme === 'dark' ? 'Modul întunecat reduce oboseala ochilor în mediile cu iluminare variabilă.' : 'Modul clar oferă o experiență optimă în medii bine iluminate.'}</p>
          </div>
        </section>

        {/* Change Password */}
        <section className="p-6 rounded-xl border" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--color-accent)' }}>
            <Lock size={20} /> Schimbare Parolă
          </h3>

          <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="label-base">Parolă curentă</label>
              <input
                id="currentPassword"
                type="password"
                {...register('currentPassword')}
                className="input-base w-full"
                placeholder="Introdu parola curentă"
                disabled={isChanging}
              />
              {errors.currentPassword && (
                <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>{errors.currentPassword.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="newPassword" className="label-base">Parolă nouă</label>
              <input
                id="newPassword"
                type="password"
                {...register('newPassword')}
                className="input-base w-full"
                placeholder="Introdu parolă nouă (min 8 caractere)"
                disabled={isChanging}
              />
              {errors.newPassword && (
                <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>{errors.newPassword.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label-base">Confirmare parolă</label>
              <input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword')}
                className="input-base w-full"
                placeholder="Confirmă parola nouă"
                disabled={isChanging}
              />
              {errors.confirmPassword && (
                <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isChanging}
              className="w-full px-4 py-3 rounded-lg font-semibold transition-all"
              style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-bg-primary)', opacity: isChanging ? 0.6 : 1 }}
            >
              {isChanging ? 'Se salvează...' : 'Schimbă parolă'}
            </button>
          </form>

          <div className="p-3 rounded text-xs mt-4" style={{ backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}>
            <p className="font-medium mb-1">⚠️ Securitate</p>
            <p>Parolă trebuie să aibă minim 8 caractere. După schimbare, va trebui să te reconectezi.</p>
          </div>
        </section>

        {/* Accessibility */}
        <section className="p-6 rounded-xl border" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
          <h3 className="text-lg font-bold mb-6" style={{ color: 'var(--color-accent)' }}>Accesibilitate</h3>
          <div className="space-y-3">
            {[
              { label: 'Inele de focus mai evidente', desc: 'Afișează inele de focus mai vizibile pentru navigarea cu tastatură', defaultChecked: true },
              { label: 'Respectare preferință animații', desc: 'Dezactivează animațiile dacă sistemul preferă mișcări reduse', defaultChecked: true },
              { label: 'Contrast mai înalt', desc: 'Crește contrastul pentru o citire mai ușoară', defaultChecked: false },
            ].map(({ label, desc, defaultChecked }) => (
              <label key={label} className="flex items-center gap-3 p-4 rounded-lg cursor-pointer" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                <input type="checkbox" defaultChecked={defaultChecked} className="rounded" />
                <div>
                  <p className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>{label}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{desc}</p>
                </div>
              </label>
            ))}
          </div>
        </section>

        {/* System info */}
        <section className="p-6 rounded-xl border" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
          <h3 className="text-lg font-bold mb-6" style={{ color: 'var(--color-accent)' }}>Informații Sistem</h3>
          <div className="space-y-3 text-sm mb-4">
            {[
              { label: 'Versiune SIMDM',     value: '2.0.0' },
              { label: 'Faza implementare',  value: 'Faza 2 (Inventar)' },
              { label: 'Conformitate WCAG',  value: '2.1 AA', color: 'var(--color-success)' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between">
                <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
                <span className="font-mono" style={{ color: color || 'var(--color-text-primary)' }}>{value}</span>
              </div>
            ))}
          </div>
          <div className="p-3 rounded text-xs" style={{ backgroundColor: 'var(--color-info-bg)', color: 'var(--color-info)' }}>
            <p className="font-medium mb-1">ℹ️ Despre SIMDM</p>
            <p>Sistem Informațional de Management al Dispozitivelor Medicale conform Ghidului Bioinginerului (Ordinul MS nr. 889/2024, Republica Moldova).</p>
          </div>
        </section>

        {/* Logout */}
        <div className="space-y-4">
          <button onClick={logout} className="w-full px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--color-error)', color: '#ffffff' }}>
            <LogOut size={18} /> Deconectare
          </button>
          <p className="text-xs text-center" style={{ color: 'var(--color-text-secondary)' }}>© 2026 SIMDM. Toate drepturile rezervate.</p>
        </div>
      </div>
    </div>
  );
}
