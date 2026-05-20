import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Calendar, 
  User, 
  Clock, 
  ListTodo, 
  Plus, 
  CheckCircle2, 
  Archive,
  Trash2,
  FileText,
  Lock,
  Edit
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { api } from '../../services/api';
import { 
  AdminProcOrder, 
  AdminProcTask,
  AdminProcResponse, 
  AdminProcListResponse 
} from '../../types/administrative';
import AdminProcTaskForm from './AdminProcTaskForm';

export default function AdminProcOrderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<AdminProcOrder | null>(null);
  const [tasks, setTasks] = useState<AdminProcTask[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [orderRes, tasksRes, statusesRes] = await Promise.all([
        api.get<AdminProcResponse<AdminProcOrder>>(`/api/administrative/orders/${id}`),
        api.get<AdminProcListResponse<AdminProcTask>>(`/api/administrative/orders/${id}/tasks`),
        api.get<{ success: boolean; data: any[] }>('/api/orders/statuses'),
      ]);

      if (orderRes.success) setOrder(orderRes.data);
      else setError(orderRes.error || 'لم يتم العثور على الطلب');

      if (tasksRes.success) setTasks(tasksRes.data);
      if (statusesRes.success) setStatuses(statusesRes.data);
    } catch (err: any) {
      setError(err.message || 'فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderStatusChange = async (newStatusId: string) => {
    try {
      await api.put(`/api/administrative/orders/${id}`, {
        status_id: newStatusId,
      });
      loadData();
    } catch (err) {
      console.error(err);
      alert('فشل تغيير حالة الطلب');
    }
  };

  const handleArchive = async () => {
    if (!confirm('هل أنت متأكد من أرشفة هذا الطلب؟')) return;
    
    try {
      await api.post(`/api/administrative/orders/${id}/archive`, {});
      navigate('/administrative');
    } catch (err) {
      console.error(err);
      alert('فشل أرشفة الطلب');
    }
  };

  const handleDelete = async () => {
    if (!confirm('هل أنت متأكد من حذف هذا الطلب؟ لا يمكن التراجع.')) return;
    
    try {
      await api.delete(`/api/administrative/orders/${id}`);
      navigate('/administrative');
    } catch (err) {
      console.error(err);
      alert('فشل حذف الطلب');
    }
  };

  const handleTaskCreated = () => {
    setShowTaskForm(false);
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md p-8 bg-red-50 border-2 border-red-200 rounded-2xl">
          <Lock className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-700 mb-2">غير متاح</h2>
          <p className="text-red-600">{error || 'لم يتم العثور على الطلب'}</p>
          <button
            onClick={() => navigate('/administrative')}
            className="mt-6 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            العودة للأقسام
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(`/administrative/categories/${order.category_id}`)}
        className="flex items-center gap-2 text-gray-500 hover:text-[#FF9F4A] transition-colors"
      >
        <ArrowRight className="w-4 h-4" />
        <span>العودة للقائمة</span>
      </button>

      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-100"
      >
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div className="flex-1 min-w-[300px]">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
                {order.category_name}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{order.title}</h1>
            {order.description && (
              <p className="text-gray-600 leading-relaxed">{order.description}</p>
            )}

            {/* تغيير حالة الطلب */}
            <div className="mt-4 flex items-center gap-3">
              <span className="text-sm font-bold text-gray-600">حالة الطلب:</span>
              <select
                value={order.status_id?.toString() || ''}
                onChange={(e) => handleOrderStatusChange(e.target.value)}
                className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-bold border-2 border-blue-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
              >
                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleArchive}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-semibold text-sm transition-colors"
            >
              <Archive className="w-4 h-4" />
              أرشفة
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 font-semibold text-sm transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              حذف
            </button>
          </div>
        </div>

        {/* Meta Info */}
        <div className="flex items-center gap-6 flex-wrap text-sm text-gray-500 pt-4 border-t border-gray-100">
          <span className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <strong className="text-gray-700">{order.created_by_name}</strong>
          </span>
          {order.created_at && (
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {format(new Date(order.created_at), 'dd MMMM yyyy - hh:mm a', { locale: ar })}
            </span>
          )}
          {order.deadline && (
            <span className="flex items-center gap-2 text-orange-600">
              <Calendar className="w-4 h-4" />
              <strong>الموعد النهائي:</strong>
              {format(new Date(order.deadline), 'dd MMMM yyyy', { locale: ar })}
            </span>
          )}
        </div>
      </motion.div>

      {/* Notes/Details Card */}
      {order.notes && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl shadow-md p-6 border-2 border-orange-200"
        >
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-bold text-gray-800">
              {order.category_name === 'الإعلانات' ? 'محتوى الإعلان' : 'تفاصيل الكتاب الرسمي'}
            </h3>
          </div>
          <div className="bg-white rounded-xl p-4 border border-orange-100">
            <pre className="whitespace-pre-wrap text-gray-700 leading-relaxed font-sans">
              {order.notes}
            </pre>
          </div>
        </motion.div>
      )}

      {/* بيانات العطاء */}
      {(order.tender_id || order.donor_client || order.announcement_link || order.submission_deadline || order.initial_notes) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-md p-6 border-2 border-blue-200"
        >
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-800">بيانات العطاء</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {order.tender_id && (
              <div className="bg-white rounded-xl p-4 border border-blue-100">
                <p className="text-xs font-bold text-blue-600 mb-1">رقم/اسم العطاء</p>
                <p className="text-gray-800 font-semibold">{order.tender_id}</p>
              </div>
            )}
            {order.donor_client && (
              <div className="bg-white rounded-xl p-4 border border-blue-100">
                <p className="text-xs font-bold text-blue-600 mb-1">الجهة المانحة / العميل</p>
                <p className="text-gray-800 font-semibold">{order.donor_client}</p>
              </div>
            )}
            {order.announcement_link && (
              <div className="bg-white rounded-xl p-4 border border-blue-100">
                <p className="text-xs font-bold text-blue-600 mb-1">رابط إعلان العطاء</p>
                <a href={order.announcement_link} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 underline text-sm break-all">
                  {order.announcement_link}
                </a>
              </div>
            )}
            {order.submission_deadline && (
              <div className="bg-white rounded-xl p-4 border border-blue-100">
                <p className="text-xs font-bold text-blue-600 mb-1">الموعد النهائي للتقديم</p>
                <p className="text-gray-800 font-semibold">
                  {format(new Date(order.submission_deadline), 'dd MMMM yyyy - hh:mm a', { locale: ar })}
                </p>
              </div>
            )}
            {order.initial_notes && (
              <div className="bg-white rounded-xl p-4 border border-blue-100 md:col-span-2">
                <p className="text-xs font-bold text-blue-600 mb-1">ملاحظات أولية</p>
                <p className="text-gray-700 whitespace-pre-wrap">{order.initial_notes}</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* بيانات الموارد البشرية */}
      {order.hr_type && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-md p-6 border-2 border-green-200"
        >
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-bold text-gray-800">
              بيانات {order.hr_type === 'مغادرة' ? 'المغادرة' : 'الإجازة'}
            </h3>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
              {order.hr_type}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {order.hr_type === 'إجازة' && order.leave_type && (
              <div className="bg-white rounded-xl p-4 border border-green-100">
                <p className="text-xs font-bold text-green-600 mb-1">نوع الإجازة</p>
                <p className="text-gray-800 font-semibold">{order.leave_type}</p>
              </div>
            )}
            {order.employee_name && (
              <div className="bg-white rounded-xl p-4 border border-green-100">
                <p className="text-xs font-bold text-green-600 mb-1">الموظف</p>
                <p className="text-gray-800 font-semibold">{order.employee_name}</p>
              </div>
            )}
            {order.start_date && (
              <div className="bg-white rounded-xl p-4 border border-green-100">
                <p className="text-xs font-bold text-green-600 mb-1">
                  {order.hr_type === 'مغادرة' ? 'تاريخ المغادرة' : 'من تاريخ'}
                </p>
                <p className="text-gray-800 font-semibold">
                  {format(new Date(order.start_date), 'dd MMMM yyyy', { locale: ar })}
                </p>
              </div>
            )}
            {order.end_date && order.hr_type === 'إجازة' && (
              <div className="bg-white rounded-xl p-4 border border-green-100">
                <p className="text-xs font-bold text-green-600 mb-1">إلى تاريخ</p>
                <p className="text-gray-800 font-semibold">
                  {format(new Date(order.end_date), 'dd MMMM yyyy', { locale: ar })}
                </p>
              </div>
            )}
            {order.days_count && (
              <div className="bg-white rounded-xl p-4 border border-green-100">
                <p className="text-xs font-bold text-green-600 mb-1">عدد الأيام</p>
                <p className="text-gray-800 font-semibold text-xl">{order.days_count} يوم</p>
              </div>
            )}
            {order.leave_time_from && order.leave_time_to && (
              <div className="bg-white rounded-xl p-4 border border-green-100">
                <p className="text-xs font-bold text-green-600 mb-1">وقت المغادرة</p>
                <p className="text-gray-800 font-semibold">
                  من {order.leave_time_from} إلى {order.leave_time_to}
                </p>
              </div>
            )}
            {order.substitute_name && (
              <div className="bg-white rounded-xl p-4 border border-green-100">
                <p className="text-xs font-bold text-green-600 mb-1">البديل</p>
                <p className="text-gray-800 font-semibold">{order.substitute_name}</p>
              </div>
            )}
            {order.reason && (
              <div className="bg-white rounded-xl p-4 border border-green-100 md:col-span-2">
                <p className="text-xs font-bold text-green-600 mb-1">السبب</p>
                <p className="text-gray-700 whitespace-pre-wrap">{order.reason}</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Tasks Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-md p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <ListTodo className="w-6 h-6 text-[#FF9F4A]" />
            <h3 className="text-xl font-bold text-gray-800">المهام</h3>
            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-bold">
              {tasks.length}
            </span>
          </div>
          <button
            onClick={() => setShowTaskForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#FF9F4A] text-white rounded-xl hover:bg-orange-600 font-semibold text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            إضافة مهمة
          </button>
        </div>

        {tasks.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <ListTodo className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">لا توجد مهام بعد</p>
            <p className="text-sm text-gray-400 mt-1">ابدأ بإضافة مهمة وتعيين موظفين عليها</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <motion.div
                key={task.id.toString()}
                whileHover={{ scale: 1.01 }}
                onClick={() => navigate(`/administrative/tasks/${task.id}`)}
                className="cursor-pointer p-4 bg-gray-50 rounded-xl hover:bg-orange-50 hover:border-orange-200 border-2 border-transparent transition-all flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-gray-800">{task.title}</h4>
                    {task.status_name && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                        {task.status_name}
                      </span>
                    )}
                  </div>
                  {task.description && (
                    <p className="text-sm text-gray-500 line-clamp-1">{task.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    {task.assignees && task.assignees.length > 0 && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {task.assignees.length} معين
                      </span>
                    )}
                    {task.comments_count !== undefined && task.comments_count > 0 && (
                      <span>💬 {task.comments_count} تعليق</span>
                    )}
                    {task.deadline && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(task.deadline), 'dd MMM', { locale: ar })}
                      </span>
                    )}
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-300 rotate-180" />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Task Form Modal */}
      {showTaskForm && order && (
        <AdminProcTaskForm
          orderId={order.id.toString()}
          orderTitle={order.title}
          onClose={() => setShowTaskForm(false)}
          onCreated={handleTaskCreated}
        />
      )}
    </div>
  );
}
