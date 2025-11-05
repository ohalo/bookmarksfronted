import apiClient from './client';
import { ApiResponse, JwtResponse, LoginRequest, RegisterRequest, WebDAVConfig, SendVerificationCodeRequest } from '@/types';

export const authApi = {
  login: (credentials: LoginRequest) => 
    apiClient.post<ApiResponse<JwtResponse>>('/auth/login', credentials),
  
  register: (data: RegisterRequest) => 
    apiClient.post<ApiResponse<JwtResponse>>('/auth/register', data),
  
  sendVerificationCode: (credentials: SendVerificationCodeRequest) =>
    apiClient.post<ApiResponse<string>>('/auth/send-verification-code', credentials),
  
  updateWebDAVConfig: (config: WebDAVConfig) =>
    apiClient.post<ApiResponse<string>>('/auth/webdav/config', config),
};

