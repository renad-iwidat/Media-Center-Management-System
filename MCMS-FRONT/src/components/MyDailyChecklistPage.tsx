import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, ListChecks, Home, Plus, Trash2, Pencil, Settings, Check, X } from 'lucide-react';
import { api } from '../services/api';

interface DailyChecklistItem {
  template_id: string;
  title: string;
  sequence_order: number;
  is_completed: boolean;
  marked_at?: string | null;
}

interface DailyTaskTemplate {
  id: string;
  title: string;
  assigned_to: string;
  sequence_order: number;
  is_active: boolean;
}

interface ChecklistResponse {
  success: boolean;
  data?: { business_day: string; user_id: string; items: DailyChecklistItem[] };
  error?: string;
}

interface GenericResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export default function MyDailyChecklistPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<DailyChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  // وضع التعديل (إدارة المهام الخاصة)
  const [editMode, setEditMode] = useState(false);
  const [templates, setTemplates] = useState<DailyTaskTemplate[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  useEffect(() => {
    loadChecklist();
  }, []);

  const loadChecklist = async () => {
    try {
      const res = await api.get<ChecklistResponse>('/api/daily-tasks/checklist');
      if (res.success && res.data) {
        setItems(res.data.items);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const res = await api.get<GenericResponse<DailyTaskTemplate[]>>(
        '/api/daily-tasks/templates'
      );
      if (res.success && res.data) setTemplates(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const enterEditMode = async () => {
    await loadTemplates();
    setEditMode(true);
  };

  const exitEditMode = async () => {
    setEditMode(false);
    setEditingId(null);
    setNewTitle('');
    await loadChecklist();
  };

  // ====== وضع علامة الإنجاز ======
  const toggleItem = async (item: DailyChecklistItem) => {
    const newValue = !item.is_completed;
    setSavingId(item.template_id);
    setItems((prev) =>
      prev.map((i) => (i.template_id === item.template_id ? { ...i, is_completed: newValue } : i))
    );
    try {
      const action = newValue ? 'complete' : 'uncomplete';
      const res = await api.post<GenericResponse<DailyChecklistItem>>(
        `/api/daily-tasks/checklist/items/${item.template_id}/${action}`,
        {}
      );
      if (!res.success) {
        setItems((prev) =>
          prev.map((i) =>
            i.template_id === item.template_id ? { ...i, is_completed: item.is_completed } : i
          )
        );
      }
    } catch (err) {
      console.error(err);
      setItems((prev) =>
        prev.map((i) =>
          i.template_id === item.template_id ? { ...i, is_completed: item.is_completed } : i
        )
      );
    } finally {
      setSavingId(null);
    }
  };

  // ====== إدارة المهام الخاصة ======
  const addTemplate = async () => {
    if (!newTitle.trim()) return;
    try {
      const res = await api.post<GenericResponse<DailyTaskTemplate>>(
        '/api/daily-tasks/templates',
        { title: newTitle.trim() } // بدون assigned_to => تُنسب للموظف نفسه
      );
      if (res.success) {
        setNewTitle('');
        loadTemplates();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const saveEdit = async (id: string) => {
    if (!editingTitle.trim()) return;
    try {
      const res = await api.put<GenericResponse<DailyTaskTemplate>>(
        `/api/daily-tasks/templates/${id}`,
        { title: editingTitle.trim() }
      );
      if (res.success) {
        setEditingId(null);
        loadTemplates();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const removeTemplate = async (id: string) => {
    if (!confirm('هل تريد حذف هذه المهمة اليومية؟ ستبقى سجلات الإنجاز السابقة محفوظة.')) return;
    try {
      const res = await api.delete<GenericResponse<unknown>>(
        `/api/daily-tasks/templates/${id}`
      );
      if (res.success) loadTemplates();
    } catch (err) {
      console.error(err);
    }
  };

  const completedCount = items.filter((i) => i.is_completed).length;
  const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <button
        onClick={() => navigate('/welcome')}
        className="flex items-center gap-2 text-gray-500 hover:text-emerald-600 transition-colors"
      >
        <Home className="w-4 h-4" />
        <span>الصفحة الرئيسية</span>
      </button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-4 flex-wrap"
      >
        <div className="flex items-center gap-4">
          <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg shadow-emerald-500/30">
            <ListChecks className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">مهامي اليومية</h1>
            <p className="text-gray-500 mt-1">قائمة مهامك اليومية الثابتة — ضع علامة عند الإنجاز</p>
          </div>
        </div>

        {!editMode ? (
          <button
            onClick={enterEditMode}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
          >
            <Settings className="w-5 h-5" />
            تعديل مهامي
          </button>
        ) : (
          <button
            onClick={exitEditMode}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors"
          >
            <Check className="w-5 h-5" />
            تم
          </button>
        )}
      </motion.div>

      {/* ====== وضع التعديل: إدارة المهام الخاصة ====== */}
      {editMode ? (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-100 p-5 flex gap-3">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTemplate()}
              placeholder="أضف مهمة يومية جديدة (مثال: تصوير)"
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

          {templates.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <p className="text-gray-400">لا توجد مهام يومية بعد — أضف أول مهمة من الأعلى</p>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 rounded-xl border-2 border-gray-100 bg-white p-4"
                >
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
                    <span className="flex-1 font-bold text-gray-800">{t.title}</span>
                  )}

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
                        onClick={() => {
                          setEditingId(t.id);
                          setEditingTitle(t.title);
                        }}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                      >
                        <Pencil className="w-5 h-5" />
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
        </div>
      ) : (
        <>
          {/* Progress */}
          {items.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-100 p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-600">إنجاز اليوم</span>
                <span className="text-sm font-bold text-emerald-600">
                  {completedCount} / {items.length} ({progress}%)
                </span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-l from-emerald-500 to-teal-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>
          )}

          {/* Checklist */}
          {items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200"
            >
              <ListChecks className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-500 mb-2">لا توجد مهام يومية</h3>
              <p className="text-gray-400 mb-4">أضف مهامك اليومية الثابتة لتظهر لك كل يوم</p>
              <button
                onClick={enterEditMode}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                إضافة مهام
              </button>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <motion.button
                  key={item.template_id}
                  type="button"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  disabled={savingId === item.template_id}
                  onClick={() => toggleItem(item)}
                  className={`w-full flex items-center gap-4 text-right rounded-xl border-2 p-5 transition-all ${
                    item.is_completed
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-white border-gray-100 hover:border-emerald-200 hover:shadow-md'
                  } ${savingId === item.template_id ? 'opacity-60' : ''}`}
                >
                  {item.is_completed ? (
                    <CheckCircle2 className="w-7 h-7 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <Circle className="w-7 h-7 text-gray-300 flex-shrink-0" />
                  )}
                  <span
                    className={`flex-1 font-bold text-lg ${
                      item.is_completed ? 'text-emerald-700 line-through' : 'text-gray-800'
                    }`}
                  >
                    {item.title}
                  </span>
                </motion.button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
