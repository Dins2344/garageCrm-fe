import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats, getChartData, triggerCron as runReminderCron } from '../services/apiServices/dashboardService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  HiOutlineUsers,
  HiOutlineTruck,
  HiOutlineClipboardList,
  HiOutlineCurrencyRupee,
  HiOutlineClock,
  HiOutlineExclamation,
  HiOutlineCheckCircle,
  HiOutlineArrowRight,
  HiOutlineBell,
  HiOutlineMail
} from 'react-icons/hi';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Trophy } from 'lucide-react';
import { useInvoiceViewer } from '../components/InvoiceViewerModal';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import { Card, CardHeader, CardBody } from '../components/Card';
import Button from '../components/Button';
import { RecentList, RecentItem, RecentItemMain, RecentItemDetails } from '../components/ListComponents';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, hasRole } = useAuth();
  const { openInvoice, InvoiceModal } = useInvoiceViewer();

  // ── Chart state ──
  const [chartData, setChartData] = useState(null);
  const [chartLoading, setChartLoading] = useState(true);
  const [period, setPeriod] = useState('7d'); // '7d' | '30d' | '90d' | 'custom'
  const [groupBy, setGroupBy] = useState('day'); // 'day' | 'week' | 'month'
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  const PRESETS = [
    { key: '7d',  label: '7 Days',   days: 7,  groupBy: 'day' },
    { key: '30d', label: '30 Days',  days: 30, groupBy: 'day' },
    { key: '90d', label: '3 Months', days: 90, groupBy: 'week' },
    { key: 'custom', label: 'Custom', days: null, groupBy: null },
  ];

  const fetchDashboard = async () => {
    try {
      const { data } = await getDashboardStats();
      setStats(data);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchCharts = useCallback(async (p = period, gb = groupBy, range = customRange) => {
    setChartLoading(true);
    try {
      const preset = PRESETS.find(x => x.key === p);
      let startDate, endDate;
      if (p === 'custom') {
        if (!range.start || !range.end) { setChartLoading(false); return; }
        startDate = range.start;
        endDate = range.end;
      } else {
        endDate = new Date().toISOString().split('T')[0];
        const s = new Date(); s.setDate(s.getDate() - (preset.days - 1));
        startDate = s.toISOString().split('T')[0];
      }
      const { data } = await getChartData({ startDate, endDate, groupBy: gb });
      setChartData(data);
    } catch { toast.error('Failed to load chart data'); }
    finally { setChartLoading(false); }
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
    } catch (error) {
      toast.error('Failed to trigger reminders');
    } finally {
      setCronRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4 text-gray-500">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const content = (
    <div className="flex flex-col gap-7">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        <StatCard title="Active Job Cards" value={stats?.overview?.activeJobCards || 0} icon={HiOutlineClipboardList} colorClass="blue" />
        <StatCard title="Today's Revenue" value={formatCurrency(stats?.revenue?.today)} icon={HiOutlineCurrencyRupee} colorClass="green" />
        <StatCard title="Monthly Revenue" value={formatCurrency(stats?.revenue?.month)} icon={HiOutlineCurrencyRupee} colorClass="purple" />
        <StatCard title="Pending Estimations" value={stats?.overview?.pendingEstimations || 0} icon={HiOutlineClock} colorClass="orange" />
        <StatCard title="Ready for Pickup" value={stats?.overview?.readyForPickup || 0} icon={HiOutlineCheckCircle} colorClass="teal" />
        <StatCard title={`Unpaid (${formatCurrency(stats?.unpaid?.total)})`} value={stats?.unpaid?.count || 0} icon={HiOutlineExclamation} colorClass="red" />
      </div>

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
                {stats?.recentJobCards?.map(jc => (
                  <Link to={`/jobcards/${jc._id}`} key={jc._id}>
                    <RecentItem>
                      <RecentItemMain>
                        <span className="font-semibold text-[15px] text-gray-800">{jc.jobCardNumber}</span>
                        <Badge intent={jc.status}>{jc.status}</Badge>
                      </RecentItemMain>
                      <RecentItemDetails>
                        <div className="flex flex-col">
                          <span>{jc.vehicle?.licensePlate} — {jc.vehicle?.make} {jc.vehicle?.model}</span>
                          <span className="text-gray-400">{jc.customer?.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-gray-400 uppercase block tracking-wider">Mechanic</span>
                          <span className="text-sm font-medium text-gray-700">{jc.assignedMechanic?.name || 'Unassigned'}</span>
                        </div>
                      </RecentItemDetails>
                    </RecentItem>
                  </Link>
                ))}
              </RecentList>
            )}
          </CardBody>
        </Card>

        {/* Low Stock Alerts */}
        {/* <Card className="animate-[slideUp_0.4s_ease_both] delay-100">
          <CardHeader title="Low Stock Alerts">
            <Button variant="ghost" size="sm" to="/inventory">
              Manage <HiOutlineArrowRight />
            </Button>
          </CardHeader>
          <CardBody noPadding>
            {stats?.lowStockItems?.length === 0 ? (
              <EmptyState icon={HiOutlineCheckCircle} title="All stock levels are healthy!" />
            ) : (
              <RecentList>
                {stats?.lowStockItems?.map(item => (
                  <RecentItem key={item._id}>
                    <RecentItemMain>
                      <span className="font-semibold">{item.partName}</span>
                      <Badge intent={item.quantity === 0 ? 'cancelled' : 'estimation_sent'}>
                        {item.quantity} left
                      </Badge>
                    </RecentItemMain>
                    <RecentItemDetails>
                      <span>Threshold: {item.threshold}</span>
                      <span className="capitalize">{item.category?.replace(/_/g, ' ')}</span>
                    </RecentItemDetails>
                  </RecentItem>
                ))}
              </RecentList>
            )}
          </CardBody>
        </Card> */}

        {/* Quick Stats Sidebar */}
        <Card className="animate-[slideUp_0.4s_ease_both] delay-150">
          <CardHeader title="Quick Overview" />
          <CardBody className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-3 px-4 bg-gray-50 rounded-lg transition-transform duration-150 hover:bg-gray-100 hover:translate-x-1">
              <div className="flex items-center gap-3 text-gray-600 font-medium">
                <HiOutlineUsers className="text-xl text-primary-500" /> Total Customers
              </div>
              <span className="text-xl font-bold text-gray-900">{stats?.overview?.totalCustomers || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 px-4 bg-gray-50 rounded-lg transition-transform duration-150 hover:bg-gray-100 hover:translate-x-1">
              <div className="flex items-center gap-3 text-gray-600 font-medium">
                <HiOutlineTruck className="text-xl text-primary-500" /> Total Vehicles
              </div>
              <span className="text-xl font-bold text-gray-900">{stats?.overview?.totalVehicles || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 px-4 bg-gray-50 rounded-lg transition-transform duration-150 hover:bg-gray-100 hover:translate-x-1">
              <div className="flex items-center gap-3 text-gray-600 font-medium">
                <HiOutlineClipboardList className="text-xl text-primary-500" /> Today's New Jobs
              </div>
              <span className="text-xl font-bold text-gray-900">{stats?.overview?.todayJobCards || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 px-4 bg-gray-50 rounded-lg transition-transform duration-150 hover:bg-gray-100 hover:translate-x-1">
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
                {stats?.recentInvoices?.map(inv => (
                  <RecentItem key={inv._id} onClick={() => openInvoice(inv._id)}>
                    <RecentItemMain>
                      <span className="font-semibold text-[15px] text-gray-800">{inv.invoiceNumber}</span>
                      <Badge intent={inv.paymentStatus}>{inv.paymentStatus}</Badge>
                    </RecentItemMain>
                    <RecentItemDetails>
                      <span>{inv.customer?.name}</span>
                      <span className="font-bold text-gray-900">{formatCurrency(inv.grandTotal)}</span>
                    </RecentItemDetails>
                  </RecentItem>
                ))}
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
                {stats.upcomingReminders.slice(0, 5).map(r => (
                  <RecentItem key={r._id}>
                    <RecentItemMain>
                      <span className="font-semibold text-sm">{r.vehicle?.licensePlate}</span>
                      <Badge intent={r.isOverdue ? 'cancelled' : 'estimation_sent'}>
                        {r.isOverdue ? 'Overdue' : new Date(r.nextServiceDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </Badge>
                    </RecentItemMain>
                  </RecentItem>
                ))}
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
                    <tr className="border-b border-gray-100 uppercase text-[11px] font-bold text-gray-400 tracking-wider">
                      <th className="px-6 py-4">Rank</th>
                      <th className="px-6 py-4">Staff Member</th>
                      <th className="px-6 py-4">Total Jobs</th>
                      <th className="px-6 py-4 text-right">Labour Achieved</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {stats.staffAchievement.map((achievement, index) => (
                      <tr key={achievement._id} className="hover:bg-gray-50/80 transition-colors group">
                        <td className="px-6 py-4">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-100 text-yellow-700 shadow-sm border border-yellow-200' :
                              index === 1 ? 'bg-gray-100 text-gray-600' :
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
                            <div className="w-20 h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
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
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
            {PRESETS.map(p => (
              <button
                key={p.key}
                onClick={() => {
                  setPeriod(p.key);
                  if (p.groupBy) setGroupBy(p.groupBy);
                  if (p.key !== 'custom') fetchCharts(p.key, p.groupBy, customRange);
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  period === p.key
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Group by selector (only for non-custom when day count is ≥ 30) */}
          {period !== 'custom' && (
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
              {['day', 'week', 'month'].map(g => (
                <button
                  key={g}
                  onClick={() => { setGroupBy(g); fetchCharts(period, g, customRange); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                    groupBy === g
                      ? 'bg-gray-800 text-white shadow-sm'
                      : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'
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
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-700 outline-none focus:border-primary-400 transition-colors"
              />
              <span className="text-gray-400 text-sm font-medium">to</span>
              <input
                type="date"
                value={customRange.end}
                min={customRange.start}
                max={new Date().toISOString().split('T')[0]}
                onChange={e => setCustomRange(r => ({ ...r, end: e.target.value }))}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-700 outline-none focus:border-primary-400 transition-colors"
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
                <div className="flex items-center justify-center h-[220px]">
                  <div className="w-8 h-8 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin" />
                </div>
              ) : chartData?.revenueTrend?.every(d => d.revenue === 0) ? (
                <EmptyState icon={HiOutlineCurrencyRupee} title="No revenue in this period" />
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
                      interval={chartData?.revenueTrend?.length > 14 ? 'preserveStartEnd' : 0}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      axisLine={false} tickLine={false}
                      tickFormatter={v => v >= 1000 ? `₹${(v/1000).toFixed(0)}k` : `₹${v}`}
                      width={52}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontSize: 13 }}
                      formatter={v => [formatCurrency(v), 'Revenue']}
                      labelStyle={{ fontWeight: 700, color: '#111827', marginBottom: 2 }}
                    />
                    <Area
                      type="monotone" dataKey="revenue"
                      stroke="#3b5ff8" strokeWidth={2.5}
                      fill="url(#revenueGrad)"
                      dot={chartData?.revenueTrend?.length <= 31 ? { r: 3.5, fill: '#3b5ff8', strokeWidth: 2, stroke: '#fff' } : false}
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
                <div className="flex items-center justify-center h-[220px]">
                  <div className="w-8 h-8 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin" />
                </div>
              ) : (() => {
                const STATUS_COLORS = { new: '#3b5ff8', estimation_sent: '#f59e0b', approved: '#8b5cf6', in_progress: '#06b6d4', ready_for_pickup: '#10b981', delivered: '#6b7280', cancelled: '#ef4444' };
                const STATUS_LABELS = { new: 'New', estimation_sent: 'Est. Sent', approved: 'Approved', in_progress: 'In Progress', ready_for_pickup: 'Ready', delivered: 'Delivered', cancelled: 'Cancelled' };
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
                          contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: 13 }}
                          formatter={(v, n) => [`${v} (${Math.round(v/total*100)}%)`, n]}
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
          {stats?.staffAchievement?.length > 0 && (
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
                    <YAxis yAxisId="labour" orientation="right" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={52} tickFormatter={v => v >= 1000 ? `₹${(v/1000).toFixed(0)}k` : `₹${v}`} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontSize: 13 }}
                      formatter={(v, name) => name === 'jobs' ? [`${v} jobs`, 'Job Count'] : [formatCurrency(v), 'Labour Value']}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} formatter={v => v === 'jobs' ? 'Job Count' : 'Labour Value'} />
                    <Bar yAxisId="jobs" dataKey="jobs" fill="#3b5ff8" radius={[6, 6, 0, 0]} maxBarSize={36} />
                    <Bar yAxisId="labour" dataKey="labour" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={36} />
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

