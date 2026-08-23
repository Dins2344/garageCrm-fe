import type { ReactNode } from 'react';

interface BadgeProps {
  intent?: string;
  children: ReactNode;
  className?: string;
  /** Accepted but currently unused by this component (some call sites pass it). */
  size?: string;
}

/**
 * A status pill, square and flat like everything else.
 *
 * Status is carried by a tinted ground plus a matching one-pixel edge rather
 * than by a pastel fill with a drop shadow — on the bone ground a shadowed
 * pastel pill floats, and six of them in a table look like buttons.
 */
export default function Badge({ intent, children, className = '' }: BadgeProps) {
  const styles: Record<string, string> = {
    new: 'bg-info-light text-info-dark border-info/25',
    estimation_sent: 'bg-warning-light text-warning-dark border-warning/30',
    approved: 'bg-success-light text-success-dark border-success/30',
    in_progress: 'bg-info-light text-info-dark border-info/30',
    quality_check: 'bg-purple-100 text-purple-700 border-purple-600/25',
    ready_for_pickup: 'bg-teal-100 text-teal-700 border-teal-700/25',
    delivered: 'bg-success-light text-success-dark border-success/30',
    cancelled: 'bg-danger-light text-danger border-danger/30',
    paid: 'bg-success-light text-success-dark border-success/30',
    partial: 'bg-warning-light text-warning-dark border-warning/30',
    unpaid: 'bg-danger-light text-danger border-danger/30',
  };

  const style = styles[intent || ''] || 'bg-bone-100 text-gray-700 border-bone-200';

  // Most call sites hand the raw enum straight through (`{jc.status}`), which
  // rendered as "In_progress" / "Ready_for_pickup". Normalising here fixes every
  // one of them without touching a call site, and non-string children (an icon
  // plus text) pass through untouched.
  const label = typeof children === 'string' ? children.replace(/_/g, ' ') : children;

  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap border px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${style} ${className}`}>
      {label}
    </span>
  );
}
