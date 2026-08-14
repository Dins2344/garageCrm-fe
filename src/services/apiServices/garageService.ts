import api from './apiInterceptor';
import type { Garage, User } from '../../types/models';
import type { ApiItemResponse } from '../../types/api';

export const getGarage = (): Promise<ApiItemResponse<Garage>> =>
  api.get('/garage').then(r => r.data);

export const updateGarage = (data: Partial<Garage>): Promise<ApiItemResponse<Garage>> =>
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
