/**
 * Skeleton component — placeholder loading indicator
 * WCAG 2024 compliant with prefers-reduced-motion support
 * Per DESIGN.md: "Skeleton screens — NU spinners pentru loading"
 */

export function Skeleton({ className = '', variant = 'line', height = 'h-4', width = 'w-full' }) {
  const variants = {
    line: 'rounded-md',
    card: 'rounded-lg',
    circle: 'rounded-full w-12 h-12',
    button: 'rounded-lg h-10',
  };

  return (
    <div
      className={`bg-[var(--color-bg-tertiary)] ${variants[variant]} ${height} ${width} ${className} animate-pulse`}
      role="status"
      aria-label="Se încarcă..."
    />
  );
}

/**
 * SkeletonGroup — multiple skeleton lines for card loading
 */
export function SkeletonGroup({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={i === 0 ? 'h-5' : i === lines - 1 ? 'h-3' : 'h-4'}
          width={i === lines - 1 ? 'w-1/3' : 'w-full'}
        />
      ))}
    </div>
  );
}

/**
 * SkeletonCard — full card skeleton for loading state
 */
export function SkeletonCard({ lines = 4, className = '' }) {
  return (
    <div className={`p-4 rounded-lg border bg-[var(--color-bg-secondary)] border-[var(--color-border)] ${className}`}>
      <Skeleton variant="line" height="h-6" width="w-2/3" className="mb-4" />
      <SkeletonGroup lines={lines} />
    </div>
  );
}

/**
 * SkeletonTable — skeleton for table rows
 */
export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-3">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <Skeleton key={colIdx} width={colIdx === 0 ? 'w-1/4' : 'w-full'} />
          ))}
        </div>
      ))}
    </div>
  );
}
