import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, UserPlus, Check } from 'lucide-react';
import { api } from '../../services/api';
import { AdminProcResponse, AdminProcTask } from '../../types/administrative';

interface User {
  id: number | string;
  name: string;
  email?: string;
}

interface Props {
  orderId: string;
  orderTitle: string;
  onClose: () => void;
  onCreated: () => void;
}

export default function AdminProcTaskForm({ orderId, orderTitle, onClose, onCreated }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    status_id: '1',
  });

  useEffect(() => {
    loadUsers();
    loadStatuses();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await api.get<{ success: boolean; data: User[] }>(
        '/api/portal/users'
      );
      if (res.success) {
        setUsers(res.data);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const loadStatuses = async () => {
    try {
      const res = await api.get<{ success: boolean; data: any[] }>(
        '/api/tasks/statuses'
      );
      if (res.success) {
        setStatuses(res.data);
      }
    } catch (err) {
      console.error('Failed to load statuses:', err);
    }
  };

  const toggleUser = (userId: string) => {
    const newSet = new Set(selectedUsers);
    if (newSet.has(userId)) {
      newSet.delete(userId);
    } else {
      newSet.add(userId);
    }
    setSelectedUsers(newSet);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!formData.title.trim()) {
      setError('عنوان المهمة مطلوب');
      setLoading(false);
      return;
    }

    try {
      const payload: any = {
        admin_order_id: orderId,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        status_id: parseInt(formData.status_id),
        assigned_users: Array.from(selectedUsers),
      };

      if (formData.deadline) {
        payload.deadline = new Date(formData.deadline).toISOString();
      }

      const res = await api.post<AdminProcResponse<AdminProcTask>>(
        '/api/administrative/tasks',
        payload
      );

      if (res.success) {
        onCreated();
      } else {
        setError(res.error || 'فشل إنشاء المهمة');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-8 py-6 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-200 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">إنشاء مهمة جديدة</h2>
              <p className="text-sm text-gray-500 mt-1">للطلب: {orderTitle}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-lg transition-colors">
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="p-8 space-y-6">
              {/* العنوان */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  عنوان المهمة <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="مثال: تجهيز الكتاب الرسمي ورفعه"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#FF9F4A] focus:outline-none transition-colors"
                  required
                />
              </div>

              {/* الوصف */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  وصف المهمة
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="اكتب وصف المهمة..."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#FF9F4A] focus:outline-none transition-colors resize-none"
                />
              </div>

              {/* الموعد النهائي */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  الموعد النهائي
                </label>
                <input
                  type="datetime-local"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#FF9F4A] focus:outline-none transition-colors"
                />
              </div>

              {/* حالة المهمة */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  حالة المهمة
                </label>
                <select
                  value={formData.status_id}
                  onChange={(e) => setFormData({ ...formData, status_id: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#FF9F4A] focus:outline-none transition-colors"
                >
                  {statuses.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* تعيين الموظفين */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <UserPlus className="w-4 h-4 inline ml-1" />
                  تعيين الموظفين <span className="text-gray-400 text-xs">({selectedUsers.size} محدد)</span>
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  الأشخاص المعينون فقط يقدرون يشوفوا الطلب والمهمة
                </p>
                
                <div className="border-2 border-gray-200 rounded-xl max-h-64 overflow-y-auto">
                  {users.length === 0 ? (
                    <div className="p-4 text-center text-gray-400 text-sm">
                      جاري تحميل المستخدمين...
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {users.map((u) => {
                        const isSelected = selectedUsers.has(u.id.toString());
                        return (
                          <label
                            key={u.id.toString()}
                            className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                              isSelected ? 'bg-orange-50' : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                              isSelected 
                                ? 'bg-[#FF9F4A] border-[#FF9F4A]' 
                                : 'border-gray-300'
                            }`}>
                              {isSelected && <Check className="w-4 h-4 text-white" />}
                            </div>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleUser(u.id.toString())}
                              className="hidden"
                            />
                            <div className="flex-1">
                              <div className="font-semibold text-gray-700">{u.name}</div>
                              {u.email && (
                                <div className="text-xs text-gray-400">{u.email}</div>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 text-sm"
                >
                  {error}
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#FF9F4A] to-orange-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    إنشاء المهمة
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
