import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorState({
  error,
  onRetry,
  title = 'A apărut o eroare',
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 bg-[var(--color-error-bg)]">
        <AlertTriangle size={32} className="text-[var(--color-error)]" />
      </div>

      <h3
        className="text-lg font-medium mb-2 text-[var(--color-error)]"
        style={{ fontFamily: 'var(--font-family-heading)' }}
      >
        {title}
      </h3>

      <p className="text-sm max-w-sm mb-6 text-[var(--color-text-secondary)]">
        {error?.message || 'Nu s-au putut încărca datele. Încearcă din nou.'}
      </p>

      {onRetry && (
        <button onClick={onRetry} className="btn-primary inline-flex items-center gap-2">
          <RefreshCw size={16} />
          Încearcă din nou
        </button>
      )}
    </div>
  );
}
