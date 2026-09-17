import type { AxiosResponse } from 'axios';
import api from './apiInterceptor';
import type { JobCard, Complaint, EstimationPart, EstimationLabor } from '../../types/models';
import type { ApiListResponse, ApiItemResponse, ApiMessageResponse } from '../../types/api';

export interface JobCardListParams {
  /** One status or several comma-separated (`new,approved`) — the API matches any. */
  status?: string;
  mechanicId?: string;
  vehicle?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateJobCardData {
  serviceType: string;
  vehicle: string;
  customer: string;
  assignedMechanic?: string;
  assignedAdvisor?: string;
  odometerAtIntake?: number;
  expectedDeliveryDate?: string;
  internalNotes?: string;
  complaints?: Complaint[];
}

export interface EstimationInput {
  parts: EstimationPart[];
  labor: EstimationLabor[];
  discount: number;
  taxRate: number;
}

export const getJobCards = (params?: JobCardListParams): Promise<ApiListResponse<JobCard>> =>
  api.get('/jobcards', { params }).then(r => r.data);

export const getJobCard = (id: string): Promise<ApiItemResponse<JobCard>> =>
  api.get(`/jobcards/${id}`).then(r => r.data);

export const createJobCard = (data: CreateJobCardData): Promise<ApiItemResponse<JobCard>> =>
  api.post('/jobcards', data).then(r => r.data);

export const updateJobCard = (id: string, data: Partial<JobCard> & Record<string, unknown>): Promise<ApiItemResponse<JobCard>> =>
  api.put(`/jobcards/${id}`, data).then(r => r.data);

export const deleteJobCard = (id: string): Promise<ApiMessageResponse> =>
  api.delete(`/jobcards/${id}`).then(r => r.data);

export const saveJobCardEstimation = (id: string, data: EstimationInput): Promise<ApiItemResponse<JobCard>> =>
  api.put(`/jobcards/${id}/estimation`, data).then(r => r.data);

export const approveJobCardEstimation = (id: string): Promise<ApiItemResponse<JobCard>> =>
  api.put(`/jobcards/${id}/approve`).then(r => r.data);

export const downloadEstimationPDF = (id: string): Promise<AxiosResponse<Blob>> =>
  api.get(`/jobcards/${id}/estimation/download`, { responseType: 'blob' });
