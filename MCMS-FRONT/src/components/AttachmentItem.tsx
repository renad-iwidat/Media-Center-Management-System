import React, { useState } from 'react';
import { Paperclip, Download, Edit2, Trash2, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { BASE_URL } from '../services/api';

interface Attachment {
  id: number;
  task_id?: number;
  title?: string;
  description?: string;
  file_url?: string;
  file_type?: string;
  uploaded_by?: number;
  user_name?: string;
  created_at?: string;
  updated_at?: string | null;
}

interface AttachmentItemProps {
  taskId: number;
  attachment: Attachment;
  onChange?: () => void;
}

export default function AttachmentItem({ taskId, attachment, onChange }: AttachmentItemProps) {
  const { user: currentUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editTitle, setEditTitle] = useState(attachment.title || '');
  const [editDescription, setEditDescription] = useState(attachment.description || '');

  const isOwner =
    currentUser && Number(attachment.uploaded_by) === Number(currentUser.id);

  const fetchWithAuth = async (path: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    return fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  };

  const handleSaveEdit = async () => {
    if (!currentUser) return;
    setLoading(true);
    setError('');

    try {
      const response = await fetchWithAuth(
        `/api/tasks/${taskId}/attachments/${attachment.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            user_id: Number(currentUser.id),
            title: editTitle,
            description: editDescription,
          }),
        }
      );

      if (response.ok) {
        setEditing(false);
        onChange?.();
      } else {
        const data = await response.json().catch(() => null);
        setError((data && data.error) || 'فشل تعديل المرفق');
      }
    } catch (err: any) {
      setError(err.message || 'فشل الاتصال');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentUser) return;
    setLoading(true);
    setError('');

    try {
      const response = await fetchWithAuth(
        `/api/tasks/${taskId}/attachments/${attachment.id}`,
        {
          method: 'DELETE',
          body: JSON.stringify({ user_id: Number(currentUser.id) }),
        }
      );

      if (response.ok) {
        setDeleting(false);
        onChange?.();
      } else {
        const data = await response.json().catch(() => null);
        setError((data && data.error) || 'فشل حذف المرفق');
      }
    } catch (err: any) {
      setError(err.message || 'فشل الاتصال');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
      {error && (
        <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-xs">
          {error}
        </div>
      )}

      {editing ? (
        <div className="space-y-3">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="العنوان"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm"
          />
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="الوصف"
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm resize-none"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveEdit}
              disabled={loading}
              className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:bg-gray-400 text-xs"
            >
              <Check className="w-3 h-3" />
              حفظ
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setEditTitle(attachment.title || '');
                setEditDescription(attachment.description || '');
                setError('');
              }}
              className="flex items-center gap-1 bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-300 text-xs"
            >
              <X className="w-3 h-3" />
              إلغاء
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-all flex-shrink-0">
              <Paperclip size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="text-sm font-bold text-slate-900 truncate">
                {attachment.title || 'بدون عنوان'}
              </h5>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                {attachment.description || 'بدون وصف'}
              </p>
              <div className="flex items-center gap-2 flex-wrap mt-2">
                <span className="text-[10px] text-slate-400 font-bold">
                  {attachment.user_name} •{' '}
                  {attachment.created_at
                    ? format(new Date(attachment.created_at), 'MM/dd HH:mm')
                    : 'N/A'}
                </span>
                {attachment.updated_at && (
                  <span
                    className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-bold"
                    title={`تم التعديل في ${new Date(attachment.updated_at).toLocaleString('ar-SA')}`}
                  >
                    ✏️ تم التعديل · {format(new Date(attachment.updated_at), 'MM/dd HH:mm')}
                  </span>
                )}
              </div>
            </div>

            {/* أزرار التعديل/الحذف لصاحب الملف */}
            {isOwner && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditing(true)}
                  className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                  title="تعديل"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleting(true)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                  title="حذف"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <a
            href={attachment.file_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all text-xs font-bold"
          >
            <Download size={14} />
            تحميل
          </a>

          {/* تأكيد الحذف */}
          {deleting && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 mb-2">هل أنت متأكد من حذف هذا الملف؟</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                >
                  نعم، احذف
                </button>
                <button
                  onClick={() => setDeleting(false)}
                  className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
