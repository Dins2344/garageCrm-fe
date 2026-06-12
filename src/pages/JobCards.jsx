import { useState, useEffect, useMemo } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { Link, useNavigate } from 'react-router-dom';
import { getJobCards, createJobCard } from '../services/apiServices/jobCardService';
import { getCustomers, createCustomer } from '../services/apiServices/customerService';
import { getVehicles, createVehicle } from '../services/apiServices/vehicleService';
import { getMechanics, getAdvisors } from '../services/apiServices/userService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlineEye,
  HiOutlineX,
  HiOutlineUser,
  HiOutlineTruck,
  HiOutlineChevronRight,
  HiOutlineChevronLeft,
  HiOutlineCheck,
  HiOutlineClipboardList
} from 'react-icons/hi';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import { Input, Select } from '../components/Form';
import { Table, Thead, Th, Tbody, Tr, Td } from '../components/Table';
import EmptyState from '../components/EmptyState';
import { ModalOverlay, Modal, ModalHeader, ModalBody, ModalFooter } from '../components/Modal';
import Badge from '../components/Badge';
import Pagination from '../components/Pagination';
import {
  JOB_STATUS_OPTIONS,
  FUEL_TYPES,
  DEFAULT_PAGE_SIZE,
  DROPDOWN_FETCH_LIMIT,
  LOCALE,
  DATE_FORMAT_OPTIONS
} from '../utils/constants';
import Loader from '../components/Loader';
import { useGlobalLoader } from '../context/GlobalLoaderContext';



export default function JobCards() {
  const [jobCards, setJobCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [showModal, setShowModal] = useState(false);
  const { user, hasRole } = useAuth();
  const { withLoader } = useGlobalLoader();
  const navigate = useNavigate();

  // ---- Stepper State ----
  const [step, setStep] = useState(1);

  // Step-1 shared data sources
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [advisors, setAdvisors] = useState([]);

  // Step-1: Customer
  const [customerMode, setCustomerMode] = useState('existing'); // 'existing' | 'new'
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [newCustomer, setNewCustomer] = useState({
    name: '', phone: '', email: '',
    address: { city: '', pincode: '' }
  });

  // Step-1: Vehicle
  const [vehicleMode, setVehicleMode] = useState('existing'); // 'existing' | 'new'
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [newVehicle, setNewVehicle] = useState({
    licensePlate: '', make: '', model: '',
    year: '', color: '', fuelType: 'petrol'
  });

  // Step-2: Work details
  const [workForm, setWorkForm] = useState({
    serviceType: 'service',
    assignedMechanic: '',
    odometerAtIntake: '',
    expectedDeliveryDate: '',
    internalNotes: '',
    complaints: [{ description: '', priority: 'medium' }]
  });

  // ---- Data Fetching ----
  // Reset to page 1 whenever the user changes the search term
  useEffect(() => {
    setPagination(p => ({ ...p, page: 1 }));
  }, [search]);

  useEffect(() => {
    fetchJobCards();
  }, [statusFilter, debouncedSearch, pagination.page]);

  useEffect(() => {
    if (showModal) {
      fetchCustomers();
      fetchVehicles();
      fetchMechanics();
    }
  }, [showModal]);

  const fetchJobCards = async () => {
    try {
      setLoading(true);
      const { data, total, pages } = await getJobCards({
        status: statusFilter,
        search: debouncedSearch,
        page: pagination.page,
        limit: DEFAULT_PAGE_SIZE
      });
      setJobCards(data);
      setPagination(prev => ({
        ...prev,
        pages: pages || Math.ceil(total / DEFAULT_PAGE_SIZE) || 1
      }));
    } catch (error) {
      toast.error('Failed to load job cards');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data } = await getCustomers({ limit: DROPDOWN_FETCH_LIMIT });
      setCustomers(data);
    } catch (e) { /* ignore */ }
  };

  const fetchVehicles = async () => {
    try {
      const { data } = await getVehicles({ limit: DROPDOWN_FETCH_LIMIT });
      setVehicles(data);
    } catch (e) { /* ignore */ }
  };

  const fetchMechanics = async () => {
    try {
      const mData = await getMechanics();
      const aData = await getAdvisors();
      setMechanics(mData);
      setAdvisors(aData);
    } catch (e) { /* ignore */ }
  };

  // ---- Filtered Lists ----
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const s = customerSearch.toLowerCase();
    return customers.filter(c =>
      c.name?.toLowerCase().includes(s) || c.phone?.includes(s)
    );
  }, [customers, customerSearch]);

  const filteredVehicles = useMemo(() => {
    let pool = vehicles;
    // If customer selected, prefer showing their vehicles
    if (selectedCustomer) {
      pool = vehicles.filter(v => {
        const custId = v.customer?._id || v.customer;
        return custId === selectedCustomer._id;
      });
    }
    if (!vehicleSearch.trim()) return pool;
    const s = vehicleSearch.toLowerCase();
    return pool.filter(v =>
      v.licensePlate?.toLowerCase().includes(s) ||
      v.make?.toLowerCase().includes(s) ||
      v.model?.toLowerCase().includes(s)
    );
  }, [vehicles, vehicleSearch, selectedCustomer]);

  // ---- Complaint handlers ----
  const addComplaint = () => {
    setWorkForm(prev => ({
      ...prev,
      complaints: [...prev.complaints, { description: '', priority: 'medium' }]
    }));
  };

  const removeComplaint = (index) => {
    setWorkForm(prev => ({
      ...prev,
      complaints: prev.complaints.filter((_, i) => i !== index)
    }));
  };

  const updateComplaint = (index, field, value) => {
    setWorkForm(prev => {
      const updated = [...prev.complaints];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, complaints: updated };
    });
  };

  // ---- Open Modal ----
  const openModal = () => {
    setStep(1);
    setCustomerMode('existing');
    setSelectedCustomer(null);
    setCustomerSearch('');
    setNewCustomer({ name: '', phone: '', email: '', address: { city: '', pincode: '' } });
    setVehicleMode('existing');
    setSelectedVehicle(null);
    setVehicleSearch('');
    if (vehicleMode === 'new') setNewVehicle({ licensePlate: '', make: '', model: '', year: '', color: '', fuelType: 'petrol' });
    setWorkForm({
      serviceType: 'service', assignedMechanic: '', odometerAtIntake: '', expectedDeliveryDate: '',
      internalNotes: '', complaints: [{ description: '', priority: 'medium' }],
      assignedAdvisor: user?.role === 'service_advisor' ? user._id : ''
    });
    setShowModal(true);
  };

  // ---- Step Validation ----
  const canProceedStep1 = () => {
    const hasCustomer = customerMode === 'existing'
      ? !!selectedCustomer
      : newCustomer.name.trim() && newCustomer.phone.trim();
    const hasVehicle = vehicleMode === 'existing'
      ? !!selectedVehicle
      : newVehicle.licensePlate.trim() && newVehicle.make.trim() && newVehicle.model.trim();
    return hasCustomer && hasVehicle;
  };

  // ---- Final Submission ----
  const handleSubmit = async () => {
    await withLoader(async () => {
      try {
        // 1. Resolve customer
        let customerId;
        if (customerMode === 'existing') {
          customerId = selectedCustomer._id;
        } else {
          const { data } = await createCustomer(newCustomer);
          customerId = data._id;
          toast.success(`Customer "${newCustomer.name}" added`);
        }

        // 2. Resolve vehicle
        let vehicleId;
        if (vehicleMode === 'existing') {
          vehicleId = selectedVehicle._id;
        } else {
          const vData = { ...newVehicle, customer: customerId };
          if (vData.year) vData.year = parseInt(vData.year);
          const { data } = await createVehicle(vData);
          vehicleId = data._id;
          toast.success(`Vehicle "${newVehicle.licensePlate}" added`);
        }

        // 3. Create Job Card
        const jobCardData = {
          serviceType: workForm.serviceType,
          vehicle: vehicleId,
          customer: customerId,
          assignedMechanic: workForm.assignedMechanic || undefined,
          assignedAdvisor: workForm.assignedAdvisor || undefined,
          odometerAtIntake: workForm.odometerAtIntake ? parseInt(workForm.odometerAtIntake) : 0,
          expectedDeliveryDate: workForm.expectedDeliveryDate || undefined,
          internalNotes: workForm.internalNotes,
          complaints: workForm.complaints.filter(c => c.description.trim())
        };

        const { data } = await createJobCard(jobCardData);
        toast.success(`Job Card ${data.jobCardNumber} created!`);
        setShowModal(false);
        fetchJobCards();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to create job card');
      }
    });
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString(LOCALE, DATE_FORMAT_OPTIONS);
  };

  // ============ RENDER ============
  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Page Header */}
      <PageHeader title="Job Cards">
        {hasRole('owner', 'admin', 'service_advisor') && (
          <Button variant="primary" onClick={openModal} icon={HiOutlinePlus}>
            New Job Card
          </Button>
        )}
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[250px]">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
          <Input
            type="text"
            placeholder="Search by job card number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="w-auto min-w-[180px]"
        >
          {JOB_STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </Select>
      </div>

      {/* Table + Pagination */}
      <div className="flex flex-col flex-1">
      {loading ? <Loader /> : jobCards.length === 0 ? (
        <EmptyState
          icon={HiOutlineClipboardList}
          title="No job cards found"
          message={statusFilter ? 'Try a different filter' : 'Create your first job card to get started'}
        />
      ) : (
        <Table>
          <Thead>
            <Tr>
              <Th>Job Card #</Th>
              <Th>Vehicle</Th>
              <Th>Customer</Th>
              <Th>Mechanic</Th>
              <Th>Service Advisor</Th>
              <Th>Status</Th>
              <Th>Est. Total</Th>
              <Th>Created</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {jobCards.map(jc => (
              <Tr key={jc._id}>
                <Td>
                  <span className="font-bold text-primary-600">
                    {jc.jobCardNumber}
                  </span>
                </Td>
                <Td>
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-900">{jc.vehicle?.licensePlate}</span>
                    <span className="text-xs text-gray-500">
                      {jc.vehicle?.make} {jc.vehicle?.model}
                    </span>
                  </div>
                </Td>
                <Td>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{jc.customer?.name}</span>
                    <span className="text-xs text-gray-500">{jc.customer?.phone}</span>
                  </div>
                </Td>
                <Td className="text-gray-700">
                  {jc.assignedMechanic?.name || (
                    <span className="text-gray-400 italic">Unassigned</span>
                  )}
                </Td>
                <Td className="text-gray-700">
                  {jc.assignedAdvisor?.name || (
                    <span className="text-gray-400 italic">Unassigned</span>
                  )}
                </Td>
                <Td>
                  <Badge intent={jc.status}>
                    {jc.status?.replace(/_/g, ' ')}
                  </Badge>
                </Td>
                <Td className="font-semibold text-gray-900">
                  {jc.estimation?.grandTotal
                    ? `₹${jc.estimation.grandTotal.toLocaleString(LOCALE)}`
                    : '—'}
                </Td>
                <Td className="text-sm text-gray-500">
                  {formatDate(jc.createdAt)}
                </Td>
                <Td>
                  <Button className='cursor-pointer' variant="ghost" size="sm" onClick={() => navigate(`/jobcards/${jc._id}`)}>
                    <HiOutlineEye className="mr-1.5" /> View
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      {/* Pagination */}
        <Pagination
          className="mt-auto pt-4"
          page={pagination.page}
          pages={pagination.pages}
          onPageChange={(page) => setPagination(p => ({ ...p, page }))}
        />
      </div>

      {/* ============ STEPPER MODAL ============ */}
      {showModal && (
        <ModalOverlay onClose={() => setShowModal(false)}>
          <Modal className="max-w-[860px]">
            {/* Stepper Header */}
            <div className="flex items-center justify-center p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
              <div className={`flex items-center flex-1 ${step === 1 ? 'opacity-100' : 'opacity-60'}`}>
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${step === 1 ? 'bg-primary-500 text-white shadow-md' : 'bg-primary-100 text-primary-600'
                    }`}>
                    {step > 1 ? <HiOutlineCheck className="text-xl" /> : <span className="font-bold">1</span>}
                  </div>
                  <span className={`text-sm font-semibold mt-2 ${step === 1 ? 'text-primary-700' : 'text-gray-500'}`}>
                    Customer & Vehicle
                  </span>
                </div>
              </div>

              <div className={`w-16 h-[2px] mx-2 ${step > 1 ? 'bg-primary-400' : 'bg-gray-200'}`} />

              <div className={`flex items-center flex-1 ${step === 2 ? 'opacity-100' : 'opacity-60'}`}>
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${step === 2 ? 'bg-primary-500 text-white shadow-md' : 'bg-gray-200 text-gray-500'
                    }`}>
                    <span className="font-bold">2</span>
                  </div>
                  <span className={`text-sm font-semibold mt-2 ${step === 2 ? 'text-primary-700' : 'text-gray-500'}`}>
                    Work Details
                  </span>
                </div>
              </div>
            </div>

            <ModalHeader
              title={step === 1 ? 'Select Customer & Vehicle' : 'Service Details'}
              onClose={() => setShowModal(false)}
            />

            <ModalBody>
              {/* ===== STEP 1: Customer & Vehicle ===== */}
              {step === 1 && (
                <>
                  {/* ---- CUSTOMER SECTION ---- */}
                  <div className="flex items-center gap-4 my-4">
                    <div className="h-px bg-gray-200 flex-1" />
                    <span className="text-sm font-bold tracking-wider text-gray-400 uppercase">Customer Information</span>
                    <div className="h-px bg-gray-200 flex-1" />
                  </div>

                  {selectedCustomer ? (
                    <div className="flex items-center justify-between p-4 bg-primary-50 border border-primary-100 rounded-xl mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center">
                          <HiOutlineUser className="text-xl" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{selectedCustomer.name}</div>
                          <div className="text-sm text-gray-500">
                            {selectedCustomer.phone}{selectedCustomer.email ? ` · ${selectedCustomer.email}` : ''}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => {
                        setSelectedCustomer(null);
                        setSelectedVehicle(null);
                        setVehicleSearch('');
                      }} title="Change Customer">
                        <HiOutlineX />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex p-1 bg-gray-100 rounded-lg mb-4">
                        <button
                          className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${customerMode === 'existing' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                          onClick={() => setCustomerMode('existing')}
                        >
                          Select Existing
                        </button>
                        <button
                          className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${customerMode === 'new' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                          onClick={() => setCustomerMode('new')}
                        >
                          Add New Customer
                        </button>
                      </div>

                      {customerMode === 'existing' ? (
                        <>
                          <div className="relative mb-3">
                            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                            <Input
                              placeholder="Search by name or phone..."
                              value={customerSearch}
                              onChange={e => setCustomerSearch(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                          <div className="max-h-[220px] overflow-y-auto border border-gray-200 rounded-xl bg-white divide-y divide-gray-100">
                            {filteredCustomers.length === 0 ? (
                              <div className="p-4 text-center text-gray-500">
                                No customers found.{' '}
                                <button className="font-semibold text-primary-600 hover:underline" onClick={() => setCustomerMode('new')}>
                                  Add a new one
                                </button>
                              </div>
                            ) : filteredCustomers.map(c => (
                              <div
                                key={c._id}
                                className="p-3 cursor-pointer hover:bg-gray-50 transition-colors flex justify-between items-center"
                                onClick={() => {
                                  setSelectedCustomer(c);
                                  setCustomerSearch('');
                                  setVehicleMode('existing');
                                  setSelectedVehicle(null);
                                  setVehicleSearch('');
                                }}
                              >
                                <div>
                                  <div className="font-semibold text-gray-900">{c.name}</div>
                                  <div className="text-sm text-gray-500">{c.phone}{c.vehicles?.length ? ` · ${c.vehicles.length} vehicle(s)` : ''}</div>
                                </div>
                                <HiOutlineChevronRight className="text-gray-400" />
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Customer Name *</label>
                              <Input
                                value={newCustomer.name}
                                onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                placeholder="Full name"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone *</label>
                              <Input
                                type="tel"
                                value={newCustomer.phone}
                                onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                placeholder="9876543210"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                              <Input
                                type="email"
                                value={newCustomer.email}
                                onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })}
                                placeholder="Optional"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1.5">City</label>
                              <Input
                                value={newCustomer.address.city}
                                onChange={e => setNewCustomer({ ...newCustomer, address: { ...newCustomer.address, city: e.target.value } })}
                                placeholder="City"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* ---- VEHICLE SECTION ---- */}
                  <div className="flex items-center gap-4 my-6">
                    <div className="h-px bg-gray-200 flex-1" />
                    <span className="text-sm font-bold tracking-wider text-gray-400 uppercase">Vehicle Information</span>
                    <div className="h-px bg-gray-200 flex-1" />
                  </div>

                  {selectedVehicle ? (
                    <div className="flex items-center justify-between p-4 bg-primary-50 border border-primary-100 rounded-xl mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center">
                          <HiOutlineTruck className="text-xl" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{selectedVehicle.licensePlate}</div>
                          <div className="text-sm text-gray-500">
                            {selectedVehicle.make} {selectedVehicle.model}
                            {selectedVehicle.color ? ` · ${selectedVehicle.color}` : ''}
                            {selectedVehicle.fuelType ? ` · ${selectedVehicle.fuelType}` : ''}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setSelectedVehicle(null)} title="Change Vehicle">
                        <HiOutlineX />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex p-1 bg-gray-100 rounded-lg mb-4">
                        <button
                          className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${vehicleMode === 'existing' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                          onClick={() => setVehicleMode('existing')}
                        >
                          Select Existing
                        </button>
                        <button
                          className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${vehicleMode === 'new' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                          onClick={() => setVehicleMode('new')}
                        >
                          Add New Vehicle
                        </button>
                      </div>

                      {vehicleMode === 'existing' ? (
                        <>
                          <div className="relative mb-2">
                            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                            <Input
                              placeholder="Search by plate, make, or model..."
                              value={vehicleSearch}
                              onChange={e => setVehicleSearch(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                          {selectedCustomer && !vehicleSearch && (
                            <p className="text-xs text-gray-500 mb-2 pl-1">
                              Showing vehicles for {selectedCustomer.name}. Clear search to see all.
                            </p>
                          )}
                          <div className="max-h-[220px] overflow-y-auto border border-gray-200 rounded-xl bg-white divide-y divide-gray-100">
                            {filteredVehicles.length === 0 ? (
                              <div className="p-4 text-center text-gray-500">
                                No vehicles found.{' '}
                                <button className="font-semibold text-primary-600 hover:underline" onClick={() => setVehicleMode('new')}>
                                  Add a new one
                                </button>
                              </div>
                            ) : filteredVehicles.map(v => (
                              <div
                                key={v._id}
                                className="p-3 cursor-pointer hover:bg-gray-50 transition-colors flex justify-between items-center"
                                onClick={() => {
                                  setSelectedVehicle(v);
                                  setVehicleSearch('');
                                  if (!selectedCustomer && v.customer) {
                                    const cust = customers.find(c => c._id === (v.customer?._id || v.customer));
                                    if (cust) setSelectedCustomer(cust);
                                  }
                                }}
                              >
                                <div>
                                  <div className="font-semibold text-gray-900">{v.licensePlate}</div>
                                  <div className="text-sm text-gray-500">
                                    {v.make} {v.model}
                                    {v.customer?.name ? ` · ${v.customer.name}` : ''}
                                  </div>
                                </div>
                                <HiOutlineChevronRight className="text-gray-400" />
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1.5">License Plate *</label>
                              <Input
                                value={newVehicle.licensePlate}
                                onChange={e => setNewVehicle({ ...newVehicle, licensePlate: e.target.value.toUpperCase() })}
                                placeholder="KA01AB1234"
                                className="uppercase"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fuel Type</label>
                              <Select
                                value={newVehicle.fuelType}
                                onChange={e => setNewVehicle({ ...newVehicle, fuelType: e.target.value })}
                              >
                                {FUEL_TYPES.map(f => (
                                  <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
                                ))}
                              </Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Make *</label>
                              <Input
                                value={newVehicle.make}
                                onChange={e => setNewVehicle({ ...newVehicle, make: e.target.value })}
                                placeholder="Maruti, Honda, Hyundai..."
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Model *</label>
                              <Input
                                value={newVehicle.model}
                                onChange={e => setNewVehicle({ ...newVehicle, model: e.target.value })}
                                placeholder="Swift, City, Creta..."
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Year</label>
                              <Input
                                type="number"
                                value={newVehicle.year}
                                onChange={e => setNewVehicle({ ...newVehicle, year: e.target.value })}
                                placeholder="2024"
                                min="1990" max="2030"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Color</label>
                              <Input
                                value={newVehicle.color}
                                onChange={e => setNewVehicle({ ...newVehicle, color: e.target.value })}
                                placeholder="White, Silver..."
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              {/* ===== STEP 2: Work Details ===== */}
              {step === 2 && (
                <>
                  {/* Summary of selected customer & vehicle */}
                  <div className="flex flex-wrap gap-4 mb-6">
                    <div className="flex-1 min-w-[220px] p-3 border border-gray-200 bg-gray-50 rounded-xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white text-gray-500 flex items-center justify-center shadow-sm">
                        <HiOutlineUser />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">
                          {customerMode === 'existing' ? selectedCustomer?.name : newCustomer.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {customerMode === 'existing' ? selectedCustomer?.phone : newCustomer.phone}
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-[220px] p-3 border border-gray-200 bg-gray-50 rounded-xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white text-gray-500 flex items-center justify-center shadow-sm">
                        <HiOutlineTruck />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">
                          {vehicleMode === 'existing' ? selectedVehicle?.licensePlate : newVehicle.licensePlate}
                        </div>
                        <div className="text-xs text-gray-500">
                          {vehicleMode === 'existing'
                            ? `${selectedVehicle?.make} ${selectedVehicle?.model}`
                            : `${newVehicle.make} ${newVehicle.model}`}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Service Type *</label>
                      <Select
                        value={workForm.serviceType}
                        onChange={e => setWorkForm({ ...workForm, serviceType: e.target.value })}
                        required
                      >
                        <option value="service">Periodic Service</option>
                        <option value="repair">General Repair</option>
                        <option value="accident">Accident Repair</option>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Assign Service Advisor *</label>
                      <Select
                        value={workForm.assignedAdvisor || ''}
                        onChange={e => setWorkForm({ ...workForm, assignedAdvisor: e.target.value })}
                        required
                      >
                        <option value="">Select Service Advisor</option>
                        {advisors.map(a => (
                          <option key={a._id} value={a._id}>{a.name}</option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Assign Mechanic</label>
                      <Select
                        value={workForm.assignedMechanic}
                        onChange={e => setWorkForm({ ...workForm, assignedMechanic: e.target.value })}
                      >
                        <option value="">Unassigned</option>
                        {mechanics.map(m => (
                          <option key={m._id} value={m._id}>{m.name}</option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Odometer Reading (km)</label>
                      <Input
                        type="number"
                        value={workForm.odometerAtIntake}
                        onChange={e => setWorkForm({ ...workForm, odometerAtIntake: e.target.value })}
                        placeholder="42000"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Expected Delivery Date</label>
                    <Input
                      type="date"
                      value={workForm.expectedDeliveryDate}
                      onChange={e => setWorkForm({ ...workForm, expectedDeliveryDate: e.target.value })}
                    />
                  </div>

                  {/* Complaints */}
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Customer Complaints / Service Requests *
                    </label>
                    {workForm.complaints.map((complaint, index) => (
                      <div key={index} className="flex gap-3 mb-3 items-center bg-gray-50/80 p-2.5 rounded-xl border border-gray-100/80">
                        <div className="flex-1 min-w-0">
                          <Input
                            value={complaint.description}
                            onChange={e => updateComplaint(index, 'description', e.target.value)}
                            placeholder="Describe the complaint or service needed..."
                            required={index === 0}
                            className="bg-white border-gray-200"
                          />
                        </div>
                        <Select
                          value={complaint.priority}
                          onChange={e => updateComplaint(index, 'priority', e.target.value)}
                          className="w-[125px] shrink-0"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </Select>
                        {workForm.complaints.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeComplaint(index)}
                            className="text-gray-400 hover:text-danger hover:bg-danger-light shrink-0"
                            title="Remove complaint"
                          >
                            <HiOutlineX className="text-lg" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button variant="ghost" size="sm" onClick={addComplaint} className="mt-1">
                      <HiOutlinePlus className="mr-1.5" /> Add Another Issue
                    </Button>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Internal Notes</label>
                    <textarea
                      className="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-lg text-[15px] text-gray-800 bg-white outline-none focus:border-primary-400 focus:shadow-[0_0_0_3px_rgba(59,95,248,0.1)] min-h-[80px] resize-y placeholder:text-gray-400"
                      value={workForm.internalNotes}
                      onChange={e => setWorkForm({ ...workForm, internalNotes: e.target.value })}
                      placeholder="Any internal notes for this job..."
                    />
                  </div>
                </>
              )}
            </ModalBody>

            <ModalFooter className="bg-gray-50 border-t border-gray-100 rounded-b-2xl pt-4">
              <div className="flex justify-between w-full">
                <Button variant="ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <div className="flex gap-2">
                  {step === 2 && (
                    <Button variant="secondary" onClick={() => setStep(1)} icon={HiOutlineChevronLeft}>
                      Back
                    </Button>
                  )}
                  {step === 1 && (
                    <Button
                      variant="primary"
                      disabled={!canProceedStep1()}
                      onClick={() => setStep(2)}
                    >
                      Next <HiOutlineChevronRight className="ml-1.5" />
                    </Button>
                  )}
                  {step === 2 && (
                    <Button variant="primary" onClick={handleSubmit} icon={HiOutlineCheck}>
                      Create Job Card
                    </Button>
                  )}
                </div>
              </div>
            </ModalFooter>

          </Modal>
        </ModalOverlay>
      )}
    </div>
  );
}
