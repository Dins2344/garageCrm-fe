// ─────────────────────────────────────────────────────────────
//  constants.ts — Application-wide constants for Garage CRM
//  Import what you need:  import { TOKEN_KEY, JOB_STATUSES } from '../utils/constants';
// ─────────────────────────────────────────────────────────────
import type { Role, JobStatus, ServiceType, ComplaintPriority, FuelType } from '../types/models';

// ── API ───────────────────────────────────────────────────────
export const API_BASE_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ── Local-storage keys ────────────────────────────────────────
// Never inline these as string literals — a typo in one of several call sites
// is silent, and a key that logout forgets to clear leaks between users on a
// shared device. MIRROR: these names must match mobile/src/utils/constants.ts.
export const TOKEN_KEY = 'garagepulse_token';
export const USER_KEY = 'garagepulse_user';
export const ADMIN_TOKEN_KEY = 'garagepulse_admin_token';
export const ADMIN_USER_KEY = 'garagepulse_admin_user';
export const ACTIVE_GARAGE_KEY = 'garagepulse_active_garage';

// ── External links ────────────────────────────────────────────
/**
 * Google Play listing for the Android app.
 *
 * The `id` query param must match `android.package` in `mobile/app.json`
 * (currently `com.dctechs.garagepulse`) — if the package is ever renamed, this
 * URL silently starts resolving to a "not found" page.
 */
export const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.dctechs.garagepulse';

/** Decorative carbon-fibre texture used behind dark panels. */
export const CARBON_FIBRE_TEXTURE_URL =
  'https://www.transparenttextures.com/patterns/carbon-fibre.png';

// ── Pagination ────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 10;
export const DROPDOWN_FETCH_LIMIT = 200;   // used when loading lists for dropdowns

// ── User Roles ────────────────────────────────────────────────
export const ROLES: Record<string, Role> = {
  OWNER: 'owner',
  ADMIN: 'admin',
  SERVICE_ADVISOR: 'service_advisor',
  MECHANIC: 'mechanic',
  RECEPTIONIST: 'receptionist',
};

export const ROLE_LABELS: Record<Role, string> = {
  owner: 'Owner',
  admin: 'Admin',
  service_advisor: 'Service Advisor',
  mechanic: 'Mechanic',
  receptionist: 'Receptionist',
};

// ── Job Card Statuses ─────────────────────────────────────────
export const JOB_STATUSES: Record<string, JobStatus> = {
  NEW: 'new',
  ESTIMATION_SENT: 'estimation_sent',
  APPROVED: 'approved',
  IN_PROGRESS: 'in_progress',
  QUALITY_CHECK: 'quality_check',
  READY_FOR_PICKUP: 'ready_for_pickup',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

export interface SelectOption {
  value: string;
  label: string;
}

/** Ordered list — used for filter dropdowns and badge rendering */
export const JOB_STATUS_OPTIONS: SelectOption[] = [
  { value: '', label: 'All Status' },
  { value: JOB_STATUSES.NEW, label: 'New' },
  { value: JOB_STATUSES.ESTIMATION_SENT, label: 'Estimation Sent' },
  { value: JOB_STATUSES.APPROVED, label: 'Approved' },
  { value: JOB_STATUSES.IN_PROGRESS, label: 'In Progress' },
  { value: JOB_STATUSES.QUALITY_CHECK, label: 'Quality Check' },
  { value: JOB_STATUSES.READY_FOR_PICKUP, label: 'Ready for Pickup' },
  { value: JOB_STATUSES.DELIVERED, label: 'Delivered' },
  { value: JOB_STATUSES.CANCELLED, label: 'Cancelled' },
];

// ── Service Types ─────────────────────────────────────────────
export const SERVICE_TYPES: Record<string, ServiceType> = {
  SERVICE: 'service',
  REPAIR: 'repair',
  ACCIDENT: 'accident',
};

export const SERVICE_TYPE_OPTIONS: SelectOption[] = [
  { value: SERVICE_TYPES.SERVICE, label: 'Periodic Service' },
  { value: SERVICE_TYPES.REPAIR, label: 'General Repair' },
  { value: SERVICE_TYPES.ACCIDENT, label: 'Accident Repair' },
];

// ── Complaint Priority ────────────────────────────────────────
export const COMPLAINT_PRIORITIES: Record<string, ComplaintPriority> = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
};

export const COMPLAINT_PRIORITY_OPTIONS: SelectOption[] = [
  { value: COMPLAINT_PRIORITIES.LOW, label: 'Low' },
  { value: COMPLAINT_PRIORITIES.MEDIUM, label: 'Medium' },
  { value: COMPLAINT_PRIORITIES.HIGH, label: 'High' },
];

// ── Vehicle ───────────────────────────────────────────────────
export const FUEL_TYPES: FuelType[] = ['petrol', 'diesel', 'cng', 'electric', 'hybrid', 'other'];

export const FUEL_TYPE_OPTIONS: SelectOption[] = FUEL_TYPES.map((f) => ({
  value: f,
  label: f.charAt(0).toUpperCase() + f.slice(1),
}));

// Currency and locale are NOT constants — they come from the garage's
// resolved locale (utils/locale.ts + GarageContext) and are applied through
// utils/format.ts. The old CURRENCY_SYMBOL/LOCALE pair hardcoded ₹ and en-IN
// for every tenant; anything reintroducing them would silently re-break
// non-Indian garages.

// ── Date Formatting ───────────────────────────────────────────
/** Standard short date format used across the app */
export const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
};

// ── App Branding ──────────────────────────────────────────────
export const APP_NAME = 'GaragePulse';
export const APP_VERSION = '1.0.0';
