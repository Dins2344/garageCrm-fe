import api from './apiInterceptor';
import type { InventoryItem } from '../../types/models';
import type { ApiListResponse, ApiItemResponse, ApiMessageResponse } from '../../types/api';

export interface InventoryListParams {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export const getInventoryItems = (params?: InventoryListParams): Promise<ApiListResponse<InventoryItem>> =>
  api.get('/inventory', { params }).then(r => r.data);

export const getInventoryItem = (id: string): Promise<ApiItemResponse<InventoryItem>> =>
  api.get(`/inventory/${id}`).then(r => r.data);

export const createInventoryItem = (data: Partial<InventoryItem>): Promise<ApiItemResponse<InventoryItem>> =>
  api.post('/inventory', data).then(r => r.data);

export const updateInventoryItem = (id: string, data: Partial<InventoryItem>): Promise<ApiItemResponse<InventoryItem>> =>
  api.put(`/inventory/${id}`, data).then(r => r.data);

export const deleteInventoryItem = (id: string): Promise<ApiMessageResponse> =>
  api.delete(`/inventory/${id}`).then(r => r.data);
