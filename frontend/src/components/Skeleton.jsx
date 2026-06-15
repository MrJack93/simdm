export default function Skeleton({ lines = 3, variant = 'text', className = '' }) {
  const variants = {
    text: <SkeletonText lines={lines} />,
    card: <SkeletonCard />,
    table: <SkeletonTable rows={lines} />,
  };

  return (
    <div className={`animate-fade-in ${className}`} role="status" aria-label="Se încarcă">
      <span className="sr-only">Se încarcă...</span>
      {variants[variant] || variants.text}
    </div>
  );
}

function SkeletonText({ lines }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton skeleton-text"
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card-base p-6 space-y-4">
      <div className="skeleton skeleton-heading" />
      <div className="skeleton skeleton-text" style={{ width: '100%' }} />
      <div className="skeleton skeleton-text" style={{ width: '80%' }} />
      <div className="skeleton skeleton-text" style={{ width: '60%' }} />
    </div>
  );
}

function SkeletonTable({ rows }) {
  return (
    <div className="space-y-2">
      <div className="skeleton skeleton-row" style={{ height: 40, opacity: 0.6 }} />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton skeleton-row" />
      ))}
    </div>
  );
}
