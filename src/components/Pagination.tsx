import { ChevronLeft, ChevronRight } from 'lucide-react';
import { pageWindow } from '../utils/pageWindow';

interface PaginationProps {
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const BUTTON = 'min-w-[36px] h-9 font-medium text-sm transition-colors duration-150 border';
const IDLE = 'bg-bone-50 text-gray-700 border-bone-400 hover:bg-bone-100 hover:border-ink-900 hover:text-gray-900';

export default function Pagination({ page, pages, onPageChange, className = '' }: PaginationProps) {
  if (pages <= 1) return null;

  return (
    <div className={`flex items-center justify-center gap-1.5 mt-auto pt-6 ${className}`}>
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
        className={`${BUTTON} ${IDLE} disabled:opacity-40 disabled:cursor-not-allowed`}
      ><ChevronLeft className="w-4 h-4 mx-auto" strokeWidth={2} /></button>

      {pageWindow(page, pages).map((item, i) =>
        item === 'gap' ? (
          <span key={`gap-${i}`} className="min-w-[24px] text-center text-sm text-gray-500 select-none">&hellip;</span>
        ) : (
          <button
            key={item}
            onClick={() => onPageChange(item)}
            aria-current={page === item ? 'page' : undefined}
            className={`${BUTTON} ${page === item ? 'bg-primary-600 text-white border-primary-600' : IDLE}`}
          >
            {item}
          </button>
        )
      )}

      <button
        disabled={page >= pages}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
        className={`${BUTTON} ${IDLE} disabled:opacity-40 disabled:cursor-not-allowed`}
      ><ChevronRight className="w-4 h-4 mx-auto" strokeWidth={2} /></button>
    </div>
  );
}
