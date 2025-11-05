import apiClient from './client';
import { Bookmark, ApiResponse, ImportResult, ImportTask, BookmarkHistory, CommitRequest, VersionComparison, WebDAVFile } from '@/types';

export const bookmarkApi = {
  getAll: () => apiClient.get<ApiResponse<Bookmark[]>>('/bookmarks'),
  
  getByCategory: (categoryId: number) => 
    apiClient.get<ApiResponse<Bookmark[]>>(`/bookmarks/category/${categoryId}`),
  
  create: (bookmark: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>) => 
    apiClient.post<ApiResponse<Bookmark>>('/bookmarks', bookmark),
  
  update: (id: number, bookmark: Partial<Bookmark>) => 
    apiClient.put<ApiResponse<Bookmark>>(`/bookmarks/${id}`, bookmark),
  
  delete: (id: number) => 
    apiClient.delete<ApiResponse<void>>(`/bookmarks/${id}`),
  
  importHtml: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<ApiResponse<ImportResult>>('/bookmarks/import/html', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  getImportTasks: () => 
    apiClient.get<ApiResponse<ImportTask[]>>('/bookmarks/import/tasks'),
  
  getImportTask: (taskId: number) => 
    apiClient.get<ApiResponse<ImportTask>>(`/bookmarks/import/tasks/${taskId}`),
  
  // 书签历史相关API
  commitBookmarks: (commitRequest: CommitRequest) =>
    apiClient.post<ApiResponse<BookmarkHistory>>('/bookmarks/commit', commitRequest),
  
  getHistory: () =>
    apiClient.get<ApiResponse<BookmarkHistory[]>>('/bookmarks/history'),
  
  getHistoryByVersion: (version: number) =>
    apiClient.get<ApiResponse<BookmarkHistory>>(`/bookmarks/history/version/${version}`),
  
  compareVersions: (version1: number, version2: number, signal?: AbortSignal) =>
    apiClient.get<ApiResponse<VersionComparison>>(`/bookmarks/history/compare?version1=${version1}&version2=${version2}`, {
      signal
    }),
  
  // WebDAV文件管理相关API
  listWebDAVFiles: () =>
    apiClient.get<ApiResponse<WebDAVFile[]>>('/bookmarks/webdav/files'),
  
        deleteWebDAVFile: (filePath: string) =>
          apiClient.delete<ApiResponse<void>>(`/bookmarks/webdav/files?filePath=${encodeURIComponent(filePath)}`),
        
        downloadWebDAVFile: (filePath: string) =>
          apiClient.get(`/bookmarks/webdav/files/download?filePath=${encodeURIComponent(filePath)}`, {
            responseType: 'blob'
          })
};

