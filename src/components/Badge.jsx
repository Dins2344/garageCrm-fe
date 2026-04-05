import React from 'react';

export default function Badge({ intent, children, className = '' }) {
  const styles = {
    new: 'bg-info-light text-info',
    estimation_sent: 'bg-[#fef3c7] text-[#d97706]',
    approved: 'bg-[#d1fae5] text-[#059669]',
    in_progress: 'bg-[#dbeafe] text-[#2563eb]',
    quality_check: 'bg-[#e9d5ff] text-[#7c3aed]',
    ready_for_pickup: 'bg-[#ccfbf1] text-[#0f766e]',
    delivered: 'bg-[#d1fae5] text-[#047857]',
    cancelled: 'bg-danger-light text-danger',
    paid: 'bg-success-light text-success',
    partial: 'bg-warning-light text-warning',
    unpaid: 'bg-danger-light text-danger',
  };

  const style = styles[intent] || 'bg-gray-100 text-gray-800';

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold capitalize whitespace-nowrap ${style} ${className}`}>
      {children}
    </span>
  );
}
