import api from './apiInterceptor';
import type { Garage } from '../../types/models';
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
