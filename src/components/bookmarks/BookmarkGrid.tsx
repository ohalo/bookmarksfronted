'use client';

import { useState, useEffect } from 'react';
import { bookmarkApi } from '@/lib/api/bookmarkApi';
import { categoryApi } from '@/lib/api/categoryApi';
import { Bookmark, Category } from '@/types';
import ImportTaskList from '../import/ImportTaskList';
import BookmarkTree from './BookmarkTree';

export default function BookmarkGrid() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [importMessage, setImportMessage] = useState('');
  const [showTaskList, setShowTaskList] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [showCommitDialog, setShowCommitDialog] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // 并行加载书签和分类
      const [bookmarksResponse, categoriesResponse] = await Promise.all([
        bookmarkApi.getAll(),
        categoryApi.getAll(),
      ]);
      
      if (bookmarksResponse.data.success) {
        setBookmarks(bookmarksResponse.data.data);
      }
      
      if (categoriesResponse.data.success) {
        setCategories(categoriesResponse.data.data);
      }
    } catch (err: any) {
      setError('加载数据失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    setCommitting(true);
    try {
      const response = await bookmarkApi.commitBookmarks({
        commitMessage: commitMessage || undefined,
      });
      if (response.data.success) {
        setImportMessage('书签已成功提交到WebDAV');
        setShowCommitDialog(false);
        setCommitMessage('');
        setTimeout(() => {
          setImportMessage('');
        }, 3000);
      }
    } catch (err: any) {
      setImportMessage('提交失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setCommitting(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
      setImportMessage('请选择HTML格式的书签文件');
      return;
    }

    try {
      setImportMessage('导入任务已启动，请查看任务列表...');
      const response = await bookmarkApi.importHtml(file);
      if (response.data.success) {
        // 显示任务列表
        setShowTaskList(true);
        // 3秒后自动隐藏消息
        setTimeout(() => {
          setImportMessage('');
        }, 3000);
      }
    } catch (err: any) {
      setImportMessage('导入失败: ' + (err.response?.data?.message || err.message));
    } finally {
      // 清空文件输入
      event.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* 顶部栏 */}
      <header className="topbar">
        <div className="topbar-left">
          <nav className="breadcrumb">
            <span className="breadcrumb-item active">
              <svg className="breadcrumb-icon folder" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>
              </svg>
              <span className="breadcrumb-text">我的书签</span>
            </span>
          </nav>
        </div>
        <div className="topbar-right">
          <button
            onClick={() => setShowTaskList(!showTaskList)}
            className="icon-btn"
            title="查看导入任务"
          >
            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4"/>
              <path d="M21 12c.552 0 1-.448 1-1V5c0-.552-.448-1-1-1H3c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1h18z"/>
              <path d="M3 12v6c0 .552.448 1 1 1h16c.552 0 1-.448 1-1v-6"/>
            </svg>
          </button>
          <input
            type="file"
            accept=".html,.htm"
            onChange={handleFileUpload}
            className="hidden"
            id="html-upload"
          />
          <label
            htmlFor="html-upload"
            className="icon-btn"
            title="导入HTML书签"
          >
            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <path d="M7 10l5 5 5-5"/>
              <path d="M12 15V3"/>
            </svg>
          </label>
        </div>
      </header>

      {/* 搜索行 */}
      <div className="search-row">
        <div className="search-wrap">
          <svg className="icon search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="search"
            placeholder="搜索书签..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="icon-btn"
              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', padding: '4px' }}
            >
              <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 操作按钮区域 */}
      <div style={{ padding: '8px 12px', display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)' }}>
        <button
          onClick={() => setShowCommitDialog(true)}
          className="pill success"
        >
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
            <path d="M21 3v5h-5"/>
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
            <path d="M3 21v-5h5"/>
          </svg>
          <span>提交到WebDAV</span>
        </button>
      </div>

      {/* 提交对话框 */}
      {showCommitDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">提交书签到WebDAV</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                提交信息（可选）
              </label>
              <input
                type="text"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="例如：更新书签列表"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="text-sm text-gray-600 mb-4">
              系统会自动检测书签是否有变化，如果有变化则会保存到WebDAV。
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCommitDialog(false);
                  setCommitMessage('');
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCommit}
                disabled={committing}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {committing ? '提交中...' : '提交'}
              </button>
            </div>
          </div>
        </div>
      )}

      {importMessage && (
        <div className={`mb-4 px-4 py-2 rounded ${
          importMessage.includes('失败') 
            ? 'bg-red-100 text-red-700' 
            : 'bg-green-100 text-green-700'
        }`}>
          {importMessage}
        </div>
      )}

      {showTaskList && (
        <div className="mb-6">
          <ImportTaskList />
        </div>
      )}

      {error && (
        <div style={{ 
          background: 'var(--danger-light)', 
          border: '1px solid var(--danger)', 
          color: 'var(--danger)', 
          padding: 'var(--space-3) var(--space-4)', 
          borderRadius: 'var(--radius)', 
          margin: 'var(--space-4)'
        }}>
          {error}
        </div>
      )}

      <div style={{ padding: 'var(--space-4)' }}>
        {bookmarks.length === 0 && categories.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg className="icon icon-xl" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </div>
            <h3 className="empty-title">暂无书签</h3>
            <p className="empty-description">点击按钮导入或添加书签</p>
          </div>
        ) : (
          <BookmarkTree
            categories={categories}
            bookmarks={bookmarks}
            searchQuery={searchQuery}
          />
        )}
      </div>
    </div>
  );
}

