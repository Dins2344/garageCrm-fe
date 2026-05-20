import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../hooks/useDebounce';
import { getVehicles, createVehicle, updateVehicle, deleteVehicle } from '../services/apiServices/vehicleService';
import { getCustomers } from '../services/apiServices/customerService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineTruck,
  HiOutlineEye
} from 'react-icons/hi';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import { Input, Select } from '../components/Form';
import { Table, Thead, Th, Tbody, Tr, Td } from '../components/Table';
import EmptyState from '../components/EmptyState';
import { ModalOverlay, Modal, ModalHeader, ModalBody, ModalFooter } from '../components/Modal';
import Badge from '../components/Badge';
import Pagination from '../components/Pagination';
import { useConfirm } from '../components/ConfirmModal';

export default function Vehicles() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const { hasRole } = useAuth();
  const { confirm, ConfirmModal } = useConfirm();

  const [form, setForm] = useState({
    licensePlate: '', make: '', model: '', year: '', color: '',
    fuelType: 'petrol', customer: ''
  });

  // Reset to page 1 whenever the user changes the search term
  useEffect(() => {
    setPagination(p => ({ ...p, page: 1 }));
  }, [search]);

  useEffect(() => {
    fetchVehicles();
    fetchCustomers();
  }, [debouncedSearch, pagination.page]);

  const fetchVehicles = async () => {
    try {
      const { data, total, pages } = await getVehicles({
        search: debouncedSearch,
        page: pagination.page,
        limit: 15
      });
      setVehicles(data);
      setPagination(prev => ({
        ...prev,
        pages: pages || Math.ceil(total / 15) || 1
      }));
    } catch (error) {
      toast.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data } = await getCustomers({ limit: 200 });
      setCustomers(data);
    } catch (e) {
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
        await updateVehicle(editingVehicle._id, data);
        toast.success('Vehicle updated!');
      } else {
        await createVehicle(data);
        toast.success('Vehicle added!');
      }
      setShowModal(false);
      fetchVehicles();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save vehicle');
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Delete Vehicle?',
      message: 'This will permanently remove the vehicle from the system.',
      confirmLabel: 'Delete',
      intent: 'danger',
    });
    if (!ok) return;
    try {
      await deleteVehicle(id);
      toast.success('Vehicle deleted');
      fetchVehicles();
    } catch (error) {
      toast.error('Failed to delete vehicle');
    }
  };

  const fuelBadges = {
    petrol: 'bg-blue-100 text-blue-700',
    diesel: 'bg-emerald-100 text-emerald-700',
    cng: 'bg-amber-100 text-amber-700',
    electric: 'bg-purple-100 text-purple-700',
    hybrid: 'bg-cyan-100 text-cyan-700'
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Vehicles">
        {hasRole('owner', 'admin', 'service_advisor', 'receptionist') && (
          <Button variant="primary" onClick={openAdd} icon={HiOutlinePlus}>
            Add Vehicle
          </Button>
        )}
      </PageHeader>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[250px]">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
          <Input
            type="text"
            placeholder="Search by plate number, make, or model..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="min-h-[300px] flex justify-center items-center">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : vehicles.length === 0 ? (
        <EmptyState
          icon={HiOutlineTruck}
          title="No vehicles found"
          message="Add your first vehicle to start tracking"
        />
      ) : (
        <Table>
          <Thead>
            <Tr>
              <Th>License Plate</Th>
              <Th>Make</Th>
              <Th>Model</Th>
              <Th>Year</Th>
              <Th>Fuel</Th>
              <Th>Color</Th>
              <Th>Owner</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {vehicles.map(v => (
              <Tr key={v._id} className=" hover:bg-blue-50/40 transition-colors" onClick={() => navigate(`/vehicles/${v._id}`)}>
                <Td>
                  <span className="font-bold bg-gray-100 px-2.5 py-1 rounded-md tracking-wider text-sm text-gray-800">
                    {v.licensePlate}
                  </span>
                </Td>
                <Td className="font-semibold text-gray-900">{v.make}</Td>
                <Td className="text-gray-700">{v.model}</Td>
                <Td className="text-gray-700">{v.year || '—'}</Td>
                <Td>
                  <Badge className={fuelBadges[v.fuelType] || 'bg-gray-100 text-gray-600'}>
                    {v.fuelType}
                  </Badge>
                </Td>
                <Td className="text-gray-700">{v.color || '—'}</Td>
                <Td className="text-gray-900 font-medium">{v.customer?.name || '—'}</Td>
                <Td>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); navigate(`/vehicles/${v._id}`); }} title="View History" className="cursor-pointer text-primary-500 hover:text-primary-600 hover:bg-primary-50">
                      <HiOutlineEye />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEdit(v); }} title="Edit" className="cursor-pointer">
                      <HiOutlinePencil />
                    </Button>
                    {hasRole('owner', 'admin') && (
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDelete(v._id); }} className="cursor-pointer text-danger hover:text-danger hover:bg-danger-light" title="Delete">
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
                title={editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
                onClose={() => setShowModal(false)}
              />
              <ModalBody>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Customer Owner *</label>
                  <Select
                    value={form.customer}
                    onChange={e => setForm({ ...form, customer: e.target.value })}
                    required
                  >
                    <option value="">Select customer...</option>
                    {customers.map(c => (
                      <option key={c._id} value={c._id}>{c.name} ({c.phone})</option>
                    ))}
                  </Select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">License Plate *</label>
                    <Input
                      value={form.licensePlate}
                      onChange={e => setForm({ ...form, licensePlate: e.target.value.toUpperCase() })}
                      placeholder="KA01AB1234"
                      required
                      className="uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fuel Type</label>
                    <Select
                      value={form.fuelType}
                      onChange={e => setForm({ ...form, fuelType: e.target.value })}
                    >
                      <option value="petrol">Petrol</option>
                      <option value="diesel">Diesel</option>
                      <option value="cng">CNG</option>
                      <option value="electric">Electric</option>
                      <option value="hybrid">Hybrid</option>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Make *</label>
                    <Input
                      value={form.make}
                      onChange={e => setForm({ ...form, make: e.target.value })}
                      placeholder="Maruti, Honda, Hyundai..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Model *</label>
                    <Input
                      value={form.model}
                      onChange={e => setForm({ ...form, model: e.target.value })}
                      placeholder="Swift, City, Creta..."
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Year</label>
                    <Input
                      type="number"
                      value={form.year}
                      onChange={e => setForm({ ...form, year: e.target.value })}
                      placeholder="2024"
                      min="1990"
                      max="2030"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Color</label>
                    <Input
                      value={form.color}
                      onChange={e => setForm({ ...form, color: e.target.value })}
                      placeholder="White, Silver, Black..."
                    />
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  {editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
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
