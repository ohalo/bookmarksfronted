'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';
import BookmarkGrid from '@/components/bookmarks/BookmarkGrid';
import BookmarkHistoryList from '@/components/history/BookmarkHistoryList';
import WebDAVConfigComponent from '@/components/webdav/WebDAVConfig';
import WebDAVFileManager from '@/components/webdav/WebDAVFileManager';

type TabType = 'bookmarks' | 'history' | 'webdav' | 'webdav-files';

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('bookmarks');
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // 只在客户端执行
    setMounted(true);
    const authenticated = auth.isAuthenticated();
    setIsAuthenticated(authenticated);
    
    if (!authenticated) {
      router.push('/login');
    }
  }, [router]);

  const handleLogout = () => {
    auth.logout();
    router.push('/login');
  };

  // 在客户端挂载之前，返回一个占位符以避免 hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">加载中...</h1>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">未授权，正在跳转...</h1>
        </div>
      </div>
    );
  }

  const user = auth.getUser();

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <nav className="topbar" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="topbar-left">
          <h1 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, margin: 0 }}>
            书签管理平台
          </h1>
        </div>
        <div className="topbar-right">
          <span style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)' }}>
            欢迎，{user?.username}
          </span>
          <button
            onClick={handleLogout}
            className="pill"
          >
            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>退出登录</span>
          </button>
        </div>
      </nav>

      {/* 标签导航 */}
      <div style={{ 
        background: 'var(--surface)', 
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: '48px',
        zIndex: 99
      }}>
        <div style={{ display: 'flex', gap: 'var(--space-4)', padding: '0 var(--space-4)' }}>
          <button
            onClick={() => setActiveTab('bookmarks')}
            className="pill"
            style={{
              borderRadius: 0,
              borderBottom: activeTab === 'bookmarks' ? '2px solid var(--primary)' : '2px solid transparent',
              background: 'transparent',
              boxShadow: 'none',
              padding: 'var(--space-3) var(--space-2)',
              marginBottom: '-1px'
            }}
          >
            <span style={{ 
              color: activeTab === 'bookmarks' ? 'var(--primary)' : 'var(--muted)',
              fontWeight: activeTab === 'bookmarks' ? 600 : 400
            }}>
              我的书签
            </span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className="pill"
            style={{
              borderRadius: 0,
              borderBottom: activeTab === 'history' ? '2px solid var(--primary)' : '2px solid transparent',
              background: 'transparent',
              boxShadow: 'none',
              padding: 'var(--space-3) var(--space-2)',
              marginBottom: '-1px'
            }}
          >
            <span style={{ 
              color: activeTab === 'history' ? 'var(--primary)' : 'var(--muted)',
              fontWeight: activeTab === 'history' ? 600 : 400
            }}>
              历史记录
            </span>
          </button>
          {/* <button
            onClick={() => setActiveTab('webdav')}
            className="pill"
            style={{
              borderRadius: 0,
              borderBottom: activeTab === 'webdav' ? '2px solid var(--primary)' : '2px solid transparent',
              background: 'transparent',
              boxShadow: 'none',
              padding: 'var(--space-3) var(--space-2)',
              marginBottom: '-1px'
            }}
          >
            <span style={{ 
              color: activeTab === 'webdav' ? 'var(--primary)' : 'var(--muted)',
              fontWeight: activeTab === 'webdav' ? 600 : 400
            }}>
              WebDAV配置
            </span>
          </button> */}
          <button
            onClick={() => setActiveTab('webdav-files')}
            className="pill"
            style={{
              borderRadius: 0,
              borderBottom: activeTab === 'webdav-files' ? '2px solid var(--primary)' : '2px solid transparent',
              background: 'transparent',
              boxShadow: 'none',
              padding: 'var(--space-3) var(--space-2)',
              marginBottom: '-1px'
            }}
          >
                 <span style={{
                   color: activeTab === 'webdav-files' ? 'var(--primary)' : 'var(--muted)',
                   fontWeight: activeTab === 'webdav-files' ? 600 : 400
                 }}>
                   书签文件
                 </span>
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div>
        {activeTab === 'bookmarks' && <BookmarkGrid />}
        {activeTab === 'history' && <BookmarkHistoryList />}
        {activeTab === 'webdav' && <WebDAVConfigComponent />}
        {activeTab === 'webdav-files' && <WebDAVFileManager />}
      </div>
    </div>
  );
}

