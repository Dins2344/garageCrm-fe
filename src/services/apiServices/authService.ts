import api from './apiInterceptor';
import type { User } from '../../types/models';
import type { ApiMessageResponse } from '../../types/api';

export interface AuthResponse {
  success: boolean;
  token: string;
  data: User;
}

export interface RegisterFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  garageName: string;
  garagePhone?: string;
  garageAddress?: Record<string, string>;
}

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
};

export const register = async (formData: RegisterFormData): Promise<AuthResponse> => {
  const res = await api.post('/auth/register', formData);
  return res.data;
};

export const getMe = async (): Promise<{ success: boolean; data: User }> => {
  const res = await api.get('/auth/me');
  return res.data;
};

export const updateProfile = async (data: Partial<Pick<User, 'name' | 'phone'>>): Promise<{ success: boolean; data: User }> => {
  const res = await api.put('/auth/profile', data);
  return res.data;
};

export const changePassword = async (data: { currentPassword: string; newPassword: string }): Promise<ApiMessageResponse> => {
  const res = await api.put('/auth/changepassword', data);
  return res.data;
};

export const logout = async (): Promise<{ success: boolean; data: Record<string, never> }> => {
  const res = await api.post('/auth/logout');
  return res.data;
};

export const forgotPassword = async (email: string): Promise<ApiMessageResponse> => {
  const res = await api.post('/auth/forgotpassword', { email });
  return res.data;
};

export const resetPassword = async (token: string, password: string): Promise<ApiMessageResponse> => {
  const res = await api.put(`/auth/resetpassword/${token}`, { password });
  return res.data;
};
