import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getEstimationByToken, approveEstimationByToken } from '../services/apiServices/publicService';

const fmt = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const priorityColors = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
  urgent: '#7c3aed',
};

export default function EstimationApproval() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await getEstimationByToken(token);
        setData(res.data);
        if (res.data?.estimation?.approvedByCustomer) {
          setApproved(true);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'This estimation link is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const handleApprove = async () => {
    setApproving(true);
    try {
      await approveEstimationByToken(token);
      setApproved(true);
      setData(prev => ({
        ...prev,
        status: 'approved',
        estimation: { ...prev.estimation, approvedByCustomer: true, approvedAt: new Date().toISOString() }
      }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve. Please try again.');
    } finally {
      setApproving(false);
    }
  };

  // ── Loading ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-sm">Loading your estimation…</p>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Link Not Found</h2>
          <p className="text-slate-500 text-sm leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  const { vehicle, customer, garage, complaints, estimation, jobCardNumber } = data;
  const hasParts = estimation?.parts?.length > 0;
  const hasLabor = estimation?.labor?.length > 0;
  const partsTotal = estimation?.parts?.reduce((s, p) => s + (p.total || 0), 0) || 0;
  const laborTotal = estimation?.labor?.reduce((s, l) => s + (l.total || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 py-8 px-4">
      {/* Max-width container */}
      <div className="max-w-2xl mx-auto space-y-5">

        {/* ── Header ── */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-8 text-white text-center shadow-xl">
          <div className="flex justify-center mb-4">
            <svg viewBox="0 0 40 40" fill="none" className="w-12 h-12 drop-shadow-lg">
              <rect width="40" height="40" rx="10" fill="white" fillOpacity="0.2"/>
              <path d="M12 28V17L20 12L28 17V28L20 23L12 28Z" fill="white" fillOpacity="0.9"/>
              <path d="M20 12V23" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-indigo-200 text-xs uppercase tracking-widest mb-1">Service Estimation</p>
          <h1 className="text-2xl font-bold">{garage?.name || 'Your Garage'}</h1>
          {garage?.phone && (
            <p className="text-indigo-200 text-sm mt-1">{garage.phone}</p>
          )}
        </div>

        {/* ── Status Banner ── */}
        {approved ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-11 h-11 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-emerald-800">Estimation Approved</p>
              <p className="text-emerald-600 text-sm">Thank you! We will begin work on your vehicle shortly.</p>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-11 h-11 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-amber-800">Awaiting Your Approval</p>
              <p className="text-amber-600 text-sm">Please review the estimation below and approve to let us begin.</p>
            </div>
          </div>
        )}

        {/* ── Vehicle & Job Card ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Vehicle Details</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-400 mb-1">License Plate</p>
              <p className="text-lg font-bold text-slate-900 tracking-wider">{vehicle?.licensePlate}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Make / Model</p>
              <p className="font-semibold text-slate-700">{vehicle?.make} {vehicle?.model}</p>
              {vehicle?.year && <p className="text-xs text-slate-400">{vehicle.year}</p>}
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Customer</p>
              <p className="font-semibold text-slate-700">{customer?.name}</p>
              <p className="text-xs text-slate-400">{customer?.phone}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Job Card</p>
              <p className="font-semibold text-indigo-600">{jobCardNumber}</p>
            </div>
          </div>
        </div>

        {/* ── Complaints ── */}
        {complaints?.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Service Requests</p>
            <ul className="space-y-2.5">
              {complaints.map((c, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span
                    className="mt-1 w-2 h-2 rounded-full shrink-0"
                    style={{ background: priorityColors[c.priority] || '#94a3b8' }}
                  />
                  <span className="text-slate-700 text-sm leading-relaxed">{c.description}</span>
                  <span className="ml-auto text-xs font-medium capitalize shrink-0"
                    style={{ color: priorityColors[c.priority] || '#94a3b8' }}>
                    {c.priority}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Estimation Breakdown ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Estimation Breakdown</p>

          {/* Parts */}
          {hasParts && (
            <div className="mb-5">
              <p className="text-xs font-semibold text-slate-500 mb-2">Spare Parts</p>
              <div className="space-y-2">
                {estimation.parts.map((p, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <div>
                      <span className="text-slate-700">{p.partName}</span>
                      <span className="text-slate-400 ml-2">×{p.quantity} @ {fmt(p.unitPrice)}</span>
                    </div>
                    <span className="font-semibold text-slate-800">{fmt(p.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Labour */}
          {hasLabor && (
            <div className="mb-5">
              <p className="text-xs font-semibold text-slate-500 mb-2">Labour</p>
              <div className="space-y-2">
                {estimation.labor.map((l, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <div>
                      <span className="text-slate-700">{l.description}</span>
                      <span className="text-slate-400 ml-2">{l.hours}h @ {fmt(l.ratePerHour)}/hr</span>
                    </div>
                    <span className="font-semibold text-slate-800">{fmt(l.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-dashed border-slate-200 pt-4 space-y-2">
            {hasParts && hasLabor && (
              <>
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Parts Total</span><span>{fmt(partsTotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Labour Total</span><span>{fmt(laborTotal)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between text-sm text-slate-500">
              <span>Subtotal</span><span>{fmt(estimation?.subtotal)}</span>
            </div>
            {estimation?.discount > 0 && (
              <div className="flex justify-between text-sm text-emerald-600">
                <span>Discount</span><span>− {fmt(estimation.discount)}</span>
              </div>
            )}
            {estimation?.taxRate > 0 && (
              <div className="flex justify-between text-sm text-slate-500">
                <span>GST ({estimation.taxRate}%)</span><span>{fmt(estimation?.taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-3 border-t border-slate-200">
              <span className="font-bold text-slate-900 text-base">Grand Total</span>
              <span className="font-extrabold text-indigo-600 text-xl">{fmt(estimation?.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* ── Approve Button ── */}
        {!approved ? (
          <button
            onClick={handleApprove}
            disabled={approving}
            className="w-full py-4 rounded-2xl font-bold text-white text-lg shadow-lg shadow-indigo-200 transition-all
              bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700
              disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
          >
            {approving ? (
              <span className="flex items-center justify-center gap-3">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Approving…
              </span>
            ) : (
              'Approve Estimation'
            )}
          </button>
        ) : (
          <div className="bg-emerald-600 text-white text-center py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-emerald-200">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Approved — Work will begin shortly
          </div>
        )}

        {/* ── Footer ── */}
        <p className="text-center text-xs text-slate-400 pb-4">
          Powered by <span className="font-semibold text-slate-500">GarageFlow CRM</span>
          {estimation?.approvedAt && approved && (
            <span className="block mt-1">
              Approved on {new Date(estimation.approvedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
