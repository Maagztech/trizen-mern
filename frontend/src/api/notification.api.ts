import api from './axios';
import { ApiResponse, Notification } from '../types';

export const notificationApi = {
  list: () =>
    api.get<ApiResponse<{ notifications: Notification[]; unreadCount: number }>>('/notifications'),

  markRead: (id: string) => api.patch<ApiResponse<Notification>>(`/notifications/${id}/read`),

  markAllRead: () => api.patch<ApiResponse<unknown>>('/notifications/read-all'),
};
