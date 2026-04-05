import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  HiOutlineSearch,
  HiOutlineEye,
  HiOutlineCheckCircle,
  HiOutlineDownload,
  HiOutlineDocumentText
} from 'react-icons/hi';
import { useInvoiceViewer } from '../components/InvoiceViewerModal';
import PageHeader from '../components/PageHeader';
import { Input, Select } from '../components/Form';
import EmptyState from '../components/EmptyState';
import { Table, Thead, Th, Tbody, Tr, Td } from '../components/Table';
import Badge from '../components/Badge';
import Button from '../components/Button';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const { hasRole } = useAuth();
  const { openInvoice, InvoiceModal } = useInvoiceViewer(fetchInvoices);

  useEffect(() => {
    fetchInvoices();
  }, [search, paymentFilter]);

  function fetchInvoices() {
    setLoading(true);
    api.get('/invoices', {
      params: { search, paymentStatus: paymentFilter, limit: 50 }
    })
      .then(res => setInvoices(res.data.data))
      .catch(() => toast.error('Failed to load invoices'))
      .finally(() => setLoading(false));
  }

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
    <div className="flex flex-col gap-6">
      <PageHeader title="Invoices" />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[250px]">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
          <Input
            type="text"
            placeholder="Search by invoice number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={paymentFilter}
          onChange={e => setPaymentFilter(e.target.value)}
          className="w-auto min-w-[160px]"
        >
          <option value="">All Payments</option>
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
        </Select>
      </div>

      {loading ? (
        <div className="min-h-[300px] flex justify-center items-center">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : invoices.length === 0 ? (
        <EmptyState 
          icon={HiOutlineDocumentText} 
          title="No invoices found" 
          message="Invoices are generated from approved job card estimations" 
        />
      ) : (
        <Table>
          <Thead>
            <Tr>
              <Th>Invoice #</Th>
              <Th>Job Card</Th>
              <Th>Customer</Th>
              <Th>Vehicle</Th>
              <Th>Amount</Th>
              <Th>Payment</Th>
              <Th>Date</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {invoices.map(inv => (
              <Tr key={inv._id}>
                <Td>
                  <span
                    className="font-bold text-primary-600 hover:text-primary-700 cursor-pointer transition-colors"
                    onClick={() => openInvoice(inv._id)}
                  >
                    {inv.invoiceNumber}
                  </span>
                </Td>
                <Td className="text-sm text-gray-700">{inv.jobCard?.jobCardNumber}</Td>
                <Td>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{inv.customer?.name}</span>
                    <span className="text-xs text-gray-500">{inv.customer?.phone}</span>
                  </div>
                </Td>
                <Td>
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-800">{inv.vehicle?.licensePlate}</span>
                    <span className="text-xs text-gray-500 capitalize">{inv.vehicle?.make} {inv.vehicle?.model}</span>
                  </div>
                </Td>
                <Td className="font-bold text-gray-900">{formatCurrency(inv.grandTotal)}</Td>
                <Td>
                  <Badge intent={inv.paymentStatus}>{inv.paymentStatus}</Badge>
                </Td>
                <Td className="text-sm text-gray-500">{formatDate(inv.createdAt)}</Td>
                <Td>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openInvoice(inv._id)} title="View Invoice">
                      <HiOutlineEye />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => downloadPDF(inv._id, inv.invoiceNumber)} title="Download PDF">
                      <HiOutlineDownload />
                    </Button>
                    {inv.paymentStatus !== 'paid' && hasRole('owner', 'admin', 'service_advisor') && (
                      <Button variant="success" size="icon" onClick={() => markAsPaid(inv._id)} title="Mark as Paid">
                        <HiOutlineCheckCircle />
                      </Button>
                    )}
                  </div>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      <InvoiceModal />
    </div>
  );
}
