import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  User, 
  Clock, 
  Calendar,
  Send,
  Paperclip,
  Download,
  Trash2,
  AtSign,
  MessageCircle,
  History,
  Lock,
  CheckCircle2,
  X,
  Edit,
  Archive
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { api, BASE_URL } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { 
  AdminProcTask,
  AdminProcTaskComment,
  AdminProcTaskAttachment,
  AdminProcTaskHistory,
  AdminProcResponse, 
  AdminProcListResponse 
} from '../../types/administrative';

interface SimpleUser {
  id: string;
  name: string;
}

export default function AdminProcTaskDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [task, setTask] = useState<AdminProcTask | null>(null);
  const [comments, setComments] = useState<AdminProcTaskComment[]>([]);
  const [attachments, setAttachments] = useState<AdminProcTaskAttachment[]>([]);
  const [history, setHistory] = useState<AdminProcTaskHistory[]>([]);
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'comments' | 'attachments' | 'history'>('comments');

  const [newComment, setNewComment] = useState('');
  const [mentionedUsers, setMentionedUsers] = useState<Set<string>>(new Set());
  const [showMentionSuggest, setShowMentionSuggest] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [fileDescription, setFileDescription] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [taskRes, commentsRes, attachmentsRes, historyRes, usersRes, statusesRes] = await Promise.all([
        api.get<AdminProcResponse<AdminProcTask>>(`/api/administrative/tasks/${id}`),
        api.get<AdminProcListResponse<AdminProcTaskComment>>(`/api/administrative/tasks/${id}/comments`),
        api.get<AdminProcListResponse<AdminProcTaskAttachment>>(`/api/administrative/tasks/${id}/attachments`),
        api.get<AdminProcListResponse<AdminProcTaskHistory>>(`/api/administrative/tasks/${id}/history`),
        api.get<{ success: boolean; data: SimpleUser[] }>('/api/portal/users'),
        api.get<{ success: boolean; data: any[] }>('/api/tasks/statuses'),
      ]);

      if (taskRes.success) setTask(taskRes.data);
      else setError(taskRes.error || 'لم يتم العثور على المهمة');

      if (commentsRes.success) setComments(commentsRes.data);
      if (attachmentsRes.success) setAttachments(attachmentsRes.data);
      if (historyRes.success) setHistory(historyRes.data);
      if (usersRes.success) setUsers(usersRes.data);
      if (statusesRes.success) setStatuses(statusesRes.data);
    } catch (err: any) {
      setError(err.message || 'فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatusId: string) => {
    try {
      await api.patch(`/api/administrative/tasks/${id}/status`, {
        status_id: newStatusId,
      });
      loadData();
    } catch (err) {
      console.error(err);
      alert('فشل تغيير الحالة');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      await api.post(`/api/administrative/tasks/${id}/comments`, {
        comment: newComment.trim(),
        mentioned_user_ids: Array.from(mentionedUsers),
      });
      setNewComment('');
      setMentionedUsers(new Set());
      loadData();
    } catch (err) {
      console.error(err);
      alert('فشل إضافة التعليق');
    }
  };

  const handleCommentChange = (val: string) => {
    setNewComment(val);
    
    // فحص آخر @
    const lastAtIdx = val.lastIndexOf('@');
    if (lastAtIdx >= 0 && lastAtIdx === val.length - 1) {
      setShowMentionSuggest(true);
      setMentionQuery('');
    } else if (lastAtIdx >= 0) {
      const afterAt = val.substring(lastAtIdx + 1);
      if (/^[\u0621-\u064A\u0660-\u0669a-zA-Z0-9_-]*$/.test(afterAt) && afterAt.length < 30) {
        setShowMentionSuggest(true);
        setMentionQuery(afterAt);
      } else {
        setShowMentionSuggest(false);
      }
    } else {
      setShowMentionSuggest(false);
    }
  };

  const insertMention = (mentionedUser: SimpleUser) => {
    const lastAtIdx = newComment.lastIndexOf('@');
    if (lastAtIdx < 0) return;
    
    const before = newComment.substring(0, lastAtIdx);
    const newText = `${before}@${mentionedUser.name} `;
    setNewComment(newText);
    
    const newMentions = new Set(mentionedUsers);
    newMentions.add(mentionedUser.id.toString());
    setMentionedUsers(newMentions);
    
    setShowMentionSuggest(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      // رفع الملف على endpoint الإجراءات الإدارية المنفصل
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name);
      if (fileDescription.trim()) {
        formData.append('description', fileDescription.trim());
      }
      
      const token = localStorage.getItem('token');
      const uploadRes = await fetch(`${BASE_URL}/api/administrative/tasks/${id}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      
      const uploadData = await uploadRes.json();
      if (!uploadData.success) {
        throw new Error(uploadData.error || 'فشل الرفع');
      }
      
      // الرفع تم وحفظ المرفق - فقط نحدّث القائمة
      loadData();
      setFileDescription('');
      e.target.value = '';
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'فشل رفع الملف');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadAttachment = async (attId: string, fallbackUrl: string, fileName: string) => {
    try {
      // تحميل الملف مباشرة من الـ backend (الـ backend يحمله من S3 ويرسله)
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/api/administrative/attachments/${attId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'file';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('✅ File downloaded:', fileName);
    } catch (err) {
      console.error('Download error:', err);
      alert('فشل تنزيل الملف');
    }
  };

  const handleDeleteAttachment = async (attId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الملف؟')) return;
    try {
      await api.delete(`/api/administrative/attachments/${attId}`);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التعليق؟')) return;
    try {
      await api.delete(`/api/administrative/comments/${commentId}`);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editingCommentText.trim()) return;
    try {
      await api.put(`/api/administrative/comments/${commentId}`, {
        comment: editingCommentText.trim(),
      });
      setEditingCommentId(null);
      setEditingCommentText('');
      loadData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'فشل تعديل التعليق');
    }
  };

  const startEditComment = (commentId: string, currentText: string) => {
    setEditingCommentId(commentId);
    setEditingCommentText(currentText);
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const handleArchiveTask = async () => {
    if (!confirm('هل أنت متأكد من أرشفة هذه المهمة؟')) return;
    try {
      await api.post(`/api/administrative/tasks/${id}/archive`, {});
      navigate(-1);
    } catch (err) {
      console.error(err);
      alert('فشل أرشفة المهمة');
    }
  };

  const handleDeleteTask = async () => {
    if (!confirm('هل أنت متأكد من حذف هذه المهمة؟ لا يمكن التراجع.')) return;
    try {
      await api.delete(`/api/administrative/tasks/${id}`);
      navigate(-1);
    } catch (err) {
      console.error(err);
      alert('فشل حذف المهمة');
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(mentionQuery.toLowerCase())
  ).slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md p-8 bg-red-50 border-2 border-red-200 rounded-2xl">
          <Lock className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-700 mb-2">غير متاح</h2>
          <p className="text-red-600">{error || 'لم يتم العثور على المهمة'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-[#FF9F4A] transition-colors"
      >
        <ArrowRight className="w-4 h-4" />
        <span>رجوع</span>
      </button>

      {/* Task Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-100"
      >
        <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
          <div className="flex-1 min-w-[300px]">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
                مهمة إدارية
              </span>
              {task.status_name && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                  {task.status_name}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{task.title}</h1>
            {task.description && (
              <p className="text-gray-600 leading-relaxed">{task.description}</p>
            )}

            {/* تغيير حالة المهمة */}
            <div className="mt-4 flex items-center gap-3">
              <span className="text-sm font-bold text-gray-600">حالة المهمة:</span>
              <select
                value={task.status_id.toString()}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-bold border-2 border-blue-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
              >
                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleArchiveTask}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-semibold text-sm transition-colors"
            >
              <Archive className="w-4 h-4" />
              أرشفة
            </button>
            <button
              onClick={handleDeleteTask}
              className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 font-semibold text-sm transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              حذف
            </button>
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-6 flex-wrap text-sm text-gray-500 pt-4 border-t border-gray-100">
          <span className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <strong className="text-gray-700">{task.created_by_name}</strong>
          </span>
          {task.created_at && (
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {format(new Date(task.created_at), 'dd MMMM yyyy', { locale: ar })}
            </span>
          )}
          {task.deadline && (
            <span className="flex items-center gap-2 text-orange-600">
              <Calendar className="w-4 h-4" />
              <strong>الموعد:</strong>
              {format(new Date(task.deadline), 'dd MMMM yyyy', { locale: ar })}
            </span>
          )}
        </div>

        {/* Assignees */}
        {task.assignees && task.assignees.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm font-bold text-gray-700 mb-2">المعينون على هذه المهمة:</p>
            <div className="flex flex-wrap gap-2">
              {task.assignees.map((a) => (
                <span
                  key={a.id.toString()}
                  className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold flex items-center gap-1"
                >
                  <User className="w-3 h-3" />
                  {a.assigned_to_name}
                </span>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="flex border-b border-gray-200">
          <TabButton
            active={activeTab === 'comments'}
            onClick={() => setActiveTab('comments')}
            icon={<MessageCircle className="w-4 h-4" />}
            label="التعليقات"
            count={comments.length}
          />
          <TabButton
            active={activeTab === 'attachments'}
            onClick={() => setActiveTab('attachments')}
            icon={<Paperclip className="w-4 h-4" />}
            label="المرفقات"
            count={attachments.length}
          />
          <TabButton
            active={activeTab === 'history'}
            onClick={() => setActiveTab('history')}
            icon={<History className="w-4 h-4" />}
            label="السجل"
            count={history.length}
          />
        </div>

        <div className="p-6">
          {/* Comments Tab */}
          {activeTab === 'comments' && (
            <div className="space-y-4">
              {/* Add Comment */}
              <div className="relative">
                <textarea
                  value={newComment}
                  onChange={(e) => handleCommentChange(e.target.value)}
                  placeholder="اكتب تعليقاً... استخدم @ لذكر شخص"
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#FF9F4A] focus:outline-none transition-colors resize-none"
                />
                
                {/* Mention Suggestions */}
                {showMentionSuggest && filteredUsers.length > 0 && (
                  <div className="absolute z-10 mt-1 w-64 bg-white border-2 border-orange-200 rounded-xl shadow-2xl overflow-hidden">
                    {filteredUsers.map(u => (
                      <button
                        key={u.id.toString()}
                        onClick={() => insertMention(u)}
                        className="w-full text-right px-4 py-3 hover:bg-orange-50 flex items-center gap-2 border-b border-gray-100 last:border-0"
                      >
                        <AtSign className="w-4 h-4 text-orange-500" />
                        <span className="text-gray-700">{u.name}</span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-400">
                    {mentionedUsers.size > 0 && `${mentionedUsers.size} منشن`}
                  </p>
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="flex items-center gap-2 px-5 py-2 bg-[#FF9F4A] text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 font-semibold text-sm transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    إرسال
                  </button>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-3 mt-6">
                {comments.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">لا توجد تعليقات بعد</p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id.toString()} className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-orange-200 text-orange-700 flex items-center justify-center font-bold text-sm">
                            {c.user_name?.substring(0, 2)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-700 text-sm">{c.user_name}</p>
                            {c.created_at && (
                              <p className="text-xs text-gray-400">
                                {format(new Date(c.created_at), 'dd MMM - hh:mm a', { locale: ar })}
                              </p>
                            )}
                          </div>
                        </div>
                        {user?.id?.toString() === c.user_id.toString() && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => startEditComment(c.id.toString(), c.comment)}
                              className="text-blue-400 hover:text-blue-600 transition-colors p-1"
                              title="تعديل"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteComment(c.id.toString())}
                              className="text-red-400 hover:text-red-600 transition-colors p-1"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* وضع التعديل */}
                      {editingCommentId === c.id.toString() ? (
                        <div className="pr-10 space-y-2">
                          <textarea
                            value={editingCommentText}
                            onChange={(e) => setEditingCommentText(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none text-sm"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditComment(c.id.toString())}
                              disabled={!editingCommentText.trim()}
                              className="px-4 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 text-sm font-semibold transition-colors"
                            >
                              حفظ التعديل
                            </button>
                            <button
                              onClick={cancelEditComment}
                              className="px-4 py-1.5 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 text-sm font-semibold transition-colors"
                            >
                              إلغاء
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-700 leading-relaxed pr-10">{c.comment}</p>
                      )}

                      {/* معلومات التعديل */}
                      {c.is_edited && (
                        <p className="text-xs text-gray-400 mt-2 pr-10 italic">
                          ✏️ تم التعديل بواسطة {c.edited_by_name || 'غير معروف'}
                          {c.edited_at && ` • ${format(new Date(c.edited_at), 'dd MMM - hh:mm a', { locale: ar })}`}
                        </p>
                      )}

                      {c.mentions && c.mentions.length > 0 && (
                        <div className="mt-2 pr-10 flex flex-wrap gap-1">
                          {c.mentions.map((m) => (
                            <span key={m.id.toString()} className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                              @{m.mentioned_user_name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Attachments Tab */}
          {activeTab === 'attachments' && (
            <div className="space-y-4">
              {/* Upload Section */}
              <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      وصف الملف (اختياري)
                    </label>
                    <textarea
                      value={fileDescription}
                      onChange={(e) => setFileDescription(e.target.value)}
                      placeholder="اكتب وصف الملف أو ملاحظات عنه..."
                      rows={2}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-[#FF9F4A] focus:outline-none transition-colors resize-none text-sm"
                    />
                  </div>
                  
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileUpload}
                      accept="*/*"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[#FF9F4A] text-white rounded-xl hover:bg-orange-600 font-semibold transition-colors disabled:opacity-50"
                    >
                      <Paperclip className="w-5 h-5" />
                      {uploading ? 'جاري الرفع...' : 'رفع ملف'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Files List */}
              {attachments.length === 0 ? (
                <p className="text-center text-gray-400 py-8">لا توجد ملفات مرفقة</p>
              ) : (
                <div className="space-y-2">
                  {attachments.map((att) => (
                    <div key={att.id.toString()} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0 mt-1">
                        <Paperclip className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-700 truncate">{att.title || 'ملف'}</p>
                        {att.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{att.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          رفع بواسطة {att.uploaded_by_name} • {att.created_at && format(new Date(att.created_at), 'dd MMM', { locale: ar })}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDownloadAttachment(att.id.toString(), att.file_url, att.title || 'file')}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
                        title="تنزيل"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAttachment(att.id.toString())}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {history.length === 0 ? (
                <p className="text-center text-gray-400 py-8">لا يوجد تغييرات في السجل</p>
              ) : (
                history.map((h) => (
                  <div key={h.id.toString()} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                      <History className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 text-sm">
                      <p className="text-gray-700">
                        <strong>{h.changed_by_name}</strong> غيّر الحالة من{' '}
                        <span className="font-semibold text-gray-500">
                          {h.old_status_name || '—'}
                        </span>{' '}
                        إلى{' '}
                        <span className="font-semibold text-blue-600">{h.new_status_name}</span>
                      </p>
                      {h.changed_at && (
                        <p className="text-xs text-gray-400 mt-1">
                          {format(new Date(h.changed_at), 'dd MMMM yyyy - hh:mm a', { locale: ar })}
                        </p>
                      )}
                      {h.notes && (
                        <p className="text-sm text-gray-600 mt-1 italic">{h.notes}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label, count }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-semibold transition-all ${
        active
          ? 'bg-orange-50 text-[#FF9F4A] border-b-2 border-[#FF9F4A]'
          : 'text-gray-500 hover:bg-gray-50'
      }`}
    >
      {icon}
      <span>{label}</span>
      {count > 0 && (
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
          active ? 'bg-orange-200 text-[#FF9F4A]' : 'bg-gray-200 text-gray-600'
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}
