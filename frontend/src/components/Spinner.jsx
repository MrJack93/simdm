const sizes = {
  sm: 'w-4 h-4 border-[1.5px]',
  md: 'w-5 h-5 border-2',
  lg: 'w-8 h-8 border-[3px]',
};

export default function Spinner({ size = 'md', className = '' }) {
  return (
    <div
      className={`loading-spinner ${sizes[size] || sizes.md} ${className}`}
      role="status"
      aria-label="Se încarcă"
    >
      <span className="sr-only">Se încarcă...</span>
    </div>
  );
}
