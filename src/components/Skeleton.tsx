/**
 * A placeholder block that pulses while content loads. Stands in for the
 * shape of what is coming so the layout does not jump when the data lands.
 * Square and flat like everything else; `rounded-full` is fine for a dot.
 */
interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className = '' }: SkeletonProps) {
  return <div aria-hidden="true" className={`bg-bone-200 animate-pulse motion-reduce:animate-none ${className}`} />;
}

/**
 * The shape of a label/value list. `rows` should match the real row count so
 * nothing moves when the data arrives; each row is the height of an InfoRow.
 */
export function SkeletonRows({ rows }: { rows: number }) {
  return (
    <div data-testid="skeleton-rows">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={`flex items-center justify-between py-3.5 ${i < rows - 1 ? 'border-b border-bone-200' : ''}`}>
          <Skeleton className={`h-3.5 ${i % 3 === 0 ? 'w-24' : 'w-16'}`} />
          <Skeleton className={`h-3.5 ${i % 2 === 0 ? 'w-32' : 'w-24'}`} />
        </div>
      ))}
    </div>
  );
}
