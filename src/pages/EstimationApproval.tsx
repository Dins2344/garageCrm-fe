import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getEstimationByToken, approveEstimationByToken } from '../services/apiServices/publicService';
import Loader from '../components/Loader';
import { formatMoney, formatDate } from '../utils/format';
import { DEFAULT_LOCALE } from '../utils/locale';
import type { JobCard, Vehicle, Customer, Garage, ComplaintPriority, ResolvedLocale } from '../types/models';

/**
 * This page is unauthenticated, so it has no GarageContext to read a locale
 * from. The API resolves one server-side and returns it on the payload — see
 * backend/usecases/publicUsecase.ts.
 */
type PublicEstimation = JobCard & { locale?: ResolvedLocale };

const priorityColors: Record<ComplaintPriority, string> = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
  urgent: '#7c3aed',
};

export default function EstimationApproval() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PublicEstimation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(false);

  // India only until the payload lands, matching the server's own fallback.
  const locale = data?.locale ?? DEFAULT_LOCALE;
  const fmt = (n?: number) => formatMoney(n, locale);

  useEffect(() => {
    (async () => {
      try {
        const res = await getEstimationByToken(token!);
        setData(res.data);
        if (res.data?.estimation?.approvedByCustomer) {
          setApproved(true);
        }
      } catch (err) {
        const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        setError(message || 'This estimation link is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const handleApprove = async () => {
    setApproving(true);
    try {
      await approveEstimationByToken(token!);
      setApproved(true);
      setData(prev => prev ? ({
        ...prev,
        status: 'approved',
        estimation: { ...prev.estimation, approvedByCustomer: true, approvedAt: new Date().toISOString() }
      }) : prev);
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(message || 'Failed to approve. Please try again.');
    } finally {
      setApproving(false);
    }
  };

  // ── Loading ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader text="Loading your estimation…" />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────
  if (error || !data) {
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

  const vehicle = data.vehicle as Vehicle | undefined;
  const customer = data.customer as Customer | undefined;
  const garage = data.garage as Garage | undefined;
  const { complaints, estimation, jobCardNumber } = data;
  const hasParts = (estimation?.parts?.length || 0) > 0;
  const hasLabor = (estimation?.labor?.length || 0) > 0;
  const partsTotal = estimation?.parts?.reduce((s, p) => s + (p.total || 0), 0) || 0;
  const laborTotal = estimation?.labor?.reduce((s, l) => s + (l.total || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 py-8 px-4">
      {/* Max-width container */}
      <div className="w-full max-w-2xl mx-auto space-y-5">

        {/* ── Header ── */}
        <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-8 text-white text-center shadow-xl">

          <p className="text-primary-200 text-xs uppercase tracking-widest mb-1">Service Estimation</p>
          <h1 className="text-2xl font-bold">{garage?.name || 'Your Garage'}</h1>
          {garage?.phone && (
            <p className="text-primary-200 text-sm mt-1">{garage.phone}</p>
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
              <p className="font-semibold text-primary-600">{jobCardNumber}</p>
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
                <span>{locale.taxLabel} ({estimation.taxRate ?? 0}%)</span><span>{fmt(estimation?.taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-3 border-t border-slate-200">
              <span className="font-bold text-slate-900 text-base">Grand Total</span>
              <span className="font-extrabold text-primary-600 text-xl">{fmt(estimation?.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* ── Approve Button ── */}
        {!approved ? (
          <button
            onClick={handleApprove}
            disabled={approving}
            className="w-full py-4 rounded-2xl font-bold text-white text-lg shadow-lg shadow-primary-200 transition-all
              bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800
              disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
          >
            {approving ? (
              <span className="flex items-center justify-center gap-3">
                <Loader variant="inline" />
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
          Powered by <span className="font-semibold text-slate-500">GaragePulse CRM</span>
          {estimation?.approvedAt && approved && (
            <span className="block mt-1">
              Approved on {formatDate(estimation.approvedAt, locale, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
