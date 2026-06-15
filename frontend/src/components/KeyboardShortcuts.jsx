import { useEffect, useRef, useState } from 'react';
import { X, Keyboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SHORTCUTS = [
  { keys: ['Ctrl', 'K'], description: 'Căutare rapidă', action: 'search' },
  { keys: ['Ctrl', 'N'], description: 'Dispozitiv nou', path: '/devices/new' },
  { keys: ['Ctrl', 'M'], description: 'Mentenanță', path: '/maintenance/calendar' },
  { keys: ['Ctrl', '/'], description: 'Ajutor scurtături', action: 'help' },
  { keys: ['Esc'], description: 'Închide modal / Anulează', action: 'close' },
];

export default function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const dialogRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setOpen((prev) => !prev);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        navigate('/devices/new');
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        navigate('/maintenance/calendar');
        return;
      }

      // Focus trap for dialog
      if (open && e.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll('button');
        if (!focusable || focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === last) {
            first.focus();
            e.preventDefault();
          }
        }
      }
    };

    // Focus on first button when dialog opens
    if (open) {
      const first = dialogRef.current?.querySelector('button');
      first?.focus();
    }

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate, open]);

  if (!open) return null;

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-modal-overlay"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Scurtături tastatură"
    >
      <div
        className="w-full max-w-md rounded-xl p-6 animate-modal-content"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Keyboard size={20} style={{ color: 'var(--color-accent)' }} />
            <h2
              className="text-lg font-medium"
              style={{
                fontFamily: 'var(--font-family-heading)',
                color: 'var(--color-text-primary)',
              }}
            >
              Scurtături Tastatură
            </h2>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded-lg hover:opacity-70 transition-opacity"
            aria-label="Închide"
          >
            <X size={18} style={{ color: 'var(--color-text-secondary)' }} />
          </button>
        </div>

        <div className="space-y-3">
          {SHORTCUTS.map((shortcut) => (
            <div
              key={shortcut.description}
              className="flex items-center justify-between py-2"
              style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
            >
              <span
                className="text-sm"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {shortcut.description}
              </span>
              <div className="flex gap-1">
                {shortcut.keys.map((key) => (
                  <kbd
                    key={key}
                    className="px-2 py-1 text-xs rounded-md font-mono"
                    style={{
                      backgroundColor: 'var(--color-bg-tertiary)',
                      color: 'var(--color-text-secondary)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
