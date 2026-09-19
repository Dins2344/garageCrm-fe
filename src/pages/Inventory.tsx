import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { inventorySchema, type InventoryFormValues, type InventoryFormOutput } from '../utils/validation';
import { useGarage } from '../context/GarageContext';
import { formatMoney } from '../utils/format';
import { DEFAULT_PAGE_SIZE } from '../utils/constants';
import Loader from '../components/Loader';
import { useGlobalLoader } from '../context/GlobalLoaderContext';
import { useDebounce } from '../hooks/useDebounce';
import { useConfirm } from '../components/ConfirmModal';
import { getInventoryItems, createInventoryItem, updateInventoryItem, deleteInventoryItem } from '../services/apiServices/inventoryService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  TriangleAlert,
  LayoutTemplate
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import { Input, Select } from '../components/Form';
import { Table, Thead, Th, Tbody, Tr, Td } from '../components/Table';
import EmptyState from '../components/EmptyState';
import { ModalOverlay, Modal, ModalHeader, ModalBody, ModalFooter } from '../components/Modal';
import Badge from '../components/Badge';
import Pagination from '../components/Pagination';
import type { InventoryItem, InventoryCategory } from '../types/models';

const CATEGORIES: { value: string; label: string }[] = [
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

// Shape comes from the zod schema so the form and the validator cannot drift.
const BLANK_FORM: InventoryFormValues = {
  partName: '', partNumber: '', category: 'other',
  quantity: 0, threshold: 5, unitPrice: 0, sellingPrice: 0,
  supplier: { name: '', phone: '' }, location: ''
};

export default function Inventory() {
  const { locale } = useGarage();
  const money = (n?: number) => formatMoney(n, locale);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [category, setCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const { hasRole } = useAuth();
  const { withLoader } = useGlobalLoader();
  const { confirm, ConfirmModal } = useConfirm();

  const {
    register,
    handleSubmit: rhfHandleSubmit,
    reset,
    formState: { errors },
  } = useForm<InventoryFormValues, unknown, InventoryFormOutput>({
    resolver: zodResolver(inventorySchema),
    defaultValues: BLANK_FORM,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  // Reset to page 1 whenever the user changes the search term
  useEffect(() => {
    setPagination(p => ({ ...p, page: 1 }));
  }, [search]);

  useEffect(() => {
    fetchInventory();
  }, [debouncedSearch, category, pagination.page]);

  const fetchInventory = async () => {
    try {
      const { data, total, pages } = await getInventoryItems({
        search: debouncedSearch,
        category,
        page: pagination.page,
        limit: DEFAULT_PAGE_SIZE
      });
      setItems(data);
      setPagination(prev => ({
        ...prev,
        pages: pages || Math.ceil(total / DEFAULT_PAGE_SIZE) || 1
      }));
    } catch {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditingItem(null);
    reset(BLANK_FORM);
    setShowModal(true);
  };

  const openEdit = (item: InventoryItem) => {
    setEditingItem(item);
    reset({
      partName: item.partName,
      partNumber: item.partNumber || '',
      category: item.category,
      quantity: item.quantity,
      threshold: item.threshold,
      unitPrice: item.unitPrice,
      sellingPrice: item.sellingPrice || 0,
      supplier: { name: item.supplier?.name || '', phone: item.supplier?.phone || '' },
      location: item.location || ''
    });
    setShowModal(true);
  };

  const handleSubmit = rhfHandleSubmit(async (values) => {
    const form = { ...values, category: values.category as InventoryCategory };
    await withLoader(async () => {
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
        const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
        toast.error(message || 'Failed to save');
      }
    });
  });

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Remove Inventory Item?',
      message: 'This item will be permanently removed from inventory.',
      confirmLabel: 'Remove',
      intent: 'danger',
    });
    if (!ok) return;
    await withLoader(async () => {
      try {
        await deleteInventoryItem(id);
        toast.success('Item removed');
        fetchInventory();
      } catch {
        toast.error('Failed to remove');
      }
    });
  };

  const lowStockCount = items.filter(i => i.isLowStock).length;

  return (
    <div className="flex flex-col gap-6 h-full">
      <PageHeader title="Inventory">
        {hasRole('owner', 'admin', 'service_advisor') && (
          <Button variant="primary" onClick={openAdd} icon={Plus}>
            Add Item
          </Button>
        )}
      </PageHeader>

      {lowStockCount > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 mb-2 shadow-sm animate-[fadeIn_0.3s_ease]">
          <TriangleAlert className="w-5 h-5" />
          <span className="font-medium">You have {lowStockCount} items low on stock. Please restock soon.</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-[18px] h-[18px]" />
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

      {/* Table + Pagination */}
      <div className="flex flex-col flex-1">
      {loading ? <Loader /> : items.length === 0 ? (
        <EmptyState
          icon={LayoutTemplate}
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
                      <TriangleAlert className="w-[1em] h-[1em] text-danger shrink-0" aria-label="Low stock" />
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
                <Td className="text-gray-700">{money(item.unitPrice)}</Td>
                <Td className="font-semibold text-gray-900">{money(item.sellingPrice || item.unitPrice)}</Td>
                <Td className="text-gray-500">{item.location || '—'}</Td>
                <Td>
                  <div className="flex gap-2">
                    {hasRole('owner', 'admin', 'service_advisor') && (
                      <Button variant="ghost" size="icon" onClick={() => openEdit(item)} title="Edit">
                        <Pencil className="w-[1em] h-[1em]" />
                      </Button>
                    )}
                    {hasRole('owner', 'admin') && (
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item._id)} className="text-danger hover:text-danger hover:bg-danger-light" title="Delete">
                        <Trash2 className="w-[1em] h-[1em]" />
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

      {showModal && (
        <ModalOverlay onClose={() => setShowModal(false)}>
          <Modal>
            <form onSubmit={handleSubmit} noValidate>
              <ModalHeader
                title={editingItem ? 'Edit Inventory Item' : 'Add Inventory Item'}
                onClose={() => setShowModal(false)}
              />
              <ModalBody>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Part Name *</label>
                    <Input
                      {...register('partName')}
                      placeholder="Engine Oil 5W-30"
                      error={!!errors.partName}
                      aria-invalid={!!errors.partName}
                    />
                    {errors.partName && (
                      <p role="alert" className="text-danger text-[13px] mt-1">{errors.partName.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Part Number</label>
                    <Input
                      {...register('partNumber')}
                      placeholder="SKU / Part #"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
                    <Select
                      {...register('category')}
                    >
                      {CATEGORIES.filter(c => c.value).map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Location</label>
                    <Input
                      {...register('location')}
                      placeholder="Rack A, Shelf 3"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Quantity *</label>
                    <Input
                      type="number"
                      {...register('quantity')}
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Low Stock Threshold</label>
                    <Input
                      type="number"
                      {...register('threshold')}
                      min="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cost Price ({locale.currency}) *</label>
                    <Input
                      type="number"
                      {...register('unitPrice')}
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Selling Price ({locale.currency})</label>
                    <Input
                      type="number"
                      {...register('sellingPrice')}
                      min="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Supplier Name</label>
                    <Input
                      {...register('supplier.name')}
                      placeholder="Supplier name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Supplier Phone</label>
                    <Input
                      {...register('supplier.phone')}
                      error={!!errors.supplier?.phone}
                      aria-invalid={!!errors.supplier?.phone}
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
      <ConfirmModal />
    </div>
  );
}
