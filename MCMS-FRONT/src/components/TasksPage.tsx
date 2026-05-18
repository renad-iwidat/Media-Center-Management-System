import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, ChevronLeft, ChevronRight,
  Clock, CheckSquare
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Task, Order, Status, User, TaskType } from '../types';
import { Button, Input, Select } from './ui/Inputs';
import { Badge } from './ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { useNavigate, useLocation } from 'react-router-dom';
import { Modal } from './ui/Modal';
import TaskForm from './TaskForm';
import TaskTypeIndicator from './TaskTypeIndicator';
import TaskStatusDropdown from './TaskStatusDropdown';

type TaskTab = 'all' | 'mine' | 'overdue';

export default function TasksPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<TaskTab>('all');
  const [pagination, setPagination] = useState({ limit: 10, offset: 0, total: 0 });
  
  const [filters, setFilters] = useState({
    order_id: '',
    assigned_to: '',
    status_id: '',
    task_type_id: '',
    search: ''
  });

  const [lookups, setLookups] = useState<{
    orders: Order[];
    statuses: Status[];
    users: User[];
    taskTypes: TaskType[];
  }>({ 
    orders: [], 
    statuses: [], 
    users: [], 
    taskTypes: [
      { id: 1, name: 'تصوير', category: 'shooting', color: '#3b82f6', icon: '📹' },
      { id: 2, name: 'اخبارية', category: 'reporting', color: '#a855f7', icon: '📰' },
      { id: 3, name: 'أخرى', category: 'other', color: '#64748b', icon: '📋' }
    ]
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      let endpoint = '/api/tasks';
      if (activeTab === 'mine' && user) endpoint = `/api/tasks/assignee/${user.id}`;
      else if (activeTab === 'overdue') endpoint = '/api/tasks/overdue';

      const query = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
        ...(filters.order_id && { order_id: filters.order_id }),
        ...(filters.assigned_to && { assigned_to: filters.assigned_to }),
        ...(filters.status_id && { status_id: filters.status_id }),
        ...(filters.task_type_id && { task_type_id: filters.task_type_id }),
        ...(filters.search && { search: filters.search })
      }).toString();

      const res = await api.get<{ success: boolean; data: Task[]; total: number }>(`${endpoint}?${query}`);
      if (res.success) {
        setTasks(res.data);
        setPagination(p => ({ ...p, total: res.total ?? res.data?.length ?? 0 }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLookups = async () => {
    try {
      const [ordersRes, statusesRes, usersRes, typesRes] = await Promise.all([
        api.get<{ success: boolean; data: Order[] }>('/api/orders?limit=50'),
        api.get<{ success: boolean; data: Status[] }>('/api/tasks/statuses'),
        api.get<{ success: boolean; data: User[] }>('/api/portal/users'),
        api.get<{ success: boolean; data: TaskType[] }>('/api/tasks/types')
      ]);

      // Task types - use API data if available
      let taskTypes: TaskType[] = [];
      if (typesRes.success && Array.isArray(typesRes.data) && typesRes.data.length > 0) {
        taskTypes = typesRes.data;
      } else {
        // Fallback to hardcoded task types
        taskTypes = [
          { id: 1, name: 'تصوير', category: 'shooting', color: '#3b82f6', icon: '📹' },
          { id: 2, name: 'اخبارية', category: 'reporting', color: '#a855f7', icon: '📰' },
          { id: 3, name: 'أخرى', category: 'other', color: '#64748b', icon: '📋' }
        ];
      }

      setLookups({
        orders: ordersRes.data || [],
        statuses: statusesRes.data || [],
        users: usersRes.data || [],
        taskTypes: taskTypes
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchLookups(); }, []);
  useEffect(() => { fetchData(); }, [pagination.offset, filters, activeTab]);

  // إعادة تحميل البيانات لما الصفحة ترجع للنشاط (بعد الرجوع من تفاصيل المهمة)
  useEffect(() => {
    if (location.pathname === '/tasks') {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  // إعادة تحميل البيانات لما الصفحة ترجع تكون مرئية
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchData();
      }
    };

    const handleFocus = () => {
      fetchData();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.offset, filters, activeTab]);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">المهام التنفيذية</h1>
          <p className="text-slate-500 font-medium">متابعة وإنجاز العمليات اليومية</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-[#3d6a8a] hover:bg-[#2d5570] text-white shadow-lg hover:shadow-xl">
          <Plus size={20} />
          مهمة جديدة
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl w-fit border border-slate-200">
        <TabBtn active={activeTab === 'all'} onClick={() => setActiveTab('all')}>الكل</TabBtn>
        <TabBtn active={activeTab === 'mine'} onClick={() => setActiveTab('mine')}>مهامي</TabBtn>
        <TabBtn active={activeTab === 'overdue'} onClick={() => setActiveTab('overdue')}>المتأخرة</TabBtn>
      </div>

      {/* Filters & Bulk Actions */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            placeholder="بحث في المهام..." 
            className="pr-11 bg-slate-50 border-transparent focus:bg-white"
            value={filters.search}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
          />
        </div>
        
        <div className="w-48">
          <Select 
            options={[{ value: '', label: 'كل الطلبات' }, ...lookups.orders.map(o => ({ value: o.id, label: o.title }))]}
            value={filters.order_id}
            onChange={(e) => setFilters(f => ({ ...f, order_id: e.target.value }))}
            className="h-11 py-0 text-sm"
          />
        </div>

        <div className="w-40">
          <Select 
            options={[{ value: '', label: 'كل الموظفين' }, ...lookups.users.map(u => ({ value: u.id, label: u.name }))]}
            value={filters.assigned_to}
            onChange={(e) => setFilters(f => ({ ...f, assigned_to: e.target.value }))}
            className="h-11 py-0 text-sm"
          />
        </div>

        <div className="w-40">
          <Select 
            options={[{ value: '', label: 'كل الحالات' }, ...lookups.statuses.map(s => ({ value: s.id, label: s.name }))]}
            value={filters.status_id}
            onChange={(e) => setFilters(f => ({ ...f, status_id: e.target.value }))}
            className="h-11 py-0 text-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-gradient-to-r from-[#3d6a8a] to-[#2d5570] text-white text-sm font-bold border-b-4 border-[#FF9F4A]">
                <th className="px-6 py-4 border-r border-white/20">المهمة</th>
                <th className="px-6 py-4 border-r border-white/20">الطلب</th>
                <th className="px-6 py-4 border-r border-white/20">الحالة</th>
                <th className="px-6 py-4 border-r border-white/20">المسؤول</th>
                <th className="px-6 py-4 border-r border-white/20">الموعد</th>
                <th className="px-6 py-4">الأولوية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <AnimatePresence mode="popLayout">
                {tasks.map((task, index) => (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={task.id} 
                    className={cn(
                      "hover:bg-blue-50 transition-all group cursor-pointer border-l-4",
                      index % 2 === 0 ? "bg-white" : "bg-slate-50",
                      "border-l-[#FF9F4A]"
                    )}
                    onClick={() => navigate(`/tasks/${task.id}`)}
                  >
                    <td className="px-6 py-5 border-r border-slate-200">
                      <span className="text-sm font-bold text-slate-900 group-hover:text-[#3d6a8a] transition-colors">
                        {task.title}
                      </span>
                    </td>
                    <td className="px-6 py-5 border-r border-slate-200">
                      <span className="text-xs font-semibold text-slate-700 px-2.5 py-1 bg-slate-100 rounded-lg inline-block max-w-[150px] truncate" title={task.order_title}>
                        {task.order_title}
                      </span>
                    </td>
                    <td className="px-6 py-5 border-r border-slate-200">
                      {(() => {
                        const statusName = task.status_name || lookups.statuses.find(s => s.id === task.status_id)?.name || '—';
                        // ألوان الحالة
                        const statusColor = (() => {
                          const name = statusName.toLowerCase();
                          if (name.includes('done') || name.includes('منجز') || name.includes('مكتمل')) return 'bg-green-100 text-green-700 border-green-200';
                          if (name.includes('progress') || name.includes('قيد') || name.includes('تنفيذ')) return 'bg-blue-100 text-blue-700 border-blue-200';
                          if (name.includes('review') || name.includes('مراجعة')) return 'bg-purple-100 text-purple-700 border-purple-200';
                          if (name.includes('cancel') || name.includes('ملغ') || name.includes('رفض')) return 'bg-red-100 text-red-700 border-red-200';
                          if (name.includes('pending') || name.includes('انتظار') || name.includes('معلق')) return 'bg-amber-100 text-amber-700 border-amber-200';
                          return 'bg-slate-100 text-slate-700 border-slate-200';
                        })();
                        return (
                          <span className={cn(
                            "text-xs font-bold px-3 py-1.5 rounded-lg inline-block border",
                            statusColor
                          )}>
                            {statusName}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-5 border-r border-slate-200">
                      <span className="text-sm font-semibold text-slate-700 px-2.5 py-1 bg-slate-100 rounded-lg inline-block">
                        {task.assigned_to_name}
                      </span>
                    </td>
                    <td className="px-6 py-5 border-r border-slate-200 whitespace-nowrap">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <Clock size={14} className="text-[#FF9F4A] flex-shrink-0" />
                        <span className="font-mono text-sm text-slate-700 font-medium bg-orange-50 px-2.5 py-1 rounded-lg whitespace-nowrap">
                          {task.deadline ? format(new Date(task.deadline), 'yyyy-MM-dd') : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={cn(
                        "text-xs font-bold px-2.5 py-1 rounded-lg inline-block",
                        task.priority_id === 1 && "bg-red-100 text-red-700",
                        task.priority_id === 2 && "bg-orange-100 text-orange-700",
                        task.priority_id === 3 && "bg-yellow-100 text-yellow-700",
                        task.priority_id === 4 && "bg-slate-100 text-slate-600"
                      )}>
                        {getPriorityLabel(task.priority_id)}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          
          {loading && tasks.length === 0 && (
            <div className="p-12 text-center text-slate-400">جاري تحميل المهام...</div>
          )}
          
          {!loading && tasks.length === 0 && (
            <div className="p-20 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <CheckSquare className="text-slate-300" size={32} />
              </div>
              <p className="text-slate-500 font-bold">لا يوجد مهام حالياً</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {tasks.length > 0 && (
          <div className="px-6 py-4 bg-gradient-to-r from-[#3d6a8a] to-[#2d5570] border-t-4 border-[#FF9F4A] flex items-center justify-between text-white">
            <span className="text-sm font-medium">
              عرض <span className="font-bold text-[#FF9F4A]">{tasks.length}</span> من أصل <span className="font-bold text-[#FF9F4A]">{pagination.total}</span> مهمة
            </span>
            <div className="flex items-center gap-3">
              <button 
                disabled={pagination.offset === 0}
                onClick={() => setPagination(p => ({ ...p, offset: p.offset - p.limit }))}
                className="px-4 py-2 text-white bg-white/20 hover:bg-white/30 rounded-lg border border-white/30 transition-all disabled:opacity-30 disabled:pointer-events-none font-medium flex items-center gap-2"
              >
                <ChevronRight size={18} />
                السابق
              </button>
              <button 
                disabled={pagination.offset + pagination.limit >= pagination.total}
                onClick={() => setPagination(p => ({ ...p, offset: p.offset + p.limit }))}
                className="px-4 py-2 text-white bg-white/20 hover:bg-white/30 rounded-lg border border-white/30 transition-all disabled:opacity-30 disabled:pointer-events-none font-medium flex items-center gap-2"
              >
                التالي
                <ChevronLeft size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="إنشاء مهمة جديدة" className="max-w-3xl">
        <TaskForm 
          onSuccess={(newTaskId) => { 
            setIsModalOpen(false); 
            if (newTaskId) {
              // إذا كانت مهمة اخبارية جديدة، افتح تفاصيلها
              navigate(`/tasks/${newTaskId}`);
            } else {
              fetchData();
            }
          }} 
          onCancel={() => setIsModalOpen(false)} 
        />
      </Modal>
    </div>
  );
}

function TabBtn({ children, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-6 py-2 text-xs font-bold rounded-xl transition-all",
        active ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
      )}
    >
      {children}
    </button>
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
  return labels[id] || 'منخفض';
};
