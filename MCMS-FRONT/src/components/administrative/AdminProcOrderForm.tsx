import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { AdminProcCategory, AdminProcResponse, AdminProcOrder } from '../../types/administrative';

interface Props {
  category: AdminProcCategory;
  onClose: () => void;
  onCreated: () => void;
}

export default function AdminProcOrderForm({ category, onClose, onCreated }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    notes: '',
    status_id: '1',
    // حقول العطاءات
    tender_id: '',
    donor_client: '',
    announcement_link: '',
    submission_deadline: '',
    initial_notes: '',
    // حقول الموارد البشرية
    hr_type: 'إجازة',
    leave_type: 'سنوية',
    employee_id: '',
    start_date: '',
    end_date: '',
    days_count: '',
    leave_time_from: '',
    leave_time_to: '',
    reason: '',
    substitute_id: '',
  });

  // هل هذا القسم هو العطاءات؟
  const isTender = category.name === 'العطاءات' || category.id?.toString() === '3';
  // هل هذا القسم هو الموارد البشرية؟
  const isHR = category.name === 'الموارد البشرية' || category.id?.toString() === '4';

  React.useEffect(() => {
    // جلب حالات الطلبات
    api.get<{ success: boolean; data: any[] }>('/api/orders/statuses').then((res) => {
      if (res.success) setStatuses(res.data);
    });
    // جلب المستخدمين (للموارد البشرية)
    if (isHR) {
      api.get<{ success: boolean; data: any[] }>('/api/portal/users').then((res) => {
        if (res.success) setUsers(res.data);
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!formData.title.trim()) {
      setError('العنوان مطلوب');
      setLoading(false);
      return;
    }

    try {
      const payload: any = {
        category_id: category.id,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        status_id: parseInt(formData.status_id),
        notes: formData.notes.trim() || undefined,
      };

      if (formData.deadline) {
        payload.deadline = new Date(formData.deadline).toISOString();
      }

      // حقول العطاءات
      if (isTender) {
        if (formData.tender_id.trim()) payload.tender_id = formData.tender_id.trim();
        if (formData.donor_client.trim()) payload.donor_client = formData.donor_client.trim();
        if (formData.announcement_link.trim()) payload.announcement_link = formData.announcement_link.trim();
        if (formData.submission_deadline) payload.submission_deadline = new Date(formData.submission_deadline).toISOString();
        if (formData.initial_notes.trim()) payload.initial_notes = formData.initial_notes.trim();
      }

      // حقول الموارد البشرية
      if (isHR) {
        payload.hr_type = formData.hr_type;
        if (formData.leave_type) payload.leave_type = formData.leave_type;
        if (formData.employee_id) payload.employee_id = formData.employee_id;
        if (formData.start_date) payload.start_date = formData.start_date;
        if (formData.end_date) payload.end_date = formData.end_date;
        if (formData.days_count) payload.days_count = formData.days_count;
        if (formData.leave_time_from) payload.leave_time_from = formData.leave_time_from;
        if (formData.leave_time_to) payload.leave_time_to = formData.leave_time_to;
        if (formData.reason.trim()) payload.reason = formData.reason.trim();
        if (formData.substitute_id) payload.substitute_id = formData.substitute_id;
      }

      const res = await api.post<AdminProcResponse<AdminProcOrder>>(
        '/api/administrative/orders',
        payload
      );

      if (res.success) {
        onCreated();
      } else {
        setError(res.error || 'فشل إنشاء الطلب');
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
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div 
            className="px-8 py-6 flex items-center justify-between border-b"
            style={{ 
              backgroundColor: (category.color || '#3B82F6') + '15',
              borderColor: (category.color || '#3B82F6') + '30'
            }}
          >
            <div>
              <h2 className="text-2xl font-bold text-gray-800">إنشاء طلب جديد</h2>
              <p className="text-sm text-gray-500 mt-1">{category.name}</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="p-8 space-y-6">
              {/* العنوان */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  عنوان الطلب <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="اكتب عنوان الطلب..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#FF9F4A] focus:outline-none transition-colors"
                  required
                />
              </div>

              {/* الوصف */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  وصف الطلب
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="اكتب وصف مختصر للطلب..."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#FF9F4A] focus:outline-none transition-colors resize-none"
                />
              </div>

              {/* تفاصيل الطلب (notes) - يتغير حسب القسم */}
              {!isHR && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {isTender 
                      ? 'تفاصيل العطاء' 
                      : category.name === 'الإعلانات' 
                        ? 'محتوى الإعلان' 
                        : 'تفاصيل الطلب'}
                    {category.name === 'تكليف الكتب الرسمية' && (
                      <span className="text-gray-400 text-xs mr-1">(محتوى الكتاب الرسمي)</span>
                    )}
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder={
                      category.name === 'الإعلانات' 
                        ? 'اكتب نص الإعلان أو تفاصيله هنا...'
                        : isTender
                          ? 'اكتب تفاصيل العطاء هنا...'
                          : 'اكتب تفاصيل الطلب الكاملة هنا (نص الكتاب، التعليمات، إلخ)...'
                    }
                    rows={6}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#FF9F4A] focus:outline-none transition-colors resize-none font-mono text-sm"
                  />
                </div>
              )}

              {/* حقول العطاءات - تظهر فقط لقسم العطاءات */}
              {isTender && (
                <>
                  <div className="border-t-2 border-orange-200 pt-6">
                    <h3 className="text-lg font-bold text-orange-700 mb-4 flex items-center gap-2">
                      📋 بيانات العطاء
                    </h3>
                  </div>

                  {/* رقم/اسم العطاء */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      رقم/اسم العطاء
                    </label>
                    <input
                      type="text"
                      value={formData.tender_id}
                      onChange={(e) => setFormData({ ...formData, tender_id: e.target.value })}
                      placeholder="مثال: TAM/2025/T41"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#FF9F4A] focus:outline-none transition-colors"
                    />
                  </div>

                  {/* الجهة المانحة/العميل */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      الجهة المانحة / العميل
                    </label>
                    <input
                      type="text"
                      value={formData.donor_client}
                      onChange={(e) => setFormData({ ...formData, donor_client: e.target.value })}
                      placeholder="مثال: TAM, UNDP, UNICEF..."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#FF9F4A] focus:outline-none transition-colors"
                    />
                  </div>

                  {/* رابط إعلان العطاء */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      رابط إعلان العطاء
                    </label>
                    <input
                      type="url"
                      value={formData.announcement_link}
                      onChange={(e) => setFormData({ ...formData, announcement_link: e.target.value })}
                      placeholder="https://..."
                      dir="ltr"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#FF9F4A] focus:outline-none transition-colors text-left"
                    />
                  </div>

                  {/* الموعد النهائي للتقديم */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      الموعد النهائي للتقديم
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.submission_deadline}
                      onChange={(e) => setFormData({ ...formData, submission_deadline: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#FF9F4A] focus:outline-none transition-colors"
                    />
                  </div>

                  {/* ملاحظات أولية */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      ملاحظات أولية
                    </label>
                    <textarea
                      value={formData.initial_notes}
                      onChange={(e) => setFormData({ ...formData, initial_notes: e.target.value })}
                      placeholder="مثال: Technical and Financial offers shall be prepared..."
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#FF9F4A] focus:outline-none transition-colors resize-none"
                    />
                  </div>
                </>
              )}

              {/* حقول الموارد البشرية - تظهر فقط لقسم الموارد البشرية */}
              {isHR && (
                <>
                  <div className="border-t-2 border-green-200 pt-6">
                    <h3 className="text-lg font-bold text-green-700 mb-4 flex items-center gap-2">
                      👤 بيانات الإجازة / المغادرة
                    </h3>
                  </div>

                  {/* نوع الطلب */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      نوع الطلب <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.hr_type}
                      onChange={(e) => setFormData({ ...formData, hr_type: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                    >
                      <option value="إجازة">إجازة</option>
                      <option value="مغادرة">مغادرة</option>
                    </select>
                  </div>

                  {/* نوع الإجازة - يظهر فقط لو إجازة */}
                  {formData.hr_type === 'إجازة' && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        نوع الإجازة
                      </label>
                      <select
                        value={formData.leave_type}
                        onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                      >
                        <option value="سنوية">سنوية</option>
                        <option value="مرضية">مرضية</option>
                        <option value="بدون راتب">بدون راتب</option>
                        <option value="طارئة">طارئة</option>
                        <option value="أمومة">أمومة</option>
                        <option value="أخرى">أخرى</option>
                      </select>
                    </div>
                  )}

                  {/* الموظف */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      الموظف
                    </label>
                    <select
                      value={formData.employee_id}
                      onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                    >
                      <option value="">-- اختر الموظف --</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* تاريخ البداية والنهاية */}
                  {formData.hr_type === 'إجازة' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          من تاريخ
                        </label>
                        <input
                          type="date"
                          value={formData.start_date}
                          onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          إلى تاريخ
                        </label>
                        <input
                          type="date"
                          value={formData.end_date}
                          onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                  )}

                  {/* عدد الأيام */}
                  {formData.hr_type === 'إجازة' && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        عدد الأيام
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        value={formData.days_count}
                        onChange={(e) => setFormData({ ...formData, days_count: e.target.value })}
                        placeholder="مثال: 3"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                      />
                    </div>
                  )}

                  {/* وقت المغادرة - يظهر فقط لو مغادرة */}
                  {formData.hr_type === 'مغادرة' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          من الساعة
                        </label>
                        <input
                          type="time"
                          value={formData.leave_time_from}
                          onChange={(e) => setFormData({ ...formData, leave_time_from: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          إلى الساعة
                        </label>
                        <input
                          type="time"
                          value={formData.leave_time_to}
                          onChange={(e) => setFormData({ ...formData, leave_time_to: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                  )}

                  {/* تاريخ المغادرة */}
                  {formData.hr_type === 'مغادرة' && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        تاريخ المغادرة
                      </label>
                      <input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                      />
                    </div>
                  )}

                  {/* السبب */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      السبب
                    </label>
                    <textarea
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      placeholder="اكتب سبب الإجازة أو المغادرة..."
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors resize-none"
                    />
                  </div>

                  {/* البديل */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      البديل (من يغطي مكانه)
                    </label>
                    <select
                      value={formData.substitute_id}
                      onChange={(e) => setFormData({ ...formData, substitute_id: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                    >
                      <option value="">-- اختر البديل --</option>
                      {users.filter(u => u.id.toString() !== formData.employee_id).map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
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

              {/* حالة الطلب */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  حالة الطلب
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
                    إنشاء الطلب
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
