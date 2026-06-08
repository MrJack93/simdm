import { useState, useEffect } from 'react';

// eslint-disable-next-line react-refresh/only-export-components
export const focusStyles = {
  ring:       '0 0 0 2px var(--color-bg-primary), 0 0 0 4px var(--color-accent)',
  ringDanger: '0 0 0 2px var(--color-bg-primary), 0 0 0 4px var(--color-error)',
};

export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only fixed top-4 left-4 px-4 py-2 rounded-lg font-medium z-50"
      style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-bg-primary)' }}
    >
      Sari la conținut principal
    </a>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useKeyboardNavigation(items, onSelect) {
  const [focusedIndex, setFocusedIndex] = useState(0);

  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        setFocusedIndex(prev => (prev + 1) % items.length);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        setFocusedIndex(prev => (prev - 1 + items.length) % items.length);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        onSelect(items[focusedIndex]);
        break;
      case 'Escape':
        setFocusedIndex(-1);
        break;
      default:
        break;
    }
  };

  return { focusedIndex, handleKeyDown };
}

// eslint-disable-next-line react-refresh/only-export-components
export function checkContrast(color1, color2) {
  const getLuminance = (hex) => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8)  & 0xff;
    const b = (rgb >> 0)  & 0xff;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  };
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker  = Math.min(lum1, lum2);
  return ((lighter + 0.05) / (darker + 0.05)).toFixed(2);
}

export function LiveRegion({ message, role = 'status', level = 'polite' }) {
  return (
    <div role={role} aria-live={level} aria-atomic="true" className="sr-only">
      {message}
    </div>
  );
}

export function AccessibleModalBackdrop({ isOpen, onClose, children }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" role="presentation" onClick={onClose}>
      <div
        className="rounded-lg max-w-lg w-full p-6 focus:outline-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={e => e.stopPropagation()}
        tabIndex={-1}
        style={{ backgroundColor: 'var(--color-bg-secondary)' }}
      >
        {children}
      </div>
    </div>
  );
}

export function AccessibleAlert({ type = 'info', title, message, onDismiss }) {
  const config = {
    error:   { role: 'alert',  level: 'assertive', icon: '❌', bg: 'var(--color-error-bg)' },
    warning: { role: 'alert',  level: 'assertive', icon: '⚠️', bg: 'var(--color-warning-bg)' },
    success: { role: 'status', level: 'polite',    icon: '✅', bg: 'var(--color-success-bg)' },
    info:    { role: 'status', level: 'polite',    icon: 'ℹ️', bg: 'var(--color-info-bg)' },
  }[type] || {};

  return (
    <div role={config.role} aria-live={config.level} aria-atomic="true" className="p-4 rounded-lg border mb-4" style={{ backgroundColor: config.bg }}>
      <div className="flex items-start gap-3">
        <span className="text-xl">{config.icon}</span>
        <div className="flex-1">
          {title && <p className="font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>{title}</p>}
          <p style={{ color: 'var(--color-text-primary)' }}>{message}</p>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} aria-label="Închide" className="hover:opacity-70" style={{ color: 'var(--color-text-secondary)' }}>×</button>
        )}
      </div>
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function getAccessibleErrorMessage(fieldName, errorType) {
  const messages = {
    required:  `${fieldName} este obligatoriu`,
    email:     'Introduceți o adresă de e-mail validă',
    minLength: `${fieldName} este prea scurt`,
    maxLength: `${fieldName} este prea lung`,
    pattern:   `${fieldName} nu are formatul corect`,
  };
  return messages[errorType] || 'Format invalid';
}
