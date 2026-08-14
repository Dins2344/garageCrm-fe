import { useState, useEffect, type FormEvent } from 'react';
import { useGarage } from '../context/GarageContext';
import { formatMoney } from '../utils/format';
import { DEFAULT_PAGE_SIZE } from '../utils/constants';
import Loader from '../components/Loader';
import { useGlobalLoader } from '../context/GlobalLoaderContext';
import { useDebounce } from '../hooks/useDebounce';
import { useConfirm } from '../components/ConfirmModal';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../services/apiServices/customerService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlinePhone,
  HiOutlineMail
} from 'react-icons/hi';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import { Input } from '../components/Form';
import { Table, Thead, Th, Tbody, Tr, Td } from '../components/Table';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import { ModalOverlay, Modal, ModalHeader, ModalBody, ModalFooter } from '../components/Modal';
import type { Customer } from '../types/models';

interface CustomerForm {
  name: string;
  phone: string;
  email: string;
  notes: string;
  address: { street: string; city: string; state: string; pincode: string };
}

const BLANK_FORM: CustomerForm = {
  name: '', phone: '', email: '', notes: '',
  address: { street: '', city: '', state: '', pincode: '' }
};

export default function Customers() {
  const { locale } = useGarage();
  const money = (n?: number) => formatMoney(n, locale);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const { hasRole } = useAuth();
  const { withLoader } = useGlobalLoader();
  const { confirm, ConfirmModal } = useConfirm();

  const [form, setForm] = useState<CustomerForm>(BLANK_FORM);

  useEffect(() => {
    fetchCustomers();
  }, [debouncedSearch, pagination.page]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data, pages } = await getCustomers({
        search: debouncedSearch,
        page: pagination.page,
        limit: DEFAULT_PAGE_SIZE
      });
      setCustomers(data);
      setPagination(prev => ({ ...prev, pages }));
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditingCustomer(null);
    setForm(BLANK_FORM);
    setShowModal(true);
  };

  const openEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setForm({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      notes: customer.notes || '',
      address: {
        street: customer.address?.street || '',
        city: customer.address?.city || '',
        state: customer.address?.state || '',
        pincode: customer.address?.pincode || ''
      }
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await withLoader(async () => {
      try {
        if (editingCustomer) {
          await updateCustomer(editingCustomer._id, form);
          toast.success('Customer updated!');
        } else {
          await createCustomer(form);
          toast.success('Customer added!');
        }
        setShowModal(false);
        fetchCustomers();
      } catch (error) {
        const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
        toast.error(message || 'Failed to save customer');
      }
    });
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete Customer?',
      message: 'This will permanently remove the customer and all associated records.',
      confirmLabel: 'Delete',
      intent: 'danger',
    });
    if (!ok) return;
    await withLoader(async () => {
      try {
        await deleteCustomer(id);
        toast.success('Customer deleted');
        fetchCustomers();
      } catch {
        toast.error('Failed to delete customer');
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      <PageHeader title="Customers">
        {hasRole('owner', 'admin', 'service_advisor', 'receptionist') && (
          <Button variant="primary" onClick={openAdd} icon={HiOutlinePlus}>
            Add Customer
          </Button>
        )}
      </PageHeader>

      {/* Search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[250px]">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
          <Input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table + Pagination */}
      <div className="flex flex-col flex-1">
        {loading ? (
          <Loader />
        ) : customers.length === 0 ? (
          <EmptyState
            icon={HiOutlineSearch}
            title="No customers found"
            message="Add your first customer to get started"
          />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Phone</Th>
                <Th>Email</Th>
                <Th>Vehicles</Th>
                <Th>Total Visits</Th>
                <Th>Total Spent</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {customers.map(c => (
                <Tr key={c._id}>
                  <Td className="font-semibold text-gray-900">{c.name}</Td>
                  <Td>
                    <span className="flex items-center gap-1.5 text-gray-800">
                      <HiOutlinePhone className="text-gray-400" />
                      {c.phone}
                    </span>
                  </Td>
                  <Td>
                    {c.email ? (
                      <span className="flex items-center gap-1.5 text-gray-800">
                        <HiOutlineMail className="text-gray-400" />
                        {c.email}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </Td>
                  <Td className="text-gray-700">
                    {c.vehicles?.length || 0} vehicle{c.vehicles?.length !== 1 ? 's' : ''}
                  </Td>
                  <Td className="text-gray-700">{c.totalVisits}</Td>
                  <Td className="font-semibold text-gray-900">
                    {money(c.totalSpent)}
                  </Td>
                  <Td>
                    <div className="flex gap-2">
                      <Button className='cursor-pointer' variant="ghost" size="icon" onClick={() => openEdit(c)} title="Edit">
                        <HiOutlinePencil />
                      </Button>
                      {hasRole('owner', 'admin') && (
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(c._id)} className="cursor-pointer text-danger hover:text-danger hover:bg-danger-light" title="Delete">
                          <HiOutlineTrash />
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
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <ModalOverlay onClose={() => setShowModal(false)}>
          <Modal>
            <form onSubmit={handleSubmit}>
              <ModalHeader
                title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
                onClose={() => setShowModal(false)}
              />
              <ModalBody>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="customer-name" className="block text-sm font-semibold text-gray-700 mb-1.5">Customer Name *</label>
                    <Input
                      id="customer-name"
                      type="text"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="Full name"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="customer-phone" className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number *</label>
                    <Input
                      id="customer-phone"
                      type="tel"
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      placeholder={locale.phoneExample}
                      required
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="customer@email.com (optional)"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">City</label>
                    <Input
                      type="text"
                      value={form.address.city}
                      onChange={e => setForm({ ...form, address: { ...form.address, city: e.target.value } })}
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Pincode</label>
                    <Input
                      type="text"
                      value={form.address.pincode}
                      onChange={e => setForm({ ...form, address: { ...form.address, pincode: e.target.value } })}
                      placeholder="560001"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes</label>
                  <textarea
                    className="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-lg text-[15px] text-gray-800 bg-white outline-none focus:border-primary-400 focus:shadow-[0_0_0_3px_rgba(59,95,248,0.1)] min-h-[100px] resize-y placeholder:text-gray-400"
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    placeholder="Any notes about this customer..."
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="secondary" onClick={() => setShowModal(false)} type="button">
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  {editingCustomer ? 'Update Customer' : 'Add Customer'}
                </Button>
              </ModalFooter>
            </form>
          </Modal>
        </ModalOverlay>
      )}
      <ConfirmModal />
    </div>
  );
}
