// ─────────────────────────────────────────────────────────────
//  constants.js — Application-wide constants for Garage CRM
//  Import what you need:  import { TOKEN_KEY, JOB_STATUSES } from '../utils/constants';
// ─────────────────────────────────────────────────────────────

// ── API ───────────────────────────────────────────────────────
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ── Local-storage keys ────────────────────────────────────────
export const TOKEN_KEY = 'garagepulse_token';
export const USER_KEY = 'garagepulse_user';
export const ADMIN_TOKEN_KEY = 'garagepulse_admin_token';

// ── Pagination ────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 10;
export const DROPDOWN_FETCH_LIMIT = 200;   // used when loading lists for dropdowns

// ── User Roles ────────────────────────────────────────────────
export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  SERVICE_ADVISOR: 'service_advisor',
  MECHANIC: 'mechanic',
  RECEPTIONIST: 'receptionist',
};

export const ROLE_LABELS = {
  [ROLES.OWNER]: 'Owner',
  [ROLES.ADMIN]: 'Admin',
  [ROLES.SERVICE_ADVISOR]: 'Service Advisor',
  [ROLES.MECHANIC]: 'Mechanic',
  [ROLES.RECEPTIONIST]: 'Receptionist',
};

// ── Job Card Statuses ─────────────────────────────────────────
export const JOB_STATUSES = {
  NEW: 'new',
  ESTIMATION_SENT: 'estimation_sent',
  APPROVED: 'approved',
  IN_PROGRESS: 'in_progress',
  QUALITY_CHECK: 'quality_check',
  READY_FOR_PICKUP: 'ready_for_pickup',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

/** Ordered list — used for filter dropdowns and badge rendering */
export const JOB_STATUS_OPTIONS = [
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
export const SERVICE_TYPES = {
  SERVICE: 'service',
  REPAIR: 'repair',
  ACCIDENT: 'accident',
};

export const SERVICE_TYPE_OPTIONS = [
  { value: SERVICE_TYPES.SERVICE, label: 'Periodic Service' },
  { value: SERVICE_TYPES.REPAIR, label: 'General Repair' },
  { value: SERVICE_TYPES.ACCIDENT, label: 'Accident Repair' },
];

// ── Complaint Priority ────────────────────────────────────────
export const COMPLAINT_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
};

export const COMPLAINT_PRIORITY_OPTIONS = [
  { value: COMPLAINT_PRIORITIES.LOW, label: 'Low' },
  { value: COMPLAINT_PRIORITIES.MEDIUM, label: 'Medium' },
  { value: COMPLAINT_PRIORITIES.HIGH, label: 'High' },
];

// ── Vehicle ───────────────────────────────────────────────────
export const FUEL_TYPES = ['petrol', 'diesel', 'cng', 'electric', 'hybrid', 'other'];

export const FUEL_TYPE_OPTIONS = FUEL_TYPES.map((f) => ({
  value: f,
  label: f.charAt(0).toUpperCase() + f.slice(1),
}));

// ── Currency / Locale ─────────────────────────────────────────
export const CURRENCY_SYMBOL = '₹';
export const LOCALE = 'en-IN';

// ── Date Formatting ───────────────────────────────────────────
/** Standard short date format used across the app */
export const DATE_FORMAT_OPTIONS = {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
};

// ── App Branding ──────────────────────────────────────────────
export const APP_NAME = 'GaragePulse';
export const APP_VERSION = '1.0.0';
