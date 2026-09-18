import { useState, useEffect, useCallback } from 'react';
import { useGarage } from '../context/GarageContext';
import { formatMoney, formatDate as fmtDate } from '../utils/format';
import { Link } from 'react-router-dom';
import { getDashboardStats, getChartData, triggerCron as runReminderCron } from '../services/apiServices/dashboardService';
import type { DashboardStats, ChartData } from '../services/apiServices/dashboardService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  HiOutlineUsers,
  HiOutlineTruck,
  HiOutlineClipboardList,
  HiOutlineReceiptTax,
  HiOutlineClock,
  HiOutlineExclamation,
  HiOutlineCheckCircle,
  HiOutlineArrowRight,
  HiOutlineBell,
  HiOutlineMail,
  HiOutlineRefresh
} from 'react-icons/hi';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Trophy } from 'lucide-react';
import { useInvoiceViewer } from '../components/InvoiceViewerModal';
import StatCard from '../components/StatCard';
import MonthlyBusinessPanel from '../components/MonthlyBusinessPanel';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import { Card, CardHeader, CardBody } from '../components/Card';
import Button from '../components/Button';
import { RecentList, RecentItem, RecentItemMain, RecentItemDetails } from '../components/ListComponents';
import Loader from '../components/Loader';

type Period = '7d' | '30d' | '90d' | 'custom';
type GroupBy = 'day' | 'week' | 'month';

interface Preset {
  key: Period;
  label: string;
  days: number | null;
  groupBy: GroupBy | null;
}

const PRESETS: Preset[] = [
  { key: '7d',  label: '7 Days',   days: 7,  groupBy: 'day' },
  { key: '30d', label: '30 Days',  days: 30, groupBy: 'day' },
  { key: '90d', label: '3 Months', days: 90, groupBy: 'week' },
  { key: 'custom', label: 'Custom', days: null, groupBy: null },
];

export default function Dashboard() {
  const { locale } = useGarage();
  const money = (n?: number) => formatMoney(n, locale);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { hasRole } = useAuth();
  const { openInvoice, InvoiceModal } = useInvoiceViewer();

  // ── Chart state ──
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [chartLoading, setChartLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('7d');
  const [groupBy, setGroupBy] = useState<GroupBy>('day');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  const fetchDashboard = async () => {
    try {
      const { data } = await getDashboardStats();
      setStats(data);
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchCharts = useCallback(async (p: Period = period, gb: GroupBy = groupBy, range = customRange) => {
    setChartLoading(true);
    try {
      const preset = PRESETS.find(x => x.key === p);
      let startDate: string, endDate: string;
      if (p === 'custom') {
        if (!range.start || !range.end) { setChartLoading(false); return; }
        startDate = range.start;
        endDate = range.end;
      } else {
        endDate = new Date().toISOString().split('T')[0];
        const s = new Date(); s.setDate(s.getDate() - ((preset?.days || 7) - 1));
        startDate = s.toISOString().split('T')[0];
      }
      const { data } = await getChartData({ startDate, endDate, groupBy: gb });
      setChartData(data);
    } catch { toast.error('Failed to load chart data'); }
    finally { setChartLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, groupBy, customRange]);

  useEffect(() => { fetchDashboard(); }, []);
  useEffect(() => { fetchCharts(); }, []);

  const [cronRunning, setCronRunning] = useState(false);
  const triggerCron = async () => {
    setCronRunning(true);
    try {
      const { data: d } = await runReminderCron();
      toast.success(`Reminders: ${d.emailSent || 0} emails, ${d.smsSent || 0} SMS sent | ${d.skipped || 0} skipped`);
      fetchDashboard();
    } catch {
      toast.error('Failed to trigger reminders');
    } finally {
      setCronRunning(false);
    }
  };

  if (loading) {
    return <Loader text="Loading dashboard..." />;
  }

  const formatCurrency = (amount?: number) => money(amount);

  /**
   * Compact form for chart axis ticks, where a full "₹12,34,567.00" would
   * overlap its neighbours. Deliberately hand-rolled rather than
   * `notation: 'compact'` — that's one of the Intl options Hermes support is
   * unreliable for, and this file's mobile counterpart uses the same approach.
   */
  const axisMoney = (v: number) =>
    v >= 1000 ? `${locale.currency} ${(v / 1000).toFixed(0)}k` : `${locale.currency} ${v}`;

  const content = (
    <div className="flex flex-col gap-7">
      <div className="flex justify-between items-center -mb-2">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h1>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            fetchDashboard();
            fetchCharts();
          }}
          icon={HiOutlineRefresh}
        >
          Refresh Data
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4">
        <StatCard title="Active Job Cards" value={stats?.overview?.activeJobCards || 0} icon={HiOutlineClipboardList} colorClass="blue" />
        <StatCard title="Today's Revenue" value={formatCurrency(stats?.revenue?.today)} icon={HiOutlineReceiptTax} colorClass="green" />
        <StatCard title="Monthly Revenue" value={formatCurrency(stats?.revenue?.month)} icon={HiOutlineReceiptTax} colorClass="purple" />
        <StatCard title="Pending Estimations" value={stats?.overview?.pendingEstimations || 0} icon={HiOutlineClock} colorClass="orange" />
        <StatCard title="Ready for Pickup" value={stats?.overview?.readyForPickup || 0} icon={HiOutlineCheckCircle} colorClass="teal" />
        <StatCard title={`Unpaid (${formatCurrency(stats?.unpaid?.total)})`} value={stats?.unpaid?.count || 0} icon={HiOutlineExclamation} colorClass="red" />
      </div>

      {/* Monthly business figures — owner/admin, the only roles who see expenses */}
      {hasRole('owner', 'admin') && <MonthlyBusinessPanel />}

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">

        {/* Recent Job Cards */}
        <Card className="animate-[slideUp_0.4s_ease_both] delay-75">
          <CardHeader title="Recent Job Cards">
            <Button variant="ghost" size="sm" to="/jobcards">
              View All <HiOutlineArrowRight />
            </Button>
          </CardHeader>
          <CardBody noPadding>
            {stats?.recentJobCards?.length === 0 ? (
              <EmptyState icon={HiOutlineClipboardList} title="No job cards yet" />
            ) : (
              <RecentList>
                {stats?.recentJobCards?.map(jc => {
                  const vehicle = typeof jc.vehicle === 'string' ? null : jc.vehicle;
                  const customer = typeof jc.customer === 'string' ? null : jc.customer;
                  const mechanic = typeof jc.assignedMechanic === 'string' ? null : jc.assignedMechanic;
                  return (
                  <Link to={`/jobcards/${jc._id}`} key={jc._id}>
                    <RecentItem>
                      <RecentItemMain>
                        <span className="font-semibold text-[15px] text-gray-800">{jc.jobCardNumber}</span>
                        <Badge intent={jc.status}>{jc.status}</Badge>
                      </RecentItemMain>
                      <RecentItemDetails>
                        <div className="flex flex-col">
                          <span>{vehicle?.licensePlate} — {vehicle?.make} {vehicle?.model}</span>
                          <span className="text-gray-400">{customer?.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-gray-400 uppercase block tracking-wider">Mechanic</span>
                          <span className="text-sm font-medium text-gray-700">{mechanic?.name || 'Unassigned'}</span>
                        </div>
                      </RecentItemDetails>
                    </RecentItem>
                  </Link>
                  );
                })}
              </RecentList>
            )}
          </CardBody>
        </Card>

        {/* Quick Stats Sidebar */}
        <Card className="animate-[slideUp_0.4s_ease_both] delay-150">
          <CardHeader title="Quick Overview" />
          <CardBody className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-3 px-4 bg-bone-100 rounded-lg transition-transform duration-150 hover:bg-bone-200 hover:translate-x-1">
              <div className="flex items-center gap-3 text-gray-600 font-medium">
                <HiOutlineUsers className="text-xl text-primary-500" /> Total Customers
              </div>
              <span className="text-xl font-bold text-gray-900">{stats?.overview?.totalCustomers || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 px-4 bg-bone-100 rounded-lg transition-transform duration-150 hover:bg-bone-200 hover:translate-x-1">
              <div className="flex items-center gap-3 text-gray-600 font-medium">
                <HiOutlineTruck className="text-xl text-primary-500" /> Total Vehicles
              </div>
              <span className="text-xl font-bold text-gray-900">{stats?.overview?.totalVehicles || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 px-4 bg-bone-100 rounded-lg transition-transform duration-150 hover:bg-bone-200 hover:translate-x-1">
              <div className="flex items-center gap-3 text-gray-600 font-medium">
                <HiOutlineClipboardList className="text-xl text-primary-500" /> Today's New Jobs
              </div>
              <span className="text-xl font-bold text-gray-900">{stats?.overview?.todayJobCards || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 px-4 bg-bone-100 rounded-lg transition-transform duration-150 hover:bg-bone-200 hover:translate-x-1">
              <div className="flex items-center gap-3 text-gray-600 font-medium">
                <HiOutlineClock className="text-xl text-primary-500" /> In Progress
              </div>
              <span className="text-xl font-bold text-gray-900">{stats?.overview?.inProgressJobs || 0}</span>
            </div>
          </CardBody>
        </Card>

        {/* Recent Invoices */}
        <Card className="animate-[slideUp_0.4s_ease_both] delay-200">
          <CardHeader title="Recent Invoices">
            <Button variant="ghost" size="sm" to="/invoices">
              View All <HiOutlineArrowRight />
            </Button>
          </CardHeader>
          <CardBody noPadding>
            {stats?.recentInvoices?.length === 0 ? (
              <EmptyState title="No invoices yet" />
            ) : (
              <RecentList>
                {stats?.recentInvoices?.map(inv => {
                  const customer = typeof inv.customer === 'string' ? null : inv.customer;
                  return (
                  <RecentItem key={inv._id} onClick={() => openInvoice(inv._id)}>
                    <RecentItemMain>
                      <span className="font-semibold text-[15px] text-gray-800">{inv.invoiceNumber}</span>
                      <Badge intent={inv.paymentStatus}>{inv.paymentStatus}</Badge>
                    </RecentItemMain>
                    <RecentItemDetails>
                      <span>{customer?.name}</span>
                      <span className="font-bold text-gray-900">{formatCurrency(inv.grandTotal)}</span>
                    </RecentItemDetails>
                  </RecentItem>
                  );
                })}
              </RecentList>
            )}
          </CardBody>
        </Card>

        {/* Service Reminders */}
        <Card className="animate-[slideUp_0.4s_ease_both] delay-300">
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <HiOutlineBell className="text-2xl" /> Reminders
              </h3>
              {hasRole('owner', 'admin') && (
                <Button variant="ghost" size="sm" onClick={triggerCron} disabled={cronRunning} icon={HiOutlineMail}>
                  {cronRunning ? '...' : 'Send'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardBody noPadding>
            {!stats?.upcomingReminders?.length ? (
              <EmptyState icon={HiOutlineCheckCircle} title="No reminders" />
            ) : (
              <RecentList>
                {stats.upcomingReminders.slice(0, 5).map(r => {
                  const vehicle = typeof r.vehicle === 'string' ? null : r.vehicle;
                  return (
                  <RecentItem key={r._id}>
                    <RecentItemMain>
                      <span className="font-semibold text-sm">{vehicle?.licensePlate}</span>
                      <Badge intent={r.isOverdue ? 'cancelled' : 'estimation_sent'}>
                        {r.isOverdue ? 'Overdue' : fmtDate(r.nextServiceDate, locale, { day: 'numeric', month: 'short' })}
                      </Badge>
                    </RecentItemMain>
                  </RecentItem>
                  );
                })}
              </RecentList>
            )}
          </CardBody>
        </Card>

        {/* Staff Achievement Leaderboard */}
        <Card className="animate-[slideUp_0.4s_ease_both] delay-350 xl:col-span-2">
          <CardHeader>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" strokeWidth={1.5} />
              Monthly Staff Achievement
            </h3>
          </CardHeader>
          <CardBody noPadding>
            {!stats?.staffAchievement?.length ? (
              <EmptyState icon={HiOutlineUsers} title="No data yet for this month" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-bone-200 uppercase text-[11px] font-bold text-gray-400 tracking-wider">
                      <th className="px-6 py-4">Rank</th>
                      <th className="px-6 py-4">Staff Member</th>
                      <th className="px-6 py-4">Total Jobs</th>
                      <th className="px-6 py-4 text-right">Labour Achieved</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {stats.staffAchievement.map((achievement, index) => (
                      <tr key={achievement._id} className="hover:bg-bone-100/80 transition-colors group">
                        <td className="px-6 py-4">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-100 text-yellow-700 shadow-sm border border-yellow-200' :
                              index === 1 ? 'bg-bone-200 text-gray-600' :
                                index === 2 ? 'bg-orange-50 text-orange-700' :
                                  'text-gray-400'
                            }`}>
                            {index + 1}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-800 group-hover:text-primary-600 transition-colors">
                              {achievement.staffName}
                            </span>
                            <span className="text-[11px] font-bold uppercase text-gray-400 tracking-tighter">
                              {achievement.role}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-700">{achievement.jobCount}</span>
                            <span className="text-xs text-gray-400">jobs completed</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-[15px] font-bold text-gray-900 font-mono">
                              {formatCurrency(achievement.totalLabor)}
                            </span>
                            <div className="w-20 h-1.5 bg-bone-200 rounded-full mt-2 overflow-hidden">
                              <div
                                className="h-full bg-primary-500 rounded-full shadow-[0_0_8px_rgba(59,95,248,0.3)] transition-all duration-1000"
                                style={{ width: `${Math.min(100, (achievement.totalLabor / (stats.staffAchievement[0]?.totalLabor || 1)) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>

      </div>

      {/* ── INTERACTIVE CHARTS ── */}
      <div className="flex flex-col gap-4">

        {/* Period selector toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-1 bg-bone-50 border border-bone-200 rounded-xl p-1 shadow-sm">
            {PRESETS.map(p => (
              <button
                key={p.key}
                onClick={() => {
                  setPeriod(p.key);
                  if (p.groupBy) setGroupBy(p.groupBy);
                  if (p.key !== 'custom') fetchCharts(p.key, p.groupBy || groupBy, customRange);
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  period === p.key
                    ? 'bg-ink-900 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-bone-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Group by selector (only for non-custom when day count is ≥ 30) */}
          {period !== 'custom' && (
            <div className="flex items-center gap-1 bg-bone-50 border border-bone-200 rounded-xl p-1 shadow-sm">
              {(['day', 'week', 'month'] as GroupBy[]).map(g => (
                <button
                  key={g}
                  onClick={() => { setGroupBy(g); fetchCharts(period, g, customRange); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                    groupBy === g
                      ? 'bg-ink-900 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-bone-200'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          )}

          {/* Custom date pickers */}
          {period === 'custom' && (
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="date"
                value={customRange.start}
                max={customRange.end || new Date().toISOString().split('T')[0]}
                onChange={e => setCustomRange(r => ({ ...r, start: e.target.value }))}
                className="px-3 py-1.5 text-sm border border-bone-200 rounded-xl bg-bone-50 text-gray-700 outline-none focus:border-primary-400 transition-colors"
              />
              <span className="text-gray-400 text-sm font-medium">to</span>
              <input
                type="date"
                value={customRange.end}
                min={customRange.start}
                max={new Date().toISOString().split('T')[0]}
                onChange={e => setCustomRange(r => ({ ...r, end: e.target.value }))}
                className="px-3 py-1.5 text-sm border border-bone-200 rounded-xl bg-bone-50 text-gray-700 outline-none focus:border-primary-400 transition-colors"
              />
              <button
                onClick={() => fetchCharts('custom', groupBy, customRange)}
                disabled={!customRange.start || !customRange.end}
                className="px-4 py-1.5 text-sm font-bold bg-primary-600 text-white rounded-xl disabled:opacity-40 hover:bg-primary-700 transition-colors"
              >
                Apply
              </button>
            </div>
          )}
        </div>

        {/* Charts grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Revenue Trend */}
          <Card className="lg:col-span-2 animate-[slideUp_0.4s_ease_both] delay-400">
            <CardHeader title="Revenue Trend" />
            <CardBody>
              {chartLoading ? (
                <Loader />
              ) : chartData?.revenueTrend?.every(d => d.revenue === 0) ? (
                <EmptyState icon={HiOutlineReceiptTax} title="No revenue in this period" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData?.revenueTrend || []} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b5ff8" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#3b5ff8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 600 }}
                      axisLine={false} tickLine={false}
                      interval={(chartData?.revenueTrend?.length || 0) > 14 ? 'preserveStartEnd' : 0}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      axisLine={false} tickLine={false}
                      tickFormatter={axisMoney}
                      width={52}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: 0, background: 'var(--color-ink-900)', border: '1px solid rgba(255,255,255,0.15)', boxShadow: 'none', color: '#fff', fontFamily: 'var(--font-sans)', fontSize: 13 }}
                      itemStyle={{ color: '#fff' }}
                      labelStyle={{ fontWeight: 700, color: '#fff', marginBottom: 2 }}
                      formatter={(v) => [formatCurrency(Number(v)), 'Revenue']}
                    />
                    <Area
                      type="monotone" dataKey="revenue"
                      stroke="#3b5ff8" strokeWidth={2.5}
                      fill="url(#revenueGrad)"
                      dot={(chartData?.revenueTrend?.length || 0) <= 31 ? { r: 3.5, fill: '#3b5ff8', strokeWidth: 2, stroke: '#fff' } : false}
                      activeDot={{ r: 6, fill: '#3b5ff8', strokeWidth: 2, stroke: '#fff' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardBody>
          </Card>

          {/* Job Status Breakdown */}
          <Card className="animate-[slideUp_0.4s_ease_both] delay-450">
            <CardHeader title="Job Status" />
            <CardBody>
              {chartLoading ? (
                <Loader />
              ) : (() => {
                const STATUS_COLORS: Record<string, string> = { new: '#3b5ff8', estimation_sent: '#f59e0b', approved: '#8b5cf6', in_progress: '#06b6d4', ready_for_pickup: '#10b981', delivered: '#6b7280', cancelled: '#ef4444' };
                const STATUS_LABELS: Record<string, string> = { new: 'New', estimation_sent: 'Est. Sent', approved: 'Approved', in_progress: 'In Progress', quality_check: 'Quality Check', ready_for_pickup: 'Ready', delivered: 'Delivered', cancelled: 'Cancelled' };
                const breakdown = chartData?.jobStatusBreakdown || {};
                const pieData = Object.entries(breakdown)
                  .map(([s, c]) => ({ name: STATUS_LABELS[s] || s, value: c, color: STATUS_COLORS[s] || '#9ca3af' }))
                  .filter(d => d.value > 0).sort((a, b) => b.value - a.value);

                if (!pieData.length) return <EmptyState icon={HiOutlineClipboardList} title="No jobs in this period" />;

                const total = pieData.reduce((s, d) => s + d.value, 0);
                return (
                  <div className="flex flex-col gap-4">
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                          {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Tooltip
                          contentStyle={{ borderRadius: 0, background: 'var(--color-ink-900)', border: '1px solid rgba(255,255,255,0.15)', boxShadow: 'none', color: '#fff', fontFamily: 'var(--font-sans)', fontSize: 13 }}
                          itemStyle={{ color: '#fff' }}
                          formatter={(v, n) => [`${v} (${Math.round(Number(v)/total*100)}%)`, n]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                      {pieData.map(d => (
                        <div key={d.name} className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                          <span className="text-xs text-gray-600 font-medium truncate">{d.name}</span>
                          <span className="text-xs font-bold text-gray-900 ml-auto">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </CardBody>
          </Card>

          {/* Staff Performance Bar Chart (unchanged, from main stats) */}
          {stats?.staffAchievement && stats.staffAchievement.length > 0 && (
            <Card className="lg:col-span-3 animate-[slideUp_0.4s_ease_both] delay-500">
              <CardHeader title="Staff Performance — This Month" />
              <CardBody>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={stats.staffAchievement.slice(0, 8).map(s => ({ name: s.staffName?.split(' ')[0] || 'N/A', jobs: s.jobCount, labour: s.totalLabor }))}
                    margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="jobs" orientation="left" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={28} label={{ value: 'Jobs', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 10, fill: '#9ca3af' } }} />
                    <YAxis yAxisId="labour" orientation="right" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={52} tickFormatter={axisMoney} />
                    <Tooltip
                      contentStyle={{ borderRadius: 0, background: 'var(--color-ink-900)', border: '1px solid rgba(255,255,255,0.15)', boxShadow: 'none', color: '#fff', fontFamily: 'var(--font-sans)', fontSize: 13 }}
                      itemStyle={{ color: '#fff' }}
                      labelStyle={{ fontWeight: 700, color: '#fff', marginBottom: 2 }}
                      formatter={(v, name) => name === 'jobs' ? [`${v} jobs`, 'Job Count'] : [formatCurrency(Number(v)), 'Labour Value']}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} formatter={v => v === 'jobs' ? 'Job Count' : 'Labour Value'} />
                    <Bar yAxisId="jobs" dataKey="jobs" fill="#3b5ff8" radius={[0, 0, 0, 0]} maxBarSize={36} />
                    <Bar yAxisId="labour" dataKey="labour" fill="#10b981" radius={[0, 0, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
          )}

        </div>
      </div>
    </div>
  );

  return (
    <>
      {content}
      <InvoiceModal />
    </>
  );
}
