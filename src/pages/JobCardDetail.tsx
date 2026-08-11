import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';
import { useGlobalLoader } from '../context/GlobalLoaderContext';
import { getJobCard, updateJobCard, saveJobCardEstimation, approveJobCardEstimation, downloadEstimationPDF } from '../services/apiServices/jobCardService';
import { getMechanics } from '../services/apiServices/userService';
import { getGarage } from '../services/apiServices/garageService';
import { createInvoice as generateInvoice } from '../services/apiServices/invoiceService';
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
  HiOutlineDownload,
  HiOutlineCheck,
} from 'react-icons/hi';
import { HiOutlineWrench } from 'react-icons/hi2';
import Button from '../components/Button';
import { Input, Select } from '../components/Form';
import { Table, Thead, Th, Tbody, Tr, Td } from '../components/Table';
import EmptyState from '../components/EmptyState';
import { ModalOverlay, Modal, ModalHeader, ModalBody, ModalFooter } from '../components/Modal';
import Badge from '../components/Badge';
import { Card } from '../components/Card';
import { useInvoiceViewer } from '../components/InvoiceViewerModal';
import { useConfirm } from '../components/ConfirmModal';
import type { JobCard, User, EstimationPart, EstimationLabor, JobStatus, Vehicle, Customer, AssignedStaff } from '../types/models';

const STATUS_FLOW: JobStatus[] = [
  'new', 'estimation_sent', 'approved', 'in_progress',
  'quality_check', 'ready_for_pickup', 'delivered'
];

interface EstimationForm {
  parts: EstimationPart[];
  labor: EstimationLabor[];
  discount: number;
  taxRate: number;
}

export default function JobCardDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const { withLoader } = useGlobalLoader();
  const [jobCard, setJobCard] = useState<JobCard | null>(null);
  const [mechanics, setMechanics] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEstimation, setShowEstimation] = useState(false);
  const [updatingMechanic, setUpdatingMechanic] = useState<string | false>(false);
  const { confirm, ConfirmModal } = useConfirm();

  const [estimation, setEstimation] = useState<EstimationForm>({
    parts: [],
    labor: [],
    discount: 0,
    taxRate: 18
  });

  useEffect(() => {
    fetchJobCard();
    fetchMechanics();
  }, [id]);

  const fetchJobCard = async () => {
    try {
      const { data } = await getJobCard(id!);
      setJobCard(data);

      // The estimation subdocument's taxRate always defaults to 18 in the
      // schema, so it can't distinguish "never filled in" from "actually
      // 18" — treat an estimation with no parts/labor yet as new and seed
      // its tax rate from the garage's configured default instead.
      const isNewEstimation = !data.estimation?.parts?.length && !data.estimation?.labor?.length;
      let defaultTaxRate = 18;
      if (isNewEstimation) {
        try {
          const { data: garage } = await getGarage();
          defaultTaxRate = garage.settings?.taxRate ?? 18;
        } catch { /* fall back to 18 */ }
      }

      if (data.estimation) {
        setEstimation({
          parts: data.estimation.parts || [],
          labor: data.estimation.labor || [],
          discount: data.estimation.discount || 0,
          taxRate: isNewEstimation ? defaultTaxRate : (data.estimation.taxRate ?? defaultTaxRate)
        });
      }
    } catch {
      toast.error('Failed to load job card');
    } finally {
      setLoading(false);
    }
  };

  const fetchMechanics = async () => {
    try {
      const mData = await getMechanics();
      setMechanics(mData);
    } catch { /* ignore */ }
  };

  const assignMechanic = async (mechanicId: string) => {
    setUpdatingMechanic(mechanicId);
    try {
      await updateJobCard(id!, { assignedMechanic: mechanicId });
      toast.success('Mechanic assigned');
      fetchJobCard();
    } catch {
      toast.error('Failed to assign mechanic');
    } finally {
      setUpdatingMechanic(false);
    }
  };

  const updateStatus = async (newStatus: JobStatus) => {
    if (newStatus === 'estimation_sent') {
      const hasParts = (jobCard?.estimation?.parts?.length || 0) > 0;
      const hasLabor = (jobCard?.estimation?.labor?.length || 0) > 0;
      if (!hasParts && !hasLabor) {
        toast.error('Cannot send estimation: Please add at least one part or labor item.');
        return;
      }
    }
    if (newStatus === 'delivered' && !jobCard?.invoice) {
      toast.error('Cannot mark as delivered: Please generate an invoice first.');
      return;
    }
    await withLoader(async () => {
      try {
        await updateJobCard(id!, { status: newStatus });
        toast.success(`Status updated to "${newStatus.replace(/_/g, ' ')}"`);
        fetchJobCard();
      } catch {
        toast.error('Failed to update status');
      }
    });
  };

  const getNextStatus = (): JobStatus | null => {
    if (!jobCard) return null;
    const currentIndex = STATUS_FLOW.indexOf(jobCard.status);
    if (currentIndex === -1 || currentIndex >= STATUS_FLOW.length - 1) return null;
    return STATUS_FLOW[currentIndex + 1];
  };

  // Estimation handlers
  const addPart = () => {
    setEstimation({
      ...estimation,
      parts: [...estimation.parts, { partName: '', quantity: 1, unitPrice: 0 }]
    });
  };

  const addLabor = () => {
    setEstimation({
      ...estimation,
      labor: [...estimation.labor, { description: '', hours: 1, ratePerHour: 500 }]
    });
  };

  const downloadEstimation = async () => {
    await withLoader(async () => {
      try {
        const response = await downloadEstimationPDF(id!);
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Estimation-${jobCard!.jobCardNumber}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        toast.success('Estimation PDF downloaded');
      } catch {
        toast.error('Failed to download estimation');
      }
    });
  };

  const updatePart = <K extends keyof EstimationPart>(index: number, field: K, value: EstimationPart[K]) => {
    const updated = [...estimation.parts];
    updated[index] = { ...updated[index], [field]: value };
    setEstimation({ ...estimation, parts: updated });
  };

  const updateLabor = <K extends keyof EstimationLabor>(index: number, field: K, value: EstimationLabor[K]) => {
    const updated = [...estimation.labor];
    updated[index] = { ...updated[index], [field]: value };
    setEstimation({ ...estimation, labor: updated });
  };

  const removePart = (index: number) => {
    setEstimation({
      ...estimation,
      parts: estimation.parts.filter((_, i) => i !== index)
    });
  };

  const removeLabor = (index: number) => {
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
    await withLoader(async () => {
      try {
        await saveJobCardEstimation(id!, estimation);
        toast.success('Estimation saved!');
        setShowEstimation(false);
        fetchJobCard();
      } catch {
        toast.error('Failed to save estimation');
      }
    });
  };

  const approveEstimation = async () => {
    await withLoader(async () => {
      try {
        await approveJobCardEstimation(id!);
        toast.success('Estimation approved!');
        fetchJobCard();
      } catch {
        toast.error('Failed to approve');
      }
    });
  };

  // Invoice viewer modal
  const { openInvoice, InvoiceModal } = useInvoiceViewer(fetchJobCard);

  const createInvoice = async () => {
    const ok = await confirm({
      title: 'Generate Invoice?',
      message: 'Are you sure you want to generate an invoice for this job card? This will finalize the estimation, update the system statuses, and notify the customer.',
      confirmLabel: 'Generate Invoice',
      intent: 'warning',
    });
    if (!ok) return;
    await withLoader(async () => {
      try {
        const { data } = await generateInvoice({ jobCardId: id! });
        toast.success(`Invoice ${data.invoiceNumber} created!`);
        fetchJobCard();
      } catch (error) {
        const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
        toast.error(message || 'Failed to create invoice');
      }
    });
  };

  if (loading) {
    return <Loader text="Loading job card..." />;
  }

  if (!jobCard) return null;

  const totals = calculateTotals();
  const nextStatus = getNextStatus();
  const vehicle = jobCard.vehicle as Vehicle | undefined;
  const customer = jobCard.customer as Customer | undefined;
  const assignedMechanic = jobCard.assignedMechanic as AssignedStaff | null | undefined;
  const assignedAdvisor = jobCard.assignedAdvisor as AssignedStaff | null | undefined;
  const invoiceRef = jobCard.invoice as { _id: string } | string | null | undefined;
  const invoiceId = invoiceRef && typeof invoiceRef !== 'string' ? invoiceRef._id : invoiceRef;

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/jobcards')}>
            <HiOutlineArrowLeft />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{jobCard.jobCardNumber}</h1>
            <div className="mt-1 flex gap-2">
              <Badge intent={jobCard.status}>
                {jobCard.status?.replace(/_/g, ' ')}
              </Badge>
              {jobCard.serviceType && (
                <Badge intent="none">
                  {jobCard.serviceType.replace(/_/g, ' ')}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {nextStatus && hasRole('owner', 'admin', 'service_advisor', 'mechanic') && (
            <Button variant="primary" onClick={() => updateStatus(nextStatus)}>
              Move to: {nextStatus.replace(/_/g, ' ')}
            </Button>
          )}
          {jobCard.status !== 'cancelled' && jobCard.status !== 'delivered' && hasRole('owner', 'admin') && (
            <Button variant="ghost" onClick={async () => {
              const ok = await confirm({
                title: 'Cancel Job Card?',
                message: 'Are you sure you want to cancel this job card? This action cannot be undone and will stop all progress.',
                confirmLabel: 'Cancel Job',
                intent: 'danger',
              });
              if (ok) updateStatus('cancelled');
            }} className="text-danger hover:text-danger hover:bg-danger-light">
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Status Progress */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
        <div className="min-w-[600px] flex justify-between relative">
          {/* Connecting Line */}
          <div className="absolute top-5 left-8 right-8 h-[2px] bg-gray-200 -z-10" />

          {STATUS_FLOW.map((status, index) => {
            const currentIndex = STATUS_FLOW.indexOf(jobCard.status);
            const isCompleted = index <= currentIndex;
            const isCurrent = index === currentIndex;
            const circleClass = isCurrent
              ? 'bg-primary-500 text-white shadow-md ring-4 ring-primary-50'
              : isCompleted
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-400 border-2 border-white';
            const labelClass = isCurrent ? 'text-primary-600' : isCompleted ? 'text-green-600' : 'text-gray-400';
            return (
              <div key={status} className="flex flex-col items-center flex-1 z-10 relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${circleClass}`}>
                  {isCompleted && !isCurrent ? <HiOutlineCheck className="text-lg" /> : index + 1}
                </div>
                <span className={`mt-3 text-xs font-semibold uppercase tracking-wider text-center ${labelClass}`}>
                  {status.replace(/_/g, ' ')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Vehicle & Customer Info */}
        <Card title="Vehicle & Customer" className="lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
            <div>
              <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">License Plate</span>
              <span className="font-bold text-gray-900 text-lg">{vehicle?.licensePlate}</span>
            </div>
            <div>
              <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Vehicle</span>
              <span className="font-medium text-gray-900">
                {vehicle?.make} {vehicle?.model}
                {vehicle?.year ? ` (${vehicle.year})` : ''}
              </span>
            </div>
            <div>
              <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Customer</span>
              <span className="font-medium text-gray-900">{customer?.name}</span>
            </div>
            <div>
              <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Phone</span>
              <span className="font-medium text-gray-900">{customer?.phone}</span>
            </div>
            <div>
              <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Odometer</span>
              <span className="font-medium text-gray-900">{jobCard.odometerAtIntake?.toLocaleString() || '—'} km</span>
            </div>
            <div>
              <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Service Type</span>
              <span className="font-medium text-gray-900">{jobCard.serviceType || ''}</span>
            </div>
            <div>
              <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Service Advisor</span>
              <span className="font-medium text-gray-900">{assignedAdvisor?.name || 'Unassigned'}</span>
            </div>
            <div>
              <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Mechanic</span>
              {hasRole('owner', 'admin', 'service_advisor') ? (
                <Select
                  value={assignedMechanic?._id || ''}
                  onChange={(e) => assignMechanic(e.target.value)}
                  disabled={!!updatingMechanic}
                  className="h-8 py-0 px-2 text-sm bg-gray-50/50 border-gray-200"
                >
                  <option value="">Unassigned</option>
                  {mechanics.map(m => (
                    <option key={m._id} value={m._id}>{m.name}</option>
                  ))}
                </Select>
              ) : (
                <span className="font-medium text-gray-900">{assignedMechanic?.name || 'Unassigned'}</span>
              )}
            </div>
            {jobCard.expectedDeliveryDate && (
              <div>
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Expected Delivery</span>
                <span className="font-medium text-gray-900">
                  {new Date(jobCard.expectedDeliveryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
            )}
          </div>
          {jobCard.internalNotes && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Internal Notes</span>
              <p className="text-sm text-gray-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 italic">{jobCard.internalNotes}</p>
            </div>
          )}
        </Card>

        {/* Service History Timeline */}
        <Card title="Timeline" className="lg:col-span-1">
          <div className="flex flex-col gap-6 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-gray-100 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
            {(jobCard.statusHistory || []).slice().reverse().map((history, index) => {
              const changedBy = typeof history.changedBy === 'string' ? null : history.changedBy;
              return (
              <div key={index} className="flex gap-4 relative z-10">
                <div className={`w-9 h-9 rounded-full bg-white border-2 flex items-center justify-center shrink-0 shadow-sm ${index === 0 ? 'border-primary-500 ring-4 ring-primary-50' : 'border-gray-200'
                  }`}>
                  <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-primary-500 animate-pulse' : 'bg-gray-300'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <Badge intent={history.status}>
                      {history.status?.replace(/_/g, ' ')}
                    </Badge>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{new Date(history.changedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  </div>
                  <div className="text-[10px] text-gray-400 font-medium mb-1.5 uppercase tracking-tighter">
                    {new Date(history.changedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} by {changedBy?.name || 'Staff'}
                  </div>
                  {history.notes && (
                    <div className="text-xs text-gray-600 bg-gray-50 px-2 py-1.5 rounded-lg">
                      {history.notes}
                    </div>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        </Card>

        {/* Complaints */}
        <Card title="Complaints & Service Requests" className="md:col-span-2 lg:col-span-3">
          {jobCard.complaints?.length === 0 ? (
            <p className="text-gray-500 italic">No complaints logged</p>
          ) : (
            <div className="flex flex-col gap-3">
              {jobCard.complaints?.map((c, i) => (
                <div key={i} className="flex gap-3 items-start bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <Badge intent={c.priority === 'urgent' ? 'cancelled' : c.priority === 'high' ? 'estimation_sent' : 'new'}>
                    {c.priority}
                  </Badge>
                  <span className="text-sm text-gray-800">{c.description}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Estimation Summary */}
        <Card
          title="Estimation"
          className="md:col-span-2 lg:col-span-3"
          action={
            <div className="flex flex-wrap gap-2">
              {hasRole('owner', 'admin', 'service_advisor') && !jobCard.invoice && (
                <Button variant="secondary" size="sm" onClick={() => setShowEstimation(true)} icon={HiOutlinePencil}>
                  Edit Estimation
                </Button>
              )}
              {jobCard.estimation?.grandTotal > 0 && (
                <Button variant="ghost" size="sm" onClick={downloadEstimation} icon={HiOutlineDownload}>
                  Export Estimation
                </Button>
              )}
              {jobCard.estimation?.grandTotal > 0 && !jobCard.estimation?.approvedByCustomer && (jobCard.status !== 'cancelled' && jobCard.status !== 'delivered') && hasRole('owner', 'admin', 'service_advisor') && (
                <Button variant="primary" size="sm" onClick={approveEstimation} icon={HiOutlineCheckCircle} className="bg-green-600 hover:bg-green-700">
                  Approve
                </Button>
              )}
              {jobCard.estimation?.approvedByCustomer && !jobCard.invoice && (jobCard.status !== 'cancelled' && jobCard.status !== 'delivered') && hasRole('owner', 'admin', 'service_advisor') && (
                <Button variant="accent" size="sm" onClick={createInvoice} icon={HiOutlineDocumentText}>
                  Generate Invoice
                </Button>
              )}
              {jobCard.invoice && (
                <Button variant="primary" size="sm" onClick={() => openInvoice(invoiceId as string)} icon={HiOutlineCurrencyRupee}>
                  View Invoice
                </Button>
              )}
            </div>
          }
        >

          <div>
            {jobCard.estimation?.grandTotal > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="flex flex-col gap-6">
                  {/* Parts Table */}
                  {jobCard.estimation.parts?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 ml-1 uppercase tracking-wider">Parts</h4>
                      <Table>
                        <Thead>
                          <Tr>
                            <Th>Part Name</Th>
                            <Th>Qty</Th>
                            <Th>Unit Price</Th>
                            <Th>Total</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {jobCard.estimation.parts.map((p, i) => (
                            <Tr key={i}>
                              <Td className="font-medium text-gray-900">{p.partName}</Td>
                              <Td>{p.quantity}</Td>
                              <Td>₹{p.unitPrice?.toLocaleString('en-IN')}</Td>
                              <Td className="font-bold text-gray-900">₹{p.total?.toLocaleString('en-IN')}</Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </div>
                  )}

                  {/* Labor Table */}
                  {jobCard.estimation.labor?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 ml-1 uppercase tracking-wider">Labor</h4>
                      <Table>
                        <Thead>
                          <Tr>
                            <Th>Description</Th>
                            <Th>Hours</Th>
                            <Th>Rate/Hr</Th>
                            <Th>Total</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {jobCard.estimation.labor.map((l, i) => (
                            <Tr key={i}>
                              <Td className="font-medium text-gray-900">{l.description}</Td>
                              <Td>{l.hours}</Td>
                              <Td>₹{l.ratePerHour?.toLocaleString('en-IN')}</Td>
                              <Td className="font-bold text-gray-900">₹{l.total?.toLocaleString('en-IN')}</Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </div>
                  )}
                </div>

                {/* Totals Box */}
                <div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 lg:sticky lg:top-6">
                    <h4 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-6 border-b border-gray-200 pb-2">Summary</h4>

                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-center text-gray-600">
                        <span>Subtotal</span>
                        <span className="font-semibold text-gray-900">₹{jobCard.estimation.subtotal?.toLocaleString('en-IN')}</span>
                      </div>

                      {jobCard.estimation.discount > 0 && (
                        <div className="flex justify-between items-center text-green-600">
                          <span>Discount</span>
                          <span className="font-semibold">-₹{jobCard.estimation.discount?.toLocaleString('en-IN')}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-gray-600">
                        <span>Tax ({jobCard.estimation.taxRate}%)</span>
                        <span className="font-semibold text-gray-900">₹{jobCard.estimation.taxAmount?.toLocaleString('en-IN')}</span>
                      </div>

                      <div className="h-px bg-gray-200 my-2" />

                      <div className="flex justify-between items-center text-xl font-bold">
                        <span className="text-gray-900">Grand Total</span>
                        <span className="text-primary-600">₹{jobCard.estimation.grandTotal?.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {jobCard.estimation.approvedByCustomer && (
                      <div className="mt-6 flex items-center justify-center gap-2 bg-green-50 text-green-700 py-3 rounded-lg border border-green-200 font-semibold shadow-sm">
                        <HiOutlineCheckCircle className="text-xl" /> Estimation Approved
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={HiOutlineWrench}
                title="No estimation"
                message='Click "Edit Estimation" to add parts and labor.'
              />
            )}
          </div>
        </Card>
      </div>

      {/* Estimation Editor Modal */}
      {showEstimation && (
        <ModalOverlay onClose={() => setShowEstimation(false)}>
          <Modal className="max-w-[900px]">
            <ModalHeader title="Edit Estimation" onClose={() => setShowEstimation(false)} />

            <ModalBody>
              {/* Parts */}
              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Parts</h4>
              <div className="flex flex-col gap-3 mb-6">
                {estimation.parts.map((part, i) => (
                  <div key={i} className="flex flex-wrap sm:flex-nowrap gap-3 items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <Input
                      value={part.partName}
                      onChange={e => updatePart(i, 'partName', e.target.value)}
                      placeholder="Part name (e.g. Engine Oil, Brake Pad)"
                      className="flex-1 min-w-[180px]"
                    />
                    <Input
                      type="number"
                      value={part.quantity}
                      onChange={e => updatePart(i, 'quantity', parseInt(e.target.value, 10) || 0)}
                      placeholder="Qty"
                      className="w-[80px]"
                    />
                    <Input
                      type="number"
                      value={part.unitPrice}
                      onChange={e => updatePart(i, 'unitPrice', parseFloat(e.target.value) || 0)}
                      placeholder="Unit Price (₹)"
                      className="w-[120px]"
                    />
                    <div className="font-bold text-gray-900 min-w-[100px] text-right">
                      ₹{(part.quantity * part.unitPrice).toLocaleString('en-IN')}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removePart(i)} className="text-danger hover:text-danger hover:bg-danger-light">
                      <HiOutlineTrash />
                    </Button>
                  </div>
                ))}
                <Button variant="ghost" size="sm" onClick={addPart} className="self-start mt-1">
                  <HiOutlinePlus className="mr-1.5" /> Add Part
                </Button>
              </div>

              {/* Labor */}
              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Labor</h4>
              <div className="flex flex-col gap-3 mb-6">
                {estimation.labor.map((labor, i) => (
                  <div key={i} className="flex flex-wrap sm:flex-nowrap gap-3 items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <Input
                      value={labor.description}
                      onChange={e => updateLabor(i, 'description', e.target.value)}
                      placeholder="Labor description"
                      className="flex-1 min-w-[200px]"
                    />
                    <Input
                      type="number"
                      value={labor.hours}
                      onChange={e => updateLabor(i, 'hours', parseFloat(e.target.value) || 0)}
                      placeholder="Hours"
                      step="0.5"
                      className="w-[80px]"
                    />
                    <Input
                      type="number"
                      value={labor.ratePerHour}
                      onChange={e => updateLabor(i, 'ratePerHour', parseFloat(e.target.value) || 0)}
                      placeholder="Rate/hr"
                      className="w-[100px]"
                    />
                    <div className="font-bold text-gray-900 min-w-[100px] text-right">
                      ₹{(labor.hours * labor.ratePerHour).toLocaleString('en-IN')}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeLabor(i)} className="text-danger hover:text-danger hover:bg-danger-light">
                      <HiOutlineTrash />
                    </Button>
                  </div>
                ))}
                <Button variant="ghost" size="sm" onClick={addLabor} className="self-start mt-1">
                  <HiOutlinePlus className="mr-1.5" /> Add Labor
                </Button>
              </div>

              {/* Discount & Tax */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6 pt-4 border-t border-gray-100">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Discount (₹)</label>
                  <Input
                    type="number"
                    value={estimation.discount}
                    onChange={e => setEstimation({ ...estimation, discount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tax Rate (%)</label>
                  <Input
                    type="number"
                    value={estimation.taxRate}
                    onChange={e => setEstimation({ ...estimation, taxRate: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Live Totals */}
              <div className="bg-primary-50 border border-primary-100 rounded-xl p-5 flex flex-col gap-3">
                <div className="flex justify-between items-center text-gray-600">
                  <span>Parts Total</span>
                  <span className="font-semibold text-gray-900">₹{totals.partsTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>Labor Total</span>
                  <span className="font-semibold text-gray-900">₹{totals.laborTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900">₹{totals.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="h-px bg-primary-200 my-1" />
                <div className="flex justify-between items-center text-lg font-bold text-gray-900">
                  <span>Grand Total</span>
                  <span className="text-primary-600">₹{Math.round(totals.grandTotal).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </ModalBody>

            <ModalFooter className="bg-gray-50 border-t border-gray-100 rounded-b-2xl">
              <div className="flex justify-between w-full">
                <Button variant="ghost" onClick={() => setShowEstimation(false)}>Cancel</Button>
                <Button variant="primary" onClick={saveEstimation}>Save Estimation</Button>
              </div>
            </ModalFooter>
          </Modal>
        </ModalOverlay>
      )}
      <InvoiceModal />
      <ConfirmModal />
    </div>
  );
}
