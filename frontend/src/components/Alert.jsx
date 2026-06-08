import { X, AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';

const ALERT_CONFIG = {
  success: {
    bg: 'var(--color-success-bg)',
    border: 'var(--color-status-functional)',
    icon: CheckCircle,
    role: 'status',
  },
  error: {
    bg: 'var(--color-error-bg)',
    border: 'var(--color-status-defect)',
    icon: AlertCircle,
    role: 'alert',
  },
  warning: {
    bg: 'var(--color-warning-bg)',
    border: 'var(--color-status-in-repair)',
    icon: AlertTriangle,
    role: 'alert',
  },
  info: {
    bg: 'var(--color-info-bg)',
    border: 'var(--color-status-loaned)',
    icon: Info,
    role: 'status',
  },
};

export default function Alert({ type = 'info', children, dismissible = false, onDismiss, className = '' }) {
  const config = ALERT_CONFIG[type] || ALERT_CONFIG.info;
  const IconComponent = config.icon;

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-[10px] border ${className}`}
      style={{ backgroundColor: config.bg, borderColor: config.border }}
      role={config.role}
    >
      <IconComponent size={20} className="flex-shrink-0 mt-0.5" style={{ color: config.border }} />
      <div className="flex-1 text-sm" style={{ color: 'var(--color-text-primary)' }}>
        {children}
      </div>
      {dismissible && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 hover:opacity-70 transition-opacity"
          aria-label="Închide alerta"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
