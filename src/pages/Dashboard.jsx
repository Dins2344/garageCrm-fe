import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats, triggerCron as runReminderCron } from '../services/apiServices/dashboardService';
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

  useEffect(() => {
    fetchDashboard();
  }, []);

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
    </div>
  );

  return (
    <>
      {content}
      <InvoiceModal />
    </>
  );
}

