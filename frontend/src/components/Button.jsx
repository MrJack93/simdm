import React from 'react';

export default function Button({
  variant = 'primary',
  size = 'base',
  disabled = false,
  loading = false,
  className = '',
  children,
  icon: Icon,
  iconPosition = 'left',
  ...props
}) {
  const base = `
    inline-flex items-center justify-center font-semibold gap-2
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-all duration-150
  `;

  const sizes = {
    sm:   'px-3 py-2 text-sm min-h-[36px] rounded-[8px]',
    base: 'px-4 py-3 text-base min-h-[44px] rounded-[10px]',
    lg:   'px-6 py-3 text-lg min-h-[52px] rounded-[12px]',
  };

  const variants = {
    primary: `
      bg-[var(--color-accent)] text-[#1a1a1a]
      hover:bg-[var(--color-accent-hover)] hover:shadow-lg hover:-translate-y-0.5
      focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-[var(--color-bg-primary)]
    `,
    secondary: `
      bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]
      border border-[var(--color-border)]
      hover:bg-[var(--color-bg-elevated)] hover:shadow-md
      focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-[var(--color-bg-primary)]
    `,
    danger: `
      bg-[var(--color-error)] text-white
      hover:bg-red-700 hover:shadow-lg hover:-translate-y-0.5
      focus-visible:ring-[var(--color-error)] focus-visible:ring-offset-[var(--color-bg-primary)]
    `,
    outline: `
      border-2 border-[var(--color-accent)] text-[var(--color-accent)] bg-transparent
      hover:bg-[var(--color-accent-subtle)]
      focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-[var(--color-bg-primary)]
    `,
  };

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {Icon && iconPosition === 'left' && <Icon size={size === 'sm' ? 16 : 20} />}
      {loading ? 'Se încarcă…' : children}
      {Icon && iconPosition === 'right' && <Icon size={size === 'sm' ? 16 : 20} />}
    </button>
  );
}
