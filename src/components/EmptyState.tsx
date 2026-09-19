import type { ComponentType } from 'react';

interface EmptyStateProps {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  message?: string;
}

export default function EmptyState({ icon: Icon, title, message }: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-5 text-gray-600">
      {Icon && <Icon className="w-10 h-10 mb-4 text-bone-400 mx-auto" />}
      <h3 className="font-display text-lg font-bold tracking-tight text-gray-900 mb-2">{title}</h3>
      {message && <p>{message}</p>}
    </div>
  );
}
