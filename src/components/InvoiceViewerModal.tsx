import { useState } from 'react';
import { useConfirm } from './ConfirmModal';
import { getInvoice, updateInvoicePayment, downloadInvoicePdf, deleteInvoice } from '../services/apiServices/invoiceService';
import { useAuth } from '../context/AuthContext';
import { useGarage } from '../context/GarageContext';
import { useGlobalLoader } from '../context/GlobalLoaderContext';
import { formatMoney, formatNumber, formatDate as fmtDate } from '../utils/format';
import toast from 'react-hot-toast';
import {
  // Currency-neutral: a rupee glyph on a UK garage's invoice is just wrong.
  HiOutlineReceiptTax,
  HiOutlineCheckCircle,
  HiOutlineDownload,
  HiOutlineX,
  HiOutlineTrash
} from 'react-icons/hi';
import { Phone, Mail, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { ModalOverlay, Modal } from './Modal';
import Button from './Button';
import { Table, Thead, Th, Tbody, Tr, Td } from './Table';
import Loader from './Loader';
import type { Invoice, Customer, Vehicle, Garage } from '../types/models';

/**
 * Reusable Invoice Viewer Modal
 *
 * Usage:
 *   const { openInvoice, InvoiceModal } = useInvoiceViewer(onPaymentCallback);
 *
 *   <button onClick={() => openInvoice(invoiceId)}>View Invoice</button>
 *   <InvoiceModal />
 */
export function useInvoiceViewer(onPaymentUpdate?: () => void) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerInvoice, setViewerInvoice] = useState<Invoice | null>(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  const { hasRole } = useAuth();
  const { locale } = useGarage();
  const { withLoader } = useGlobalLoader();
  const { confirm, ConfirmModal } = useConfirm();

  const openInvoice = async (invoiceId?: string) => {
    if (!invoiceId) return;
    setViewerOpen(true);
    setViewerLoading(true);
    try {
      const { data } = await getInvoice(invoiceId);
      setViewerInvoice(data);
    } catch {
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

  const markAsPaid = async (invoiceId: string) => {
    if (!viewerInvoice) return;
    await withLoader(async () => {
      try {
        await updateInvoicePayment(invoiceId, {
          amountPaid: viewerInvoice.grandTotal,
          paymentMethod: 'cash'
        });
        toast.success('Payment recorded!');
        openInvoice(invoiceId);
        if (onPaymentUpdate) onPaymentUpdate();
      } catch {
        toast.error('Failed to update payment');
      }
    });
  };

  const handleCancelInvoice = async (invoiceId: string) => {
    const ok = await confirm({
      title: 'Cancel Invoice?',
      message: 'Cancelling this invoice will reopen the job card for editing and automatically restore inventory stock levels.',
      confirmLabel: 'Cancel Invoice',
      intent: 'warning',
    });
    if (!ok) return;
    await withLoader(async () => {
      try {
        await deleteInvoice(invoiceId);
        toast.success('Invoice cancelled and Job reopened!');
        closeViewer();
        if (onPaymentUpdate) onPaymentUpdate();
      } catch {
        toast.error('Failed to cancel invoice');
      }
    });
  };

  const downloadPDF = async (invoiceId: string, invoiceNumber?: string) => {
    await withLoader(async () => {
      try {
        const { data } = await downloadInvoicePdf(invoiceId);
        const url = window.URL.createObjectURL(new Blob([data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Invoice-${invoiceNumber}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        toast.success('PDF downloaded');
      } catch {
        toast.error('Failed to download PDF');
      }
    });
  };

  const formatDate = (date?: string | null) =>
    date ? fmtDate(date, locale, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  const formatDateLong = (date?: string | null) =>
    date ? fmtDate(date, locale, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }) : '—';

  const formatCurrency = (amount?: number) => formatMoney(amount, locale);

  const InvoiceModal = () => {
    if (!viewerOpen) return null;

    const inv = viewerInvoice;
    const customer = inv?.customer as Customer | undefined;
    const vehicle = inv?.vehicle as Vehicle | undefined;
    const garage = inv?.garage as Garage | undefined;
    const jobCard = inv?.jobCard as { jobCardNumber?: string; odometerAtIntake?: number } | undefined;

    return (
      <>
      <ModalOverlay onClose={closeViewer}>
        <Modal className="max-w-[800px] p-0 overflow-hidden bg-white">
          {/* Custom Header to accommodate actions */}
          <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <HiOutlineReceiptTax className="text-primary-600 text-2xl" />
              {inv?.invoiceNumber || 'Loading...'}
            </h2>
            <div className="flex items-center gap-2">
              {inv && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadPDF(inv._id, inv.invoiceNumber)}
                    title="Download PDF"
                    icon={HiOutlineDownload}
                  >
                    PDF
                  </Button>
                  {inv.paymentStatus !== 'paid' && hasRole('owner', 'admin', 'service_advisor') && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => markAsPaid(inv._id)}
                      icon={HiOutlineCheckCircle}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Mark Paid
                    </Button>
                  )}
                  {hasRole('owner', 'admin') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelInvoice(inv._id)}
                      icon={HiOutlineTrash}
                      className="text-danger hover:bg-danger-light"
                    >
                      Cancel Bill
                    </Button>
                  )}
                </>
              )}
              <Button variant="ghost" size="icon" onClick={closeViewer} className="ml-2">
                <HiOutlineX />
              </Button>
            </div>
          </div>

          <div className="p-6 sm:p-8 md:p-10 max-h-[80vh] overflow-y-auto">
            {viewerLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader />
                <p className="mt-4 text-gray-500 font-medium">Loading invoice...</p>
              </div>
            ) : inv ? (
              <div className="max-w-4xl mx-auto bg-white">
                {/* ── Header: Branding + Invoice Meta ── */}
                <div className="flex flex-col md:flex-row justify-between items-start mb-12 pb-8 border-b border-gray-100 gap-6">
                  <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
                      {garage?.name || 'GaragePulse'}
                    </h1>
                    <div className="text-gray-500 text-sm flex flex-col gap-1">
                      {garage?.address && (
                        <p>
                          {[
                            garage.address.street,
                            garage.address.city,
                            garage.address.state,
                            garage.address.pincode
                          ].filter(Boolean).join(', ')}
                        </p>
                      )}
                      {garage?.phone && <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gray-400" /> {garage.phone}</p>}
                      {garage?.gstNumber && (
                        <p className="font-semibold text-gray-700 mt-1">
                          {locale.taxIdLabel}: {garage.gstNumber}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="md:text-right bg-gray-50 p-4 rounded-xl border border-gray-100 shrink-0">
                    <p className="text-2xl font-bold text-gray-900 mb-1">{inv.invoiceNumber}</p>
                    <p className="text-gray-500 text-sm">
                      Date: <span className="font-medium text-gray-700">{formatDateLong(inv.createdAt)}</span>
                    </p>
                    {jobCard?.jobCardNumber && (
                      <p className="text-gray-500 text-sm mt-0.5">
                        Job Card: <span className="font-medium text-gray-700">{jobCard.jobCardNumber}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* ── Customer & Vehicle Info ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                  <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Bill To</h4>
                    <div className="text-lg font-bold text-gray-900 mb-2">{customer?.name || '—'}</div>
                    <div className="text-gray-600 text-sm space-y-1">
                      {customer?.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gray-400" /> {customer.phone}</div>}
                      {customer?.email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-gray-400" /> {customer.email}</div>}
                      {customer?.address && (
                        <div className="mt-2 text-gray-500 leading-relaxed">
                          {[
                            customer.address.street,
                            customer.address.city,
                            customer.address.state
                          ].filter(Boolean).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Vehicle Details</h4>
                    <div className="text-lg font-bold text-gray-900 mb-2">{vehicle?.licensePlate || '—'}</div>
                    <div className="text-gray-600 text-sm space-y-1">
                      <div>
                        <span className="font-medium text-gray-700">{vehicle?.make} {vehicle?.model}</span>
                        {vehicle?.year ? ` (${vehicle.year})` : ''}
                      </div>
                      {vehicle?.color && (
                        <div className="text-gray-500 mt-1">Color: {vehicle.color}</div>
                      )}
                      {jobCard?.odometerAtIntake !== undefined && jobCard.odometerAtIntake !== null && (
                        <div className="text-gray-500 mt-1">Kilometers Run: {formatNumber(jobCard.odometerAtIntake, locale)} km</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Parts Table ── */}
                {inv.parts?.length > 0 && (
                  <div className="mb-10">
                    <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Parts & Materials</h4>
                    <Table>
                      <Thead>
                        <Tr>
                          <Th className="w-1/2">Part Name</Th>
                          <Th>Qty</Th>
                          <Th>Unit Price</Th>
                          <Th className="text-right">Total</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {inv.parts.map((part, i) => (
                          <Tr key={i}>
                            <Td className="font-medium text-gray-900">{part.partName}</Td>
                            <Td>{part.quantity}</Td>
                            <Td>{formatCurrency(part.unitPrice)}</Td>
                            <Td className="font-bold text-gray-900 text-right">{formatCurrency(part.total)}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </div>
                )}

                {/* ── Labor Table ── */}
                {inv.labor?.length > 0 && (
                  <div className="mb-12">
                    <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Labor Charges</h4>
                    <Table>
                      <Thead>
                        <Tr>
                          <Th className="w-1/2">Description</Th>
                          <Th>Hours</Th>
                          <Th>Rate/Hr</Th>
                          <Th className="text-right">Total</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {inv.labor.map((lab, i) => (
                          <Tr key={i}>
                            <Td className="font-medium text-gray-900">{lab.description}</Td>
                            <Td>{lab.hours}</Td>
                            <Td>{formatCurrency(lab.ratePerHour)}</Td>
                            <Td className="font-bold text-gray-900 text-right">{formatCurrency(lab.total)}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </div>
                )}

                {/* ── Totals ── */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-12">

                  {/* Payment Status Banner */}
                  <div className="flex-1 w-full md:w-auto">
                    <div className={`flex flex-col gap-2 p-5 rounded-2xl border ${
                      inv.paymentStatus === 'paid' ? 'bg-green-50 border-green-200 text-green-800' :
                      inv.paymentStatus === 'unpaid' ? 'bg-orange-50 border-orange-200 text-orange-800' :
                      'bg-blue-50 border-blue-200 text-blue-800'
                    }`}>
                      <div className="flex items-center gap-2 font-bold text-lg">
                        {inv.paymentStatus === 'paid' && <><CheckCircle2 className="w-5 h-5" /> Payment Received</>}
                        {inv.paymentStatus === 'unpaid' && <><AlertTriangle className="w-5 h-5" /> Payment Pending</>}
                        {inv.paymentStatus === 'partial' && <><Clock className="w-5 h-5" /> Partial Payment Received</>}
                      </div>
                      <div className="text-sm opacity-90 font-medium">
                        {inv.paymentStatus !== 'unpaid' && (
                          <div className="mb-1">
                            Paid: <span className="font-bold">{formatCurrency(inv.amountPaid)}</span>
                            {inv.paymentMethod && ` via ${inv.paymentMethod.replace('_', ' ')}`}
                            {inv.paidAt && ` on ${formatDate(inv.paidAt)}`}
                          </div>
                        )}
                        {inv.paymentStatus === 'partial' && (
                          <div className="text-red-700 font-bold bg-white/50 inline-block px-2 py-1 rounded-md mt-1">
                            Due: {formatCurrency(inv.grandTotal - inv.amountPaid)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Totals Box */}
                  <div className="w-full md:w-80 bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-gray-600 text-sm font-medium">
                        <span>Subtotal</span>
                        <span className="text-gray-900">{formatCurrency(inv.subtotal)}</span>
                      </div>
                      {inv.discount > 0 && (
                        <div className="flex justify-between items-center text-green-600 text-sm font-medium">
                          <span>Discount</span>
                          <span>-{formatCurrency(inv.discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-gray-600 text-sm font-medium">
                        {/* `?? 0`, never `?? 18`: in a zero-tax country the old
                            fallback printed a fabricated 18% line on a real
                            customer-facing invoice. */}
                        <span>{locale.taxLabel} ({inv.taxRate ?? 0}%)</span>
                        <span className="text-gray-900">{formatCurrency(inv.taxAmount)}</span>
                      </div>

                      <div className="h-px bg-gray-200 my-4" />

                      <div className="flex justify-between items-center text-xl font-black text-gray-900">
                        <span>Total Amount</span>
                        <span className="text-primary-600">{formatCurrency(inv.grandTotal)}</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* ── Notes ── */}
                {inv.notes && (
                  <div className="bg-yellow-50 text-yellow-800 p-5 rounded-2xl border border-yellow-200/50">
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-1 opacity-70">Notes / Remarks</h4>
                    <p className="text-sm font-medium leading-relaxed">{inv.notes}</p>
                  </div>
                )}

                <div className="mt-12 pt-8 border-t border-dashed border-gray-200 text-center text-gray-400 text-sm font-medium">
                  Thank you for your business!
                </div>
              </div>
            ) : null}
          </div>
        </Modal>
      </ModalOverlay>
      <ConfirmModal />
      </>
    );
  };

  return { openInvoice, closeViewer, InvoiceModal };
}
