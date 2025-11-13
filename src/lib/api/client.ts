import axios, { AxiosInstance, AxiosError } from 'axios';
import Cookies from 'js-cookie';

const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' && window.location.protocol === 'https:' 
    ? 'https://bookmarks-topic.cloud/api'
    : 'http://localhost:8080/api'),
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加JWT token
apiClient.interceptors.request.use((config) => {
  const token = Cookies.get('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器 - 处理认证错误
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      Cookies.remove('auth_token');
      Cookies.remove('user');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

