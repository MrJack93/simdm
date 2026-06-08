const STATUS_CONFIG = {
  FUNCTIONAL: {
    symbol: '✓',
    label: 'Funcțional',
    color: 'var(--color-status-functional)',
    bg: 'var(--color-success-bg)',
  },
  IN_REPARATIE: {
    symbol: '⟳',
    label: 'În reparație',
    color: 'var(--color-status-in-repair)',
    bg: 'var(--color-warning-bg)',
  },
  DEFECT: {
    symbol: '✗',
    label: 'Defect',
    color: 'var(--color-status-defect)',
    bg: 'var(--color-error-bg)',
  },
  CASAT: {
    symbol: '−',
    label: 'Casat',
    color: 'var(--color-status-decommissioned)',
    bg: 'rgba(107, 114, 128, 0.1)',
  },
  IMPRUMUTAT: {
    symbol: '→',
    label: 'Împrumutat',
    color: 'var(--color-status-loaned)',
    bg: 'var(--color-info-bg)',
  },
  REZERVA: {
    symbol: '◻',
    label: 'Rezervă',
    color: 'var(--color-status-spare)',
    bg: 'rgba(167, 139, 250, 0.1)',
  },
};

export default function StatusBadge({ status, size = 'md', className = '' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.FUNCTIONAL;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-2 text-sm gap-2',
    lg: 'px-4 py-2 text-base gap-2',
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: config.bg, color: config.color }}
      role="status"
      aria-label={`Status: ${config.label}`}
    >
      <span aria-hidden="true">{config.symbol}</span>
      <span>{config.label}</span>
    </span>
  );
}
