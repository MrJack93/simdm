import { X, AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';

const ALERT_CONFIG = {
  success: {
    bg: 'var(--color-success-bg)',
    border: 'var(--color-success)',
    icon: CheckCircle,
    role: 'status',
  },
  error: {
    bg: 'var(--color-error-bg)',
    border: 'var(--color-error)',
    icon: AlertCircle,
    role: 'alert',
  },
  warning: {
    bg: 'var(--color-warning-bg)',
    border: 'var(--color-warning)',
    icon: AlertTriangle,
    role: 'alert',
  },
  info: {
    bg: 'var(--color-info-bg)',
    border: 'var(--color-info)',
    icon: Info,
    role: 'status',
  },
};

export default function Alert({ type = 'info', children, dismissible = false, onDismiss, className = '' }) {
  const config = ALERT_CONFIG[type] || ALERT_CONFIG.info;
  const IconComponent = config.icon;

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border ${className}`}
      style={{ backgroundColor: config.bg, borderColor: config.border }}
      role={config.role}
    >
      <IconComponent size={18} className="flex-shrink-0 mt-0.5" style={{ color: config.border }} />
      <div className="flex-1 text-sm" style={{ color: 'var(--color-text-primary)' }}>
        {children}
      </div>
      {dismissible && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 hover:opacity-70 transition-opacity focusable"
          aria-label="Închide alerta"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
