import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft,
  HiOutlinePencil,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineDocumentText,
  HiOutlineCurrencyRupee,
  HiOutlineX,
  HiOutlineDownload
} from 'react-icons/hi';
import './JobCardDetail.css';

const STATUS_FLOW = [
  'new', 'estimation_sent', 'approved', 'in_progress',
  'quality_check', 'ready_for_pickup', 'delivered'
];

export default function JobCardDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole, user } = useAuth();
  const [jobCard, setJobCard] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEstimation, setShowEstimation] = useState(false);

  const [estimation, setEstimation] = useState({
    parts: [],
    labor: [],
    discount: 0,
    taxRate: 18
  });

  useEffect(() => {
    fetchJobCard();
    fetchInventory();
  }, [id]);

  const fetchJobCard = async () => {
    try {
      const res = await api.get(`/jobcards/${id}`);
      setJobCard(res.data.data);
      if (res.data.data.estimation) {
        setEstimation({
          parts: res.data.data.estimation.parts || [],
          labor: res.data.data.estimation.labor || [],
          discount: res.data.data.estimation.discount || 0,
          taxRate: res.data.data.estimation.taxRate || 18
        });
      }
    } catch (error) {
      toast.error('Job card not found');
      navigate('/jobcards');
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await api.get('/inventory', { params: { limit: 200 } });
      setInventory(res.data.data);
    } catch (error) { /* silent */ }
  };

  const updateStatus = async (newStatus) => {
    try {
      await api.put(`/jobcards/${id}`, { status: newStatus });
      toast.success(`Status updated to "${newStatus.replace(/_/g, ' ')}"`);
      fetchJobCard();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getNextStatus = () => {
    if (!jobCard) return null;
    const currentIndex = STATUS_FLOW.indexOf(jobCard.status);
    if (currentIndex === -1 || currentIndex >= STATUS_FLOW.length - 1) return null;
    return STATUS_FLOW[currentIndex + 1];
  };

  // Estimation handlers
  const addPart = () => {
    setEstimation({
      ...estimation,
      parts: [...estimation.parts, { partName: '', quantity: 1, unitPrice: 0, inventoryItem: '' }]
    });
  };

  const addLabor = () => {
    setEstimation({
      ...estimation,
      labor: [...estimation.labor, { description: '', hours: 1, ratePerHour: 500 }]
    });
  };

  const updatePart = (index, field, value) => {
    const updated = [...estimation.parts];
    updated[index][field] = value;

    // Auto-fill from inventory
    if (field === 'inventoryItem' && value) {
      const item = inventory.find(i => i._id === value);
      if (item) {
        updated[index].partName = item.partName;
        updated[index].unitPrice = item.sellingPrice || item.unitPrice;
      }
    }

    setEstimation({ ...estimation, parts: updated });
  };

  const updateLabor = (index, field, value) => {
    const updated = [...estimation.labor];
    updated[index][field] = value;
    setEstimation({ ...estimation, labor: updated });
  };

  const removePart = (index) => {
    setEstimation({
      ...estimation,
      parts: estimation.parts.filter((_, i) => i !== index)
    });
  };

  const removeLabor = (index) => {
    setEstimation({
      ...estimation,
      labor: estimation.labor.filter((_, i) => i !== index)
    });
  };

  const calculateTotals = () => {
    const partsTotal = estimation.parts.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);
    const laborTotal = estimation.labor.reduce((sum, l) => sum + (l.hours * l.ratePerHour), 0);
    const subtotal = partsTotal + laborTotal;
    const taxAmount = ((subtotal - estimation.discount) * estimation.taxRate) / 100;
    const grandTotal = subtotal - estimation.discount + taxAmount;
    return { partsTotal, laborTotal, subtotal, taxAmount, grandTotal };
  };

  const saveEstimation = async () => {
    try {
      await api.put(`/jobcards/${id}/estimation`, estimation);
      toast.success('Estimation saved!');
      setShowEstimation(false);
      fetchJobCard();
    } catch (error) {
      toast.error('Failed to save estimation');
    }
  };

  const approveEstimation = async () => {
    try {
      await api.put(`/jobcards/${id}/approve`);
      toast.success('Estimation approved! ✅');
      fetchJobCard();
    } catch (error) {
      toast.error('Failed to approve');
    }
  };

  const createInvoice = async () => {
    try {
      const res = await api.post('/invoices', { jobCardId: id });
      toast.success(`Invoice ${res.data.data.invoiceNumber} created!`);
      fetchJobCard();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create invoice');
    }
  };

  const downloadPDF = async (invoiceId) => {
    try {
      const res = await api.get(`/invoices/${invoiceId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${jobCard?.jobCardNumber || 'invoice'}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch (error) {
      toast.error('Failed to download PDF');
    }
  };

  if (loading) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  if (!jobCard) return null;

  const totals = calculateTotals();
  const nextStatus = getNextStatus();

  return (
    <div className="jobcard-detail">
      {/* Header */}
      <div className="detail-header">
        <div className="detail-header-left">
          <button className="btn btn-ghost" onClick={() => navigate('/jobcards')}>
            <HiOutlineArrowLeft /> Back
          </button>
          <div>
            <h1 style={{ fontSize: '1.5rem' }}>{jobCard.jobCardNumber}</h1>
            <span className={`badge badge-${jobCard.status}`} style={{ fontSize: '0.875rem', padding: '6px 16px' }}>
              {jobCard.status?.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
        <div className="detail-header-actions">
          {nextStatus && hasRole('owner', 'admin', 'service_advisor', 'mechanic') && (
            <button className="btn btn-accent" onClick={() => updateStatus(nextStatus)}>
              Move to: {nextStatus.replace(/_/g, ' ')}
            </button>
          )}
          {jobCard.status !== 'cancelled' && jobCard.status !== 'delivered' && hasRole('owner', 'admin') && (
            <button className="btn btn-danger btn-sm" onClick={() => updateStatus('cancelled')}>
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Status Progress */}
      <div className="status-progress">
        {STATUS_FLOW.map((status, index) => {
          const currentIndex = STATUS_FLOW.indexOf(jobCard.status);
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <div
              key={status}
              className={`status-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
            >
              <div className="status-dot">{isCompleted ? '✓' : index + 1}</div>
              <span className="status-label">{status.replace(/_/g, ' ')}</span>
            </div>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="detail-grid">
        {/* Vehicle & Customer Info */}
        <div className="card">
          <div className="card-header">
            <h3>Vehicle & Customer</h3>
          </div>
          <div className="card-body">
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">License Plate</span>
                <span className="info-value font-bold">{jobCard.vehicle?.licensePlate}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Vehicle</span>
                <span className="info-value">
                  {jobCard.vehicle?.make} {jobCard.vehicle?.model}
                  {jobCard.vehicle?.year ? ` (${jobCard.vehicle.year})` : ''}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Customer</span>
                <span className="info-value">{jobCard.customer?.name}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Phone</span>
                <span className="info-value">{jobCard.customer?.phone}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Odometer</span>
                <span className="info-value">{jobCard.odometerAtIntake?.toLocaleString() || '—'} km</span>
              </div>
              <div className="info-item">
                <span className="info-label">Mechanic</span>
                <span className="info-value">{jobCard.assignedMechanic?.name || 'Unassigned'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Complaints */}
        <div className="card">
          <div className="card-header">
            <h3>Complaints & Service Requests</h3>
          </div>
          <div className="card-body">
            {jobCard.complaints?.length === 0 ? (
              <p className="text-muted">No complaints logged</p>
            ) : (
              <div className="complaints-list">
                {jobCard.complaints?.map((c, i) => (
                  <div key={i} className="complaint-item">
                    <span className={`badge badge-${c.priority === 'urgent' ? 'cancelled' : c.priority === 'high' ? 'estimation_sent' : 'new'}`}>
                      {c.priority}
                    </span>
                    <span>{c.description}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Estimation Summary */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header">
            <h3>💰 Estimation</h3>
            <div className="flex gap-1">
              {hasRole('owner', 'admin', 'service_advisor') && (
                <button className="btn btn-secondary btn-sm" onClick={() => setShowEstimation(true)}>
                  <HiOutlinePencil /> Edit Estimation
                </button>
              )}
              {jobCard.estimation?.grandTotal > 0 && !jobCard.estimation?.approvedByCustomer && hasRole('owner', 'admin', 'service_advisor') && (
                <button className="btn btn-success btn-sm" onClick={approveEstimation}>
                  <HiOutlineCheckCircle /> Approve
                </button>
              )}
              {jobCard.estimation?.approvedByCustomer && !jobCard.invoice && hasRole('owner', 'admin', 'service_advisor') && (
                <button className="btn btn-accent btn-sm" onClick={createInvoice}>
                  <HiOutlineDocumentText /> Generate Invoice
                </button>
              )}
              {jobCard.invoice && (
                <>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate(`/invoices/${jobCard.invoice._id || jobCard.invoice}`)}
                  >
                    <HiOutlineCurrencyRupee /> View Invoice
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => downloadPDF(jobCard.invoice._id || jobCard.invoice)}
                  >
                    <HiOutlineDownload /> Download PDF
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="card-body">
            {jobCard.estimation?.grandTotal > 0 ? (
              <>
                {/* Parts Table */}
                {jobCard.estimation.parts?.length > 0 && (
                  <>
                    <h4 className="mb-1">Parts</h4>
                    <div className="table-container mb-2">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Part Name</th>
                            <th>Qty</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {jobCard.estimation.parts.map((p, i) => (
                            <tr key={i}>
                              <td>{p.partName}</td>
                              <td>{p.quantity}</td>
                              <td>₹{p.unitPrice?.toLocaleString('en-IN')}</td>
                              <td className="font-bold">₹{p.total?.toLocaleString('en-IN')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {/* Labor Table */}
                {jobCard.estimation.labor?.length > 0 && (
                  <>
                    <h4 className="mb-1">Labor</h4>
                    <div className="table-container mb-2">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Description</th>
                            <th>Hours</th>
                            <th>Rate/Hr</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {jobCard.estimation.labor.map((l, i) => (
                            <tr key={i}>
                              <td>{l.description}</td>
                              <td>{l.hours}</td>
                              <td>₹{l.ratePerHour?.toLocaleString('en-IN')}</td>
                              <td className="font-bold">₹{l.total?.toLocaleString('en-IN')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {/* Totals */}
                <div className="estimation-totals">
                  <div className="total-row">
                    <span>Subtotal</span>
                    <span>₹{jobCard.estimation.subtotal?.toLocaleString('en-IN')}</span>
                  </div>
                  {jobCard.estimation.discount > 0 && (
                    <div className="total-row text-success">
                      <span>Discount</span>
                      <span>-₹{jobCard.estimation.discount?.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="total-row">
                    <span>Tax ({jobCard.estimation.taxRate}%)</span>
                    <span>₹{jobCard.estimation.taxAmount?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="total-row grand-total">
                    <span>Grand Total</span>
                    <span>₹{jobCard.estimation.grandTotal?.toLocaleString('en-IN')}</span>
                  </div>
                  {jobCard.estimation.approvedByCustomer && (
                    <div className="badge badge-approved" style={{ marginTop: '12px' }}>
                      ✅ Approved by Customer
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="empty-state">
                <p>No estimation created yet. Click "Edit Estimation" to add parts and labor.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Estimation Editor Modal */}
      {showEstimation && (
        <div className="modal-overlay" onClick={() => setShowEstimation(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px' }}>
            <div className="modal-header">
              <h2>Edit Estimation</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowEstimation(false)}>
                <HiOutlineX />
              </button>
            </div>
            <div className="modal-body">
              {/* Parts */}
              <h4 className="mb-1">Parts</h4>
              {estimation.parts.map((part, i) => (
                <div key={i} className="est-row">
                  <select
                    className="form-select"
                    value={part.inventoryItem || ''}
                    onChange={e => updatePart(i, 'inventoryItem', e.target.value)}
                    style={{ flex: 2 }}
                  >
                    <option value="">Select from inventory...</option>
                    {inventory.map(inv => (
                      <option key={inv._id} value={inv._id}>
                        {inv.partName} (₹{inv.sellingPrice || inv.unitPrice}) — Stock: {inv.quantity}
                      </option>
                    ))}
                  </select>
                  <input
                    className="form-input"
                    value={part.partName}
                    onChange={e => updatePart(i, 'partName', e.target.value)}
                    placeholder="Part name"
                    style={{ flex: 2 }}
                  />
                  <input
                    className="form-input"
                    type="number"
                    value={part.quantity}
                    onChange={e => updatePart(i, 'quantity', parseInt(e.target.value) || 0)}
                    placeholder="Qty"
                    style={{ width: '80px' }}
                  />
                  <input
                    className="form-input"
                    type="number"
                    value={part.unitPrice}
                    onChange={e => updatePart(i, 'unitPrice', parseFloat(e.target.value) || 0)}
                    placeholder="Price"
                    style={{ width: '100px' }}
                  />
                  <span className="est-total">₹{(part.quantity * part.unitPrice).toLocaleString('en-IN')}</span>
                  <button className="btn btn-ghost btn-icon text-danger" onClick={() => removePart(i)}>
                    <HiOutlineTrash />
                  </button>
                </div>
              ))}
              <button className="btn btn-ghost btn-sm mb-2" onClick={addPart}>
                <HiOutlinePlus /> Add Part
              </button>

              {/* Labor */}
              <h4 className="mb-1">Labor</h4>
              {estimation.labor.map((labor, i) => (
                <div key={i} className="est-row">
                  <input
                    className="form-input"
                    value={labor.description}
                    onChange={e => updateLabor(i, 'description', e.target.value)}
                    placeholder="Labor description"
                    style={{ flex: 3 }}
                  />
                  <input
                    className="form-input"
                    type="number"
                    value={labor.hours}
                    onChange={e => updateLabor(i, 'hours', parseFloat(e.target.value) || 0)}
                    placeholder="Hours"
                    step="0.5"
                    style={{ width: '80px' }}
                  />
                  <input
                    className="form-input"
                    type="number"
                    value={labor.ratePerHour}
                    onChange={e => updateLabor(i, 'ratePerHour', parseFloat(e.target.value) || 0)}
                    placeholder="Rate/hr"
                    style={{ width: '100px' }}
                  />
                  <span className="est-total">₹{(labor.hours * labor.ratePerHour).toLocaleString('en-IN')}</span>
                  <button className="btn btn-ghost btn-icon text-danger" onClick={() => removeLabor(i)}>
                    <HiOutlineTrash />
                  </button>
                </div>
              ))}
              <button className="btn btn-ghost btn-sm mb-2" onClick={addLabor}>
                <HiOutlinePlus /> Add Labor
              </button>

              {/* Discount & Tax */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Discount (₹)</label>
                  <input
                    className="form-input"
                    type="number"
                    value={estimation.discount}
                    onChange={e => setEstimation({ ...estimation, discount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tax Rate (%)</label>
                  <input
                    className="form-input"
                    type="number"
                    value={estimation.taxRate}
                    onChange={e => setEstimation({ ...estimation, taxRate: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Live Totals */}
              <div className="estimation-totals" style={{ marginTop: '16px' }}>
                <div className="total-row">
                  <span>Parts Total</span>
                  <span>₹{totals.partsTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="total-row">
                  <span>Labor Total</span>
                  <span>₹{totals.laborTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="total-row">
                  <span>Subtotal</span>
                  <span>₹{totals.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="total-row grand-total">
                  <span>Grand Total</span>
                  <span>₹{Math.round(totals.grandTotal).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowEstimation(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveEstimation}>Save Estimation</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
