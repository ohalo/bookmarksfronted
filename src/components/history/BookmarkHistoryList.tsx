'use client';

import { useState, useEffect } from 'react';
import { bookmarkApi } from '@/lib/api/bookmarkApi';
import { BookmarkHistory } from '@/types';
import VersionComparison from './VersionComparison';

export default function BookmarkHistoryList() {
  const [history, setHistory] = useState<BookmarkHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVersions, setSelectedVersions] = useState<[number | null, number | null]>([null, null]);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await bookmarkApi.getHistory();
      if (response.data.success) {
        setHistory(response.data.data);
      }
    } catch (err: any) {
      setError('加载历史记录失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleVersionSelect = (version: number, index: 0 | 1) => {
    const newSelected = [...selectedVersions] as [number | null, number | null];
    newSelected[index] = version;
    setSelectedVersions(newSelected);
  };

  const handleCompare = () => {
    if (selectedVersions[0] && selectedVersions[1]) {
      setShowComparison(true);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-center items-center h-32">
          <div className="text-gray-500">加载中...</div>
        </div>
      </div>
    );
  }

  if (showComparison && selectedVersions[0] && selectedVersions[1]) {
    return (
      <VersionComparison
        version1={selectedVersions[0]}
        version2={selectedVersions[1]}
        onBack={() => setShowComparison(false)}
      />
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
          <h2 style={{ 
            fontSize: 'var(--text-xl)', 
            fontWeight: 600, 
            color: 'var(--fg)',
            margin: 0
          }}>书签历史记录</h2>
          <button
            onClick={loadHistory}
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

      {/* 版本对比选择 */}
      {history.length > 1 && (
        <div style={{
          marginBottom: 'var(--space-6)',
          padding: 'var(--space-4)',
          background: 'var(--surface)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)'
        }}>
          <h3 style={{ 
            fontSize: 'var(--text-sm)', 
            fontWeight: 500, 
            color: 'var(--fg)',
            marginBottom: 'var(--space-3)'
          }}>对比版本</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <select
              value={selectedVersions[0] || ''}
              onChange={(e) => handleVersionSelect(Number(e.target.value), 0)}
              style={{
                padding: 'var(--space-2) var(--space-3)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                background: 'var(--bg)',
                color: 'var(--fg)',
                fontSize: 'var(--text-sm)',
                outline: 'none',
                cursor: 'pointer'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
            >
              <option value="">选择版本1</option>
              {history.map((h) => (
                <option key={h.version} value={h.version}>
                  版本 {h.version}
                </option>
              ))}
            </select>
            <span style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)' }}>vs</span>
            <select
              value={selectedVersions[1] || ''}
              onChange={(e) => handleVersionSelect(Number(e.target.value), 1)}
              style={{
                padding: 'var(--space-2) var(--space-3)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                background: 'var(--bg)',
                color: 'var(--fg)',
                fontSize: 'var(--text-sm)',
                outline: 'none',
                cursor: 'pointer'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
            >
              <option value="">选择版本2</option>
              {history.map((h) => (
                <option key={h.version} value={h.version}>
                  版本 {h.version}
                </option>
              ))}
            </select>
            <button
              onClick={handleCompare}
              disabled={!selectedVersions[0] || !selectedVersions[1]}
              className="pill"
              style={{
                opacity: (!selectedVersions[0] || !selectedVersions[1]) ? 0.5 : 1,
                cursor: (!selectedVersions[0] || !selectedVersions[1]) ? 'not-allowed' : 'pointer'
              }}
            >
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 17A7 7 0 1 1 9 3a7 7 0 0 1 0 14z"/>
                <path d="M15 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14z"/>
              </svg>
              <span>对比</span>
            </button>
          </div>
        </div>
      )}

      {history.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg className="icon icon-xl" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>
          <h3 className="empty-title">暂无历史记录</h3>
          <p className="empty-description">提交书签到WebDAV后会显示历史记录</p>
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
                }}>版本</th>
                <th style={{
                  padding: 'var(--space-3) var(--space-4)',
                  textAlign: 'left',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>书签数量</th>
                <th style={{
                  padding: 'var(--space-3) var(--space-4)',
                  textAlign: 'left',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>状态</th>
                <th style={{
                  padding: 'var(--space-3) var(--space-4)',
                  textAlign: 'left',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>提交信息</th>
                <th style={{
                  padding: 'var(--space-3) var(--space-4)',
                  textAlign: 'left',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>提交时间</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr 
                  key={item.id} 
                  style={{
                    borderBottom: '1px solid var(--border)',
                    transition: 'background var(--transition)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{
                    padding: 'var(--space-4)',
                    whiteSpace: 'nowrap'
                  }}>
                    <span style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: 600,
                      color: 'var(--fg)'
                    }}>v{item.version}</span>
                  </td>
                  <td style={{
                    padding: 'var(--space-4)',
                    whiteSpace: 'nowrap'
                  }}>
                    <span style={{
                      fontSize: 'var(--text-sm)',
                      color: 'var(--muted)'
                    }}>{item.bookmarkCount}</span>
                  </td>
                  <td style={{
                    padding: 'var(--space-4)',
                    whiteSpace: 'nowrap'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      {item.hasChanges ? (
                        <span className="pill success" style={{ fontSize: 'var(--text-xs)' }}>
                          有更新
                        </span>
                      ) : (
                        <span className="pill" style={{ 
                          fontSize: 'var(--text-xs)',
                          background: 'var(--surface)',
                          color: 'var(--muted)'
                        }}>
                          无变化
                        </span>
                      )}
                      {item.webdavStored && (
                        <span className="pill" style={{ 
                          fontSize: 'var(--text-xs)',
                          background: 'var(--primary-light)',
                          color: 'var(--primary)'
                        }}>
                          已存储
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: 'var(--space-4)' }}>
                    <span style={{
                      fontSize: 'var(--text-sm)',
                      color: 'var(--muted)'
                    }}>
                      {item.commitMessage || '自动提交'}
                    </span>
                  </td>
                  <td style={{
                    padding: 'var(--space-4)',
                    whiteSpace: 'nowrap'
                  }}>
                    <span style={{
                      fontSize: 'var(--text-sm)',
                      color: 'var(--muted)'
                    }}>{formatDate(item.createdAt)}</span>
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

