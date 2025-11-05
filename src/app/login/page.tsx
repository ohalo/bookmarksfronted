'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/authApi';
import { auth } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleSendCode = async () => {
    if (!username || !password) {
      setError('请先输入用户名和密码');
      return;
    }

    setError('');
    setSendingCode(true);

    try {
      const response = await authApi.sendVerificationCode({ username, password });
      if (response.data.success) {
        setCodeSent(true);
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(response.data.message || '发送验证码失败');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '发送验证码失败，请检查用户名和密码');
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('请输入用户名和密码');
      return;
    }

    if (!codeSent) {
      setError('请先获取验证码');
      return;
    }

    if (!verificationCode) {
      setError('请输入验证码');
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.login({ username, password, verificationCode });
      if (response.data.success) {
        auth.login(response.data.data);
        router.push('/dashboard');
      } else {
        setError(response.data.message || '登录失败');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '登录失败，请检查用户名、密码和验证码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            登录到书签平台
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">
                用户名
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                密码
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <input
                id="verificationCode"
                name="verificationCode"
                type="text"
                required={codeSent}
                maxLength={6}
                inputMode="numeric"
                autoComplete="one-time-code"
                className={`appearance-none rounded-none relative block flex-1 px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-bl-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm ${
                  !codeSent ? 'bg-gray-50' : 'bg-white'
                }`}
                placeholder={codeSent ? "验证码" : "请先获取验证码"}
                value={verificationCode}
                onChange={(e) => {
                  // 始终允许输入并更新值
                  const newValue = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setVerificationCode(newValue);
                  if (!codeSent && newValue) {
                    setError('请先点击"获取验证码"按钮');
                  } else if (codeSent) {
                    setError(''); // 清除之前的错误
                  }
                }}
                onFocus={() => {
                  if (!codeSent) {
                    setError('请先点击"获取验证码"按钮');
                  }
                }}
              />
              <button
                type="button"
                onClick={handleSendCode}
                disabled={sendingCode || countdown > 0 || !username || !password}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-br-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {sendingCode ? '发送中...' : countdown > 0 ? `${countdown}秒` : '获取验证码'}
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </div>

          <div className="text-center">
            <a
              href="/register"
              className="text-blue-600 hover:text-blue-500 text-sm"
            >
              还没有账号？立即注册
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}

