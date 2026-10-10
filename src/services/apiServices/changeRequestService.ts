import api from './apiInterceptor';
import type { ChangeRequest, ChangeRequestStatus, ChangeRequestType } from '../../types/models';
import type { ApiListResponse, ApiItemResponse } from '../../types/api';

export interface ChangeRequestListParams {
  status?: ChangeRequestStatus;
  type?: ChangeRequestType;
  targetId?: string;
  page?: number;
  limit?: number;
}

export interface RaiseChangeRequestInput {
  type: ChangeRequestType;
  targetId: string;
  payload: Record<string, unknown>;
}

export const getChangeRequests = (params?: ChangeRequestListParams): Promise<ApiListResponse<ChangeRequest>> =>
  api.get('/change-requests', { params }).then(r => r.data);

export const getChangeRequest = (id: string): Promise<ApiItemResponse<ChangeRequest>> =>
  api.get(`/change-requests/${id}`).then(r => r.data);

export const raiseChangeRequest = (data: RaiseChangeRequestInput): Promise<ApiItemResponse<ChangeRequest>> =>
  api.post('/change-requests', data).then(r => r.data);

export const approveChangeRequest = (id: string, note = ''): Promise<ApiItemResponse<ChangeRequest>> =>
  api.put(`/change-requests/${id}/approve`, { note }).then(r => r.data);

export const rejectChangeRequest = (id: string, note = ''): Promise<ApiItemResponse<ChangeRequest>> =>
  api.put(`/change-requests/${id}/reject`, { note }).then(r => r.data);

export const withdrawChangeRequest = (id: string): Promise<ApiItemResponse<ChangeRequest>> =>
  api.put(`/change-requests/${id}/withdraw`).then(r => r.data);
