import { useState } from 'react';

/**
 * Dialog de confirmare ștergere — înlocuiește window.confirm() care blochează
 * main thread-ul și nu poate fi stilizat.
 *
 * Utilizare:
 *   <DeleteConfirmDialog
 *     name="Dispozitiv X"
 *     onConfirm={() => deleteMutation.mutate(id)}
 *     trigger={<button>Șterge</button>}
 *   />
 */
export function DeleteConfirmDialog({ name, onConfirm, trigger, description }) {
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    setOpen(false);
    onConfirm();
  };

  return (
    <>
      {/* Clonăm trigger-ul pentru a injecta onClick */}
      <span onClick={() => setOpen(true)} style={{ display: 'contents' }}>
        {trigger}
      </span>

      {open && (
        // Overlay
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl p-6 shadow-xl"
            style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
          >
            {/* Icon avertizare */}
            <div className="flex justify-center mb-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                style={{ backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error)' }}
                aria-hidden="true"
              >
                ⚠
              </div>
            </div>

            {/* Titlu */}
            <h2
              id="delete-dialog-title"
              className="text-lg font-bold text-center mb-2"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Confirmare ștergere
            </h2>

            {/* Mesaj */}
            <p className="text-sm text-center mb-6" style={{ color: 'var(--color-text-secondary)' }}>
              {description || (
                <>
                  Ești sigur că vrei să ștergi{' '}
                  <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    &ldquo;{name}&rdquo;
                  </span>
                  ?
                  <br />
                  <span style={{ color: 'var(--color-error)' }}>Acțiunea nu poate fi anulată.</span>
                </>
              )}
            </p>

            {/* Butoane */}
            <div className="flex gap-3">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-2.5 rounded-lg font-medium border transition-all"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
                autoFocus
              >
                Anulare
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-2.5 rounded-lg font-medium transition-all"
                style={{ backgroundColor: 'var(--color-error)', color: '#ffffff' }}
              >
                Șterge
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
