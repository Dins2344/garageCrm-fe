import api from './apiInterceptor';
import type { Vehicle, JobCard } from '../../types/models';
import type { ApiListResponse, ApiItemResponse, ApiMessageResponse } from '../../types/api';

export interface VehicleListParams {
  search?: string;
  page?: number;
  limit?: number;
}

export const getVehicles = (params?: VehicleListParams): Promise<ApiListResponse<Vehicle>> =>
  api.get('/vehicles', { params }).then(r => r.data);

export const getVehicle = (id: string): Promise<ApiItemResponse<Vehicle>> =>
  api.get(`/vehicles/${id}`).then(r => r.data);

export const getVehicleHistory = (id: string, params?: { page?: number; limit?: number }): Promise<ApiListResponse<JobCard>> =>
  api.get(`/vehicles/${id}/history`, { params }).then(r => r.data);

export const createVehicle = (data: Partial<Vehicle> & { customer: string }): Promise<ApiItemResponse<Vehicle>> =>
  api.post('/vehicles', data).then(r => r.data);

export const updateVehicle = (id: string, data: Partial<Vehicle>): Promise<ApiItemResponse<Vehicle>> =>
  api.put(`/vehicles/${id}`, data).then(r => r.data);

export const deleteVehicle = (id: string): Promise<ApiMessageResponse> =>
  api.delete(`/vehicles/${id}`).then(r => r.data);
