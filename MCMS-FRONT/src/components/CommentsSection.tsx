import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, Send, Edit2, Trash2, X, Check } from 'lucide-react';
import MentionAutocomplete from './MentionAutocomplete';
import { BASE_URL } from '../services/api';

interface Comment {
  id: number;
  task_id: number;
  user_id: number;
  comment: string;
  created_at: string;
  updated_at?: string | null;
  user_name?: string;
}

interface Mention {
  id: number;
  comment_id: number;
  mentioned_user_id: number;
  mentioned_by_user_id: number;
  entity_type: string;
  entity_id: number;
  created_at: string;
  mentioned_user_name?: string;
  mentioned_by_user_name?: string;
}

interface CommentsSectionProps {
  taskId: number;
  onCommentAdded?: () => void;
}

export default function CommentsSection({ taskId, onCommentAdded }: CommentsSectionProps) {
  const { user: currentUser } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  
  // Delete confirmation
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Helper for fetching with auth
  const fetchWithAuth = async (path: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
    return response;
  };

  // جلب التعليقات والمنشنات
  const fetchComments = async () => {
    try {
      const [commentsRes, mentionsRes] = await Promise.all([
        fetchWithAuth(`/api/tasks/${taskId}/comments`),
        fetchWithAuth(`/api/tasks/${taskId}/mentions`),
      ]);

      const commentsData = await commentsRes.json();
      const mentionsData = await mentionsRes.json();

      if (commentsData && commentsData.success) {
        setComments(commentsData.data || []);
      }
      if (mentionsData && mentionsData.success) {
        setMentions(mentionsData.data || []);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [taskId]);

  // إضافة تعليق
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetchWithAuth(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          comment: newComment,
          user_id: Number(currentUser.id),
        }),
      });

      if (response.ok) {
        setNewComment('');
        await fetchComments();
        onCommentAdded?.();
      } else {
        const data = await response.json().catch(() => null);
        setError((data && data.error) || 'فشل إضافة التعليق');
      }
    } catch (err: any) {
      setError(`فشل الاتصال: ${err.message || 'خطأ غير معروف'}`);
    } finally {
      setLoading(false);
    }
  };

  // بدء التعديل
  const startEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditText(comment.comment);
    setError('');
  };

  // إلغاء التعديل
  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  // حفظ التعديل
  const saveEdit = async (commentId: number) => {
    if (!editText.trim() || !currentUser) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetchWithAuth(`/api/tasks/${taskId}/comments/${commentId}`, {
        method: 'PUT',
        body: JSON.stringify({
          comment: editText,
          user_id: Number(currentUser.id),
        }),
      });

      if (response.ok) {
        setEditingId(null);
        setEditText('');
        await fetchComments();
      } else {
        const data = await response.json().catch(() => null);
        setError((data && data.error) || 'فشل تعديل التعليق');
      }
    } catch (err: any) {
      setError(`فشل الاتصال: ${err.message || 'خطأ غير معروف'}`);
    } finally {
      setLoading(false);
    }
  };

  // حذف تعليق
  const handleDelete = async (commentId: number) => {
    if (!currentUser) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetchWithAuth(`/api/tasks/${taskId}/comments/${commentId}`, {
        method: 'DELETE',
        body: JSON.stringify({
          user_id: Number(currentUser.id),
        }),
      });

      if (response.ok) {
        setDeletingId(null);
        await fetchComments();
        onCommentAdded?.();
      } else {
        const data = await response.json().catch(() => null);
        setError((data && data.error) || 'فشل حذف التعليق');
      }
    } catch (err: any) {
      setError(`فشل الاتصال: ${err.message || 'خطأ غير معروف'}`);
    } finally {
      setLoading(false);
    }
  };

  // تحديد المنشنات في التعليق
  const highlightMentions = (text: string, commentId: number) => {
    const commentMentions = mentions.filter(m => m.comment_id === commentId);
    let highlightedText = text;

    commentMentions.forEach(mention => {
      if (!mention.mentioned_user_name) return;
      const regex = new RegExp(`@${mention.mentioned_user_name}`, 'g');
      highlightedText = highlightedText.replace(
        regex,
        `<span class="bg-blue-200 text-blue-900 px-1 rounded">@${mention.mentioned_user_name}</span>`
      );
    });

    return highlightedText;
  };

  // التحقق من ملكية التعليق
  const isOwnComment = (comment: Comment) => {
    return currentUser && Number(comment.user_id) === Number(currentUser.id);
  };

  return (
    <div className="w-full space-y-4">
      {/* رأس القسم */}
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">التعليقات ({comments.length})</h3>
      </div>

      {/* رسالة الخطأ */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* نموذج إضافة تعليق */}
      <form onSubmit={handleAddComment} className="space-y-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <MentionAutocomplete value={newComment} onChange={setNewComment} />
        <button
          type="submit"
          disabled={loading || !newComment.trim()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" />
          {loading ? 'جاري الإرسال...' : 'إرسال'}
        </button>
      </form>

      {/* قائمة التعليقات */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-gray-500 text-center py-4">لا توجد تعليقات حتى الآن</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm group">
              {/* رأس التعليق */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                    {(comment.user_name || 'م').substring(0, 1)}
                  </div>
                  <span className="font-semibold text-gray-900">{comment.user_name || 'مستخدم'}</span>
                  <span className="text-sm text-gray-500">
                    {new Date(comment.created_at).toLocaleDateString('ar-SA')}
                  </span>
                  {comment.updated_at && (
                    <span
                      className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200"
                      title={`تم التعديل في ${new Date(comment.updated_at).toLocaleString('ar-SA')}`}
                    >
                      ✏️ تم التعديل · {new Date(comment.updated_at).toLocaleString('ar-SA', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                      })}
                    </span>
                  )}
                </div>

                {/* أزرار التعديل والحذف - تظهر فقط لصاحب التعليق */}
                {isOwnComment(comment) && editingId !== comment.id && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(comment)}
                      className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                      title="تعديل"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingId(comment.id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* محتوى التعليق - وضع التعديل */}
              {editingId === comment.id ? (
                <div className="space-y-2">
                  <MentionAutocomplete value={editText} onChange={setEditText} />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => saveEdit(comment.id)}
                      disabled={loading || !editText.trim()}
                      className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors text-sm"
                    >
                      <Check className="w-4 h-4" />
                      حفظ
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                    >
                      <X className="w-4 h-4" />
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* محتوى التعليق العادي */}
                  <p
                    className="text-gray-800 whitespace-pre-wrap leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: highlightMentions(comment.comment, comment.id),
                    }}
                  />

                  {/* المنشنات */}
                  {mentions.filter(m => m.comment_id === comment.id).length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-sm text-gray-600 mb-1">المنشنات:</p>
                      <div className="flex flex-wrap gap-2">
                        {mentions
                          .filter(m => m.comment_id === comment.id)
                          .map(mention => (
                            <span
                              key={mention.id}
                              className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded"
                            >
                              @{mention.mentioned_user_name}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* تأكيد الحذف */}
              {deletingId === comment.id && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 mb-2">هل أنت متأكد من حذف هذا التعليق؟</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(comment.id)}
                      disabled={loading}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                    >
                      نعم، احذف
                    </button>
                    <button
                      onClick={() => setDeletingId(null)}
                      className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300 transition-colors"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
