import apiClient from './client';
import { ApiResponse, Feedback, CreateFeedbackRequest } from '@/types';

export const feedbackApi = {
  // 获取所有留言列表
  getAllFeedbacks: (type?: string) => {
    const params = type ? { type } : {};
    return apiClient.get<ApiResponse<Feedback[]>>('/feedback', { params });
  },
  
  // 获取我的留言列表
  getMyFeedbacks: () => 
    apiClient.get<ApiResponse<Feedback[]>>('/feedback/my'),
  
  // 获取留言详情
  getFeedbackById: (id: number) => 
    apiClient.get<ApiResponse<Feedback>>(`/feedback/${id}`),
  
  // 创建留言
  createFeedback: (data: CreateFeedbackRequest) => 
    apiClient.post<ApiResponse<Feedback>>('/feedback', data),
  
  // 回复留言
  replyFeedback: (id: number, data: CreateFeedbackRequest) => 
    apiClient.post<ApiResponse<Feedback>>(`/feedback/${id}/reply`, data),
  
  // 更新留言状态
  updateFeedbackStatus: (id: number, status: string) => 
    apiClient.put<ApiResponse<Feedback>>(`/feedback/${id}/status`, null, { 
      params: { status } 
    }),
  
  // 删除留言
  deleteFeedback: (id: number) => 
    apiClient.delete<ApiResponse<string>>(`/feedback/${id}`),
};

