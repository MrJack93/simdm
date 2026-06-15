import { cn } from "@/lib/utils"

/**
 * Skeleton component — shadcn/ui v4 pattern
 * Simplified composable API with just className
 * Per context7: Use data attributes + Tailwind classes
 * 
 * WCAG 2024: aria-busy on parent container
 * Animation respects prefers-reduced-motion
 */
export function Skeleton({ className, ...props }) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "bg-[var(--color-bg-tertiary)] animate-pulse rounded-md",
        className
      )}
      role="status"
      aria-label="Se încarcă..."
      {...props}
    />
  )
}

/**
 * Utility: Create skeleton lines for text loading
 * @param {number} lines - Number of skeleton lines to render
 * @param {string} className - Additional Tailwind classes
 */
export function SkeletonLines({ lines = 3, className = "" }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 rounded-md ${
            i === lines - 1 ? "w-2/3" : "w-full"
          }`}
        />
      ))}
    </div>
  )
}

/**
 * Utility: Create skeleton card with header + content
 * @param {number} lines - Lines in content area
 * @param {string} className - Additional Tailwind classes
 */
export function SkeletonCard({ lines = 3, className = "" }) {
  return (
    <div className={`p-4 rounded-lg border space-y-3 ${className}`}>
      <Skeleton className="h-5 w-2/3" /> {/* Header */}
      <SkeletonLines lines={lines} />
    </div>
  )
}

/**
 * Utility: Create skeleton table rows
 * @param {number} rows - Number of rows
 * @param {number} cols - Number of columns
 */
export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-3">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <Skeleton
              key={colIdx}
              className={`h-4 ${colIdx === 0 ? "w-1/4" : "w-full"}`}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
