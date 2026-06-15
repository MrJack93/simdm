import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

export function DeleteConfirmDialog({ name, onConfirm, trigger, description }) {
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    setOpen(false);
    onConfirm();
  };

  return (
    <>
      <span onClick={() => setOpen(true)} style={{ display: 'contents' }}>
        {trigger}
      </span>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-modal-overlay"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl p-6 animate-modal-content"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div className="flex justify-center mb-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-error-bg)' }}
                aria-hidden="true"
              >
                <AlertTriangle size={24} style={{ color: 'var(--color-error)' }} />
              </div>
            </div>

            <h2
              id="delete-dialog-title"
              className="text-lg font-medium text-center mb-2"
              style={{
                fontFamily: 'var(--font-family-heading)',
                color: 'var(--color-text-primary)',
              }}
            >
              Confirmare ștergere
            </h2>

            <p className="text-sm text-center mb-6" style={{ color: 'var(--color-text-secondary)' }}>
              {description || (
                <>
                  Ești sigur că vrei să ștergi{' '}
                  <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    &ldquo;{name}&rdquo;
                  </span>
                  ?
                  <br />
                  <span style={{ color: 'var(--color-error)' }}>Acțiunea nu poate fi anulată.</span>
                </>
              )}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 btn-secondary"
                autoFocus
              >
                Anulare
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 btn-danger"
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
