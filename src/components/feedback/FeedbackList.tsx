'use client';

import { useState, useEffect } from 'react';
import { feedbackApi } from '@/lib/api/feedbackApi';
import { Feedback, CreateFeedbackRequest } from '@/types';
import { auth } from '@/lib/auth';

export default function FeedbackList() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filterType, setFilterType] = useState<string>('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyTitle, setReplyTitle] = useState('');

  // 表单状态
  const [formData, setFormData] = useState<CreateFeedbackRequest>({
    title: '',
    content: '',
    feedbackType: 'FEEDBACK',
  });

  useEffect(() => {
    loadFeedbacks();
  }, [filterType]);

  const loadFeedbacks = async () => {
    try {
      setLoading(true);
      const response = await feedbackApi.getAllFeedbacks(filterType || undefined);
      if (response.data.success) {
        setFeedbacks(response.data.data);
      } else {
        setError('加载留言失败');
      }
    } catch (err: any) {
      setError('加载留言失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content.trim()) {
      setError('请输入留言内容');
      return;
    }

    try {
      const response = await feedbackApi.createFeedback(formData);
      if (response.data.success) {
        setShowCreateForm(false);
        setFormData({ title: '', content: '', feedbackType: 'FEEDBACK' });
        loadFeedbacks();
      } else {
        setError(response.data.message || '发布失败');
      }
    } catch (err: any) {
      setError('发布失败: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleReply = async (parentId: number) => {
    if (!replyContent.trim()) {
      setError('请输入回复内容');
      return;
    }

    try {
      const response = await feedbackApi.replyFeedback(parentId, {
        title: replyTitle || '回复',
        content: replyContent,
        parentId,
      });
      if (response.data.success) {
        setReplyingTo(null);
        setReplyContent('');
        setReplyTitle('');
        loadFeedbacks();
      } else {
        setError(response.data.message || '回复失败');
      }
    } catch (err: any) {
      setError('回复失败: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这条留言吗？')) {
      return;
    }

    try {
      const response = await feedbackApi.deleteFeedback(id);
      if (response.data.success) {
        loadFeedbacks();
      } else {
        setError(response.data.message || '删除失败');
      }
    } catch (err: any) {
      setError('删除失败: ' + (err.response?.data?.message || err.message));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      FEEDBACK: '留言',
      SUGGESTION: '建议',
      BUG: 'Bug反馈',
    };
    return map[type] || type;
  };

  const getTypeColor = (type: string) => {
    const map: Record<string, string> = {
      FEEDBACK: 'bg-blue-100 text-blue-800',
      SUGGESTION: 'bg-green-100 text-green-800',
      BUG: 'bg-red-100 text-red-800',
    };
    return map[type] || 'bg-gray-100 text-gray-800';
  };

  const currentUser = auth.getUser();

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold">留言与建议</h2>
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">全部类型</option>
            <option value="FEEDBACK">留言</option>
            <option value="SUGGESTION">建议</option>
            <option value="BUG">Bug反馈</option>
          </select>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            {showCreateForm ? '取消' : '发布留言'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* 发布留言表单 */}
      {showCreateForm && (
        <div className="mb-6 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">发布新留言</h3>
          <form onSubmit={handleCreateFeedback}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                类型
              </label>
              <select
                value={formData.feedbackType}
                onChange={(e) => setFormData({ ...formData, feedbackType: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="FEEDBACK">留言</option>
                <option value="SUGGESTION">建议</option>
                <option value="BUG">Bug反馈</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                标题 <span className="text-gray-400 text-xs">(可选)</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="不填写将自动生成标题"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                内容
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={5}
                placeholder="请输入留言内容"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setFormData({ title: '', content: '', feedbackType: 'FEEDBACK' });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                发布
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 留言列表 */}
      <div className="space-y-4">
        {feedbacks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            暂无留言，快来发布第一条吧！
          </div>
        ) : (
          feedbacks.map((feedback) => (
            <div key={feedback.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(feedback.feedbackType)}`}>
                      {getTypeLabel(feedback.feedbackType)}
                    </span>
                    <h3 className="text-lg font-semibold">{feedback.title}</h3>
                  </div>
                  <div className="text-sm text-gray-500 mb-2">
                    <span>{feedback.username}</span>
                    <span className="mx-2">•</span>
                    <span>{formatDate(feedback.createdAt)}</span>
                  </div>
                </div>
                {currentUser && currentUser.id === feedback.userId && (
                  <button
                    onClick={() => handleDelete(feedback.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    删除
                  </button>
                )}
              </div>
              
              <div className="text-gray-700 mb-4 whitespace-pre-wrap">
                {feedback.content}
              </div>

              {/* 回复按钮 */}
              <div className="mb-3">
                <button
                  onClick={() => setReplyingTo(replyingTo === feedback.id ? null : feedback.id)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  {replyingTo === feedback.id ? '取消回复' : `回复 (${feedback.replyCount || 0})`}
                </button>
              </div>

              {/* 回复表单 */}
              {replyingTo === feedback.id && (
                <div className="mb-4 pl-4 border-l-2 border-blue-200">
                  <div className="mb-2">
                    <input
                      type="text"
                      value={replyTitle}
                      onChange={(e) => setReplyTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-2"
                      placeholder="回复标题（可选）"
                    />
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      rows={3}
                      placeholder="请输入回复内容"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyContent('');
                        setReplyTitle('');
                      }}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => handleReply(feedback.id)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      回复
                    </button>
                  </div>
                </div>
              )}

              {/* 回复列表 */}
              {feedback.replies && feedback.replies.length > 0 && (
                <div className="mt-4 space-y-3 pl-4 border-l-2 border-gray-200">
                  {feedback.replies.map((reply) => (
                    <div key={reply.id} className="bg-gray-50 rounded p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">{reply.username}</span>
                          <span className="mx-2">•</span>
                          <span>{formatDate(reply.createdAt)}</span>
                        </div>
                        {currentUser && currentUser.id === reply.userId && (
                          <button
                            onClick={() => handleDelete(reply.id)}
                            className="text-red-600 hover:text-red-800 text-xs"
                          >
                            删除
                          </button>
                        )}
                      </div>
                      <div className="text-gray-700 text-sm whitespace-pre-wrap">
                        {reply.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

