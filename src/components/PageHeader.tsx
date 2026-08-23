import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  children?: ReactNode;
}

export default function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-4 mb-7 border-b border-bone-200 pb-5">
      <h1 className="font-display text-3xl font-extrabold tracking-[-0.02em] text-gray-900">
        {title}
      </h1>
      {children && (
        <div className="flex items-center gap-3">
          {children}
        </div>
      )}
    </div>
  );
}
