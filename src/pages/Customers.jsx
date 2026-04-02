import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineX
} from 'react-icons/hi';

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
    <div>
      <div className="page-header">
        <h1>Customers</h1>
        <div className="page-header-actions">
          {hasRole('owner', 'admin', 'service_advisor', 'receptionist') && (
            <button className="btn btn-primary" onClick={openAdd} id="add-customer-btn">
              <HiOutlinePlus /> Add Customer
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="search-filter-bar">
        <div className="search-input-wrapper">
          <HiOutlineSearch />
          <input
            className="form-input"
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading-screen"><div className="spinner" /></div>
      ) : customers.length === 0 ? (
        <div className="empty-state">
          <HiOutlineSearch style={{ fontSize: '3rem' }} />
          <h3>No customers found</h3>
          <p>Add your first customer to get started</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Vehicles</th>
                <th>Total Visits</th>
                <th>Total Spent</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c._id}>
                  <td>
                    <span className="font-semibold">{c.name}</span>
                  </td>
                  <td>
                    <span className="flex items-center gap-1">
                      <HiOutlinePhone style={{ color: 'var(--gray-400)' }} />
                      {c.phone}
                    </span>
                  </td>
                  <td>
                    {c.email ? (
                      <span className="flex items-center gap-1">
                        <HiOutlineMail style={{ color: 'var(--gray-400)' }} />
                        {c.email}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>
                    {c.vehicles?.length || 0} vehicle{(c.vehicles?.length || 0) !== 1 ? 's' : ''}
                  </td>
                  <td>{c.totalVisits}</td>
                  <td className="font-semibold">
                    ₹{(c.totalSpent || 0).toLocaleString('en-IN')}
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>
                        <HiOutlinePencil />
                      </button>
                      {hasRole('owner', 'admin') && (
                        <button className="btn btn-ghost btn-sm text-danger" onClick={() => handleDelete(c._id)}>
                          <HiOutlineTrash />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="pagination">
          <button
            disabled={pagination.page <= 1}
            onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
          >
            ‹
          </button>
          {Array.from({ length: pagination.pages }, (_, i) => (
            <button
              key={i + 1}
              className={pagination.page === i + 1 ? 'active' : ''}
              onClick={() => setPagination(p => ({ ...p, page: i + 1 }))}
            >
              {i + 1}
            </button>
          ))}
          <button
            disabled={pagination.page >= pagination.pages}
            onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
          >
            ›
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCustomer ? 'Edit Customer' : 'Add Customer'}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>
                <HiOutlineX />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Customer Name *</label>
                    <input
                      className="form-input"
                      type="text"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="Full name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number *</label>
                    <input
                      className="form-input"
                      type="tel"
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      placeholder="9876543210"
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    className="form-input"
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="customer@email.com (optional)"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input
                      className="form-input"
                      type="text"
                      value={form.address.city}
                      onChange={e => setForm({ ...form, address: { ...form.address, city: e.target.value } })}
                      placeholder="City"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pincode</label>
                    <input
                      className="form-input"
                      type="text"
                      value={form.address.pincode}
                      onChange={e => setForm({ ...form, address: { ...form.address, pincode: e.target.value } })}
                      placeholder="560001"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea
                    className="form-textarea"
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    placeholder="Any notes about this customer..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCustomer ? 'Update Customer' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
