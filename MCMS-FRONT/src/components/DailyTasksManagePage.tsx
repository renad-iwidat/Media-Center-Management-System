import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ListChecks, Home, Plus, Trash2, ChevronUp, ChevronDown, Power, Check, X } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface DailyTaskTemplate {
  id: string;
  title: string;
  assigned_to: string;
  sequence_order: number;
  is_active: boolean;
}

interface SimpleUser {
  id: string;
  name: string;
  role_name?: string;
}

interface ListResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export default function DailyTasksManagePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [templates, setTemplates] = useState<DailyTaskTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const canManage = user?.permissions?.includes('daily_tasks.manage');

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUserId) loadTemplates(selectedUserId);
    else setTemplates([]);
  }, [selectedUserId]);

  const loadUsers = async () => {
    try {
      const res = await api.get<ListResponse<SimpleUser[]>>('/api/portal/users');
      if (res.success && res.data) setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadTemplates = async (userId: string) => {
    setLoading(true);
    try {
      const res = await api.get<ListResponse<DailyTaskTemplate[]>>(
        `/api/daily-tasks/templates?assigned_to=${userId}`
      );
      if (res.success && res.data) setTemplates(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addTemplate = async () => {
    if (!newTitle.trim() || !selectedUserId) return;
    try {
      const res = await api.post<ListResponse<DailyTaskTemplate>>(
        '/api/daily-tasks/templates',
        { title: newTitle.trim(), assigned_to: selectedUserId }
      );
      if (res.success) {
        setNewTitle('');
        loadTemplates(selectedUserId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const saveEdit = async (id: string) => {
    if (!editingTitle.trim()) return;
    try {
      const res = await api.put<ListResponse<DailyTaskTemplate>>(
        `/api/daily-tasks/templates/${id}`,
        { title: editingTitle.trim() }
      );
      if (res.success) {
        setEditingId(null);
        loadTemplates(selectedUserId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleActive = async (t: DailyTaskTemplate) => {
    try {
      const res = await api.put<ListResponse<DailyTaskTemplate>>(
        `/api/daily-tasks/templates/${t.id}`,
        { is_active: !t.is_active }
      );
      if (res.success) loadTemplates(selectedUserId);
    } catch (err) {
      console.error(err);
    }
  };

  const removeTemplate = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المهمة اليومية؟ ستبقى سجلات الإنجاز السابقة محفوظة.')) return;
    try {
      const res = await api.delete<ListResponse<unknown>>(
        `/api/daily-tasks/templates/${id}`
      );
      if (res.success) loadTemplates(selectedUserId);
    } catch (err) {
      console.error(err);
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= templates.length) return;
    const reordered = [...templates];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(target, 0, moved);
    setTemplates(reordered);
    try {
      await api.patch<ListResponse<DailyTaskTemplate[]>>(
        '/api/daily-tasks/templates/reorder',
        { assigned_to: selectedUserId, ordered_ids: reordered.map((t) => t.id) }
      );
    } catch (err) {
      console.error(err);
      loadTemplates(selectedUserId);
    }
  };

  if (user && !canManage) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <ListChecks className="w-16 h-16 mb-4" />
        <p className="text-lg font-bold">ليس لديك صلاحية لإدارة المهام اليومية</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/welcome')}
        className="flex items-center gap-2 text-gray-500 hover:text-emerald-600 transition-colors"
      >
        <Home className="w-4 h-4" />
        <span>الصفحة الرئيسية</span>
      </button>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg shadow-emerald-500/30">
          <ListChecks className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">إدارة المهام اليومية</h1>
          <p className="text-gray-500 mt-1">عرّف المهام اليومية الثابتة لكل موظف مرة واحدة</p>
        </div>
      </motion.div>

      {/* اختيار الموظف */}
      <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-100 p-5">
        <label className="block text-sm font-bold text-gray-600 mb-2">اختر الموظف</label>
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-emerald-400 outline-none"
        >
          <option value="">— اختر موظفاً —</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
              {u.role_name ? ` — ${u.role_name}` : ''}
            </option>
          ))}
        </select>
      </div>

      {selectedUserId && (
        <>
          {/* إضافة مهمة */}
          <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-100 p-5 flex gap-3">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTemplate()}
              placeholder="عنوان المهمة اليومية (مثال: تصوير)"
              className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-emerald-400 outline-none"
            />
            <button
              onClick={addTemplate}
              disabled={!newTitle.trim()}
              className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
              إضافة
            </button>
          </div>

          {/* القائمة */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <p className="text-gray-400">لا توجد مهام يومية لهذا الموظف بعد</p>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((t, index) => (
                <div
                  key={t.id}
                  className={`flex items-center gap-3 rounded-xl border-2 p-4 ${
                    t.is_active ? 'bg-white border-gray-100' : 'bg-gray-50 border-gray-200 opacity-70'
                  }`}
                >
                  {/* ترتيب */}
                  <div className="flex flex-col">
                    <button onClick={() => move(index, -1)} disabled={index === 0} className="text-gray-400 hover:text-emerald-600 disabled:opacity-30">
                      <ChevronUp className="w-5 h-5" />
                    </button>
                    <button onClick={() => move(index, 1)} disabled={index === templates.length - 1} className="text-gray-400 hover:text-emerald-600 disabled:opacity-30">
                      <ChevronDown className="w-5 h-5" />
                    </button>
                  </div>

                  {/* العنوان */}
                  {editingId === t.id ? (
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit(t.id)}
                      autoFocus
                      className="flex-1 border-2 border-emerald-300 rounded-lg px-3 py-2 outline-none"
                    />
                  ) : (
                    <span
                      className={`flex-1 font-bold ${t.is_active ? 'text-gray-800' : 'text-gray-400'}`}
                      onDoubleClick={() => {
                        setEditingId(t.id);
                        setEditingTitle(t.title);
                      }}
                    >
                      {t.title}
                      {!t.is_active && <span className="text-xs text-gray-400 mr-2">(مُعطّلة)</span>}
                    </span>
                  )}

                  {/* أزرار */}
                  {editingId === t.id ? (
                    <>
                      <button onClick={() => saveEdit(t.id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg">
                        <Check className="w-5 h-5" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => toggleActive(t)}
                        title={t.is_active ? 'تعطيل' : 'تفعيل'}
                        className={`p-2 rounded-lg ${t.is_active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-gray-400 hover:bg-gray-100'}`}
                      >
                        <Power className="w-5 h-5" />
                      </button>
                      <button onClick={() => removeTemplate(t.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
