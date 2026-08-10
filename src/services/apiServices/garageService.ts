import api from './apiInterceptor';
import type { Garage } from '../../types/models';
import type { ApiItemResponse } from '../../types/api';

export const getGarage = (): Promise<ApiItemResponse<Garage>> =>
  api.get('/garage').then(r => r.data);

export const updateGarage = (data: Partial<Garage>): Promise<ApiItemResponse<Garage>> =>
  api.put('/garage', data).then(r => r.data);
