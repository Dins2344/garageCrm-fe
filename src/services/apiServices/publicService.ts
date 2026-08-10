import api from './apiInterceptor';
import type { JobCard } from '../../types/models';
import type { ApiItemResponse } from '../../types/api';

/**
 * Fetch estimation details by the one-time token in the approval link.
 * No authentication required.
 */
export const getEstimationByToken = async (token: string): Promise<ApiItemResponse<JobCard>> => {
  const res = await api.get(`/public/estimate/${token}`);
  return res.data;
};

/**
 * Customer approves the estimation via the one-time link token.
 * No authentication required.
 */
export const approveEstimationByToken = async (token: string): Promise<ApiItemResponse<JobCard>> => {
  const res = await api.post(`/public/estimate/${token}/approve`);
  return res.data;
};
