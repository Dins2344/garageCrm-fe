import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { vehicleSchema, type VehicleFormValues, type VehicleFormOutput } from '../utils/validation';
import { DEFAULT_PAGE_SIZE, DROPDOWN_FETCH_LIMIT, FUEL_TYPE_OPTIONS } from '../utils/constants';
import Loader from '../components/Loader';
import { useGlobalLoader } from '../context/GlobalLoaderContext';
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
import type { Vehicle, Customer, FuelType } from '../types/models';

// Shape comes from the zod schema so the form and the validator cannot drift.
const BLANK_FORM: VehicleFormValues = {
  licensePlate: '', make: '', model: '', year: '', color: '',
  fuelType: 'petrol', customer: ''
};

const fuelBadges: Record<string, string> = {
  petrol: 'bg-blue-100 text-blue-700',
  diesel: 'bg-emerald-100 text-emerald-700',
  cng: 'bg-amber-100 text-amber-700',
  electric: 'bg-purple-100 text-purple-700',
  hybrid: 'bg-cyan-100 text-cyan-700'
};

export default function Vehicles() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const { hasRole } = useAuth();
  const { withLoader } = useGlobalLoader();
  const { confirm, ConfirmModal } = useConfirm();

  const {
    register,
    handleSubmit: rhfHandleSubmit,
    reset,
    formState: { errors },
  } = useForm<VehicleFormValues, unknown, VehicleFormOutput>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: BLANK_FORM,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  // Plates are stored upper-case. Uppercasing in the change handler keeps what
  // the user sees and what gets submitted in step.
  const plateField = register('licensePlate');

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
      setLoading(true);
      const { data, total, pages } = await getVehicles({
        search: debouncedSearch,
        page: pagination.page,
        limit: DEFAULT_PAGE_SIZE
      });
      setVehicles(data);
      setPagination(prev => ({
        ...prev,
        pages: pages || Math.ceil(total / DEFAULT_PAGE_SIZE) || 1
      }));
    } catch {
      toast.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data } = await getCustomers({ limit: DROPDOWN_FETCH_LIMIT });
      setCustomers(data);
    } catch {
      toast.error('Failed to load customers');
    }
  };

  const openAdd = () => {
    setEditingVehicle(null);
    reset(BLANK_FORM);
    setShowModal(true);
  };

  const openEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    const customerId = typeof vehicle.customer === 'string' ? vehicle.customer : vehicle.customer?._id;
    reset({
      licensePlate: vehicle.licensePlate,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year ? String(vehicle.year) : '',
      color: vehicle.color || '',
      fuelType: vehicle.fuelType || 'petrol',
      customer: customerId || ''
    });
    setShowModal(true);
  };

  const handleSubmit = rhfHandleSubmit(async (form) => {
    await withLoader(async () => {
      try {
        const data: Partial<Vehicle> & { customer: string } = {
          ...form,
          year: typeof form.year === 'number' ? form.year : undefined,
          fuelType: (form.fuelType || 'petrol') as FuelType,
        };
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
        const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
        toast.error(message || 'Failed to save vehicle');
      }
    });
  });

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete Vehicle?',
      message: 'This will permanently remove the vehicle from the system.',
      confirmLabel: 'Delete',
      intent: 'danger',
    });
    if (!ok) return;
    await withLoader(async () => {
      try {
        await deleteVehicle(id);
        toast.success('Vehicle deleted');
        fetchVehicles();
      } catch {
        toast.error('Failed to delete vehicle');
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 h-full">
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
            placeholder="Search by plate, make, model or customer name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table + Pagination */}
      <div className="flex flex-col flex-1">
        {loading ? (
          <Loader />
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
              {vehicles.map(v => {
                const owner = typeof v.customer === 'string' ? null : v.customer;
                return (
                <Tr key={v._id} className=" hover:bg-blue-50/40 transition-colors" onClick={() => navigate(`/vehicles/${v._id}`)}>
                  <Td>
                    <span className="font-bold bg-bone-200 px-2.5 py-1 rounded-md tracking-wider text-sm text-gray-800">
                      {v.licensePlate}
                    </span>
                  </Td>
                  <Td className="font-semibold text-gray-900">{v.make}</Td>
                  <Td className="text-gray-700">{v.model}</Td>
                  <Td className="text-gray-700">{v.year || '—'}</Td>
                  <Td>
                    <Badge className={fuelBadges[v.fuelType || ''] || 'bg-bone-200 text-gray-600'}>
                      {v.fuelType}
                    </Badge>
                  </Td>
                  <Td className="text-gray-700">{v.color || '—'}</Td>
                  <Td className="text-gray-900 font-medium">{owner?.name || '—'}</Td>
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
                );
              })}
            </Tbody>
          </Table>
        )}

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
                title={editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
                onClose={() => setShowModal(false)}
              />
              <ModalBody>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Customer Owner *</label>
                  <Select
                    {...register('customer')}
                    error={!!errors.customer}
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
                      {...plateField}
                      onChange={e => {
                        e.target.value = e.target.value.toUpperCase();
                        return plateField.onChange(e);
                      }}
                      placeholder="KA01AB1234"
                      error={!!errors.licensePlate}
                      aria-invalid={!!errors.licensePlate}
                      className="uppercase"
                    />
                    {errors.licensePlate && (
                      <p role="alert" className="text-danger text-[13px] mt-1">{errors.licensePlate.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fuel Type</label>
                    <Select
                      {...register('fuelType')}
                    >
                      {FUEL_TYPE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Make *</label>
                    <Input
                      {...register('make')}
                      placeholder="Maruti, Honda, Hyundai..."
                      error={!!errors.make}
                      aria-invalid={!!errors.make}
                    />
                    {errors.make && (
                      <p role="alert" className="text-danger text-[13px] mt-1">{errors.make.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Model *</label>
                    <Input
                      {...register('model')}
                      placeholder="Swift, City, Creta..."
                      error={!!errors.model}
                      aria-invalid={!!errors.model}
                    />
                    {errors.model && (
                      <p role="alert" className="text-danger text-[13px] mt-1">{errors.model.message}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Year</label>
                    <Input
                      type="number"
                      {...register('year')}
                      placeholder="2024"
                      error={!!errors.year}
                      aria-invalid={!!errors.year}
                    />
                    {errors.year && (
                      <p role="alert" className="text-danger text-[13px] mt-1">{errors.year.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Color</label>
                    <Input
                      {...register('color')}
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
