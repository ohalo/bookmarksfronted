'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/authApi';
import { auth } from '@/lib/auth';

type RegisterMode = 'normal' | 'quick';

export default function RegisterPage() {
  const router = useRouter();
  const [registerMode, setRegisterMode] = useState<RegisterMode>('normal');
  
  useEffect(() => {
    // 检查URL参数
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') === 'quick') {
        setRegisterMode('quick');
      }
    }
  }, []);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [quickRegisterData, setQuickRegisterData] = useState({
    tokenSource: 'RANDOM' as 'IP' | 'MAC' | 'RANDOM' | 'MANUAL',
    customInput: '',
    validityType: 'WEEK' as 'WEEK' | 'MONTH_3' | 'MONTH_6' | 'YEAR' | 'PERMANENT',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [generatedToken, setGeneratedToken] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleQuickRegisterChange = (field: string, value: any) => {
    setQuickRegisterData({
      ...quickRegisterData,
      [field]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setGeneratedToken('');

    if (registerMode === 'quick') {
      // 一键注册
      if (quickRegisterData.tokenSource === 'MANUAL' && !quickRegisterData.customInput.trim()) {
        setError('手动输入模式需要提供自定义字符');
        return;
      }

      setLoading(true);

      try {
        const response = await authApi.quickRegister({
          tokenSource: quickRegisterData.tokenSource,
          customInput: quickRegisterData.tokenSource === 'MANUAL' ? quickRegisterData.customInput : undefined,
          validityType: quickRegisterData.validityType,
        });
        
        if (response.data.success) {
          setGeneratedToken(response.data.data.token);
          setSuccessMessage(`注册成功！您的Token已生成，有效期：${getValidityTypeText(response.data.data.validityType)}`);
          
          // 可以选择自动登录
          setTimeout(() => {
            handleTokenLogin(response.data.data.token);
          }, 2000);
        } else {
          setError(response.data.message || '一键注册失败');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || '一键注册失败，请检查输入信息');
      } finally {
        setLoading(false);
      }
    } else {
      // 传统注册
      if (formData.password !== formData.confirmPassword) {
        setError('两次输入的密码不一致');
        return;
      }

      if (formData.password.length < 6) {
        setError('密码长度至少为6位');
        return;
      }

      setLoading(true);

      try {
        const response = await authApi.register({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        });
        
        if (response.data.success) {
          auth.login(response.data.data);
          router.push('/dashboard');
        } else {
          setError(response.data.message || '注册失败');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || '注册失败，请检查输入信息');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleTokenLogin = async (token: string) => {
    try {
      const response = await authApi.tokenLogin({ token });
      if (response.data.success) {
        auth.login(response.data.data);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError('自动登录失败，请手动使用Token登录');
    }
  };

  const getValidityTypeText = (type: string) => {
    const map: Record<string, string> = {
      'WEEK': '一周',
      'MONTH_3': '3个月',
      'MONTH_6': '6个月',
      'YEAR': '一年',
      'PERMANENT': '永久有效',
    };
    return map[type] || type;
  };

  const copyToken = () => {
    if (generatedToken) {
      navigator.clipboard.writeText(generatedToken);
      setSuccessMessage('Token已复制到剪贴板！');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            注册新账号
          </h2>
        </div>
        
        {/* 注册方式切换 */}
        <div className="flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => {
              setRegisterMode('normal');
              setError('');
              setSuccessMessage('');
              setGeneratedToken('');
            }}
            className={`flex-1 py-2 px-4 text-sm font-medium text-center ${
              registerMode === 'normal'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            传统注册
          </button>
          <button
            type="button"
            onClick={() => {
              setRegisterMode('quick');
              setError('');
              setSuccessMessage('');
              setGeneratedToken('');
            }}
            className={`flex-1 py-2 px-4 text-sm font-medium text-center ${
              registerMode === 'quick'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            一键注册
          </button>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {successMessage}
            </div>
          )}

          {generatedToken && (
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  您的Token（请妥善保管）：
                </label>
                <button
                  type="button"
                  onClick={copyToken}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  复制
                </button>
              </div>
              <div className="bg-white p-2 rounded border border-gray-300 break-all text-sm font-mono">
                {generatedToken}
              </div>
              <p className="mt-2 text-xs text-gray-600">
                正在自动登录...
              </p>
            </div>
          )}

          {registerMode === 'quick' ? (
            // 一键注册表单
            <div className="space-y-4">
              <div>
                <label htmlFor="tokenSource" className="block text-sm font-medium text-gray-700 mb-2">
                  Token生成方式
                </label>
                <select
                  id="tokenSource"
                  value={quickRegisterData.tokenSource}
                  onChange={(e) => handleQuickRegisterChange('tokenSource', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="RANDOM">随机生成（推荐）</option>
                  <option value="IP">基于IP地址</option>
                  <option value="MAC">基于MAC地址</option>
                  <option value="MANUAL">手动输入字符</option>
                </select>
              </div>

              {quickRegisterData.tokenSource === 'MANUAL' && (
                <div>
                  <label htmlFor="customInput" className="block text-sm font-medium text-gray-700 mb-2">
                    自定义字符
                  </label>
                  <input
                    id="customInput"
                    type="text"
                    value={quickRegisterData.customInput}
                    onChange={(e) => handleQuickRegisterChange('customInput', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="请输入自定义字符"
                  />
                </div>
              )}

              <div>
                <label htmlFor="validityType" className="block text-sm font-medium text-gray-700 mb-2">
                  Token有效期
                </label>
                <select
                  id="validityType"
                  value={quickRegisterData.validityType}
                  onChange={(e) => handleQuickRegisterChange('validityType', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="WEEK">一周（默认）</option>
                  <option value="MONTH_3">3个月</option>
                  <option value="MONTH_6">6个月</option>
                  <option value="YEAR">一年</option>
                  <option value="PERMANENT">永久有效</option>
                </select>
              </div>
            </div>
          ) : (
            // 传统注册表单
            <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                用户名
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="请输入用户名（3-50个字符）"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                邮箱
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="请输入邮箱地址"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                密码
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="请输入密码（至少6位）"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                确认密码
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="请再次输入密码"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || !!generatedToken}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? '注册中...' : generatedToken ? '已注册' : '注册'}
            </button>
          </div>

          <div className="text-center space-y-2">
            {registerMode === 'quick' ? (
              <a
                href="/login"
                className="text-blue-600 hover:text-blue-500 text-sm block"
              >
                已有Token？立即登录
              </a>
            ) : (
              <>
                <a
                  href="/login"
                  className="text-blue-600 hover:text-blue-500 text-sm block"
                >
                  已有账号？立即登录
                </a>
                <a
                  href="/register?mode=quick"
                  className="text-blue-600 hover:text-blue-500 text-sm block"
                >
                  或使用一键注册
                </a>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

