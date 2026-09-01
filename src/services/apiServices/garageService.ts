import api from './apiInterceptor';
import type { Address, Garage, GarageSettings, User } from '../../types/models';
import type { ApiItemResponse } from '../../types/api';

/**
 * The API merges `settings` and `address` key-by-key (dotted-path `$set`), so
 * a caller may send just the sub-keys it owns and the rest are preserved.
 * `Partial<Garage>` alone would wrongly demand a complete sub-document.
 */
export type GarageUpdatePayload = Partial<Omit<Garage, 'settings' | 'address'>> & {
  settings?: Partial<GarageSettings>;
  address?: Partial<Address>;
};

export const getGarage = (): Promise<ApiItemResponse<Garage>> =>
  api.get('/garage').then(r => r.data);

export const updateGarage = (data: GarageUpdatePayload): Promise<ApiItemResponse<Garage>> =>
  api.put('/garage', data).then(r => r.data);

export const listBranches = (): Promise<ApiItemResponse<Garage[]>> =>
  api.get('/garage/branches').then(r => r.data);

export const createBranch = (
  data: Pick<Garage, 'name' | 'phone'> & Partial<Pick<Garage, 'email' | 'gstNumber' | 'address'>>
): Promise<ApiItemResponse<Garage>> =>
  api.post('/garage/branches', data).then(r => r.data);

export const getBranchStaff = (garageId: string): Promise<ApiItemResponse<User[]>> =>
  api.get(`/garage/branches/${garageId}/staff`).then(r => r.data);

export interface DeleteBranchPayload {
  staffAction?: 'delete' | 'reassign';
  reassignToGarageId?: string;
}

export interface DeleteBranchResult {
  deletedGarageId: string;
  fallbackGarageId: string;
}

export const deleteBranch = (
  garageId: string,
  payload?: DeleteBranchPayload
): Promise<ApiItemResponse<DeleteBranchResult>> =>
  api.delete(`/garage/branches/${garageId}`, { data: payload }).then(r => r.data);

/** How many rows of each kind the removal deleted. */
export interface RemovedSampleDataCounts {
  customers: number;
  vehicles: number;
  jobCards: number;
  invoices: number;
}

/**
 * Clears the demo rows a garage is seeded with at registration. Scoped
 * server-side to the caller's own garage — there is no id to pass.
 */
export const removeSampleData = (): Promise<ApiItemResponse<RemovedSampleDataCounts>> =>
  api.delete('/garage/sample-data').then(r => r.data);
