import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, Send, Loader2, CheckCircle2, XCircle, AlertCircle, Home } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface LeaveRequest {
  id: string;
  title: string;
  hr_type: string;
  leave_type?: string;
  start_date?: string;
  end_date?: string;
  days_count?: number;
  leave_time_from?: string;
  leave_time_to?: string;
  reason?: string;
  status_name?: string;
  status_id?: string;
  substitute_name?: string;
  created_at?: string;
}

export default function MyLeaveRequestPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myRequests, setMyRequests] = useState<LeaveRequest[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    hr_type: 'إجازة',
    leave_type: 'سنوية',
    start_date: '',
    end_date: '',
    days_count: '',
    leave_time_from: '',
    leave_time_to: '',
    reason: '',
    substitute_id: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersRes, statusesRes, myRequestsRes] = await Promise.all([
        api.get<{ success: boolean; data: any[] }>('/api/portal/users'),
        api.get<{ success: boolean; data: any[] }>('/api/orders/statuses'),
        api.get<{ success: boolean; data: any[] }>('/api/administrative/my-leave-requests'),
      ]);

      if (usersRes.success) setUsers(usersRes.data);
      if (statusesRes.success) setStatuses(statusesRes.data);
      if (myRequestsRes.success) setMyRequests(myRequestsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(false);

    try {
      const title = formData.hr_type === 'إجازة' 
        ? `طلب إجازة ${formData.leave_type} - ${user?.name}`
        : `طلب مغادرة - ${user?.name}`;

      const payload: any = {
        category_id: 4, // الموارد البشرية
        title,
        status_id: 1, // مسودة / بانتظار الموافقة
        hr_type: formData.hr_type,
        employee_id: user?.id,
      };

      if (formData.hr_type === 'إجازة') {
        payload.leave_type = formData.leave_type;
        if (formData.start_date) payload.start_date = formData.start_date;
        if (formData.end_date) payload.end_date = formData.end_date;
        if (formData.days_count) payload.days_count = formData.days_count;
      } else {
        if (formData.start_date) payload.start_date = formData.start_date;
        if (formData.leave_time_from) payload.leave_time_from = formData.leave_time_from;
        if (formData.leave_time_to) payload.leave_time_to = formData.leave_time_to;
      }

      if (formData.reason.trim()) payload.reason = formData.reason.trim();
      if (formData.substitute_id) payload.substitute_id = formData.substitute_id;

      const res = await api.post<{ success: boolean }>('/api/administrative/leave-request', payload);

      if (res.success) {
        setSuccess(true);
        setShowForm(false);
        setFormData({
          hr_type: 'إجازة', leave_type: 'سنوية', start_date: '', end_date: '',
          days_count: '', leave_time_from: '', leave_time_to: '', reason: '', substitute_id: '',
        });
        loadData();
      }
    } catch (err: any) {
      alert(err.message || 'فشل تقديم الطلب');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (statusName?: string) => {
    if (!statusName) return 'bg-gray-100 text-gray-600';
    if (statusName.includes('مكتمل') || statusName.includes('موافق')) return 'bg-green-100 text-green-700';
    if (statusName.includes('مرفوض') || statusName.includes('ملغي')) return 'bg-red-100 text-red-700';
    if (statusName.includes('تنفيذ') || statusName.includes('مراجعة')) return 'bg-blue-100 text-blue-700';
    return 'bg-amber-100 text-amber-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back to Home */}
      <button
        onClick={() => navigate('/welcome')}
        className="flex items-center gap-2 text-gray-500 hover:text-green-600 transition-colors"
      >
        <Home className="w-4 h-4" />
        <span>الصفحة الرئيسية</span>
      </button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg shadow-green-500/30">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">طلب إجازة / مغادرة</h1>
            <p className="text-gray-500 mt-1">قدّم طلب إجازة أو مغادرة وتابع حالته</p>
          </div>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
        >
          <Send className="w-5 h-5" />
          تقديم طلب جديد
        </button>
      </motion.div>

      {/* Success Message */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-center gap-3"
        >
          <CheckCircle2 className="w-6 h-6 text-green-600" />
          <p className="text-green-700 font-semibold">تم تقديم طلبك بنجاح! سيتم مراجعته من قبل الإدارة.</p>
        </motion.div>
      )}

      {/* Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-8 border-2 border-green-100"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            📝 تقديم طلب جديد
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* نوع الطلب */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">نوع الطلب</label>
              <select
                value={formData.hr_type}
                onChange={(e) => setFormData({ ...formData, hr_type: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
              >
                <option value="إجازة">إجازة</option>
                <option value="مغادرة">مغادرة</option>
              </select>
            </div>

            {/* نوع الإجازة */}
            {formData.hr_type === 'إجازة' && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">نوع الإجازة</label>
                <select
                  value={formData.leave_type}
                  onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
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

            {/* التواريخ */}
            {formData.hr_type === 'إجازة' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">من تاريخ</label>
                  <input type="date" value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">إلى تاريخ</label>
                  <input type="date" value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">عدد الأيام</label>
                  <input type="number" step="0.5" min="0.5" value={formData.days_count}
                    onChange={(e) => setFormData({ ...formData, days_count: e.target.value })}
                    placeholder="مثال: 3"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">تاريخ المغادرة</label>
                  <input type="date" value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">من الساعة</label>
                  <input type="time" value={formData.leave_time_from}
                    onChange={(e) => setFormData({ ...formData, leave_time_from: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">إلى الساعة</label>
                  <input type="time" value={formData.leave_time_to}
                    onChange={(e) => setFormData({ ...formData, leave_time_to: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none" />
                </div>
              </div>
            )}

            {/* السبب */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">السبب</label>
              <textarea value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="اكتب سبب الإجازة أو المغادرة..."
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none resize-none" />
            </div>

            {/* البديل */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">البديل (من يغطي مكانك)</label>
              <select value={formData.substitute_id}
                onChange={(e) => setFormData({ ...formData, substitute_id: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none">
                <option value="">-- اختر البديل (اختياري) --</option>
                {users.filter(u => u.id.toString() !== user?.id?.toString()).map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-6 py-3 text-gray-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors">
                إلغاء
              </button>
              <button type="submit" disabled={submitting}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 transition-all">
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {submitting ? 'جاري التقديم...' : 'تقديم الطلب'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* My Requests List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800">طلباتي السابقة</h2>
        
        {myRequests.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">لم تقدم أي طلبات إجازة أو مغادرة بعد</p>
          </div>
        ) : (
          myRequests.map((req) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border-2 border-gray-100 p-5 hover:border-green-200 transition-all"
            >
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                      {req.hr_type}
                    </span>
                    {req.leave_type && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-semibold">
                        {req.leave_type}
                      </span>
                    )}
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(req.status_name)}`}>
                      {req.status_name || 'بانتظار المراجعة'}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-800">{req.title}</h3>
                  
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 flex-wrap">
                    {req.start_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(req.start_date), 'dd MMM yyyy', { locale: ar })}
                        {req.end_date && req.hr_type === 'إجازة' && ` → ${format(new Date(req.end_date), 'dd MMM yyyy', { locale: ar })}`}
                      </span>
                    )}
                    {req.days_count && <span className="font-semibold">{req.days_count} يوم</span>}
                    {req.leave_time_from && req.leave_time_to && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {req.leave_time_from} - {req.leave_time_to}
                      </span>
                    )}
                  </div>
                  {req.reason && <p className="text-sm text-gray-600 mt-2">{req.reason}</p>}
                </div>
                {req.created_at && (
                  <span className="text-xs text-gray-400">
                    {format(new Date(req.created_at), 'dd MMM', { locale: ar })}
                  </span>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
