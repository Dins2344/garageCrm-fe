import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiOutlineReceiptTax, HiOutlineClipboardCheck, HiOutlineCash, HiOutlineTrendingUp, HiOutlineTrendingDown } from 'react-icons/hi';
import { getMonthlyMetrics } from '../services/apiServices/dashboardService';
import { useGarage } from '../context/GarageContext';
import { useDebounce } from '../hooks/useDebounce';
import { formatMoney } from '../utils/format';
import { EXPENSE_CATEGORY_LABEL } from '../utils/constants';
import MonthPicker from './MonthPicker';
import { currentMonthKey } from '../utils/months';
import StatCard from './StatCard';
import Loader from './Loader';
import type { MonthlyMetrics } from '../types/models';

/** "+12%" / "-8%" against last month; null when last month was zero. */
const changeVsPrevious = (current: number, previous: number): number | null => {
  if (!previous) return null;
  return Math.round(((current - previous) / Math.abs(previous)) * 100);
};

function Delta({ current, previous, invert = false }: { current: number; previous: number; invert?: boolean }) {
  const pct = changeVsPrevious(current, previous);
  if (pct === null) return <span className="text-xs text-gray-500">No figure for last month</span>;
  // For expenses, going up is the bad direction.
  const good = invert ? pct <= 0 : pct >= 0;
  const Icon = pct >= 0 ? HiOutlineTrendingUp : HiOutlineTrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${good ? 'text-success-dark' : 'text-danger'}`}>
      <Icon className="w-3.5 h-3.5" />
      {pct > 0 ? '+' : ''}{pct}% vs last month
    </span>
  );
}

/**
 * The month's business figures: revenue, services, expenses, net profit,
 * with last month for comparison and where the expenses went. Owner/admin
 * only — the caller gates it; the API refuses everyone else anyway.
 */
export default function MonthlyBusinessPanel() {
  const { locale, activeGarageId } = useGarage();
  const money = (n?: number) => formatMoney(n, locale);
  const [month, setMonth] = useState(currentMonthKey());
  // Ten taps on the arrow are one request, for the month the taps end on.
  const debouncedMonth = useDebounce(month, 350);
  const [metrics, setMetrics] = useState<MonthlyMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getMonthlyMetrics(debouncedMonth)
      .then(res => { if (!cancelled) setMetrics(res.data); })
      .catch(() => { if (!cancelled) toast.error('Failed to load monthly figures'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [debouncedMonth, activeGarageId]);

  const profitPositive = (metrics?.netProfit ?? 0) >= 0;

  return (
    <section aria-label="Monthly business" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold text-gray-900">Business this month</h2>
        <div className="flex items-center gap-3">
          <MonthPicker value={month} onChange={setMonth} locale={locale.locale} />
          <Link to="/expenses" className="text-sm font-semibold text-primary-600 hover:text-primary-700">Manage expenses</Link>
        </div>
      </div>

      {loading && !metrics ? <Loader /> : metrics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="flex flex-col gap-2">
              <StatCard title="Total revenue" value={money(metrics.revenue)} icon={HiOutlineReceiptTax} colorClass="green" />
              <Delta current={metrics.revenue} previous={metrics.previous.revenue} />
            </div>
            <div className="flex flex-col gap-2">
              <StatCard title="Services completed" value={metrics.services} icon={HiOutlineClipboardCheck} colorClass="blue" />
              <Delta current={metrics.services} previous={metrics.previous.services} />
            </div>
            <div className="flex flex-col gap-2">
              <StatCard title="Total expenses" value={money(metrics.expenses)} icon={HiOutlineCash} colorClass="red" />
              <Delta current={metrics.expenses} previous={metrics.previous.expenses} invert />
            </div>
            <div className="flex flex-col gap-2">
              <StatCard
                title={profitPositive ? 'Net profit' : 'Net loss'}
                value={money(Math.abs(metrics.netProfit))}
                icon={profitPositive ? HiOutlineTrendingUp : HiOutlineTrendingDown}
                colorClass={profitPositive ? 'teal' : 'red'}
              />
              <Delta current={metrics.netProfit} previous={metrics.previous.netProfit} />
            </div>
          </div>

          {metrics.expensesByCategory.length > 0 && (
            <div className="border border-bone-200 bg-bone-50 p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Where the money went</h3>
              <ul className="flex flex-col gap-2">
                {metrics.expensesByCategory.map(row => {
                  const share = metrics.expenses ? Math.round((row.total / metrics.expenses) * 100) : 0;
                  return (
                    <li key={row.category} className="flex items-center gap-3 text-sm">
                      <span className="w-44 shrink-0 text-gray-700">{EXPENSE_CATEGORY_LABEL[row.category] || row.category}</span>
                      <span className="flex-1 h-2 bg-bone-200" aria-hidden="true">
                        <span className="block h-2 bg-danger" style={{ width: `${share}%` }} />
                      </span>
                      <span className="w-28 text-right tabular font-semibold text-gray-900">{money(row.total)}</span>
                      <span className="w-10 text-right text-xs text-gray-500">{share}%</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}
