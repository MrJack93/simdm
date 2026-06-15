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
    bg: 'var(--color-status-decommissioned-bg, rgba(107, 114, 128, 0.1))',
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
    bg: 'var(--color-status-spare-bg, rgba(167, 139, 250, 0.1))',
  },
};

export default function StatusBadge({ status, size = 'md', className = '' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.FUNCTIONAL;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${sizeClasses[size]} ${className}`}
      style={{
        backgroundColor: config.bg,
        color: config.color,
        fontFamily: 'var(--font-family-base)',
      }}
      role="status"
      aria-label={`Status: ${config.label}`}
    >
      <span aria-hidden="true" className="font-semibold">{config.symbol}</span>
      <span>{config.label}</span>
    </span>
  );
}
