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
  HiOutlineDownload,
  HiOutlineCheck,
} from 'react-icons/hi';
import { HiOutlineWrench } from 'react-icons/hi2';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import { Input, Select } from '../components/Form';
import { Table, Thead, Th, Tbody, Tr, Td } from '../components/Table';
import EmptyState from '../components/EmptyState';
import { ModalOverlay, Modal, ModalHeader, ModalBody, ModalFooter } from '../components/Modal';
import Badge from '../components/Badge';
import { Card } from '../components/Card';
import { useInvoiceViewer } from '../components/InvoiceViewerModal';

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

  // Invoice viewer modal
  const { openInvoice, InvoiceModal } = useInvoiceViewer(fetchJobCard);

  const createInvoice = async () => {
    try {
      const res = await api.post('/invoices', { jobCardId: id });
      toast.success(`Invoice ${res.data.data.invoiceNumber} created!`);
      fetchJobCard();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create invoice');
    }
  };

  if (loading) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  if (!jobCard) return null;

  const totals = calculateTotals();
  const nextStatus = getNextStatus();

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/jobcards')}>
            <HiOutlineArrowLeft />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{jobCard.jobCardNumber}</h1>
            <div className="mt-1">
              <Badge intent={jobCard.status}>
                {jobCard.status?.replace(/_/g, ' ')}
              </Badge>
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
            <Button variant="ghost" onClick={() => updateStatus('cancelled')} className="text-danger hover:text-danger hover:bg-danger-light">
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
            return (
              <div key={status} className="flex flex-col items-center flex-1 z-10 relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
                  isCurrent ? 'bg-primary-500 text-white shadow-md ring-4 ring-primary-50' :
                  isCompleted ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400 border-2 border-white'
                }`}>
                  {isCompleted && !isCurrent ? <HiOutlineCheck className="text-lg" /> : index + 1}
                </div>
                <span className={`mt-3 text-xs font-semibold uppercase tracking-wider text-center ${
                  isCurrent ? 'text-primary-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                }`}>
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
              <span className="font-bold text-gray-900 text-lg">{jobCard.vehicle?.licensePlate}</span>
            </div>
            <div>
              <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Vehicle</span>
              <span className="font-medium text-gray-900">
                {jobCard.vehicle?.make} {jobCard.vehicle?.model}
                {jobCard.vehicle?.year ? ` (${jobCard.vehicle.year})` : ''}
              </span>
            </div>
            <div>
              <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Customer</span>
              <span className="font-medium text-gray-900">{jobCard.customer?.name}</span>
            </div>
            <div>
              <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Phone</span>
              <span className="font-medium text-gray-900">{jobCard.customer?.phone}</span>
            </div>
            <div>
              <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Odometer</span>
              <span className="font-medium text-gray-900">{jobCard.odometerAtIntake?.toLocaleString() || '—'} km</span>
            </div>
            <div>
              <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Mechanic</span>
              <span className="font-medium text-gray-900">{jobCard.assignedMechanic?.name || 'Unassigned'}</span>
            </div>
          </div>
        </Card>

        {/* Complaints */}
        <Card title="Complaints & Service Requests">
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
        <Card title="💰 Estimation" className="md:col-span-2 lg:col-span-3">
          <div className="flex flex-wrap gap-2 mb-6 -mt-10 justify-end">
            {hasRole('owner', 'admin', 'service_advisor') && (
              <Button variant="secondary" size="sm" onClick={() => setShowEstimation(true)} icon={HiOutlinePencil}>
                Edit Estimation
              </Button>
            )}
            {jobCard.estimation?.grandTotal > 0 && !jobCard.estimation?.approvedByCustomer && hasRole('owner', 'admin', 'service_advisor') && (
              <Button variant="primary" size="sm" onClick={approveEstimation} icon={HiOutlineCheckCircle} className="bg-green-600 hover:bg-green-700">
                Approve
              </Button>
            )}
            {jobCard.estimation?.approvedByCustomer && !jobCard.invoice && hasRole('owner', 'admin', 'service_advisor') && (
              <Button variant="accent" size="sm" onClick={createInvoice} icon={HiOutlineDocumentText}>
                Generate Invoice
              </Button>
            )}
            {jobCard.invoice && (
              <Button variant="primary" size="sm" onClick={() => openInvoice(jobCard.invoice._id || jobCard.invoice)} icon={HiOutlineCurrencyRupee}>
                View Invoice
              </Button>
            )}
          </div>

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
                        <HiOutlineCheckCircle className="text-xl" /> Approved by Customer
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
                    <Select
                      value={part.inventoryItem || ''}
                      onChange={e => updatePart(i, 'inventoryItem', e.target.value)}
                      className="min-w-[200px] flex-1"
                    >
                      <option value="">Select from inventory...</option>
                      {inventory.map(inv => (
                        <option key={inv._id} value={inv._id}>
                          {inv.partName} (₹{inv.sellingPrice || inv.unitPrice}) — Stock: {inv.quantity}
                        </option>
                      ))}
                    </Select>
                    <Input
                      value={part.partName}
                      onChange={e => updatePart(i, 'partName', e.target.value)}
                      placeholder="Part name"
                      className="flex-1 min-w-[150px]"
                    />
                    <Input
                      type="number"
                      value={part.quantity}
                      onChange={e => updatePart(i, 'quantity', parseInt(e.target.value) || 0)}
                      placeholder="Qty"
                      className="w-[80px]"
                    />
                    <Input
                      type="number"
                      value={part.unitPrice}
                      onChange={e => updatePart(i, 'unitPrice', parseFloat(e.target.value) || 0)}
                      placeholder="Price"
                      className="w-[100px]"
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
    </div>
  );
}
