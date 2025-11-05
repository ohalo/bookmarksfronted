import apiClient from './client';
import { Category, ApiResponse } from '@/types';

export const categoryApi = {
  getAll: () => apiClient.get<ApiResponse<Category[]>>('/categories'),
  
  create: (category: Omit<Category, 'id' | 'createdAt'>) => 
    apiClient.post<ApiResponse<Category>>('/categories', category),
  
  delete: (id: number) => 
    apiClient.delete<ApiResponse<void>>(`/categories/${id}`),
};

