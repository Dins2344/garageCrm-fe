import React from 'react';

export function RecentList({ children, className = '' }) {
  return <div className={`flex flex-col ${className}`}>{children}</div>;
}

export function RecentItem({ children, onClick, className = '' }) {
  return (
    <div 
      onClick={onClick}
      className={`flex flex-col gap-1.5 px-6 py-3.5 border-b border-gray-100 transition-colors duration-150 last:border-b-0 hover:bg-gray-50 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

export function RecentItemMain({ children, className = '' }) {
  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      {children}
    </div>
  );
}

export function RecentItemDetails({ children, className = '' }) {
  return (
    <div className={`flex items-center justify-between text-[13px] text-gray-600 ${className}`}>
      {children}
    </div>
  );
}
