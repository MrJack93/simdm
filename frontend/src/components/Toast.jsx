import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const TOAST_CONFIG = {
  success: {
    icon: CheckCircle,
    borderColor: 'var(--color-success)',
    bgColor: 'var(--color-success-bg)',
    textColor: 'var(--color-success)',
  },
  error: {
    icon: AlertCircle,
    borderColor: 'var(--color-error)',
    bgColor: 'var(--color-error-bg)',
    textColor: 'var(--color-error)',
  },
  warning: {
    icon: AlertTriangle,
    borderColor: 'var(--color-warning)',
    bgColor: 'var(--color-warning-bg)',
    textColor: 'var(--color-warning)',
  },
  info: {
    icon: Info,
    borderColor: 'var(--color-info)',
    bgColor: 'var(--color-info-bg)',
    textColor: 'var(--color-info)',
  },
};

const AUTO_DISMISS = {
  success: 3000,
  info: 3000,
  warning: 5000,
  error: null,
};

export default function Toast({ type = 'info', message, duration, onDismiss, className = '' }) {
  const [visible, setVisible] = useState(true);
  const config = TOAST_CONFIG[type] || TOAST_CONFIG.info;
  const IconComponent = config.icon;
  const dismissTimeout = duration ?? AUTO_DISMISS[type];

  useEffect(() => {
    if (dismissTimeout) {
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => onDismiss?.(), 200);
      }, dismissTimeout);
      return () => clearTimeout(timer);
    }
  }, [dismissTimeout, onDismiss]);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => onDismiss?.(), 200);
  };

  return (
    <div
      className={`
        flex items-start gap-3 px-4 py-3 rounded-xl text-sm min-w-[300px] max-w-[420px]
        ${visible ? 'animate-toast-in' : 'animate-toast-out'}
        ${className}
      `}
      style={{
        backgroundColor: config.bgColor,
        borderLeft: `3px solid ${config.borderColor}`,
        color: 'var(--color-text-primary)',
      }}
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      <IconComponent size={18} className="flex-shrink-0 mt-0.5" style={{ color: config.textColor }} />
      <div className="flex-1" style={{ color: 'var(--color-text-primary)' }}>
        {message}
      </div>
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 p-1 hover:opacity-70 transition-opacity focusable"
        aria-label="Închide"
      >
        <X size={14} />
      </button>
    </div>
  );
}
