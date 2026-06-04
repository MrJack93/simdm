import React from 'react';

export default function Card({ children, header, footer, actions, elevated = false, interactive = false, className = '', ...props }) {
  return (
    <div
      className={`
        bg-[var(--color-bg-secondary)]
        border border-[var(--color-border)]
        rounded-[14px] p-6
        transition-all duration-300
        ${interactive ? 'hover:shadow-lg hover:border-[var(--color-accent)] cursor-pointer' : ''}
        ${elevated ? 'shadow-lg' : 'shadow-sm'}
        ${className}
      `}
      {...props}
    >
      {header && (
        <div className="mb-4 pb-4 border-b border-[var(--color-border)]">
          {typeof header === 'string' ? (
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{header}</h3>
          ) : header}
        </div>
      )}

      <div className="mb-4">{children}</div>

      {actions && (
        <div className="flex gap-3 pt-4 border-t border-[var(--color-border)]">
          {actions}
        </div>
      )}

      {footer && (
        <div className="pt-4 border-t border-[var(--color-border)] text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {footer}
        </div>
      )}
    </div>
  );
}
