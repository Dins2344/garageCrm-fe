import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
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
  HiOutlineCheck
} from 'react-icons/hi';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'new', label: 'New' },
  { value: 'estimation_sent', label: 'Estimation Sent' },
  { value: 'approved', label: 'Approved' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'quality_check', label: 'Quality Check' },
  { value: 'ready_for_pickup', label: 'Ready for Pickup' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' }
];

const FUEL_TYPES = ['petrol', 'diesel', 'cng', 'electric', 'hybrid', 'other'];

export default function JobCards() {
  const [jobCards, setJobCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const { hasRole, user } = useAuth();
  const navigate = useNavigate();

  // ---- Stepper State ----
  const [step, setStep] = useState(1);

  // Step-1 shared data sources
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [mechanics, setMechanics] = useState([]);

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
    assignedMechanic: '',
    odometerAtIntake: '',
    expectedDeliveryDate: '',
    internalNotes: '',
    complaints: [{ description: '', priority: 'medium' }]
  });

  // ---- Data Fetching ----
  useEffect(() => {
    fetchJobCards();
  }, [statusFilter, search]);

  useEffect(() => {
    if (showModal) {
      fetchCustomers();
      fetchVehicles();
      fetchMechanics();
    }
  }, [showModal]);

  const fetchJobCards = async () => {
    try {
      const res = await api.get('/jobcards', {
        params: { status: statusFilter, search, limit: 50 }
      });
      setJobCards(res.data.data);
    } catch (error) {
      toast.error('Failed to load job cards');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers', { params: { limit: 200 } });
      setCustomers(res.data.data);
    } catch (e) { /* ignore */ }
  };

  const fetchVehicles = async () => {
    try {
      const res = await api.get('/vehicles', { params: { limit: 200 } });
      setVehicles(res.data.data);
    } catch (e) { /* ignore */ }
  };

  const fetchMechanics = async () => {
    try {
      const res = await api.get('/users');
      setMechanics(res.data.data.filter(u => u.role === 'mechanic'));
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
    setNewVehicle({ licensePlate: '', make: '', model: '', year: '', color: '', fuelType: 'petrol' });
    setWorkForm({
      assignedMechanic: '', odometerAtIntake: '', expectedDeliveryDate: '',
      internalNotes: '', complaints: [{ description: '', priority: 'medium' }]
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
    try {
      // 1. Resolve customer
      let customerId;
      if (customerMode === 'existing') {
        customerId = selectedCustomer._id;
      } else {
        const res = await api.post('/customers', newCustomer);
        customerId = res.data.data._id;
        toast.success(`Customer "${newCustomer.name}" added`);
      }

      // 2. Resolve vehicle
      let vehicleId;
      if (vehicleMode === 'existing') {
        vehicleId = selectedVehicle._id;
      } else {
        const vData = { ...newVehicle, customer: customerId };
        if (vData.year) vData.year = parseInt(vData.year);
        const res = await api.post('/vehicles', vData);
        vehicleId = res.data.data._id;
        toast.success(`Vehicle "${newVehicle.licensePlate}" added`);
      }

      // 3. Create Job Card
      const data = {
        vehicle: vehicleId,
        customer: customerId,
        assignedMechanic: workForm.assignedMechanic || undefined,
        odometerAtIntake: workForm.odometerAtIntake ? parseInt(workForm.odometerAtIntake) : 0,
        expectedDeliveryDate: workForm.expectedDeliveryDate || undefined,
        internalNotes: workForm.internalNotes,
        complaints: workForm.complaints.filter(c => c.description.trim())
      };

      const res = await api.post('/jobcards', data);
      toast.success(`Job Card ${res.data.data.jobCardNumber} created!`);
      setShowModal(false);
      fetchJobCards();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create job card');
    }
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  // ============ RENDER ============
  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1>Job Cards</h1>
        {hasRole('owner', 'admin', 'service_advisor') && (
          <button className="btn btn-primary" onClick={openModal} id="create-jobcard-btn">
            <HiOutlinePlus /> New Job Card
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="search-filter-bar">
        <div className="search-input-wrapper">
          <HiOutlineSearch />
          <input
            className="form-input"
            type="text"
            placeholder="Search by job card number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-select"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ width: 'auto', minWidth: '180px' }}
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading-screen"><div className="spinner" /></div>
      ) : jobCards.length === 0 ? (
        <div className="empty-state">
          <h3>No job cards found</h3>
          <p>{statusFilter ? 'Try a different filter' : 'Create your first job card to get started'}</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Job Card #</th>
                <th>Vehicle</th>
                <th>Customer</th>
                <th>Mechanic</th>
                <th>Status</th>
                <th>Est. Total</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobCards.map(jc => (
                <tr key={jc._id}>
                  <td>
                    <span className="font-bold" style={{ color: 'var(--primary-600)' }}>
                      {jc.jobCardNumber}
                    </span>
                  </td>
                  <td>
                    <div>
                      <span className="font-semibold">{jc.vehicle?.licensePlate}</span>
                      <br />
                      <span className="text-sm text-muted">
                        {jc.vehicle?.make} {jc.vehicle?.model}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div>
                      <span>{jc.customer?.name}</span>
                      <br />
                      <span className="text-sm text-muted">{jc.customer?.phone}</span>
                    </div>
                  </td>
                  <td>
                    {jc.assignedMechanic?.name || (
                      <span className="text-muted">Unassigned</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge badge-${jc.status}`}>
                      {jc.status?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="font-semibold">
                    {jc.estimation?.grandTotal
                      ? `₹${jc.estimation.grandTotal.toLocaleString('en-IN')}`
                      : '—'}
                  </td>
                  <td className="text-sm text-muted">
                    {formatDate(jc.createdAt)}
                  </td>
                  <td>
                    <Link to={`/jobcards/${jc._id}`} className="btn btn-ghost btn-sm">
                      <HiOutlineEye /> View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ============ STEPPER MODAL ============ */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()} style={{ maxWidth: '860px' }}>

            {/* Stepper Header */}
            <div className="stepper">
              <div className={`stepper-step ${step === 1 ? 'active' : 'completed'}`}>
                <div className="stepper-step-dot">
                  <div className={`stepper-dot ${step === 1 ? 'active' : 'completed'}`}>
                    {step > 1 ? <HiOutlineCheck /> : '1'}
                  </div>
                  <span className="stepper-label">Customer & Vehicle</span>
                </div>
              </div>
              <div className={`stepper-connector ${step > 1 ? 'completed' : ''}`} />
              <div className={`stepper-step ${step === 2 ? 'active' : ''}`}>
                <div className="stepper-step-dot">
                  <div className={`stepper-dot ${step === 2 ? 'active' : ''}`}>2</div>
                  <span className="stepper-label">Work Details</span>
                </div>
              </div>
            </div>

            <div className="modal-header" style={{ paddingTop: '16px' }}>
              <h2>{step === 1 ? 'Select Customer & Vehicle' : 'Service Details'}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>
                <HiOutlineX />
              </button>
            </div>

            <div className="modal-body">
              {/* ===== STEP 1: Customer & Vehicle ===== */}
              {step === 1 && (
                <>
                  {/* ---- CUSTOMER SECTION ---- */}
                  <div className="section-divider">
                    <div className="divider-line" />
                    <span className="divider-label">Customer Information</span>
                    <div className="divider-line" />
                  </div>

                  {selectedCustomer ? (
                    <div className="selection-card">
                      <div className="selection-icon"><HiOutlineUser /></div>
                      <div className="selection-info">
                        <div className="selection-title">{selectedCustomer.name}</div>
                        <div className="selection-subtitle">{selectedCustomer.phone}{selectedCustomer.email ? ` · ${selectedCustomer.email}` : ''}</div>
                      </div>
                      <button className="selection-remove" onClick={() => {
                        setSelectedCustomer(null);
                        setSelectedVehicle(null); // Reset vehicle too
                        setVehicleSearch('');
                      }}>
                        <HiOutlineX />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="tab-toggle">
                        <button
                          className={`tab-toggle-btn ${customerMode === 'existing' ? 'active' : ''}`}
                          onClick={() => setCustomerMode('existing')}
                        >
                          Select Existing
                        </button>
                        <button
                          className={`tab-toggle-btn ${customerMode === 'new' ? 'active' : ''}`}
                          onClick={() => setCustomerMode('new')}
                        >
                          Add New Customer
                        </button>
                      </div>

                      {customerMode === 'existing' ? (
                        <>
                          <div className="search-input-wrapper mb-1">
                            <HiOutlineSearch />
                            <input
                              className="form-input"
                              placeholder="Search by name or phone..."
                              value={customerSearch}
                              onChange={e => setCustomerSearch(e.target.value)}
                            />
                          </div>
                          <div className="select-list">
                            {filteredCustomers.length === 0 ? (
                              <div className="select-list-empty">
                                No customers found.{' '}
                                <button
                                  style={{ color: 'var(--primary-500)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                                  onClick={() => setCustomerMode('new')}
                                >
                                  Add a new one
                                </button>
                              </div>
                            ) : filteredCustomers.map(c => (
                              <div
                                key={c._id}
                                className="select-list-item"
                                onClick={() => {
                                  setSelectedCustomer(c);
                                  setCustomerSearch('');
                                  // Auto-select vehicle mode to existing if customer has vehicles
                                  setVehicleMode('existing');
                                  setSelectedVehicle(null);
                                  setVehicleSearch('');
                                }}
                              >
                                <div>
                                  <div className="item-main">{c.name}</div>
                                  <div className="item-sub">{c.phone}{c.vehicles?.length ? ` · ${c.vehicles.length} vehicle(s)` : ''}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div>
                          <div className="form-row">
                            <div className="form-group">
                              <label className="form-label">Customer Name *</label>
                              <input
                                className="form-input"
                                value={newCustomer.name}
                                onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                placeholder="Full name"
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Phone *</label>
                              <input
                                className="form-input"
                                type="tel"
                                value={newCustomer.phone}
                                onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                placeholder="9876543210"
                              />
                            </div>
                          </div>
                          <div className="form-row">
                            <div className="form-group">
                              <label className="form-label">Email</label>
                              <input
                                className="form-input"
                                type="email"
                                value={newCustomer.email}
                                onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })}
                                placeholder="Optional"
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label">City</label>
                              <input
                                className="form-input"
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
                  <div className="section-divider" style={{ marginTop: '28px' }}>
                    <div className="divider-line" />
                    <span className="divider-label">Vehicle Information</span>
                    <div className="divider-line" />
                  </div>

                  {selectedVehicle ? (
                    <div className="selection-card">
                      <div className="selection-icon"><HiOutlineTruck /></div>
                      <div className="selection-info">
                        <div className="selection-title">{selectedVehicle.licensePlate}</div>
                        <div className="selection-subtitle">
                          {selectedVehicle.make} {selectedVehicle.model}
                          {selectedVehicle.color ? ` · ${selectedVehicle.color}` : ''}
                          {selectedVehicle.fuelType ? ` · ${selectedVehicle.fuelType}` : ''}
                        </div>
                      </div>
                      <button className="selection-remove" onClick={() => setSelectedVehicle(null)}>
                        <HiOutlineX />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="tab-toggle">
                        <button
                          className={`tab-toggle-btn ${vehicleMode === 'existing' ? 'active' : ''}`}
                          onClick={() => setVehicleMode('existing')}
                        >
                          Select Existing
                        </button>
                        <button
                          className={`tab-toggle-btn ${vehicleMode === 'new' ? 'active' : ''}`}
                          onClick={() => setVehicleMode('new')}
                        >
                          Add New Vehicle
                        </button>
                      </div>

                      {vehicleMode === 'existing' ? (
                        <>
                          <div className="search-input-wrapper mb-1">
                            <HiOutlineSearch />
                            <input
                              className="form-input"
                              placeholder="Search by plate, make, or model..."
                              value={vehicleSearch}
                              onChange={e => setVehicleSearch(e.target.value)}
                            />
                          </div>
                          {selectedCustomer && !vehicleSearch && (
                            <p className="text-xs text-muted mb-1" style={{ paddingLeft: '2px' }}>
                              Showing vehicles for {selectedCustomer.name}. Clear search to see all.
                            </p>
                          )}
                          <div className="select-list">
                            {filteredVehicles.length === 0 ? (
                              <div className="select-list-empty">
                                No vehicles found.{' '}
                                <button
                                  style={{ color: 'var(--primary-500)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                                  onClick={() => setVehicleMode('new')}
                                >
                                  Add a new one
                                </button>
                              </div>
                            ) : filteredVehicles.map(v => (
                              <div
                                key={v._id}
                                className="select-list-item"
                                onClick={() => {
                                  setSelectedVehicle(v);
                                  setVehicleSearch('');
                                  // Auto-select customer if not already set
                                  if (!selectedCustomer && v.customer) {
                                    const cust = customers.find(c => c._id === (v.customer?._id || v.customer));
                                    if (cust) setSelectedCustomer(cust);
                                  }
                                }}
                              >
                                <div>
                                  <div className="item-main">{v.licensePlate}</div>
                                  <div className="item-sub">
                                    {v.make} {v.model}
                                    {v.customer?.name ? ` · ${v.customer.name}` : ''}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div>
                          <div className="form-row">
                            <div className="form-group">
                              <label className="form-label">License Plate *</label>
                              <input
                                className="form-input"
                                value={newVehicle.licensePlate}
                                onChange={e => setNewVehicle({ ...newVehicle, licensePlate: e.target.value.toUpperCase() })}
                                placeholder="KA01AB1234"
                                style={{ textTransform: 'uppercase' }}
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Fuel Type</label>
                              <select
                                className="form-select"
                                value={newVehicle.fuelType}
                                onChange={e => setNewVehicle({ ...newVehicle, fuelType: e.target.value })}
                              >
                                {FUEL_TYPES.map(f => (
                                  <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="form-row">
                            <div className="form-group">
                              <label className="form-label">Make *</label>
                              <input
                                className="form-input"
                                value={newVehicle.make}
                                onChange={e => setNewVehicle({ ...newVehicle, make: e.target.value })}
                                placeholder="Maruti, Honda, Hyundai..."
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Model *</label>
                              <input
                                className="form-input"
                                value={newVehicle.model}
                                onChange={e => setNewVehicle({ ...newVehicle, model: e.target.value })}
                                placeholder="Swift, City, Creta..."
                              />
                            </div>
                          </div>
                          <div className="form-row">
                            <div className="form-group">
                              <label className="form-label">Year</label>
                              <input
                                className="form-input"
                                type="number"
                                value={newVehicle.year}
                                onChange={e => setNewVehicle({ ...newVehicle, year: e.target.value })}
                                placeholder="2024"
                                min="1990" max="2030"
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Color</label>
                              <input
                                className="form-input"
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
                  <div className="flex gap-2 mb-2" style={{ flexWrap: 'wrap' }}>
                    <div className="selection-card" style={{ flex: 1, minWidth: '220px', marginBottom: 0 }}>
                      <div className="selection-icon"><HiOutlineUser /></div>
                      <div className="selection-info">
                        <div className="selection-title">
                          {customerMode === 'existing' ? selectedCustomer?.name : newCustomer.name}
                        </div>
                        <div className="selection-subtitle">
                          {customerMode === 'existing' ? selectedCustomer?.phone : newCustomer.phone}
                        </div>
                      </div>
                    </div>
                    <div className="selection-card" style={{ flex: 1, minWidth: '220px', marginBottom: 0 }}>
                      <div className="selection-icon"><HiOutlineTruck /></div>
                      <div className="selection-info">
                        <div className="selection-title">
                          {vehicleMode === 'existing' ? selectedVehicle?.licensePlate : newVehicle.licensePlate}
                        </div>
                        <div className="selection-subtitle">
                          {vehicleMode === 'existing'
                            ? `${selectedVehicle?.make} ${selectedVehicle?.model}`
                            : `${newVehicle.make} ${newVehicle.model}`}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Assign Mechanic</label>
                      <select
                        className="form-select"
                        value={workForm.assignedMechanic}
                        onChange={e => setWorkForm({ ...workForm, assignedMechanic: e.target.value })}
                      >
                        <option value="">Unassigned</option>
                        {mechanics.map(m => (
                          <option key={m._id} value={m._id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Odometer Reading (km)</label>
                      <input
                        className="form-input"
                        type="number"
                        value={workForm.odometerAtIntake}
                        onChange={e => setWorkForm({ ...workForm, odometerAtIntake: e.target.value })}
                        placeholder="42000"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Expected Delivery Date</label>
                    <input
                      className="form-input"
                      type="date"
                      value={workForm.expectedDeliveryDate}
                      onChange={e => setWorkForm({ ...workForm, expectedDeliveryDate: e.target.value })}
                    />
                  </div>

                  {/* Complaints */}
                  <div className="form-group">
                    <label className="form-label">
                      Customer Complaints / Service Requests *
                    </label>
                    {workForm.complaints.map((complaint, index) => (
                      <div key={index} className="flex gap-1 mb-1" style={{ alignItems: 'flex-start' }}>
                        <input
                          className="form-input"
                          value={complaint.description}
                          onChange={e => updateComplaint(index, 'description', e.target.value)}
                          placeholder="Describe the complaint or service needed..."
                          required={index === 0}
                        />
                        <select
                          className="form-select"
                          value={complaint.priority}
                          onChange={e => updateComplaint(index, 'priority', e.target.value)}
                          style={{ width: '130px', flexShrink: 0 }}
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                        {workForm.complaints.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-icon text-danger"
                            onClick={() => removeComplaint(index)}
                          >
                            <HiOutlineX />
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" className="btn btn-ghost btn-sm" onClick={addComplaint}>
                      <HiOutlinePlus /> Add Complaint
                    </button>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Internal Notes</label>
                    <textarea
                      className="form-textarea"
                      value={workForm.internalNotes}
                      onChange={e => setWorkForm({ ...workForm, internalNotes: e.target.value })}
                      placeholder="Any internal notes for this job..."
                    />
                  </div>
                </>
              )}
            </div>

            {/* Stepper Footer */}
            <div className="stepper-footer">
              <div className="stepper-footer-left">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
              </div>
              <div className="stepper-footer-right">
                {step === 2 && (
                  <button className="btn btn-secondary" onClick={() => setStep(1)}>
                    <HiOutlineChevronLeft /> Back
                  </button>
                )}
                {step === 1 && (
                  <button
                    className="btn btn-primary"
                    disabled={!canProceedStep1()}
                    onClick={() => setStep(2)}
                  >
                    Next <HiOutlineChevronRight />
                  </button>
                )}
                {step === 2 && (
                  <button className="btn btn-primary" onClick={handleSubmit}>
                    <HiOutlineCheck /> Create Job Card
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
