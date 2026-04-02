import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineX
} from 'react-icons/hi';

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const { hasRole } = useAuth();

  const [form, setForm] = useState({
    licensePlate: '', make: '', model: '', year: '', color: '',
    fuelType: 'petrol', customer: ''
  });

  useEffect(() => {
    fetchVehicles();
    fetchCustomers();
  }, [search]);

  const fetchVehicles = async () => {
    try {
      const res = await api.get('/vehicles', { params: { search, limit: 50 } });
      setVehicles(res.data.data);
    } catch (error) {
      toast.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers', { params: { limit: 200 } });
      setCustomers(res.data.data);
    } catch (error) {
      console.error('Failed to load customers');
    }
  };

  const openAdd = () => {
    setEditingVehicle(null);
    setForm({ licensePlate: '', make: '', model: '', year: '', color: '', fuelType: 'petrol', customer: '' });
    setShowModal(true);
  };

  const openEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setForm({
      licensePlate: vehicle.licensePlate,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year || '',
      color: vehicle.color || '',
      fuelType: vehicle.fuelType || 'petrol',
      customer: vehicle.customer?._id || vehicle.customer
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...form };
      if (data.year) data.year = parseInt(data.year);

      if (editingVehicle) {
        await api.put(`/vehicles/${editingVehicle._id}`, data);
        toast.success('Vehicle updated!');
      } else {
        await api.post('/vehicles', data);
        toast.success('Vehicle added!');
      }
      setShowModal(false);
      fetchVehicles();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save vehicle');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      await api.delete(`/vehicles/${id}`);
      toast.success('Vehicle deleted');
      fetchVehicles();
    } catch (error) {
      toast.error('Failed to delete vehicle');
    }
  };

  const fuelColors = {
    petrol: '#3b82f6',
    diesel: '#10b981',
    cng: '#f59e0b',
    electric: '#7c3aed',
    hybrid: '#06b6d4'
  };

  return (
    <div>
      <div className="page-header">
        <h1>Vehicles</h1>
        {hasRole('owner', 'admin', 'service_advisor', 'receptionist') && (
          <button className="btn btn-primary" onClick={openAdd} id="add-vehicle-btn">
            <HiOutlinePlus /> Add Vehicle
          </button>
        )}
      </div>

      <div className="search-filter-bar">
        <div className="search-input-wrapper">
          <HiOutlineSearch />
          <input
            className="form-input"
            type="text"
            placeholder="Search by plate number, make, or model..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-screen"><div className="spinner" /></div>
      ) : vehicles.length === 0 ? (
        <div className="empty-state">
          <h3>No vehicles found</h3>
          <p>Add your first vehicle to start tracking</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>License Plate</th>
                <th>Make</th>
                <th>Model</th>
                <th>Year</th>
                <th>Fuel</th>
                <th>Color</th>
                <th>Owner</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map(v => (
                <tr key={v._id}>
                  <td>
                    <span className="font-bold" style={{
                      backgroundColor: 'var(--gray-100)',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      letterSpacing: '0.05em',
                      fontSize: '0.875rem'
                    }}>
                      {v.licensePlate}
                    </span>
                  </td>
                  <td className="font-semibold">{v.make}</td>
                  <td>{v.model}</td>
                  <td>{v.year || '—'}</td>
                  <td>
                    <span className="badge" style={{
                      background: `${fuelColors[v.fuelType] || '#64748b'}20`,
                      color: fuelColors[v.fuelType] || '#64748b'
                    }}>
                      {v.fuelType}
                    </span>
                  </td>
                  <td>{v.color || '—'}</td>
                  <td>{v.customer?.name || '—'}</td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(v)}>
                        <HiOutlinePencil />
                      </button>
                      {hasRole('owner', 'admin') && (
                        <button className="btn btn-ghost btn-sm text-danger" onClick={() => handleDelete(v._id)}>
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>
                <HiOutlineX />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Customer Owner *</label>
                  <select
                    className="form-select"
                    value={form.customer}
                    onChange={e => setForm({ ...form, customer: e.target.value })}
                    required
                  >
                    <option value="">Select customer...</option>
                    {customers.map(c => (
                      <option key={c._id} value={c._id}>{c.name} ({c.phone})</option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">License Plate *</label>
                    <input
                      className="form-input"
                      value={form.licensePlate}
                      onChange={e => setForm({ ...form, licensePlate: e.target.value.toUpperCase() })}
                      placeholder="KA01AB1234"
                      required
                      style={{ textTransform: 'uppercase' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fuel Type</label>
                    <select
                      className="form-select"
                      value={form.fuelType}
                      onChange={e => setForm({ ...form, fuelType: e.target.value })}
                    >
                      <option value="petrol">Petrol</option>
                      <option value="diesel">Diesel</option>
                      <option value="cng">CNG</option>
                      <option value="electric">Electric</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Make *</label>
                    <input
                      className="form-input"
                      value={form.make}
                      onChange={e => setForm({ ...form, make: e.target.value })}
                      placeholder="Maruti, Honda, Hyundai..."
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Model *</label>
                    <input
                      className="form-input"
                      value={form.model}
                      onChange={e => setForm({ ...form, model: e.target.value })}
                      placeholder="Swift, City, Creta..."
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Year</label>
                    <input
                      className="form-input"
                      type="number"
                      value={form.year}
                      onChange={e => setForm({ ...form, year: e.target.value })}
                      placeholder="2024"
                      min="1990"
                      max="2030"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Color</label>
                    <input
                      className="form-input"
                      value={form.color}
                      onChange={e => setForm({ ...form, color: e.target.value })}
                      placeholder="White, Silver, Black..."
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
