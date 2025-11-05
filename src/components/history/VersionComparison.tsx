'use client';

import { useState, useEffect, useRef } from 'react';
import { bookmarkApi } from '@/lib/api/bookmarkApi';
import { VersionComparison, Bookmark } from '@/types';

interface VersionComparisonProps {
  version1: number;
  version2: number;
  onBack: () => void;
}

type TabType = 'added' | 'removed' | 'modified';
const ITEMS_PER_PAGE = 10;

// 全局请求跟踪器，防止重复请求
const pendingRequests = new Map<string, AbortController>();

export default function VersionComparisonComponent({ version1, version2, onBack }: VersionComparisonProps) {
  const [comparison, setComparison] = useState<VersionComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('added');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    // 生成唯一的请求ID（基于版本号）
    const requestKey = `${version1}-${version2}`;
    
    // 如果已经有相同的请求正在进行，取消之前的请求
    if (pendingRequests.has(requestKey)) {
      const existingController = pendingRequests.get(requestKey);
      if (existingController) {
        existingController.abort();
      }
      pendingRequests.delete(requestKey);
    }
    
    let isMounted = true;
    const abortController = new AbortController();
    pendingRequests.set(requestKey, abortController);
    
    const loadComparison = async () => {
      try {
        setLoading(true);
        setError('');
        
        // 使用AbortController来取消请求
        const response = await bookmarkApi.compareVersions(
          version1, 
          version2, 
          abortController.signal
        );
        
        // 检查组件是否已卸载
        if (!isMounted) {
          return;
        }
        
        if (response.data.success) {
          setComparison(response.data.data);
        }
      } catch (err: any) {
        // 如果是取消的请求，不显示错误
        if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED' || err.message?.includes('canceled')) {
          return;
        }
        
        // 检查组件是否已卸载
        if (!isMounted) {
          return;
        }
        setError('加载对比数据失败: ' + (err.response?.data?.message || err.message));
      } finally {
        if (isMounted) {
          setLoading(false);
        }
        // 清除请求跟踪
        pendingRequests.delete(requestKey);
      }
    };
    
    loadComparison();
    
    // 清理函数
    return () => {
      isMounted = false;
      if (pendingRequests.has(requestKey)) {
        const controller = pendingRequests.get(requestKey);
        if (controller) {
          controller.abort();
        }
        pendingRequests.delete(requestKey);
      }
    };
  }, [version1, version2]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  // 获取当前页的数据
  const getCurrentPageData = () => {
    if (!comparison) return [];
    
    let data: Bookmark[] | any[] = [];
    switch (activeTab) {
      case 'added':
        data = comparison.addedList || [];
        break;
      case 'removed':
        data = comparison.removedList || [];
        break;
      case 'modified':
        data = comparison.modifiedList || [];
        break;
    }
    
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return data.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  // 获取总页数
  const getTotalPages = () => {
    if (!comparison) return 0;
    
    let count = 0;
    switch (activeTab) {
      case 'added':
        count = comparison.added;
        break;
      case 'removed':
        count = comparison.removed;
        break;
      case 'modified':
        count = comparison.modified;
        break;
    }
    
    return Math.ceil(count / ITEMS_PER_PAGE);
  };

  // 切换标签页时重置页码
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setCurrentPage(1);
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

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
        >
          返回
        </button>
      </div>
    );
  }

  if (!comparison) {
    return null;
  }

  const currentData = getCurrentPageData();
  const totalPages = getTotalPages();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">版本对比</h2>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
        >
          返回
        </button>
      </div>

      {/* 版本信息 */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border border-gray-200 rounded-lg">
          <h3 className="font-medium text-gray-700 mb-2">版本 {comparison.version1}</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>书签数量: {comparison.version1Info.bookmarkCount}</p>
            <p>提交时间: {formatDate(comparison.version1Info.createdAt)}</p>
            <p>提交信息: {comparison.version1Info.commitMessage || '自动提交'}</p>
          </div>
        </div>
        <div className="p-4 border border-gray-200 rounded-lg">
          <h3 className="font-medium text-gray-700 mb-2">版本 {comparison.version2}</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>书签数量: {comparison.version2Info.bookmarkCount}</p>
            <p>提交时间: {formatDate(comparison.version2Info.createdAt)}</p>
            <p>提交信息: {comparison.version2Info.commitMessage || '自动提交'}</p>
          </div>
        </div>
      </div>

      {/* 变化统计 */}
      <div className="mb-6">
        <h3 className="font-medium text-gray-900 mb-3">变化统计</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-2xl font-bold text-green-700">{comparison.added}</div>
            <div className="text-sm text-green-600">新增</div>
          </div>
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-2xl font-bold text-red-700">{comparison.removed}</div>
            <div className="text-sm text-red-600">删除</div>
          </div>
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-2xl font-bold text-yellow-700">{comparison.modified}</div>
            <div className="text-sm text-yellow-600">修改</div>
          </div>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-2xl font-bold text-blue-700">{comparison.totalNew}</div>
            <div className="text-sm text-blue-600">当前总数</div>
          </div>
        </div>
      </div>

      {/* 详细差异列表 - 只有有数据时才显示 */}
      {(comparison.added > 0 || comparison.removed > 0 || comparison.modified > 0) && (
        <div className="mt-6">
          <h3 className="font-medium text-gray-900 mb-4">详细信息</h3>
          
          {/* 标签页导航 */}
          <div className="border-b border-gray-200 mb-4">
            <nav className="-mb-px flex space-x-8">
              {comparison.added > 0 && (
                <button
                  onClick={() => handleTabChange('added')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'added'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  新增 ({comparison.added})
                </button>
              )}
              {comparison.removed > 0 && (
                <button
                  onClick={() => handleTabChange('removed')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'removed'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  删除 ({comparison.removed})
                </button>
              )}
              {comparison.modified > 0 && (
                <button
                  onClick={() => handleTabChange('modified')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'modified'
                      ? 'border-yellow-500 text-yellow-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  修改 ({comparison.modified})
                </button>
              )}
            </nav>
          </div>

          {/* 书签列表 */}
          <div className="space-y-2">
            {activeTab === 'added' && comparison.addedList && (
              <div className="space-y-2">
                {currentData.map((bookmark: Bookmark, index: number) => (
                  <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <a 
                      href={bookmark.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-medium text-green-900 hover:underline"
                    >
                      {bookmark.title}
                    </a>
                    {bookmark.description && (
                      <p className="text-sm text-green-700 mt-1">{bookmark.description}</p>
                    )}
                    <p className="text-xs text-green-600 mt-1 break-all">{bookmark.url}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'removed' && comparison.removedList && (
              <div className="space-y-2">
                {currentData.map((bookmark: Bookmark, index: number) => (
                  <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <span className="font-medium text-red-900 line-through">
                      {bookmark.title}
                    </span>
                    {bookmark.description && (
                      <p className="text-sm text-red-700 mt-1 line-through">{bookmark.description}</p>
                    )}
                    <p className="text-xs text-red-600 mt-1 break-all">{bookmark.url}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'modified' && comparison.modifiedList && (
              <div className="space-y-2">
                {currentData.map((item: any, index: number) => (
                  <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 mr-4">
                        <p className="text-xs text-gray-600 mb-2">修改前:</p>
                        <div className="p-2 bg-white border border-gray-300 rounded mb-2">
                          <p className="font-medium text-gray-900 line-through">{item.old.title}</p>
                          {item.old.description && (
                            <p className="text-sm text-gray-700 mt-1 line-through">{item.old.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-600 mb-2">修改后:</p>
                        <div className="p-2 bg-white border border-gray-300 rounded mb-2">
                          <a 
                            href={item.new.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-medium text-yellow-900 hover:underline"
                          >
                            {item.new.title}
                          </a>
                          {item.new.description && (
                            <p className="text-sm text-gray-700 mt-1">{item.new.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2 break-all">URL: {item.new.url}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 分页控件 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-700">
                显示第 {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, 
                  activeTab === 'added' ? comparison.added : 
                  activeTab === 'removed' ? comparison.removed : comparison.modified)} 条，
                共 {activeTab === 'added' ? comparison.added : 
                    activeTab === 'removed' ? comparison.removed : comparison.modified} 条
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  上一页
                </button>
                <span className="text-sm text-gray-700">
                  第 {currentPage} / {totalPages} 页
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 无变化提示 */}
      {comparison.added === 0 && comparison.removed === 0 && comparison.modified === 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2">详细信息</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>版本 {comparison.version1} 共有 {comparison.totalOld} 个书签</p>
            <p>版本 {comparison.version2} 共有 {comparison.totalNew} 个书签</p>
            <p>• 两个版本之间没有变化</p>
          </div>
        </div>
      )}
    </div>
  );
}
