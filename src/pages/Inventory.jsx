import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineExclamation,
  HiOutlineX
} from 'react-icons/hi';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'engine_oil', label: 'Engine Oil' },
  { value: 'filters', label: 'Filters' },
  { value: 'brakes', label: 'Brakes' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'suspension', label: 'Suspension' },
  { value: 'body_parts', label: 'Body Parts' },
  { value: 'tyres', label: 'Tyres' },
  { value: 'battery', label: 'Battery' },
  { value: 'coolant', label: 'Coolant' },
  { value: 'transmission', label: 'Transmission' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'other', label: 'Other' }
];

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const { hasRole } = useAuth();

  const [form, setForm] = useState({
    partName: '', partNumber: '', category: 'other',
    quantity: 0, threshold: 5, unitPrice: 0, sellingPrice: 0,
    supplier: { name: '', phone: '' }, location: ''
  });

  useEffect(() => {
    fetchInventory();
  }, [search, category]);

  const fetchInventory = async () => {
    try {
      const res = await api.get('/inventory', { params: { search, category, limit: 100 } });
      setItems(res.data.data);
    } catch (error) {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditingItem(null);
    setForm({
      partName: '', partNumber: '', category: 'other',
      quantity: 0, threshold: 5, unitPrice: 0, sellingPrice: 0,
      supplier: { name: '', phone: '' }, location: ''
    });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setForm({
      partName: item.partName,
      partNumber: item.partNumber || '',
      category: item.category,
      quantity: item.quantity,
      threshold: item.threshold,
      unitPrice: item.unitPrice,
      sellingPrice: item.sellingPrice || 0,
      supplier: item.supplier || { name: '', phone: '' },
      location: item.location || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/inventory/${editingItem._id}`, form);
        toast.success('Item updated!');
      } else {
        await api.post('/inventory', form);
        toast.success('Item added to inventory!');
      }
      setShowModal(false);
      fetchInventory();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this item from inventory?')) return;
    try {
      await api.delete(`/inventory/${id}`);
      toast.success('Item removed');
      fetchInventory();
    } catch (error) {
      toast.error('Failed to remove');
    }
  };

  const lowStockCount = items.filter(i => i.isLowStock).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Inventory</h1>
          {lowStockCount > 0 && (
            <span className="badge badge-cancelled" style={{ marginLeft: '12px' }}>
              <HiOutlineExclamation /> {lowStockCount} low stock
            </span>
          )}
        </div>
        {hasRole('owner', 'admin', 'service_advisor') && (
          <button className="btn btn-primary" onClick={openAdd} id="add-inventory-btn">
            <HiOutlinePlus /> Add Item
          </button>
        )}
      </div>

      <div className="search-filter-bar">
        <div className="search-input-wrapper">
          <HiOutlineSearch />
          <input
            className="form-input"
            type="text"
            placeholder="Search parts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-select"
          value={category}
          onChange={e => setCategory(e.target.value)}
          style={{ width: 'auto', minWidth: '180px' }}
        >
          {CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading-screen"><div className="spinner" /></div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <h3>No inventory items found</h3>
          <p>Start adding parts and materials</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Part Name</th>
                <th>Part #</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Threshold</th>
                <th>Cost Price</th>
                <th>Selling Price</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item._id} style={item.isLowStock ? { background: 'rgba(239, 68, 68, 0.03)' } : {}}>
                  <td>
                    <span className="font-semibold">{item.partName}</span>
                    {item.isLowStock && (
                      <HiOutlineExclamation style={{ color: 'var(--danger)', marginLeft: '6px', verticalAlign: 'middle' }} />
                    )}
                  </td>
                  <td className="text-muted">{item.partNumber || '—'}</td>
                  <td>
                    <span className="badge badge-new">{item.category?.replace(/_/g, ' ')}</span>
                  </td>
                  <td>
                    <span className={`font-bold ${item.isLowStock ? 'text-danger' : ''}`}>
                      {item.quantity}
                    </span>
                  </td>
                  <td className="text-muted">{item.threshold}</td>
                  <td>₹{item.unitPrice?.toLocaleString('en-IN')}</td>
                  <td className="font-semibold">₹{(item.sellingPrice || item.unitPrice)?.toLocaleString('en-IN')}</td>
                  <td className="text-muted">{item.location || '—'}</td>
                  <td>
                    <div className="flex gap-1">
                      {hasRole('owner', 'admin', 'service_advisor') && (
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(item)}>
                          <HiOutlinePencil />
                        </button>
                      )}
                      {hasRole('owner', 'admin') && (
                        <button className="btn btn-ghost btn-sm text-danger" onClick={() => handleDelete(item._id)}>
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingItem ? 'Edit Inventory Item' : 'Add Inventory Item'}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>
                <HiOutlineX />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Part Name *</label>
                    <input className="form-input" value={form.partName}
                      onChange={e => setForm({ ...form, partName: e.target.value })}
                      placeholder="Engine Oil 5W-30" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Part Number</label>
                    <input className="form-input" value={form.partNumber}
                      onChange={e => setForm({ ...form, partNumber: e.target.value })}
                      placeholder="SKU / Part #" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-select" value={form.category}
                      onChange={e => setForm({ ...form, category: e.target.value })}>
                      {CATEGORIES.filter(c => c.value).map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input className="form-input" value={form.location}
                      onChange={e => setForm({ ...form, location: e.target.value })}
                      placeholder="Rack A, Shelf 3" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Quantity *</label>
                    <input className="form-input" type="number" value={form.quantity}
                      onChange={e => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })}
                      min="0" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Low Stock Threshold</label>
                    <input className="form-input" type="number" value={form.threshold}
                      onChange={e => setForm({ ...form, threshold: parseInt(e.target.value) || 0 })}
                      min="0" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Cost Price (₹) *</label>
                    <input className="form-input" type="number" value={form.unitPrice}
                      onChange={e => setForm({ ...form, unitPrice: parseFloat(e.target.value) || 0 })}
                      min="0" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Selling Price (₹)</label>
                    <input className="form-input" type="number" value={form.sellingPrice}
                      onChange={e => setForm({ ...form, sellingPrice: parseFloat(e.target.value) || 0 })}
                      min="0" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Supplier Name</label>
                    <input className="form-input" value={form.supplier.name}
                      onChange={e => setForm({ ...form, supplier: { ...form.supplier, name: e.target.value } })}
                      placeholder="Supplier name" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Supplier Phone</label>
                    <input className="form-input" value={form.supplier.phone}
                      onChange={e => setForm({ ...form, supplier: { ...form.supplier, phone: e.target.value } })}
                      placeholder="Supplier phone" />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editingItem ? 'Update Item' : 'Add to Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
