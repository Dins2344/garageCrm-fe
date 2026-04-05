import { useState, useEffect } from 'react';
import api from '../services/api';
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

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const { hasRole } = useAuth();

  const [form, setForm] = useState({
    name: '', phone: '', email: '', notes: '',
    address: { street: '', city: '', state: '', pincode: '' }
  });

  useEffect(() => {
    fetchCustomers();
  }, [search, pagination.page]);

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers', {
        params: { search, page: pagination.page, limit: 15 }
      });
      setCustomers(res.data.data);
      setPagination(prev => ({
        ...prev,
        pages: res.data.pages,
        total: res.data.total
      }));
    } catch (error) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditingCustomer(null);
    setForm({ name: '', phone: '', email: '', notes: '', address: { street: '', city: '', state: '', pincode: '' } });
    setShowModal(true);
  };

  const openEdit = (customer) => {
    setEditingCustomer(customer);
    setForm({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      notes: customer.notes || '',
      address: customer.address || { street: '', city: '', state: '', pincode: '' }
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer._id}`, form);
        toast.success('Customer updated!');
      } else {
        await api.post('/customers', form);
        toast.success('Customer added!');
      }
      setShowModal(false);
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save customer');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    try {
      await api.delete(`/customers/${id}`);
      toast.success('Customer deleted');
      fetchCustomers();
    } catch (error) {
      toast.error('Failed to delete customer');
    }
  };

  return (
    <div className="flex flex-col gap-6">
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

      {/* Table */}
      {loading ? (
        <div className="min-h-[300px] flex justify-center items-center">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin" />
        </div>
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
                  ₹{(c.totalSpent || 0).toLocaleString('en-IN')}
                </Td>
                <Td>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)} title="Edit">
                      <HiOutlinePencil />
                    </Button>
                    {hasRole('owner', 'admin') && (
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(c._id)} className="text-danger hover:text-danger hover:bg-danger-light" title="Delete">
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
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Customer Name *</label>
                    <Input
                      type="text"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="Full name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number *</label>
                    <Input
                      type="tel"
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      placeholder="9876543210"
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
    </div>
  );
}
