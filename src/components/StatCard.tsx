import type { ComponentType } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ComponentType<{ className?: string }>;
  colorClass?: 'blue' | 'green' | 'purple' | 'orange' | 'teal' | 'red';
  /** One line under the title, e.g. "3 completed". */
  sub?: string;
}

/**
 * A single figure with its label.
 *
 * The tile is flat and square, and the accent lives on the icon alone — the
 * old 4px coloured bar down the left edge is exactly the "coloured border-left
 * above 1px" the craft floor refuses, and six of them in a row read as a
 * toolbar rather than as data.
 *
 * `colorClass` is kept because every call site passes it and the colours carry
 * real meaning (red for unpaid, green for revenue). It now tints the icon
 * instead of drawing a bar.
 */
export default function StatCard({ title, value, icon: Icon, colorClass = 'blue', sub }: StatCardProps) {
  const colorMap: Record<string, string> = {
    blue: 'text-primary-600',
    green: 'text-success-dark',
    purple: 'text-purple-600',
    orange: 'text-accent-600',
    teal: 'text-teal-600',
    red: 'text-danger',
  };

  const iconColor = colorMap[colorClass] || colorMap.blue;

  return (
    <div className="flex flex-col gap-3 border border-bone-200 bg-bone-50 p-5">
      <div className={`flex items-center gap-2 ${iconColor}`}>
        <Icon className="w-[1em] h-[1em]" />
      </div>
      {/* min-w-0 + break-words: a long money figure (an unpaid total in paise,
          say) used to overflow the tile and get clipped mid-number. */}
      <div className="min-w-0">
        <h3 className="tabular font-display text-xl font-extrabold leading-tight break-words text-gray-900">
          {value}
        </h3>
        <p className="mt-1 text-[13px] font-medium leading-snug text-gray-600">{title}</p>
        {sub && <p className="mt-0.5 text-xs text-gray-500">{sub}</p>}
      </div>
    </div>
  );
}
