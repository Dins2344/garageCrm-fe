import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlineX
} from 'react-icons/hi';

export default function Settings() {
  const { user, hasRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', role: 'mechanic'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.data);
    } catch (error) {
      console.error('Could not load users');
    } finally {
      setLoading(false);
    }
  };

  const openAddUser = () => {
    setEditingUser(null);
    setForm({ name: '', email: '', phone: '', password: '', role: 'mechanic' });
    setShowUserModal(true);
  };

  const handleSubmitUser = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser._id}`, form);
        toast.success('User updated!');
      } else {
        await api.post('/users', form);
        toast.success('Staff member added!');
      }
      setShowUserModal(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save user');
    }
  };

  const toggleUserActive = async (userId, isActive) => {
    try {
      await api.put(`/users/${userId}`, { isActive: !isActive });
      toast.success(`User ${isActive ? 'deactivated' : 'activated'}`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const roleColors = {
    owner: 'var(--primary-600)',
    admin: '#7c3aed',
    service_advisor: 'var(--success)',
    mechanic: 'var(--accent-600)',
    receptionist: '#0f766e'
  };

  return (
    <div>
      <div className="page-header">
        <h1>Settings</h1>
      </div>

      {/* Garage Info Card */}
      <div className="card mb-3">
        <div className="card-header">
          <h3>Garage Information</h3>
        </div>
        <div className="card-body">
          <div className="form-row">
            <div className="info-item">
              <span className="info-label">Garage Name</span>
              <span className="info-value font-bold">{user?.garage?.name || '—'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">GST Number</span>
              <span className="info-value">{user?.garage?.gstNumber || 'Not set'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Default Tax Rate</span>
              <span className="info-value">{user?.garage?.settings?.taxRate || 18}%</span>
            </div>
            <div className="info-item">
              <span className="info-label">Labor Rate/Hour</span>
              <span className="info-value">₹{user?.garage?.settings?.laborRatePerHour || 500}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Management */}
      <div className="card">
        <div className="card-header">
          <h3>Staff Management</h3>
          <button className="btn btn-primary btn-sm" onClick={openAddUser}>
            <HiOutlinePlus /> Add Staff
          </button>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="loading-screen" style={{ minHeight: '200px' }}><div className="spinner" /></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td className="font-semibold">{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.phone}</td>
                    <td>
                      <span className="badge" style={{
                        background: `${roleColors[u.role]}15`,
                        color: roleColors[u.role]
                      }}>
                        {u.role?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${u.isActive ? 'badge-approved' : 'badge-cancelled'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      {u.role !== 'owner' && (
                        <div className="flex gap-1">
                          <button
                            className={`btn btn-sm ${u.isActive ? 'btn-ghost text-danger' : 'btn-ghost'}`}
                            onClick={() => toggleUserActive(u._id, u.isActive)}
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showUserModal && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Staff Member</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowUserModal(false)}>
                <HiOutlineX />
              </button>
            </div>
            <form onSubmit={handleSubmitUser}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Staff member name" required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input className="form-input" type="email" value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="email@example.com" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone *</label>
                    <input className="form-input" type="tel" value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      placeholder="9876543210" required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Password *</label>
                    <input className="form-input" type="password" value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      placeholder="Min 6 characters" required minLength={6} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role *</label>
                    <select className="form-select" value={form.role}
                      onChange={e => setForm({ ...form, role: e.target.value })}>
                      <option value="mechanic">Mechanic</option>
                      <option value="service_advisor">Service Advisor</option>
                      <option value="receptionist">Receptionist</option>
                      {hasRole('owner') && <option value="admin">Admin</option>}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowUserModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Staff Member</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
