import api from './axios';
import { ApiResponse, DashboardStats, Pagination, ProviderProfile, StatusHistoryItem } from '../types';

export interface ProviderListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
  city?: string;
  minExperience?: number;
  maxExperience?: number;
  sortBy?: string;
  sortOrder?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const adminApi = {
  listProviders: (params: ProviderListParams) =>
    api.get<ApiResponse<{ data: ProviderProfile[]; pagination: Pagination }>>('/admin/providers', { params }),

  getProvider: (id: string) =>
    api.get<ApiResponse<{
      profile: ProviderProfile;
      history: StatusHistoryItem[];
      auditLogs: unknown[];
    }>>(`/admin/providers/${id}`),

  updateStatus: (id: string, data: { status: string; remarks?: string }) =>
    api.patch<ApiResponse<ProviderProfile>>(`/admin/providers/${id}/status`, data),

  approve: (id: string) => api.patch<ApiResponse<ProviderProfile>>(`/admin/providers/${id}/approve`),

  reject: (id: string, remarks: string) =>
    api.patch<ApiResponse<ProviderProfile>>(`/admin/providers/${id}/reject`, { remarks }),

  getStatistics: () => api.get<ApiResponse<DashboardStats>>('/admin/statistics'),
};
