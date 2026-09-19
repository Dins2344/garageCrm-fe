import { useState, useEffect, type ComponentType } from 'react';
import { useGarage } from '../context/GarageContext';
import { formatMoney, formatNumber, formatDate as fmtDate } from '../utils/format';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getVehicle, getVehicleHistory } from '../services/apiServices/vehicleService';

import toast from 'react-hot-toast';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Truck,
  User,
  Phone,
  Mail,
  MapPin,
  ClipboardList,
  Receipt,
  Calendar,
  Cpu,
  IdCard,
  ChartColumn,
  Settings,
  Zap,
  RefreshCw,
} from 'lucide-react';
import Badge from '../components/Badge';
import StatCard from '../components/StatCard';
import Button from '../components/Button';
import Loader from '../components/Loader';
import type { Vehicle, JobCard } from '../types/models';

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
        <Icon className="text-gray-400 w-4 h-4" />
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-gray-900">{value}</p>
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
          <ArrowLeft className="w-[1em] h-[1em]" />
        </Button>
        <h1 className="font-display text-lg font-extrabold text-gray-900 leading-tight tracking-tight">{vehicle.licensePlate}</h1>
      </div>

      {/* Identity band. Ink ground, no decoration: was a hex gradient with
          blurred circles and a duplicate service count (the stats row below
          already carries it). */}
      <div className="on-ink bg-ink-900 p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="w-16 h-16 border border-white/15 bg-white/5 flex items-center justify-center shrink-0">
          <Truck className="text-white w-8 h-8" strokeWidth={1.75} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className="font-display text-3xl font-extrabold text-white tracking-tight">{vehicle.licensePlate}</span>
            <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wide bg-white/10 text-white border border-white/20">
              {fuelType}
            </span>
          </div>
          <p className="text-white/70 text-lg font-semibold">
            {[`${vehicle.make} ${vehicle.model}`, vehicle.year, vehicle.color].filter(Boolean).join(', ')}
          </p>
          {customer && (
            <p className="text-white/60 text-sm mt-1 flex items-center gap-1.5">
              <User className="w-4 h-4" />
              {[customer.name, customer.phone].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={ClipboardList} title="Total services" value={total} sub={`${delivered.length} completed`} colorClass="blue" />
        <StatCard icon={Receipt} title="Total spend" value={money(totalSpend)} colorClass="green" />
        <StatCard icon={Calendar} title="Last service" value={lastService} colorClass="purple" />
      </div>

      {/* ── Info Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Vehicle Info */}
        <div className="bg-bone-50 rounded-2xl border border-bone-200 shadow-sm p-6">
          <h2 className="text-sm font-extrabold text-gray-800 uppercase tracking-widest mb-5 flex items-center gap-2">
            <Settings className="text-gray-400 w-4 h-4" /> Vehicle Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <InfoBlock icon={Truck} label="Make & Model" value={`${vehicle.make} ${vehicle.model}`} />
            <InfoBlock icon={Calendar} label="Year" value={vehicle.year?.toString()} />
            <InfoBlock icon={Cpu} label="Engine Number" value={vehicle.engineNumber} />
            <InfoBlock icon={IdCard} label="Chassis / VIN" value={vehicle.chassisNumber || vehicle.vin} />
            <InfoBlock icon={ChartColumn} label="Current Mileage" value={vehicle.currentOdometerReading ? `${formatNumber(vehicle.currentOdometerReading, locale)} km` : null} />
            <InfoBlock icon={Zap} label="Fuel Type" value={fuelType.charAt(0).toUpperCase() + fuelType.slice(1)} />
          </div>
        </div>

        {/* Owner Info */}
        {customer && (
          <div className="bg-bone-50 rounded-2xl border border-bone-200 shadow-sm p-6">
            <h2 className="text-sm font-extrabold text-gray-800 uppercase tracking-widest mb-5 flex items-center gap-2">
              <User className="text-gray-400 w-4 h-4" /> Owner Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <InfoBlock icon={User} label="Name" value={customer.name} />
              <InfoBlock icon={Phone} label="Phone" value={customer.phone} />
              <InfoBlock icon={Mail} label="Email" value={customer.email} />
              <InfoBlock
                icon={MapPin}
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
              <ClipboardList className="w-[1em] h-[1em] text-gray-400" /> Service History
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">{total} record{total !== 1 ? 's' : ''} found</p>
          </div>
          <button
            onClick={() => fetchHistory(1)}
            disabled={historyLoading}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-primary-500 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={historyLoading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {/* History list */}
        {jobCards.length === 0 && !historyLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-300">
            <ClipboardList className="w-[60px] h-[60px]" />
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
                  className={`grid grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-blue-50/50 transition-colors duration-150 group ${!isLast ? 'border-b border-gray-50' : ''}`}
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
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors duration-150" />
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
