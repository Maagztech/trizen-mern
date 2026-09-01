import api from './axios';
import { ApiResponse, ServiceCategory } from '../types';

export const categoryApi = {
  list: () => api.get<ApiResponse<ServiceCategory[]>>('/categories'),
};
