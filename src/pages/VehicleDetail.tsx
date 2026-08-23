import { useState, useEffect, type ComponentType } from 'react';
import { useGarage } from '../context/GarageContext';
import { formatMoney, formatNumber, formatDate as fmtDate } from '../utils/format';
import { Check } from 'lucide-react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getVehicle, getVehicleHistory } from '../services/apiServices/vehicleService';

import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft,
  HiOutlineTruck,
  HiOutlineUser,
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineLocationMarker,
  HiOutlineClipboardList,
  HiOutlineReceiptTax,
  HiOutlineCalendar,
  HiOutlineChip,
  HiOutlineIdentification,
  HiOutlineChartBar,
  HiOutlineCog,
  HiOutlineLightningBolt,
  HiOutlineRefresh,
} from 'react-icons/hi';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Loader from '../components/Loader';
import type { Vehicle, JobCard } from '../types/models';

const FUEL_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  petrol:   { bg: '#fee2e2', text: '#dc2626', dot: '#ef4444' },
  diesel:   { bg: '#dbeafe', text: '#1d4ed8', dot: '#3b82f6' },
  cng:      { bg: '#fef3c7', text: '#b45309', dot: '#f59e0b' },
  electric: { bg: '#d1fae5', text: '#065f46', dot: '#10b981' },
  hybrid:   { bg: '#ede9fe', text: '#6d28d9', dot: '#8b5cf6' },
  other:    { bg: '#f3f4f6', text: '#374151', dot: '#9ca3af' },
};

const SERVICE_TYPE_COLORS: Record<string, string> = {
  service:  'bg-blue-100 text-blue-700',
  repair:   'bg-orange-100 text-orange-700',
  accident: 'bg-red-100 text-red-700',
};

interface InfoBlockProps {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value?: string | null;
}

function InfoBlock({ icon: Icon, label, value }: InfoBlockProps) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-bone-100 border border-bone-200 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="text-gray-400 text-base" />
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: ComponentType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}

function StatCard({ icon: Icon, label, value, sub, color }: StatCardProps) {
  return (
    <div className="bg-bone-50 rounded-2xl border border-bone-200 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${color}`}>
        <Icon />
      </div>
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-extrabold text-gray-900 mt-0.5 leading-none">{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export default function VehicleDetail() {
  const { locale } = useGarage();
  const money = (n?: number) => formatMoney(n, locale);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 15;

  const fetchVehicle = async () => {
    try {
      const { data } = await getVehicle(id!);
      setVehicle(data);
    } catch {
      toast.error('Vehicle not found');
      navigate('/vehicles');
    }
  };

  const fetchHistory = async (pg = 1, append = false) => {
    setHistoryLoading(true);
    try {
      const res = await getVehicleHistory(id!, { page: pg, limit: LIMIT });
      setJobCards(prev => append ? [...prev, ...res.data] : res.data);
      setTotalPages(res.pages || 1);
      setTotal(res.total || 0);
      setPage(pg);
    } catch {
      toast.error('Failed to load service history');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchVehicle(), fetchHistory(1)]);
      setLoading(false);
    };
    init();
  }, [id]);

  const loadMore = () => fetchHistory(page + 1, true);

  if (loading) {
    return <Loader text="Loading vehicle..." />;
  }

  if (!vehicle) return null;

  const customer = typeof vehicle.customer === 'string' ? null : vehicle.customer;
  const fuelType = vehicle.fuelType?.toLowerCase() || 'other';
  const fuelStyle = FUEL_COLORS[fuelType] || FUEL_COLORS.other;

  // Stats derived from history
  const totalSpend = jobCards.reduce((sum, jc) => sum + (jc.estimation?.grandTotal || 0), 0);
  const delivered = jobCards.filter(jc => jc.status === 'delivered');
  const lastService = delivered[0]
    ? fmtDate(delivered[0].createdAt, locale, { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-12">

      {/* Top navigation bar */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/vehicles')}>
          <HiOutlineArrowLeft />
        </Button>
        <div>
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Vehicle</p>
          <h1 className="text-lg font-extrabold text-gray-900 leading-tight tracking-tight">{vehicle.licensePlate}</h1>
        </div>
      </div>

      {/* ── Hero Card ── */}
      <div
        className="relative overflow-hidden rounded-3xl p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6"
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b5ff8 50%, #6366f1 100%)',
        }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full opacity-10 bg-bone-50" />
        <div className="absolute top-12 -right-4 w-24 h-24 rounded-full opacity-10 bg-bone-50" />
        <div className="absolute -bottom-10 -left-6 w-40 h-40 rounded-full opacity-5 bg-bone-50" />

        {/* Vehicle icon */}
        <div className="w-20 h-20 rounded-2xl bg-bone-50 backdrop-blur flex items-center justify-center shrink-0 border border-white/20">
          <HiOutlineTruck className="text-white text-4xl" />
        </div>

        {/* Main info */}
        <div className="flex-1 relative z-10">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className="text-3xl font-black text-white tracking-widest">{vehicle.licensePlate}</span>
            <span
              className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
              style={{ background: fuelStyle.bg, color: fuelStyle.text }}
            >
              {fuelType}
            </span>
          </div>
          <p className="text-white/80 text-lg font-semibold">
            {vehicle.make} {vehicle.model}
            {vehicle.year ? ` · ${vehicle.year}` : ''}
            {vehicle.color ? ` · ${vehicle.color}` : ''}
          </p>
          {customer && (
            <p className="text-white/60 text-sm mt-1 flex items-center gap-1.5">
              <HiOutlineUser className="text-base" />
              {customer.name}
              {customer.phone ? ` · ${customer.phone}` : ''}
            </p>
          )}
        </div>

        {/* Service count pill */}
        <div className="relative z-10 bg-bone-50 backdrop-blur border border-white/20 rounded-2xl px-6 py-4 text-center shrink-0">
          <p className="text-4xl font-black text-white">{total}</p>
          <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mt-0.5">
            {total === 1 ? 'Service' : 'Services'}
          </p>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={HiOutlineClipboardList}
          label="Total Services"
          value={total}
          sub={`${delivered.length} completed`}
          color="bg-blue-50 text-blue-500"
        />
        <StatCard
          icon={HiOutlineReceiptTax}
          label="Total Spend"
          value={money(totalSpend)}
          sub="across all job cards"
          color="bg-emerald-50 text-emerald-500"
        />
        <StatCard
          icon={HiOutlineCalendar}
          label="Last Service"
          value={lastService}
          sub={delivered.length > 0 ? 'delivered' : 'no completed services yet'}
          color="bg-violet-50 text-violet-500"
        />
      </div>

      {/* ── Info Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Vehicle Info */}
        <div className="bg-bone-50 rounded-2xl border border-bone-200 shadow-sm p-6">
          <h2 className="text-sm font-extrabold text-gray-800 uppercase tracking-widest mb-5 flex items-center gap-2">
            <HiOutlineCog className="text-gray-400 text-base" /> Vehicle Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <InfoBlock icon={HiOutlineTruck} label="Make & Model" value={`${vehicle.make} ${vehicle.model}`} />
            <InfoBlock icon={HiOutlineCalendar} label="Year" value={vehicle.year?.toString()} />
            <InfoBlock icon={HiOutlineChip} label="Engine Number" value={vehicle.engineNumber} />
            <InfoBlock icon={HiOutlineIdentification} label="Chassis / VIN" value={vehicle.chassisNumber || vehicle.vin} />
            <InfoBlock icon={HiOutlineChartBar} label="Current Mileage" value={vehicle.currentOdometerReading ? `${formatNumber(vehicle.currentOdometerReading, locale)} km` : null} />
            <InfoBlock icon={HiOutlineLightningBolt} label="Fuel Type" value={fuelType.charAt(0).toUpperCase() + fuelType.slice(1)} />
          </div>
        </div>

        {/* Owner Info */}
        {customer && (
          <div className="bg-bone-50 rounded-2xl border border-bone-200 shadow-sm p-6">
            <h2 className="text-sm font-extrabold text-gray-800 uppercase tracking-widest mb-5 flex items-center gap-2">
              <HiOutlineUser className="text-gray-400 text-base" /> Owner Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <InfoBlock icon={HiOutlineUser} label="Name" value={customer.name} />
              <InfoBlock icon={HiOutlinePhone} label="Phone" value={customer.phone} />
              <InfoBlock icon={HiOutlineMail} label="Email" value={customer.email} />
              <InfoBlock
                icon={HiOutlineLocationMarker}
                label="City"
                value={customer.address?.city}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Service History ── */}
      <div className="bg-bone-50 rounded-2xl border border-bone-200 shadow-sm overflow-hidden">
        {/* Section header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-bone-200">
          <div>
            <h2 className="text-sm font-extrabold text-gray-800 uppercase tracking-widest flex items-center gap-2">
              <HiOutlineClipboardList className="text-gray-400" /> Service History
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">{total} record{total !== 1 ? 's' : ''} found</p>
          </div>
          <button
            onClick={() => fetchHistory(1)}
            disabled={historyLoading}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-primary-500 transition-colors disabled:opacity-50"
          >
            <HiOutlineRefresh className={historyLoading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {/* History list */}
        {jobCards.length === 0 && !historyLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-300">
            <HiOutlineClipboardList className="text-6xl" />
            <div className="text-center">
              <p className="font-bold text-gray-400 text-base">No service records yet</p>
              <p className="text-sm text-gray-300 mt-1">Job cards for this vehicle will appear here</p>
            </div>
          </div>
        ) : (
          <div>
            {/* Column headers */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-bone-100 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-bone-200">
              <div className="col-span-3">Job Card</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2 text-right">Amount</div>
              <div className="col-span-1"></div>
            </div>

            {jobCards.map((jc, index) => {
              const isLast = index === jobCards.length - 1;
              const date = jc.createdAt
                ? fmtDate(jc.createdAt, locale, { day: '2-digit', month: 'short', year: 'numeric' })
                : '—';
              const amount = jc.estimation?.grandTotal;

              return (
                <Link
                  key={jc._id}
                  to={`/jobcards/${jc._id}`}
                  className={`grid grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-blue-50/50 transition-all duration-150 group ${!isLast ? 'border-b border-gray-50' : ''}`}
                >
                  {/* Job Card Number */}
                  <div className="col-span-3">
                    <p className="font-bold text-primary-600 text-sm group-hover:text-primary-700 transition-colors">
                      {jc.jobCardNumber}
                    </p>
                    {jc.complaints?.length > 0 && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[140px]">
                        {jc.complaints[0].description}
                      </p>
                    )}
                  </div>

                  {/* Service Type */}
                  <div className="col-span-2">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold capitalize ${SERVICE_TYPE_COLORS[jc.serviceType] || 'bg-bone-200 text-gray-600'}`}>
                      {jc.serviceType || '—'}
                    </span>
                  </div>

                  {/* Date */}
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600 font-medium">{date}</p>
                    {jc.actualDeliveryDate && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Delivered: {fmtDate(jc.actualDeliveryDate, locale, { day: '2-digit', month: 'short' })}
                      </p>
                    )}
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    <Badge intent={jc.status}>
                      {jc.status?.replace(/_/g, ' ')}
                    </Badge>
                  </div>

                  {/* Amount */}
                  <div className="col-span-2 text-right">
                    {amount ? (
                      <p className="font-bold text-gray-900 text-sm">{money(amount)}</p>
                    ) : (
                      <p className="text-xs text-gray-300 font-medium">No estimate</p>
                    )}
                    {jc.estimation?.approvedByCustomer && (
                      <p className="text-[10px] text-emerald-500 font-semibold mt-0.5 flex items-center gap-1">
                        <Check className="w-3 h-3" strokeWidth={3} /> Approved
                      </p>
                    )}
                  </div>

                  {/* Arrow */}
                  <div className="col-span-1 flex justify-end">
                    <div className="w-7 h-7 rounded-lg bg-bone-200 group-hover:bg-primary-100 group-hover:text-primary-600 flex items-center justify-center transition-all duration-150 text-gray-400 text-sm">
                      →
                    </div>
                  </div>
                </Link>
              );
            })}

            {/* Load More */}
            {page < totalPages && (
              <div className="flex justify-center py-5 border-t border-bone-200">
                <Button
                  variant="secondary"
                  onClick={loadMore}
                  disabled={historyLoading}
                >
                  {historyLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader variant="inline" />
                      Loading...
                    </span>
                  ) : `Load More (${total - jobCards.length} remaining)`}
                </Button>
              </div>
            )}

            {/* Loading skeleton overlay for refresh */}
            {historyLoading && jobCards.length === 0 && (
              <Loader />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
