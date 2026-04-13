import { useState, useEffect } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { getInvoices, updateInvoicePayment, downloadInvoicePdf } from '../services/apiServices/invoiceService';
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
import Pagination from '../components/Pagination';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [paymentFilter, setPaymentFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const { hasRole } = useAuth();
  const { openInvoice, InvoiceModal } = useInvoiceViewer(fetchInvoices);

  // Reset to page 1 whenever the user changes the search term
  useEffect(() => {
    setPagination(p => ({ ...p, page: 1 }));
  }, [search]);

  useEffect(() => {
    fetchInvoices();
  }, [debouncedSearch, paymentFilter, pagination.page]);

  function fetchInvoices() {
    setLoading(true);
    getInvoices({ search: debouncedSearch, paymentStatus: paymentFilter, page: pagination.page, limit: 15 })
      .then(({ data, pages, total }) => {
        setInvoices(data);
        setPagination(prev => ({
          ...prev,
          pages: pages || Math.ceil(total / 15) || 1
        }));
      })
      .catch(() => toast.error('Failed to load invoices'))
      .finally(() => setLoading(false));
  }

  const markAsPaid = async (invoiceId) => {
    const invoice = invoices.find(i => i._id === invoiceId);
    if (!invoice) return;

    try {
      await updateInvoicePayment(invoiceId, {
        amountPaid: invoice.grandTotal,
        paymentMethod: 'cash'
      });
      toast.success('Payment recorded!');
      fetchInvoices();
    } catch (error) {
      toast.error('Failed to record payment');
    }
  };

  const handleDownload = async (id, number) => {
    try {
      const { data } = await downloadInvoicePdf(id);
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${number}.pdf`);
      document.body.appendChild(link);
      link.click();
      toast.success('PDF downloaded');
    } catch (e) {
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

      {/* Pagination */}
      <Pagination 
        page={pagination.page} 
        pages={pagination.pages} 
        onPageChange={(page) => setPagination(p => ({ ...p, page }))} 
      />

      <InvoiceModal />
    </div>
  );
}
