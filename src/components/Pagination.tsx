import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function Pagination({ page, pages, onPageChange, className = '' }: PaginationProps) {
  if (pages <= 1) return null;

  return (
    <div className={`flex items-center justify-center gap-1.5 mt-auto pt-6 ${className}`}>
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="min-w-[36px] h-9 font-medium text-sm text-gray-700 bg-bone-50 border border-bone-400 transition-colors duration-150 hover:bg-bone-100 hover:border-ink-900 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed"
      ><ChevronLeft className="w-4 h-4 mx-auto" strokeWidth={2} /></button>

      {Array.from({ length: pages }, (_, i) => {
        const pageNum = i + 1;
        const isActive = page === pageNum;
        return (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={`min-w-[36px] h-9 font-medium text-sm transition-colors duration-150 border ${
              isActive
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-bone-50 text-gray-700 border-bone-400 hover:bg-bone-100 hover:border-ink-900 hover:text-gray-900'
            }`}
          >
            {pageNum}
          </button>
        );
      })}

      <button
        disabled={page >= pages}
        onClick={() => onPageChange(page + 1)}
        className="min-w-[36px] h-9 font-medium text-sm text-gray-700 bg-bone-50 border border-bone-400 transition-colors duration-150 hover:bg-bone-100 hover:border-ink-900 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed"
      ><ChevronRight className="w-4 h-4 mx-auto" strokeWidth={2} /></button>
    </div>
  );
}
