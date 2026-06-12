import React from 'react';
import Button from './Button';

export default function Pagination({ page, pages, onPageChange, className = '' }) {
  if (pages <= 1) return null;

  return (
    <div className={`flex items-center justify-center gap-1.5 mt-auto pt-6 ${className}`}>
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="min-w-[36px] h-9 rounded-lg font-medium text-sm text-gray-600 bg-white border border-gray-200 transition-all duration-150 hover:bg-gray-50 hover:border-primary-300 hover:text-primary-600 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        ‹
      </button>
      
      {Array.from({ length: pages }, (_, i) => {
        const pageNum = i + 1;
        const isActive = page === pageNum;
        return (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={`min-w-[36px] h-9 rounded-lg font-medium text-sm transition-all duration-150 border ${
              isActive 
                ? 'bg-primary-500 text-white border-primary-500 shadow-sm' 
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-primary-300 hover:text-primary-600'
            }`}
          >
            {pageNum}
          </button>
        );
      })}

      <button
        disabled={page >= pages}
        onClick={() => onPageChange(page + 1)}
        className="min-w-[36px] h-9 rounded-lg font-medium text-sm text-gray-600 bg-white border border-gray-200 transition-all duration-150 hover:bg-gray-50 hover:border-primary-300 hover:text-primary-600 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        ›
      </button>
    </div>
  );
}
