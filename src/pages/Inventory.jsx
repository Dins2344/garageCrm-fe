import { useState, useEffect } from 'react';
import { getInventoryItems, createInventoryItem, updateInventoryItem, deleteInventoryItem } from '../services/apiServices/inventoryService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineExclamation,
  HiOutlineTemplate
} from 'react-icons/hi';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import { Input, Select } from '../components/Form';
import { Table, Thead, Th, Tbody, Tr, Td } from '../components/Table';
import EmptyState from '../components/EmptyState';
import { ModalOverlay, Modal, ModalHeader, ModalBody, ModalFooter } from '../components/Modal';
import Badge from '../components/Badge';
import Pagination from '../components/Pagination';

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
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const { hasRole } = useAuth();

  const [form, setForm] = useState({
    partName: '', partNumber: '', category: 'other',
    quantity: 0, threshold: 5, unitPrice: 0, sellingPrice: 0,
    supplier: { name: '', phone: '' }, location: ''
  });

  useEffect(() => {
    fetchInventory();
  }, [search, category, pagination.page]);

  const fetchInventory = async () => {
    try {
      const { data, total, pages } = await getInventoryItems({ 
        search, 
        category, 
        page: pagination.page, 
        limit: 15 
      });
      setItems(data);
      setPagination(prev => ({
        ...prev,
        pages: pages || Math.ceil(total / 15) || 1
      }));
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
        await updateInventoryItem(editingItem._id, form);
        toast.success('Item updated!');
      } else {
        await createInventoryItem(form);
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
      await deleteInventoryItem(id);
      toast.success('Item removed');
      fetchInventory();
    } catch (error) {
      toast.error('Failed to remove');
    }
  };

  const lowStockCount = items.filter(i => i.isLowStock).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Inventory">
        {hasRole('owner', 'admin', 'service_advisor') && (
          <Button variant="primary" onClick={openAdd} icon={HiOutlinePlus}>
            Add Item
          </Button>
        )}
      </PageHeader>

      {lowStockCount > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 mb-2 shadow-sm animate-[fadeIn_0.3s_ease]">
          <HiOutlineExclamation className="text-xl" />
          <span className="font-medium">You have {lowStockCount} items low on stock. Please restock soon.</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[250px]">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
          <Input
            type="text"
            placeholder="Search parts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="w-auto min-w-[200px]"
        >
          {CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </Select>
      </div>

      {loading ? (
        <div className="min-h-[300px] flex justify-center items-center">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState 
          icon={HiOutlineTemplate} 
          title="No inventory items found" 
          message="Start adding parts and materials" 
        />
      ) : (
        <Table>
          <Thead>
            <Tr>
              <Th>Part Name</Th>
              <Th>Part #</Th>
              <Th>Category</Th>
              <Th>Stock</Th>
              <Th>Threshold</Th>
              <Th>Cost Price</Th>
              <Th>Selling Price</Th>
              <Th>Location</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {items.map(item => (
              <Tr key={item._id} className={item.isLowStock ? 'bg-red-50/40 hover:bg-red-50/80 transition-colors' : ''}>
                <Td>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{item.partName}</span>
                    {item.isLowStock && (
                      <HiOutlineExclamation className="text-danger shrink-0" title="Low Stock!" />
                    )}
                  </div>
                </Td>
                <Td className="text-gray-500 text-sm tracking-wider">{item.partNumber || '—'}</Td>
                <Td>
                  <Badge intent="new">{item.category?.replace(/_/g, ' ')}</Badge>
                </Td>
                <Td>
                  <span className={`font-bold ${item.isLowStock ? 'text-danger' : 'text-gray-900'}`}>
                    {item.quantity}
                  </span>
                </Td>
                <Td className="text-gray-500">{item.threshold}</Td>
                <Td className="text-gray-700">₹{item.unitPrice?.toLocaleString('en-IN')}</Td>
                <Td className="font-semibold text-gray-900">₹{(item.sellingPrice || item.unitPrice)?.toLocaleString('en-IN')}</Td>
                <Td className="text-gray-500">{item.location || '—'}</Td>
                <Td>
                  <div className="flex gap-2">
                    {hasRole('owner', 'admin', 'service_advisor') && (
                      <Button variant="ghost" size="icon" onClick={() => openEdit(item)} title="Edit">
                        <HiOutlinePencil />
                      </Button>
                    )}
                    {hasRole('owner', 'admin') && (
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item._id)} className="text-danger hover:text-danger hover:bg-danger-light" title="Delete">
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

      {showModal && (
        <ModalOverlay onClose={() => setShowModal(false)}>
          <Modal>
            <form onSubmit={handleSubmit}>
              <ModalHeader 
                title={editingItem ? 'Edit Inventory Item' : 'Add Inventory Item'} 
                onClose={() => setShowModal(false)} 
              />
              <ModalBody>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Part Name *</label>
                    <Input 
                      value={form.partName}
                      onChange={e => setForm({ ...form, partName: e.target.value })}
                      placeholder="Engine Oil 5W-30" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Part Number</label>
                    <Input 
                      value={form.partNumber}
                      onChange={e => setForm({ ...form, partNumber: e.target.value })}
                      placeholder="SKU / Part #" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
                    <Select 
                      value={form.category}
                      onChange={e => setForm({ ...form, category: e.target.value })}
                    >
                      {CATEGORIES.filter(c => c.value).map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Location</label>
                    <Input 
                      value={form.location}
                      onChange={e => setForm({ ...form, location: e.target.value })}
                      placeholder="Rack A, Shelf 3" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Quantity *</label>
                    <Input 
                      type="number" 
                      value={form.quantity}
                      onChange={e => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })}
                      min="0" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Low Stock Threshold</label>
                    <Input 
                      type="number" 
                      value={form.threshold}
                      onChange={e => setForm({ ...form, threshold: parseInt(e.target.value) || 0 })}
                      min="0" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cost Price (₹) *</label>
                    <Input 
                      type="number" 
                      value={form.unitPrice}
                      onChange={e => setForm({ ...form, unitPrice: parseFloat(e.target.value) || 0 })}
                      min="0" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Selling Price (₹)</label>
                    <Input 
                      type="number" 
                      value={form.sellingPrice}
                      onChange={e => setForm({ ...form, sellingPrice: parseFloat(e.target.value) || 0 })}
                      min="0" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Supplier Name</label>
                    <Input 
                      value={form.supplier.name}
                      onChange={e => setForm({ ...form, supplier: { ...form.supplier, name: e.target.value } })}
                      placeholder="Supplier name" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Supplier Phone</label>
                    <Input 
                      value={form.supplier.phone}
                      onChange={e => setForm({ ...form, supplier: { ...form.supplier, phone: e.target.value } })}
                      placeholder="Supplier phone" 
                    />
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  {editingItem ? 'Update Item' : 'Add to Inventory'}
                </Button>
              </ModalFooter>
            </form>
          </Modal>
        </ModalOverlay>
      )}
    </div>
  );
}
