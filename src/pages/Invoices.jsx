import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  HiOutlineSearch,
  HiOutlineEye,
  HiOutlineCurrencyRupee,
  HiOutlineCheckCircle,
  HiOutlineDownload
} from 'react-icons/hi';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const { hasRole } = useAuth();

  useEffect(() => {
    fetchInvoices();
  }, [search, paymentFilter]);

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/invoices', {
        params: { search, paymentStatus: paymentFilter, limit: 50 }
      });
      setInvoices(res.data.data);
    } catch (error) {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (invoiceId) => {
    const invoice = invoices.find(i => i._id === invoiceId);
    if (!invoice) return;

    try {
      await api.put(`/invoices/${invoiceId}/payment`, {
        amountPaid: invoice.grandTotal,
        paymentMethod: 'cash'
      });
      toast.success('Payment recorded! 💰');
      fetchInvoices();
    } catch (error) {
      toast.error('Failed to update payment');
    }
  };

  const downloadPDF = async (invoiceId, invoiceNumber) => {
    try {
      const res = await api.get(`/invoices/${invoiceId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoiceNumber || 'invoice'}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch (error) {
      toast.error('Failed to download PDF');
    }
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  const formatCurrency = (amount) => `₹${(amount || 0).toLocaleString('en-IN')}`;

  return (
    <div>
      <div className="page-header">
        <h1>Invoices</h1>
      </div>

      <div className="search-filter-bar">
        <div className="search-input-wrapper">
          <HiOutlineSearch />
          <input
            className="form-input"
            type="text"
            placeholder="Search by invoice number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-select"
          value={paymentFilter}
          onChange={e => setPaymentFilter(e.target.value)}
          style={{ width: 'auto', minWidth: '160px' }}
        >
          <option value="">All Payments</option>
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-screen"><div className="spinner" /></div>
      ) : invoices.length === 0 ? (
        <div className="empty-state">
          <h3>No invoices found</h3>
          <p>Invoices are generated from approved job card estimations</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Job Card</th>
                <th>Customer</th>
                <th>Vehicle</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv._id}>
                  <td>
                    <span className="font-bold" style={{ color: 'var(--primary-600)' }}>
                      {inv.invoiceNumber}
                    </span>
                  </td>
                  <td className="text-sm">{inv.jobCard?.jobCardNumber}</td>
                  <td>
                    <div>
                      <span>{inv.customer?.name}</span>
                      <br />
                      <span className="text-sm text-muted">{inv.customer?.phone}</span>
                    </div>
                  </td>
                  <td>
                    <span className="font-semibold">{inv.vehicle?.licensePlate}</span>
                    <br />
                    <span className="text-sm text-muted">{inv.vehicle?.make} {inv.vehicle?.model}</span>
                  </td>
                  <td className="font-bold">{formatCurrency(inv.grandTotal)}</td>
                  <td>
                    <span className={`badge badge-${inv.paymentStatus}`}>
                      {inv.paymentStatus}
                    </span>
                  </td>
                  <td className="text-sm text-muted">{formatDate(inv.createdAt)}</td>
                  <td>
                    <div className="flex gap-1">
                      <Link to={`/invoices/${inv._id}`} className="btn btn-ghost btn-sm">
                        <HiOutlineEye />
                      </Link>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => downloadPDF(inv._id, inv.invoiceNumber)}
                        title="Download PDF"
                      >
                        <HiOutlineDownload />
                      </button>
                      {inv.paymentStatus !== 'paid' && hasRole('owner', 'admin', 'service_advisor') && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => markAsPaid(inv._id)}
                          title="Mark as Paid"
                        >
                          <HiOutlineCheckCircle />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
