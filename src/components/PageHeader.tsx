import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  children?: ReactNode;
}

export default function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-4 mb-7">
      <h1 className="text-[1.75rem] font-extrabold bg-linear-to-br from-gray-900 to-primary-700 bg-clip-text text-transparent">
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
