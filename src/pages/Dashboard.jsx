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
import './Dashboard.css';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, hasRole } = useAuth();

  useEffect(() => {
    fetchDashboard();
  }, []);

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

  const [cronRunning, setCronRunning] = useState(false);
  const triggerCron = async () => {
    setCronRunning(true);
    try {
      const res = await api.post('/reminders/trigger-cron');
      const d = res.data.data;
      toast.success(`Reminders: ${d.emailSent || 0} emails, ${d.smsSent || 0} SMS sent | ${d.skipped || 0} skipped`);
      fetchDashboard(); // Refresh after sending
    } catch (error) {
      toast.error('Failed to trigger reminders');
    } finally {
      setCronRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
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

  return (
    <div className="dashboard">
      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon"><HiOutlineClipboardList /></div>
          <div className="stat-info">
            <h3>{stats?.overview?.activeJobCards || 0}</h3>
            <p>Active Job Cards</p>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon"><HiOutlineCurrencyRupee /></div>
          <div className="stat-info">
            <h3>{formatCurrency(stats?.revenue?.today)}</h3>
            <p>Today's Revenue</p>
          </div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon"><HiOutlineCurrencyRupee /></div>
          <div className="stat-info">
            <h3>{formatCurrency(stats?.revenue?.month)}</h3>
            <p>Monthly Revenue</p>
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon"><HiOutlineClock /></div>
          <div className="stat-info">
            <h3>{stats?.overview?.pendingEstimations || 0}</h3>
            <p>Pending Estimations</p>
          </div>
        </div>
        <div className="stat-card teal">
          <div className="stat-icon"><HiOutlineCheckCircle /></div>
          <div className="stat-info">
            <h3>{stats?.overview?.readyForPickup || 0}</h3>
            <p>Ready for Pickup</p>
          </div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon"><HiOutlineExclamation /></div>
          <div className="stat-info">
            <h3>{stats?.unpaid?.count || 0}</h3>
            <p>Unpaid Invoices ({formatCurrency(stats?.unpaid?.total)})</p>
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Recent Job Cards */}
        <div className="card">
          <div className="card-header">
            <h3>Recent Job Cards</h3>
            <Link to="/jobcards" className="btn btn-ghost btn-sm">
              View All <HiOutlineArrowRight />
            </Link>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {stats?.recentJobCards?.length === 0 ? (
              <div className="empty-state">
                <HiOutlineClipboardList style={{ fontSize: '2.5rem' }} />
                <p>No job cards yet</p>
              </div>
            ) : (
              <div className="recent-list">
                {stats?.recentJobCards?.map(jc => (
                  <Link to={`/jobcards/${jc._id}`} className="recent-item" key={jc._id}>
                    <div className="recent-item-main">
                      <span className="recent-item-number">{jc.jobCardNumber}</span>
                      <span className={`badge badge-${jc.status}`}>
                        {jc.status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="recent-item-details">
                      <span>{jc.vehicle?.licensePlate} — {jc.vehicle?.make} {jc.vehicle?.model}</span>
                      <span className="text-muted">{jc.customer?.name}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="card">
          <div className="card-header">
            <h3>⚠️ Low Stock Alerts</h3>
            <Link to="/inventory" className="btn btn-ghost btn-sm">
              Manage <HiOutlineArrowRight />
            </Link>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {stats?.lowStockItems?.length === 0 ? (
              <div className="empty-state">
                <HiOutlineCheckCircle style={{ fontSize: '2.5rem', color: 'var(--success)' }} />
                <p>All stock levels are healthy!</p>
              </div>
            ) : (
              <div className="recent-list">
                {stats?.lowStockItems?.map(item => (
                  <div className="recent-item" key={item._id}>
                    <div className="recent-item-main">
                      <span className="font-semibold">{item.partName}</span>
                      <span className={`badge ${item.quantity === 0 ? 'badge-cancelled' : 'badge-estimation_sent'}`}>
                        {item.quantity} left
                      </span>
                    </div>
                    <div className="recent-item-details">
                      <span className="text-muted">Threshold: {item.threshold}</span>
                      <span className="text-muted">{item.category?.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats Sidebar */}
        <div className="card quick-stats-card">
          <div className="card-header">
            <h3>Quick Overview</h3>
          </div>
          <div className="card-body">
            <div className="quick-stat-row">
              <div className="quick-stat-label">
                <HiOutlineUsers />
                <span>Total Customers</span>
              </div>
              <span className="quick-stat-value">{stats?.overview?.totalCustomers || 0}</span>
            </div>
            <div className="quick-stat-row">
              <div className="quick-stat-label">
                <HiOutlineTruck />
                <span>Total Vehicles</span>
              </div>
              <span className="quick-stat-value">{stats?.overview?.totalVehicles || 0}</span>
            </div>
            <div className="quick-stat-row">
              <div className="quick-stat-label">
                <HiOutlineClipboardList />
                <span>Today's New Jobs</span>
              </div>
              <span className="quick-stat-value">{stats?.overview?.todayJobCards || 0}</span>
            </div>
            <div className="quick-stat-row">
              <div className="quick-stat-label">
                <HiOutlineClock />
                <span>In Progress</span>
              </div>
              <span className="quick-stat-value">{stats?.overview?.inProgressJobs || 0}</span>
            </div>
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="card">
          <div className="card-header">
            <h3>Recent Invoices</h3>
            <Link to="/invoices" className="btn btn-ghost btn-sm">
              View All <HiOutlineArrowRight />
            </Link>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {stats?.recentInvoices?.length === 0 ? (
              <div className="empty-state">
                <p>No invoices yet</p>
              </div>
            ) : (
              <div className="recent-list">
                {stats?.recentInvoices?.map(inv => (
                  <Link to={`/invoices/${inv._id}`} className="recent-item" key={inv._id}>
                    <div className="recent-item-main">
                      <span className="recent-item-number">{inv.invoiceNumber}</span>
                      <span className={`badge badge-${inv.paymentStatus}`}>
                        {inv.paymentStatus}
                      </span>
                    </div>
                    <div className="recent-item-details">
                      <span>{inv.customer?.name}</span>
                      <span className="font-bold">{formatCurrency(inv.grandTotal)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Service Reminders */}
        <div className="card">
          <div className="card-header">
            <h3><HiOutlineBell style={{ display: 'inline', verticalAlign: 'middle' }} /> Service Reminders</h3>
            {hasRole('owner', 'admin') && (
              <button
                className="btn btn-primary btn-sm"
                onClick={triggerCron}
                disabled={cronRunning}
                title="Manually run the reminder cron job"
              >
                <HiOutlineMail /> {cronRunning ? 'Sending...' : 'Send Reminders Now'}
              </button>
            )}
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {!stats?.upcomingReminders?.length ? (
              <div className="empty-state">
                <HiOutlineCheckCircle style={{ fontSize: '2.5rem', color: 'var(--success)' }} />
                <p>No upcoming service reminders</p>
              </div>
            ) : (
              <div className="recent-list">
                {stats.upcomingReminders.map(r => (
                  <div className="recent-item" key={r._id}>
                    <div className="recent-item-main">
                      <span className="font-semibold">
                        {r.vehicle?.licensePlate || 'Unknown Vehicle'}
                      </span>
                      <span className={`badge ${r.isOverdue ? 'badge-cancelled' : 'badge-estimation_sent'}`}>
                        {r.isOverdue ? 'Overdue' : new Date(r.nextServiceDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <div className="recent-item-details">
                      <span>{r.customer?.name || '—'}</span>
                      <span className="text-muted text-xs">
                        {r.vehicle?.make} {r.vehicle?.model}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
