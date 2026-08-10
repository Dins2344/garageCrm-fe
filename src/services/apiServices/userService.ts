import api from './apiInterceptor';
import type { User } from '../../types/models';
import type { ApiListResponse, ApiItemResponse, ApiMessageResponse } from '../../types/api';

export const getUsers = (params?: { search?: string }): Promise<ApiListResponse<User>> =>
  api.get('/users', { params }).then(r => r.data);

export const getUser = (id: string): Promise<ApiItemResponse<User>> =>
  api.get(`/users/${id}`).then(r => r.data);

export const createUser = (data: Partial<User> & { password: string }): Promise<ApiItemResponse<User>> =>
  api.post('/users', data).then(r => r.data);

export const updateUser = (id: string, data: Partial<User> & { password?: string }): Promise<ApiItemResponse<User>> =>
  api.put(`/users/${id}`, data).then(r => r.data);

export const deleteUser = (id: string): Promise<ApiMessageResponse> =>
  api.delete(`/users/${id}`).then(r => r.data);

export const getMechanics = (): Promise<User[]> =>
  api.get('/users').then(r => r.data.data.filter((u: User) => u.role === 'mechanic'));

export const getAdvisors = (): Promise<User[]> =>
  api.get('/users').then(r => r.data.data.filter((u: User) =>
    u.role === 'service_advisor' || u.role === 'owner' || u.role === 'admin'
  ));
