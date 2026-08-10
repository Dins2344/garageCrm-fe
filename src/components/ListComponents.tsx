import type { ReactNode, MouseEventHandler } from 'react';

interface RecentListProps {
  children: ReactNode;
  className?: string;
}

export function RecentList({ children, className = '' }: RecentListProps) {
  return <div className={`flex flex-col ${className}`}>{children}</div>;
}

interface RecentItemProps {
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLDivElement>;
  className?: string;
}

export function RecentItem({ children, onClick, className = '' }: RecentItemProps) {
  return (
    <div
      onClick={onClick}
      className={`flex flex-col gap-1.5 px-6 py-3.5 border-b border-gray-100 transition-colors duration-150 last:border-b-0 hover:bg-gray-50 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

interface RecentItemChildProps {
  children: ReactNode;
  className?: string;
}

export function RecentItemMain({ children, className = '' }: RecentItemChildProps) {
  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      {children}
    </div>
  );
}

export function RecentItemDetails({ children, className = '' }: RecentItemChildProps) {
  return (
    <div className={`flex items-center justify-between text-[13px] text-gray-600 ${className}`}>
      {children}
    </div>
  );
}
