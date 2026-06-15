/**
 * Badge component - compact status indicator with variants
 */
export function Badge({
  children,
  variant = 'default',
  className = '',
  ...props
}) {
  const variants = {
    default: 'bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)]',
    success: 'bg-[var(--color-success-bg)] text-[var(--color-success)]',
    error: 'bg-[var(--color-error-bg)] text-[var(--color-error)]',
    warning: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
    info: 'bg-[var(--color-info-bg)] text-[var(--color-info)]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
