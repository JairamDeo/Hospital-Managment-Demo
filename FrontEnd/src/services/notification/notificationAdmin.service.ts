import axiosInstance from '../http/axiosInstance';
import type { ApiResponse } from '@/types/api.types';

export interface HmsNotificationApiItem {
  _id: string;
  title: string;
  message: string;
  href?: string;
  type?: string;
  readAt?: string | null;
  createdAt?: string;
}

class NotificationAdminService {
  list() {
    return axiosInstance.get<ApiResponse<{ notifications: HmsNotificationApiItem[] }>>(
      '/admin/notifications'
    );
  }

  markRead(id: string) {
    return axiosInstance.post<ApiResponse<{ notification: { _id: string; readAt: string } }>>(
      `/admin/notifications/${encodeURIComponent(id)}/read`
    );
  }

  markAllRead() {
    return axiosInstance.post<ApiResponse<{ updated: number }>>('/admin/notifications/read-all');
  }
}

export const notificationAdminService = new NotificationAdminService();
