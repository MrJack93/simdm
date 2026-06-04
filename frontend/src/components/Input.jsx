import React, { forwardRef } from 'react';

const Input = forwardRef(function Input(
  { label, error, helpText, required, disabled, icon: Icon, type = 'text', className = '', ...props },
  ref
) {
  const hasError = !!error;
  const inputId = props.id || `input-${Math.random().toString(36).slice(2)}`;

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          {label}
          {required && <span aria-label="obligatoriu" className="text-[var(--color-error)]"> *</span>}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <div
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <Icon size={18} />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          disabled={disabled}
          className={`
            w-full px-4 py-3 min-h-[44px]
            bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]
            border border-[var(--color-border)] rounded-[10px]
            placeholder:text-[var(--color-text-tertiary)]
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
            focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-[var(--color-bg-primary)]
            transition-all duration-150
            disabled:opacity-50 disabled:cursor-not-allowed
            ${hasError ? 'border-[var(--color-error)] focus-visible:ring-[var(--color-error)]' : ''}
            ${Icon ? 'pl-10' : ''}
            ${className}
          `}
          aria-invalid={hasError}
          aria-describedby={helpText || error ? `${inputId}-help` : undefined}
          {...props}
        />
      </div>

      {(error || helpText) && (
        <p
          id={`${inputId}-help`}
          role={error ? 'alert' : undefined}
          className="text-xs"
          style={{ color: error ? 'var(--color-error)' : 'var(--color-text-tertiary)' }}
        >
          {error || helpText}
        </p>
      )}
    </div>
  );
});

export default Input;
