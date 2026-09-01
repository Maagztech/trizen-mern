import api from './axios';
import { ApiResponse, ProviderProfile, StatusHistoryItem } from '../types';

export const providerApi = {
  getProfile: () =>
    api.get<ApiResponse<{ profile: ProviderProfile; user: unknown; completionPercentage: number }>>('/providers/profile'),

  updateProfile: (data: Record<string, unknown>) =>
    api.put<ApiResponse<{ profile: ProviderProfile; completionPercentage: number }>>('/providers/profile', data),

  uploadPhoto: (file: File, onProgress?: (pct: number) => void) => {
    const form = new FormData();
    form.append('photo', file);
    return api.post<ApiResponse<{ profilePhoto: string }>>('/providers/profile/photo', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (e.total && onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    });
  },

  uploadDocument: (file: File, documentType: string, onProgress?: (pct: number) => void) => {
    const form = new FormData();
    form.append('document', file);
    form.append('documentType', documentType);
    return api.post<ApiResponse<ProviderProfile>>('/providers/documents', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (e.total && onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    });
  },

  deleteDocument: (id: string) => api.delete<ApiResponse<ProviderProfile>>(`/providers/documents/${id}`),

  submitApplication: () => api.post<ApiResponse<ProviderProfile>>('/providers/application/submit'),

  getApplication: () => providerApi.getProfile(),

  getHistory: () => api.get<ApiResponse<StatusHistoryItem[]>>('/providers/application/history'),
};
