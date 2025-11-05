export interface User {
  id: number;
  username: string;
  email: string;
}

export interface Bookmark {
  id?: number;
  userId: number;
  categoryId?: number;
  title: string;
  url: string;
  description?: string;
  faviconUrl?: string;
  tags?: string;
  isStarred?: boolean;
  clickCount?: number;
  addDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: number;
  userId: number;
  name: string;
  parentId?: number;
  sortOrder?: number;
  createdAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface LoginRequest {
  username: string;
  password: string;
  verificationCode?: string;
}

export interface SendVerificationCodeRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface JwtResponse {
  token: string;
  type: string;
  userId: number;
  username: string;
}

export interface ImportResult {
  importId: number;
  totalCount: number;
  successCount: number;
  failCount: number;
  message: string;
}

export interface ImportTask {
  id: number;
  userId: number;
  filename: string;
  importType: 'BROWSER_SYNC' | 'HTML_UPLOAD';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  totalCount: number;
  successCount: number;
  failCount: number;
  processedCount: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt?: string;
  progress?: number;
}

export interface BookmarkHistory {
  id: number;
  userId: number;
  version: number;
  fileName?: string;
  filePath?: string;
  bookmarkCount: number;
  hasChanges: boolean;
  commitMessage?: string;
  previousVersion?: number;
  webdavStored: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface WebDAVConfig {
  webdavUrl: string;
  webdavUsername: string;
  webdavPassword: string;
}

export interface CommitRequest {
  commitMessage?: string;
}

export interface ModifiedBookmark {
  old: Bookmark;
  new: Bookmark;
}

export interface VersionComparison {
  version1: number;
  version2: number;
  added: number;
  removed: number;
  modified: number;
  totalOld: number;
  totalNew: number;
  version1Info: BookmarkHistory;
  version2Info: BookmarkHistory;
  addedList?: Bookmark[];
  removedList?: Bookmark[];
  modifiedList?: ModifiedBookmark[];
}

export interface WebDAVFile {
  name: string;
  path: string;
  size?: number;
  lastModified?: string;
  contentType?: string;
}

