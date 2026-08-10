import api from './apiInterceptor';
import type { Customer } from '../../types/models';
import type { ApiListResponse, ApiItemResponse, ApiMessageResponse } from '../../types/api';

export interface CustomerListParams {
  search?: string;
  page?: number;
  limit?: number;
}

export const getCustomers = (params?: CustomerListParams): Promise<ApiListResponse<Customer>> =>
  api.get('/customers', { params }).then(r => r.data);

export const getCustomer = (id: string): Promise<ApiItemResponse<Customer>> =>
  api.get(`/customers/${id}`).then(r => r.data);

export const createCustomer = (data: Partial<Customer>): Promise<ApiItemResponse<Customer>> =>
  api.post('/customers', data).then(r => r.data);

export const updateCustomer = (id: string, data: Partial<Customer>): Promise<ApiItemResponse<Customer>> =>
  api.put(`/customers/${id}`, data).then(r => r.data);

export const deleteCustomer = (id: string): Promise<ApiMessageResponse> =>
  api.delete(`/customers/${id}`).then(r => r.data);
