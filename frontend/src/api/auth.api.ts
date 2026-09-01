import api from './axios';
import { ApiResponse, User } from '../types';

export const authApi = {
  register: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
  }) => api.post<ApiResponse<{ user: User; token: string }>>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<{ user: User; token: string }>>('/auth/login', data),

  adminLogin: (data: { email: string; password: string }) =>
    api.post<ApiResponse<{ user: User; token: string }>>('/auth/admin/login', data),

  me: () => api.get<ApiResponse<User>>('/auth/me'),

  googleAuthUrl: () => `${import.meta.env.VITE_API_URL}/auth/google`,
};
