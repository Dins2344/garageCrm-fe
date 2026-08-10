import type { ReactNode } from 'react';

interface BadgeProps {
  intent?: string;
  children: ReactNode;
  className?: string;
  /** Accepted but currently unused by this component (some call sites pass it). */
  size?: string;
}

export default function Badge({ intent, children, className = '' }: BadgeProps) {
  const styles: Record<string, string> = {
    new: 'bg-info-light text-info',
    estimation_sent: 'bg-warning-light text-warning-dark',
    approved: 'bg-success-light text-success',
    in_progress: 'bg-info-light text-info-dark',
    quality_check: 'bg-purple-200 text-purple-600',
    ready_for_pickup: 'bg-teal-100 text-teal-600',
    delivered: 'bg-success-light text-success-dark',
    cancelled: 'bg-danger-light text-danger',
    paid: 'bg-success-light text-success',
    partial: 'bg-warning-light text-warning',
    unpaid: 'bg-danger-light text-danger',
  };

  const style = styles[intent || ''] || 'bg-gray-100 text-gray-800';

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold capitalize whitespace-nowrap backdrop-blur-sm border border-black/5 shadow-sm ${style} ${className}`}>
      {children}
    </span>
  );
}
