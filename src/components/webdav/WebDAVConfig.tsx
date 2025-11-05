'use client';

import { useState } from 'react';
import { authApi } from '@/lib/api/authApi';
import { WebDAVConfig } from '@/types';

export default function WebDAVConfigComponent() {
  const [config, setConfig] = useState<WebDAVConfig>({
    webdavUrl: '',
    webdavUsername: '',
    webdavPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await authApi.updateWebDAVConfig(config);
      if (response.data.success) {
        setMessage({ type: 'success', text: 'WebDAV配置已保存' });
        // 清空密码字段（安全考虑）
        setConfig({ ...config, webdavPassword: '' });
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || '配置保存失败: ' + err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">WebDAV 配置</h2>
      <p className="text-gray-600 mb-6">
        配置WebDAV服务器信息，用于存储书签历史记录。文件夹将按您的用户名自动创建。
      </p>

      {message && (
        <div
          className={`mb-4 px-4 py-3 rounded ${
            message.type === 'success'
              ? 'bg-green-100 text-green-700 border border-green-400'
              : 'bg-red-100 text-red-700 border border-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="webdavUrl" className="block text-sm font-medium text-gray-700 mb-1">
            WebDAV 服务器地址
          </label>
          <input
            type="url"
            id="webdavUrl"
            value={config.webdavUrl}
            onChange={(e) => setConfig({ ...config, webdavUrl: e.target.value })}
            placeholder="https://your-webdav-server.com"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="webdavUsername" className="block text-sm font-medium text-gray-700 mb-1">
            用户名
          </label>
          <input
            type="text"
            id="webdavUsername"
            value={config.webdavUsername}
            onChange={(e) => setConfig({ ...config, webdavUsername: e.target.value })}
            placeholder="WebDAV用户名"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="webdavPassword" className="block text-sm font-medium text-gray-700 mb-1">
            密码
          </label>
          <input
            type="password"
            id="webdavPassword"
            value={config.webdavPassword}
            onChange={(e) => setConfig({ ...config, webdavPassword: e.target.value })}
            placeholder="WebDAV密码"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? '保存中...' : '保存配置'}
        </button>
      </form>
    </div>
  );
}

