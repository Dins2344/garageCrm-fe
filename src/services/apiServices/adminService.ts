import axios from 'axios';
import { API_BASE_URL, ADMIN_TOKEN_KEY } from '../../utils/constants';
import type { Garage, User } from '../../types/models';
import type { ApiItemResponse } from '../../types/api';

const adminApi = axios.create({
  baseURL: `${API_BASE_URL}/admin`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Admin specific interceptor for its own token
adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export interface AdminAuthResponse {
  success: boolean;
  token: string;
  data: { email: string; role: string };
}

export interface AdminStats {
  counts: {
    garages: number;
    users: number;
    customers: number;
    vehicles: number;
    jobCards: number;
    invoices: number;
    inventory: number;
    reminders: number;
  };
  revenue: { total: number; paid: number };
  jobsByStatus: Record<string, number>;
  recentGarages: Garage[];
  recentUsers: User[];
  queryTimeMs: number;
}

export interface EnrichedGarage extends Garage {
  _counts: { users: number; customers: number; jobCards: number; invoices: number };
  _revenue: number;
}

export interface SystemHealth {
  uptime: { process: string; system: string };
  memory: { heapUsed: string; heapTotal: string; rss: string; systemTotal: string; systemFree: string };
  cpu: { cores: number; model?: string; loadAvg: string[] };
  platform: { node: string; os: string; arch: string };
  database: { status: string; host: string; name: string };
  environment: string;
}

export const adminLogin = async (email: string, password: string): Promise<AdminAuthResponse> => {
  const res = await adminApi.post('/login', { email, password });
  return res.data;
};

export const verifyAdmin = async (): Promise<ApiItemResponse<{ email: string; role: string }>> => {
  const res = await adminApi.get('/verify');
  return res.data;
};

export const getAdminStats = async (): Promise<ApiItemResponse<AdminStats>> => {
  const res = await adminApi.get('/stats');
  return res.data;
};

export const getAllGarages = async (): Promise<ApiItemResponse<EnrichedGarage[]>> => {
  const res = await adminApi.get('/garages');
  return res.data;
};

export const getAllUsers = async (): Promise<ApiItemResponse<User[]>> => {
  const res = await adminApi.get('/users');
  return res.data;
};

export const getSystemHealth = async (): Promise<ApiItemResponse<SystemHealth>> => {
  const res = await adminApi.get('/health');
  return res.data;
};

export interface DeleteUserResult {
  deletedUser: { id: string; email: string; role: string };
  cascadedGarages?: number;
  cascadedCounts?: {
    users: number;
    customers: number;
    vehicles: number;
    jobCards: number;
    invoices: number;
    inventory: number;
    reminders: number;
  };
}

export const deleteUser = async (userId: string): Promise<ApiItemResponse<DeleteUserResult>> => {
  const res = await adminApi.delete(`/users/${userId}`);
  return res.data;
};

export interface DeleteGarageResult {
  deletedGarage: { id: string; name: string };
}

export const deleteOrphanedGarage = async (garageId: string): Promise<ApiItemResponse<DeleteGarageResult>> => {
  const res = await adminApi.delete(`/garages/${garageId}`);
  return res.data;
};


/**
 * The mobile release policy. Colocated here rather than in types/models.ts,
 * which is hand-mirrored with the mobile repo and has no use for an
 * admin-only shape — same reasoning as AdminStats above.
 */
export interface AppReleasePolicy {
  platform: string;
  latestVersion: string;
  /** Blank means nobody is blocked. The undo path for a bad policy. */
  minSupportedVersion: string;
  storeUrl: string;
  updateMessage: string;
  blockingMessage: string;
  enabled: boolean;
  updatedBy?: string;
  updatedAt?: string;
}

/** `data` is null when no policy has been saved yet — a normal state, not an error. */
export const getAppRelease = async (platform = 'android'): Promise<ApiItemResponse<AppReleasePolicy | null>> => {
  const res = await adminApi.get(`/app-release?platform=${platform}`);
  return res.data;
};

/** The first write on this surface — everything else here reads or deletes. */
export const updateAppRelease = async (body: AppReleasePolicy): Promise<ApiItemResponse<AppReleasePolicy>> => {
  const res = await adminApi.put('/app-release', body);
  return res.data;
};

export default adminApi;
