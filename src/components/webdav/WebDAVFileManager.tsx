'use client';

import { useState, useEffect } from 'react';
import { bookmarkApi } from '@/lib/api/bookmarkApi';
import { WebDAVFile } from '@/types';

export default function WebDAVFileManager() {
  const [files, setFiles] = useState<WebDAVFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await bookmarkApi.listWebDAVFiles();
      if (response.data.success) {
        // 按最后修改时间倒序排列
        const sortedFiles = response.data.data.sort((a, b) => {
          const timeA = a.lastModified ? new Date(a.lastModified).getTime() : 0;
          const timeB = b.lastModified ? new Date(b.lastModified).getTime() : 0;
          return timeB - timeA;
        });
        setFiles(sortedFiles);
      }
    } catch (err: any) {
      setError('加载文件列表失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (file: WebDAVFile) => {
    if (!confirm(`确定要删除文件 "${file.name}" 吗？此操作不可撤销。`)) {
      return;
    }

    try {
      setDeleting(file.path);
      setError('');
      const response = await bookmarkApi.deleteWebDAVFile(file.path);
      if (response.data.success) {
        // 从列表中移除已删除的文件
        setFiles(files.filter(f => f.path !== file.path));
      }
    } catch (err: any) {
      setError('删除文件失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = async (file: WebDAVFile) => {
    try {
      setError('');
      const blob = await bookmarkApi.downloadWebDAVFile(file.path);
      
      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError('下载文件失败: ' + (err.response?.data?.message || err.message));
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '未知';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '未知';
    return new Date(dateString).toLocaleString('zh-CN');
  };

  if (loading) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: 'var(--space-4)' }}>
        <div style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px'
        }}>
          <div style={{ color: 'var(--muted)', fontSize: 'var(--text-base)' }}>加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: 'var(--space-4)' }}>
      <div style={{ 
        background: 'var(--surface)', 
        borderRadius: 'var(--radius-lg)', 
        padding: 'var(--space-6)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
          <div>
            <h2 style={{ 
              fontSize: 'var(--text-xl)', 
              fontWeight: 600, 
              color: 'var(--fg)',
              margin: 0,
              marginBottom: 'var(--space-2)'
            }}>书签文件管理</h2>
            <p style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--muted)',
              margin: 0
            }}>
              共 {files.length} 个文件
            </p>
          </div>
          <button
            onClick={loadFiles}
            className="pill"
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
          >
            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
              <path d="M21 3v5h-5"/>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
              <path d="M3 21v-5h5"/>
            </svg>
            <span>刷新</span>
          </button>
        </div>

        {error && (
          <div style={{
            background: 'var(--danger-light)',
            border: '1px solid var(--danger)',
            color: 'var(--danger)',
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius)',
            marginBottom: 'var(--space-4)'
          }}>
            {error}
          </div>
        )}

        {files.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg className="icon icon-xl" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </div>
            <h3 className="empty-title">暂无文件</h3>
            <p className="empty-description">提交书签到WebDAV后会显示文件列表</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead style={{
                background: 'var(--surface)',
                borderBottom: '2px solid var(--border)'
              }}>
                <tr>
                  <th style={{
                    padding: 'var(--space-3) var(--space-4)',
                    textAlign: 'left',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    color: 'var(--muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>文件名</th>
                  <th style={{
                    padding: 'var(--space-3) var(--space-4)',
                    textAlign: 'left',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    color: 'var(--muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>大小</th>
                  <th style={{
                    padding: 'var(--space-3) var(--space-4)',
                    textAlign: 'left',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    color: 'var(--muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>最后修改</th>
                  <th style={{
                    padding: 'var(--space-3) var(--space-4)',
                    textAlign: 'right',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    color: 'var(--muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr 
                    key={file.path} 
                    style={{
                      borderBottom: '1px solid var(--border)',
                      transition: 'background var(--transition)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{
                      padding: 'var(--space-4)',
                      maxWidth: '400px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      <span style={{
                        fontSize: 'var(--text-sm)',
                        fontWeight: 500,
                        color: 'var(--fg)'
                      }} title={file.name}>{file.name}</span>
                    </td>
                    <td style={{
                      padding: 'var(--space-4)',
                      whiteSpace: 'nowrap'
                    }}>
                      <span style={{
                        fontSize: 'var(--text-sm)',
                        color: 'var(--muted)'
                      }}>{formatFileSize(file.size)}</span>
                    </td>
                    <td style={{
                      padding: 'var(--space-4)',
                      whiteSpace: 'nowrap'
                    }}>
                      <span style={{
                        fontSize: 'var(--text-sm)',
                        color: 'var(--muted)'
                      }}>{formatDate(file.lastModified)}</span>
                    </td>
                    <td style={{
                      padding: 'var(--space-4)',
                      textAlign: 'right',
                      whiteSpace: 'nowrap'
                    }}>
                      <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleDownload(file)}
                          className="pill"
                          style={{
                            background: 'var(--primary-light)',
                            color: 'var(--primary)',
                            fontSize: 'var(--text-xs)',
                            padding: 'var(--space-1) var(--space-3)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 'var(--space-1)'
                          }}
                        >
                          <svg className="icon" style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                          </svg>
                          <span>下载</span>
                        </button>
                        <button
                          onClick={() => handleDelete(file)}
                          disabled={deleting === file.path}
                          className="pill"
                          style={{
                            background: 'var(--danger-light)',
                            color: 'var(--danger)',
                            fontSize: 'var(--text-xs)',
                            padding: 'var(--space-1) var(--space-3)',
                            opacity: deleting === file.path ? 0.5 : 1,
                            cursor: deleting === file.path ? 'not-allowed' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 'var(--space-1)'
                          }}
                        >
                          {deleting === file.path ? (
                            <>
                              <svg className="icon" style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                                <path d="M3.27 6.96L12 12.01l8.73-5.05"/>
                                <path d="M12 22.08V12"/>
                              </svg>
                              <span>删除中...</span>
                            </>
                          ) : (
                            <>
                              <svg className="icon" style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                              </svg>
                              <span>删除</span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

