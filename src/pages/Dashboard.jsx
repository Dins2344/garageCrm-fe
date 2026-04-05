import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
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
      const res = await api.get('/dashboard');
      setStats(res.data.data);
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
      const res = await api.post('/reminders/trigger-cron');
      const d = res.data.data;
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
                        <span>{jc.vehicle?.licensePlate} — {jc.vehicle?.make} {jc.vehicle?.model}</span>
                        <span>{jc.customer?.name}</span>
                      </RecentItemDetails>
                    </RecentItem>
                  </Link>
                ))}
              </RecentList>
            )}
          </CardBody>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="animate-[slideUp_0.4s_ease_both] delay-100">
          <CardHeader title="⚠️ Low Stock Alerts">
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
        </Card>

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
        <Card className="animate-[slideUp_0.4s_ease_both] delay-300 xl:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <HiOutlineBell className="text-2xl" /> Service Reminders
              </h3>
              {hasRole('owner', 'admin') && (
                <Button variant="primary" size="sm" onClick={triggerCron} disabled={cronRunning} icon={HiOutlineMail}>
                  {cronRunning ? 'Sending...' : 'Send Reminders Now'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardBody noPadding>
            {!stats?.upcomingReminders?.length ? (
              <EmptyState icon={HiOutlineCheckCircle} title="No upcoming service reminders" />
            ) : (
              <RecentList className="grid grid-cols-1 md:grid-cols-2">
                {stats.upcomingReminders.map(r => (
                  <RecentItem key={r._id}>
                    <RecentItemMain>
                      <span className="font-semibold">{r.vehicle?.licensePlate || 'Unknown Vehicle'}</span>
                      <Badge intent={r.isOverdue ? 'cancelled' : 'estimation_sent'}>
                        {r.isOverdue ? 'Overdue' : new Date(r.nextServiceDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </Badge>
                    </RecentItemMain>
                    <RecentItemDetails>
                      <span>{r.customer?.name || '—'}</span>
                      <span className="text-xs">{r.vehicle?.make} {r.vehicle?.model}</span>
                    </RecentItemDetails>
                  </RecentItem>
                ))}
              </RecentList>
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

