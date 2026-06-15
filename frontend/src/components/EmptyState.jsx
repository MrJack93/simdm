import { Inbox } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'Nicio înregistrare',
  description = 'Nu există date de afișat.',
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}
      role="status"
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
        style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
      >
        <Icon size={32} style={{ color: 'var(--color-text-tertiary)' }} />
      </div>

      <h3
        className="text-lg font-medium mb-2"
        style={{
          fontFamily: 'var(--font-family-heading)',
          color: 'var(--color-text-primary)',
        }}
      >
        {title}
      </h3>

      <p
        className="text-sm max-w-sm mb-6"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {description}
      </p>

      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-primary">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
