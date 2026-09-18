import { HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi';

import { currentMonthKey, monthLabel, shiftMonth } from '../utils/months';

interface MonthPickerProps {
  /** YYYY-MM */
  value: string;
  onChange: (month: string) => void;
  locale: string;
  /** Months after this one are not offered; defaults to the current month. */
  max?: string;
  className?: string;
}

/**
 * Step through months one at a time. A single control with two arrows
 * rather than a date range picker, because "this month, last month, the one
 * before" is the whole question a garage owner asks of their figures.
 */
export default function MonthPicker({ value, onChange, locale, max = currentMonthKey(), className = '' }: MonthPickerProps) {
  const atMax = value >= max;
  return (
    <div className={`inline-flex items-center border border-bone-400 bg-bone-50 ${className}`} role="group" aria-label="Month">
      <button
        type="button"
        onClick={() => onChange(shiftMonth(value, -1))}
        aria-label="Previous month"
        className="h-10 w-10 flex items-center justify-center text-gray-600 hover:bg-bone-100 hover:text-gray-900"
      >
        <HiOutlineChevronLeft className="w-4 h-4" />
      </button>
      <span className="min-w-[160px] px-2 text-center text-sm font-semibold text-gray-900" aria-live="polite">
        {monthLabel(value, locale)}
      </span>
      <button
        type="button"
        onClick={() => onChange(shiftMonth(value, 1))}
        disabled={atMax}
        aria-label="Next month"
        className="h-10 w-10 flex items-center justify-center text-gray-600 hover:bg-bone-100 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <HiOutlineChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
