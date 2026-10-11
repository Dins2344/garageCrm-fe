import api from './apiInterceptor';
import type { AppNotification } from '../../types/models';
import type { ApiListResponse, ApiItemResponse } from '../../types/api';
import { API_BASE_URL } from '../../utils/constants';

export const getNotifications = (params?: { page?: number; limit?: number }): Promise<ApiListResponse<AppNotification>> =>
  api.get('/notifications', { params }).then(r => r.data);

export const getUnreadCount = (): Promise<number> =>
  api.get('/notifications/unread-count').then(r => r.data.data.count as number);

export const markNotificationRead = (id: string): Promise<ApiItemResponse<AppNotification>> =>
  api.put(`/notifications/${id}/read`).then(r => r.data);

export const markAllNotificationsRead = (): Promise<{ success: boolean; data: { updated: number } }> =>
  api.put('/notifications/read-all').then(r => r.data);

/** Server-Sent Events. Authenticated by the session cookie, since EventSource cannot send headers. */
export const openNotificationStream = (): EventSource =>
  new EventSource(`${API_BASE_URL}/notifications/stream`, { withCredentials: true });
