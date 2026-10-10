import api from './apiInterceptor';
import type { AppNotification } from '../../types/models';
import type { ApiListResponse, ApiItemResponse } from '../../types/api';

export const getNotifications = (params?: { page?: number; limit?: number }): Promise<ApiListResponse<AppNotification>> =>
  api.get('/notifications', { params }).then(r => r.data);

export const getUnreadCount = (): Promise<number> =>
  api.get('/notifications/unread-count').then(r => r.data.data.count as number);

export const markNotificationRead = (id: string): Promise<ApiItemResponse<AppNotification>> =>
  api.put(`/notifications/${id}/read`).then(r => r.data);

export const markAllNotificationsRead = (): Promise<{ success: boolean; data: { updated: number } }> =>
  api.put('/notifications/read-all').then(r => r.data);
