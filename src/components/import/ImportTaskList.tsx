'use client';

import { useState, useEffect } from 'react';
import { bookmarkApi } from '@/lib/api/bookmarkApi';
import { ImportTask } from '@/types';

export default function ImportTaskList() {
  const [tasks, setTasks] = useState<ImportTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTasks = async () => {
    try {
      setError('');
      const response = await bookmarkApi.getImportTasks();
      if (response.data.success) {
        const tasksWithProgress = response.data.data.map(task => ({
          ...task,
          progress: calculateProgress(task)
        }));
        setTasks(tasksWithProgress.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      }
    } catch (err: any) {
      setError('加载任务列表失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (task: ImportTask): number => {
    if (task.totalCount === 0) return 0;
    return Math.round((task.processedCount / task.totalCount) * 100);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  // 持续轮询进行中的任务
  useEffect(() => {
    const hasProcessing = tasks.some(t => t.status === 'PROCESSING' || t.status === 'PENDING');
    if (hasProcessing) {
      const interval = setInterval(loadTasks, 2000);
      return () => clearInterval(interval);
    }
  }, [tasks]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return '已完成';
      case 'PROCESSING':
        return '处理中';
      case 'FAILED':
        return '失败';
      case 'PENDING':
        return '等待中';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">导入任务列表</h2>
        <div className="text-center text-gray-500 py-8">暂无导入任务</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">导入任务列表</h2>
        <button
          onClick={loadTasks}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          刷新
        </button>
      </div>
      
      <div className="space-y-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="font-medium">{task.filename}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
                    {getStatusText(task.status)}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  创建时间: {new Date(task.createdAt).toLocaleString('zh-CN')}
                </div>
              </div>
            </div>

            {(task.status === 'PROCESSING' || task.status === 'PENDING') && (
              <div className="mt-3">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>处理进度</span>
                  <span>
                    {task.processedCount} / {task.totalCount} 
                    {task.totalCount > 0 && ` (${calculateProgress(task)}%)`}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${calculateProgress(task)}%` }}
                  ></div>
                </div>
              </div>
            )}

            {task.status === 'COMPLETED' && (
              <div className="mt-3 text-sm">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-gray-600">总计:</span>
                    <span className="ml-2 font-medium">{task.totalCount}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">成功:</span>
                    <span className="ml-2 font-medium text-green-600">{task.successCount}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">失败:</span>
                    <span className="ml-2 font-medium text-red-600">{task.failCount}</span>
                  </div>
                </div>
              </div>
            )}

            {task.status === 'FAILED' && task.errorMessage && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded p-2 text-sm text-red-700">
                {task.errorMessage}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

