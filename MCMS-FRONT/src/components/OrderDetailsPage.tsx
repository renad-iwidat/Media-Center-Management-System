import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowRight, Clock, Calendar, User, Briefcase, 
  Settings, CheckCircle2, AlertCircle, Trash2, 
  Edit, Archive, XCircle, Plus, Info, Layout,
  History, BarChart2, MessageSquare, ClipboardCheck,
  TrendingUp
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { OrderDetails, Status, Task } from '../types';
import { Button } from './ui/Inputs';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import OrderForm from './OrderForm';
import TaskForm from './TaskForm';
import TaskStatusDropdown from './TaskStatusDropdown';

export default function OrderDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [availableStatuses, setAvailableStatuses] = useState<Status[]>([]);
  const [canDelete, setCanDelete] = useState(false);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const [detailsRes, statusesRes, deleteRes] = await Promise.all([
        api.get<{ success: boolean; data: OrderDetails }>(`/api/orders/${id}/details`),
        api.get<{ success: boolean; data: Status[] }>('/api/orders/statuses'),
        api.get<{ success: boolean; data: boolean }>(`/api/orders/${id}/can-delete`)
      ]);

      if (detailsRes.success) setOrder(detailsRes.data);
      if (statusesRes.success) setAvailableStatuses(statusesRes.data);
      if (deleteRes.success) setCanDelete(deleteRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleStatusChange = async (statusId: number) => {
    if (!user || !order) return;
    try {
      const res = await api.patch<{ success: boolean }>(`/api/orders/${id}/status`, {
        status_id: statusId,
        changed_by: user.id
      });
      if (res.success) {
        fetchDetails();
        setIsStatusMenuOpen(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancel = async () => {
    if (!user || !order) return;
    const reason = window.prompt('يرجى ذكر سبب الإلغاء:');
    if (reason === null) return;

    try {
      const res = await api.patch<{ success: boolean }>(`/api/orders/${id}/cancel`, {
        cancelled_by: user.id,
        reason
      });
      if (res.success) fetchDetails();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الطلب؟ سيتم حذف كل المهام المرتبطة به أيضاً.')) return;
    try {
      const res = await api.delete<{ success: boolean; error?: string }>(`/api/orders/${id}`);
      if (res.success) {
        navigate('/orders');
      } else {
        alert('فشل حذف الطلب: ' + (res.error || 'خطأ غير معروف'));
      }
    } catch (err: any) {
      console.error('Delete order error:', err);
      alert('فشل حذف الطلب: ' + (err?.message || 'خطأ في الاتصال'));
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-400">جاري تحميل تفاصيل الطلب...</div>;
  if (!order) return <div className="p-12 text-center text-red-500 font-bold">لم يتم العثور على الطلب</div>;

  const getStatusVariant = (id: number) => {
    const variants: Record<number, any> = {
      1: 'gray', 2: 'yellow', 3: 'blue', 4: 'purple', 5: 'green', 6: 'red'
    };
    return variants[id] || 'gray';
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Info */}
      <div className="flex flex-col gap-6">
        <Link 
          to="/orders" 
          className="flex items-center gap-3 text-white hover:text-white transition-all w-fit group bg-[#3d6a8a] hover:bg-[#2d5570] px-6 py-3 rounded-xl shadow-lg hover:shadow-xl"
        >
          <ArrowRight size={24} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-lg font-bold">العودة لقائمة الطلبات</span>
        </Link>

        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-3xl rounded-full -mr-20 -mt-20" />
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Badge variant={getStatusVariant(order.status_id)} className="px-4 py-1 text-[12px]">
                    {order.status_name}
                  </Badge>
                  <span className="text-xs font-mono font-bold text-slate-400">#{order.id}</span>
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">{order.title}</h1>
                <p className="text-slate-500 max-w-2xl leading-relaxed font-medium">{order.description || 'لا يوجد وصف متاح'}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Button 
                    onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)} 
                    className="gap-2 bg-[#3d6a8a] hover:bg-[#2d5570] text-white shadow-lg hover:shadow-xl"
                  >
                    <History size={20} />
                    تغيير الحالة
                  </Button>
                  <AnimatePresence>
                    {isStatusMenuOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute left-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden"
                      >
                        {availableStatuses.map(s => (
                          <button
                            key={s.id}
                            onClick={() => handleStatusChange(s.id)}
                            className={cn(
                              "w-full text-right px-4 py-3 text-sm font-bold transition-all hover:bg-slate-50",
                              order.status_id === s.id ? "text-[#3d6a8a] bg-blue-50/50" : "text-slate-600"
                            )}
                          >
                            {s.name}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Button 
                  onClick={() => setIsEditModalOpen(true)} 
                  className="gap-2 bg-[#3d6a8a] hover:bg-[#2d5570] text-white shadow-lg hover:shadow-xl"
                >
                  <Edit size={20} />
                  تعديل
                </Button>

                {order.status_id !== 5 && order.status_id !== 6 && (
                  <Button 
                    onClick={handleCancel} 
                    className="gap-2 bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl"
                  >
                    <XCircle size={20} />
                    إلغاء
                  </Button>
                )}

                {canDelete && (
                  <Button 
                    onClick={handleDelete} 
                    className="gap-2 bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl"
                  >
                    <Trash2 size={20} />
                    حذف
                  </Button>
                )}

                {order.status_id === 5 && (
                  <Button variant="secondary" className="gap-2 bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100">
                    <Archive size={18} />
                    أرشفة
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-10 pt-8 border-t border-slate-100">
              <InfoItem icon={<Layout size={18} />} label="القسم" value={order.desk_name || 'غير محدد'} />
              <InfoItem icon={<TrendingUp size={18} />} label="الأولوية" value={order.priority_name || 'غير محدد'} />
              <InfoItem icon={<Calendar size={18} />} label="الموعد النهائي" value={order.deadline ? format(new Date(order.deadline), 'yyyy/MM/dd') : 'N/A'} isHighlight />
              <InfoItem icon={<User size={18} />} label="أنشئ بواسطة" value={order.created_by_name || 'غير معروف'} />
              {order.program_name && <InfoItem icon={<Briefcase size={18} />} label="البرنامج" value={order.program_name} />}
              {order.episode_title && <InfoItem icon={<ClipboardCheck size={18} />} label="الحلقة" value={order.episode_title} />}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Progress Section */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40">
            <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-3">
              <BarChart2 className="text-blue-600" size={24} />
              تحليل الإنجاز
            </h3>
            
            <div className="flex flex-col items-center justify-center py-6">
              <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="96" cy="96" r="88"
                    fill="none" stroke="#f1f5f9" strokeWidth="12"
                  />
                  <motion.circle
                    cx="96" cy="96" r="88"
                    fill="none" stroke="#2563eb" strokeWidth="12"
                    strokeDasharray={2 * Math.PI * 88}
                    initial={{ strokeDashoffset: 2 * Math.PI * 88 }}
                    animate={{ strokeDashoffset: (2 * Math.PI * 88) * (1 - order.progress.percentage / 100) }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-black text-slate-900 leading-none">{order.progress.percentage}%</span>
                  <span className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">إجمالي الإنجاز</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-100">
              <StatItem label="مكتملة" value={order.progress.completed} color="text-green-600" />
              <StatItem label="جارية" value={order.progress.in_progress} color="text-blue-600" />
              <StatItem label="معلقة" value={order.progress.pending} color="text-slate-400" />
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <History className="text-slate-400" size={24} />
              سجل التحديثات
            </h3>
            <div className="space-y-6">
              {order.history.map((log, idx) => (
                <div key={log.id} className="relative flex gap-4 pl-1">
                  {idx !== order.history.length - 1 && (
                    <div className="absolute top-8 bottom-[-24px] right-2.5 w-0.5 bg-slate-100" />
                  )}
                  <div className="w-5 h-5 rounded-full bg-slate-100 border-2 border-white shadow-sm flex-shrink-0 z-10" />
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-xs font-bold text-slate-900">{log.changed_by_name}</span>
                      <span className="text-xs text-slate-400">غير الحالة إلى</span>
                      <span className="text-xs font-bold text-blue-600">{log.new_status_name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {log.changed_at ? format(new Date(log.changed_at), 'yyyy-MM-dd HH:mm') : 'N/A'}
                    </span>
                  </div>
                </div>
              ))}
              {order.history.length === 0 && (
                <p className="text-center text-slate-400 text-sm">لا يوجد تاريخ متاح</p>
              )}
            </div>
          </div>
        </div>

        {/* Tasks Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-xl shadow-slate-200/40">
            <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-1 flex items-center gap-3">
                  <CheckCircle2 className="text-blue-600" size={28} />
                  المهام المرتبطة
                </h3>
                <p className="text-sm text-slate-500 font-medium">إدارة المهام التفصيلية لهذا الطلب</p>
              </div>
              <Button 
                onClick={() => setIsNewTaskModalOpen(true)} 
                className="gap-2 bg-[#3d6a8a] hover:bg-[#2d5570] text-white shadow-lg hover:shadow-xl"
              >
                <Plus size={20} />
                إنشاء مهمة جديدة
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-slate-50/50 text-[11px] text-slate-500 uppercase font-bold border-b border-slate-100">
                    <th className="px-8 py-5">المهمة</th>
                    <th className="px-8 py-5 text-center">المسؤول</th>
                    <th className="px-8 py-5 text-center">الحالة</th>
                    <th className="px-8 py-5 text-center">الموعد</th>
                    <th className="px-8 py-5 text-center">الأولوية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.tasks.map((task) => (
                    <tr 
                      key={task.id} 
                      className="hover:bg-slate-50 transition-all group cursor-pointer"
                      onClick={() => navigate(`/tasks/${task.id}`)}
                    >
                      <td className="px-8 py-6">
                        <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {task.title}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <span className="text-xs font-bold text-slate-700">{task.assigned_to_name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        {(() => {
                          const statusName = task.status_name || '—';
                          const name = statusName.toLowerCase();
                          let color = 'bg-slate-100 text-slate-700 border-slate-200';
                          if (name.includes('done') || name.includes('منجز') || name.includes('مكتمل')) color = 'bg-green-100 text-green-700 border-green-200';
                          else if (name.includes('progress') || name.includes('قيد') || name.includes('تنفيذ')) color = 'bg-blue-100 text-blue-700 border-blue-200';
                          else if (name.includes('review') || name.includes('مراجعة')) color = 'bg-purple-100 text-purple-700 border-purple-200';
                          else if (name.includes('cancel') || name.includes('ملغ')) color = 'bg-red-100 text-red-700 border-red-200';
                          else if (name.includes('pending') || name.includes('انتظار') || name.includes('معلق')) color = 'bg-amber-100 text-amber-700 border-amber-200';
                          return (
                            <span className={`text-xs font-bold px-3 py-1.5 rounded-lg inline-block border ${color}`}>
                              {statusName}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-8 py-6 text-center font-mono text-xs text-slate-500">
                        {task.deadline ? format(new Date(task.deadline), 'yyyy-MM-dd') : 'N/A'}
                      </td>
                      <td className="px-8 py-6 text-center text-xs font-bold text-slate-600">
                        {getPriorityLabel(task.priority_id)}
                      </td>
                    </tr>
                  ))}
                  {order.tasks.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                          <ClipboardCheck className="text-slate-300" size={32} />
                        </div>
                        <p className="text-slate-500 font-bold">لا يوجد مهام مرتبطة حالياً</p>
                        <p className="text-sm text-slate-400 mt-1">ابدأ بإضافة أول مهمة لإنجاز هذا الطلب</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title="تعديل الطلب"
        className="max-w-3xl"
      >
        <OrderForm 
          initialData={order} 
          onSuccess={() => { setIsEditModalOpen(false); fetchDetails(); }} 
          onCancel={() => setIsEditModalOpen(false)} 
        />
      </Modal>

      <Modal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        title="إضافة مهمة جديدة"
        className="max-w-3xl"
      >
        <TaskForm
          fixedOrderId={order.id}
          onSuccess={(newTaskId) => { 
            setIsNewTaskModalOpen(false); 
            if (newTaskId) {
              // إذا كانت مهمة اخبارية جديدة، افتح تفاصيلها
              navigate(`/tasks/${newTaskId}`);
            } else {
              fetchDetails();
            }
          }}
          onCancel={() => setIsNewTaskModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

function InfoItem({ icon, label, value, isHighlight }: any) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-widest leading-none mt-0.5">{label}</span>
      </div>
      <span className={cn(
        "text-sm font-bold truncate",
        isHighlight ? "text-blue-600" : "text-slate-800"
      )} title={value}>
        {value}
      </span>
    </div>
  );
}

function StatItem({ label, value, color }: any) {
  return (
    <div className="text-center group">
      <div className={cn("text-2xl font-black mb-1 group-hover:scale-110 transition-transform", color)}>{value}</div>
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</div>
    </div>
  );
}

const getTaskStatusVariant = (id: number) => {
  const variants: Record<number, any> = {
    1: 'gray', 2: 'yellow', 3: 'blue', 4: 'purple', 5: 'green', 6: 'red'
  };
  return variants[id] || 'gray';
};

const getPriorityLabel = (id: number) => {
  const labels: Record<number, string> = {
    1: 'عاجل', 2: 'عالي', 3: 'متوسط', 4: 'منخفض'
  };
  return labels[id] || 'غير محدد';
};