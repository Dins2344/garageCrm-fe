import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  HiOutlineSearch,
  HiOutlineEye,
  HiOutlineCurrencyRupee,
  HiOutlineCheckCircle,
  HiOutlineDownload,
  HiOutlineX
} from 'react-icons/hi';
import './InvoiceViewer.css';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const { hasRole } = useAuth();

  // Invoice Viewer State
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerInvoice, setViewerInvoice] = useState(null);
  const [viewerLoading, setViewerLoading] = useState(false);

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
      // Also refresh the viewer if this invoice is being viewed
      if (viewerInvoice?._id === invoiceId) {
        openInvoiceViewer(invoiceId);
      }
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

  // ── Invoice Viewer ──
  const openInvoiceViewer = async (invoiceId) => {
    setViewerOpen(true);
    setViewerLoading(true);
    try {
      const res = await api.get(`/invoices/${invoiceId}`);
      setViewerInvoice(res.data.data);
    } catch (error) {
      toast.error('Failed to load invoice details');
      setViewerOpen(false);
    } finally {
      setViewerLoading(false);
    }
  };

  const closeViewer = () => {
    setViewerOpen(false);
    setViewerInvoice(null);
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  const formatDateLong = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  const formatCurrency = (amount) => `₹${(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatCurrencyShort = (amount) => `₹${(amount || 0).toLocaleString('en-IN')}`;

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
                    <span
                      className="font-bold"
                      style={{ color: 'var(--primary-600)', cursor: 'pointer' }}
                      onClick={() => openInvoiceViewer(inv._id)}
                    >
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
                  <td className="font-bold">{formatCurrencyShort(inv.grandTotal)}</td>
                  <td>
                    <span className={`badge badge-${inv.paymentStatus}`}>
                      {inv.paymentStatus}
                    </span>
                  </td>
                  <td className="text-sm text-muted">{formatDate(inv.createdAt)}</td>
                  <td>
                    <div className="flex gap-1">
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => openInvoiceViewer(inv._id)}
                        title="View Invoice"
                      >
                        <HiOutlineEye />
                      </button>
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

      {/* ═══════ Invoice Viewer Modal ═══════ */}
      {viewerOpen && (
        <div className="modal-overlay" onClick={closeViewer}>
          <div
            className="modal modal-xl invoice-viewer"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="modal-header">
              <h2>
                <HiOutlineCurrencyRupee style={{ color: 'var(--primary-500)' }} />
                {viewerInvoice?.invoiceNumber || 'Loading...'}
              </h2>
              <div className="header-actions">
                {viewerInvoice && (
                  <>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => downloadPDF(viewerInvoice._id, viewerInvoice.invoiceNumber)}
                      title="Download PDF"
                    >
                      <HiOutlineDownload /> PDF
                    </button>

                    {viewerInvoice.paymentStatus !== 'paid' && hasRole('owner', 'admin', 'service_advisor') && (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => markAsPaid(viewerInvoice._id)}
                      >
                        <HiOutlineCheckCircle /> Mark Paid
                      </button>
                    )}
                  </>
                )}
                <button className="btn btn-ghost btn-sm" onClick={closeViewer}>
                  <HiOutlineX />
                </button>
              </div>
            </div>

            {/* Invoice Content */}
            {viewerLoading ? (
              <div className="modal-body" style={{ textAlign: 'center', padding: '60px' }}>
                <div className="spinner" />
                <p style={{ marginTop: 12, color: 'var(--gray-500)' }}>Loading invoice...</p>
              </div>
            ) : viewerInvoice ? (
              <div className="invoice-paper">
                {/* ── Header: Branding + Invoice Meta ── */}
                <div className="invoice-header">
                  <div className="invoice-branding">
                    <h1>{viewerInvoice.garage?.name || 'GarageFlow'}</h1>
                    {viewerInvoice.garage?.address && (
                      <p>
                        {[
                          viewerInvoice.garage.address.street,
                          viewerInvoice.garage.address.city,
                          viewerInvoice.garage.address.state,
                          viewerInvoice.garage.address.pincode
                        ].filter(Boolean).join(', ')}
                      </p>
                    )}
                    {viewerInvoice.garage?.phone && <p>📞 {viewerInvoice.garage.phone}</p>}
                    {viewerInvoice.garage?.gstNumber && (
                      <p style={{ fontWeight: 600, color: 'var(--gray-600)' }}>
                        GSTIN: {viewerInvoice.garage.gstNumber}
                      </p>
                    )}
                  </div>
                  <div className="invoice-meta">
                    <p className="invoice-number">{viewerInvoice.invoiceNumber}</p>
                    <p className="invoice-date">
                      Date: {formatDateLong(viewerInvoice.createdAt)}
                    </p>
                    {viewerInvoice.jobCard?.jobCardNumber && (
                      <p className="invoice-date">
                        Job Card: {viewerInvoice.jobCard.jobCardNumber}
                      </p>
                    )}
                  </div>
                </div>

                {/* ── Customer & Vehicle Info ── */}
                <div className="invoice-info-grid">
                  <div className="invoice-info-block">
                    <h4>Bill To</h4>
                    <div className="info-name">{viewerInvoice.customer?.name || '—'}</div>
                    {viewerInvoice.customer?.phone && (
                      <div className="info-detail">📞 {viewerInvoice.customer.phone}</div>
                    )}
                    {viewerInvoice.customer?.email && (
                      <div className="info-detail">✉️ {viewerInvoice.customer.email}</div>
                    )}
                    {viewerInvoice.customer?.address && (
                      <div className="info-detail">
                        {[
                          viewerInvoice.customer.address.street,
                          viewerInvoice.customer.address.city,
                          viewerInvoice.customer.address.state
                        ].filter(Boolean).join(', ')}
                      </div>
                    )}
                  </div>
                  <div className="invoice-info-block">
                    <h4>Vehicle</h4>
                    <div className="info-name">{viewerInvoice.vehicle?.licensePlate || '—'}</div>
                    <div className="info-detail">
                      {viewerInvoice.vehicle?.make} {viewerInvoice.vehicle?.model}
                      {viewerInvoice.vehicle?.year ? ` (${viewerInvoice.vehicle.year})` : ''}
                    </div>
                    {viewerInvoice.vehicle?.color && (
                      <div className="info-detail">Color: {viewerInvoice.vehicle.color}</div>
                    )}
                  </div>
                </div>

                {/* ── Parts Table ── */}
                {viewerInvoice.parts?.length > 0 && (
                  <>
                    <div className="invoice-section-title">Parts & Materials</div>
                    <table className="invoice-table">
                      <thead>
                        <tr>
                          <th style={{ width: '50%' }}>Part Name</th>
                          <th>Qty</th>
                          <th>Unit Price</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewerInvoice.parts.map((part, i) => (
                          <tr key={i}>
                            <td>{part.partName}</td>
                            <td>{part.quantity}</td>
                            <td>{formatCurrency(part.unitPrice)}</td>
                            <td>{formatCurrency(part.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}

                {/* ── Labor Table ── */}
                {viewerInvoice.labor?.length > 0 && (
                  <>
                    <div className="invoice-section-title">Labor Charges</div>
                    <table className="invoice-table">
                      <thead>
                        <tr>
                          <th style={{ width: '50%' }}>Description</th>
                          <th>Hours</th>
                          <th>Rate/Hr</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewerInvoice.labor.map((lab, i) => (
                          <tr key={i}>
                            <td>{lab.description}</td>
                            <td>{lab.hours}</td>
                            <td>{formatCurrency(lab.ratePerHour)}</td>
                            <td>{formatCurrency(lab.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}

                {/* ── Totals ── */}
                <div className="invoice-totals">
                  <div className="invoice-totals-box">
                    <div className="totals-row">
                      <span className="label">Subtotal</span>
                      <span className="value">{formatCurrency(viewerInvoice.subtotal)}</span>
                    </div>
                    {viewerInvoice.discount > 0 && (
                      <div className="totals-row discount">
                        <span className="label">Discount</span>
                        <span className="value">-{formatCurrency(viewerInvoice.discount)}</span>
                      </div>
                    )}
                    <div className="totals-row">
                      <span className="label">Tax ({viewerInvoice.taxRate || 18}%)</span>
                      <span className="value">{formatCurrency(viewerInvoice.taxAmount)}</span>
                    </div>
                    <div className="totals-row total-grand">
                      <span className="label">Grand Total</span>
                      <span className="value">{formatCurrency(viewerInvoice.grandTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* ── Payment Status Banner ── */}
                <div className={`payment-status-banner status-${viewerInvoice.paymentStatus}`}>
                  <div className="status-label">
                    {viewerInvoice.paymentStatus === 'paid' && '✅'}
                    {viewerInvoice.paymentStatus === 'unpaid' && '⚠️'}
                    {viewerInvoice.paymentStatus === 'partial' && '⏳'}
                    {' '}
                    {viewerInvoice.paymentStatus === 'paid'
                      ? 'Payment Received'
                      : viewerInvoice.paymentStatus === 'partial'
                        ? 'Partial Payment Received'
                        : 'Payment Pending'}
                  </div>
                  <div>
                    {viewerInvoice.paymentStatus !== 'unpaid' && (
                      <span>
                        Paid: {formatCurrency(viewerInvoice.amountPaid)}
                        {viewerInvoice.paymentMethod && ` via ${viewerInvoice.paymentMethod.replace('_', ' ')}`}
                        {viewerInvoice.paidAt && ` on ${formatDate(viewerInvoice.paidAt)}`}
                      </span>
                    )}
                    {viewerInvoice.paymentStatus === 'partial' && (
                      <span style={{ marginLeft: 12, fontWeight: 700 }}>
                        Due: {formatCurrency(viewerInvoice.grandTotal - viewerInvoice.amountPaid)}
                      </span>
                    )}
                  </div>
                </div>

                {/* ── Notes ── */}
                {viewerInvoice.notes && (
                  <div className="invoice-notes">
                    <h4>Notes</h4>
                    <p>{viewerInvoice.notes}</p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
