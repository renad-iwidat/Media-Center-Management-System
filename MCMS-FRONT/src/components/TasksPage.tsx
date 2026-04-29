import React, { useState, useEffect, useMemo } from 'react';
import { 
  Filter, Search, Plus, ChevronLeft, ChevronRight,
  Clock, AlertCircle, CheckCircle2, UserPlus, 
  MoreHorizontal, Eye, Edit, Trash2, CheckSquare
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Task, Order, Status, User } from '../types';
import { Button, Input, Select } from './ui/Inputs';
import { Badge } from './ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Modal } from './ui/Modal';
import TaskForm from './TaskForm';

type TaskTab = 'all' | 'mine' | 'overdue';

export default function TasksPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<TaskTab>('all');
  const [pagination, setPagination] = useState({ limit: 10, offset: 0, total: 0 });
  
  const [filters, setFilters] = useState({
    order_id: '',
    assigned_to: '',
    status_id: '',
    search: ''
  });

  const [lookups, setLookups] = useState<{
    orders: Order[];
    statuses: Status[];
    users: User[];
  }>({ orders: [], statuses: [], users: [] });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
  const [isBulkActionModalOpen, setIsBulkActionModalOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<'assign' | 'status' | null>(null);

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
        ...(filters.search && { search: filters.search })
      }).toString();

      const res = await api.get<{ success: boolean; data: Task[]; total: number }>(`${endpoint}?${query}`);
      if (res.success) {
        setTasks(res.data);
        setPagination(p => ({ ...p, total: res.total || 0 }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLookups = async () => {
    try {
      const [ordersRes, statusesRes, usersRes] = await Promise.all([
        api.get<{ success: boolean; data: Order[] }>('/api/orders?limit=50'),
        api.get<{ success: boolean; data: Status[] }>('/api/tasks/statuses'),
        api.get<{ success: boolean; data: User[] }>('/api/portal/users')
      ]);

      setLookups({
        orders: ordersRes.data || [],
        statuses: statusesRes.data || [],
        users: usersRes.data || []
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchLookups(); }, []);
  useEffect(() => { fetchData(); setSelectedTasks([]); }, [pagination.offset, filters, activeTab]);

  const toggleSelectAll = () => {
    if (selectedTasks.length === tasks.length) setSelectedTasks([]);
    else setSelectedTasks(tasks.map(t => t.id));
  };

  const toggleSelectOne = (id: number) => {
    if (selectedTasks.includes(id)) setSelectedTasks(selectedTasks.filter(tid => tid !== id));
    else setSelectedTasks([...selectedTasks, id]);
  };

  const handleBulkAction = async (value: number) => {
    if (!user) return;
    try {
      const endpoint = bulkActionType === 'assign' ? '/api/tasks/bulk-assign' : '/api/tasks/bulk-status';
      const payload = bulkActionType === 'assign' 
        ? { task_ids: selectedTasks, user_id: value, assigned_by: user.id }
        : { task_ids: selectedTasks, status_id: value, changed_by: user.id };

      const res = await api.post<{ success: boolean }>(endpoint, payload);
      if (res.success) {
        setIsBulkActionModalOpen(false);
        setBulkActionType(null);
        setSelectedTasks([]);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">المهام التنفيذية</h1>
          <p className="text-slate-500 font-medium">متابعة وإنجاز العمليات اليومية</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
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
            options={[{ value: '', label: 'كل الأوردرات' }, ...lookups.orders.map(o => ({ value: o.id, label: o.title }))]}
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

        {selectedTasks.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-right-4 duration-300">
            <span className="text-[11px] font-bold text-blue-700">{selectedTasks.length} مختار</span>
            <div className="h-4 w-px bg-blue-200 mx-1" />
            <button onClick={() => { setBulkActionType('assign'); setIsBulkActionModalOpen(true); }} className="text-[11px] font-black text-blue-600 hover:underline">تعيين موظف</button>
            <button onClick={() => { setBulkActionType('status'); setIsBulkActionModalOpen(true); }} className="text-[11px] font-black text-blue-600 hover:underline">تغيير حالة</button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-xl shadow-slate-200/40">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50/50 text-[11px] text-slate-500 uppercase font-bold border-b border-slate-100">
                <th className="px-6 py-4 w-10">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    checked={selectedTasks.length === tasks.length && tasks.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-6 py-4">المهمة</th>
                <th className="px-6 py-4">الأوردر</th>
                <th className="px-6 py-4 text-center">الحالة</th>
                <th className="px-6 py-4 text-center">المسؤول</th>
                <th className="px-6 py-4 text-center">الموعد</th>
                <th className="px-6 py-4 text-center">الأولوية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <AnimatePresence mode="popLayout">
                {tasks.map((task) => (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={task.id} 
                    className={cn(
                      "hover:bg-slate-50 transition-all group cursor-pointer",
                      selectedTasks.includes(task.id) && "bg-blue-50/30"
                    )}
                    onClick={() => navigate(`/tasks/${task.id}`)}
                  >
                    <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedTasks.includes(task.id)}
                        onChange={() => toggleSelectOne(task.id)}
                      />
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {task.title}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs text-slate-500 font-medium max-w-[150px] truncate block" title={task.order_title}>
                        {task.order_title}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <Badge variant={getTaskStatusVariant(task.status_id)}>
                        {task.status_name}
                      </Badge>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700">{task.assigned_to_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center font-mono text-xs text-slate-500">
                      {task.deadline ? format(new Date(task.deadline), 'yyyy-MM-dd') : 'N/A'}
                    </td>
                    <td className="px-6 py-5 text-center text-xs font-bold text-slate-600">
                      {getPriorityLabel(task.priority_id)}
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
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-bold">
            عرض {tasks.length} من أصل {pagination.total} مهمة
          </span>
          <div className="flex items-center gap-2">
            <button 
              disabled={pagination.offset === 0}
              onClick={() => setPagination(p => ({ ...p, offset: p.offset - p.limit }))}
              className="p-2 text-slate-500 hover:bg-white hover:text-blue-600 rounded-lg shadow-sm border border-slate-200 transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight size={18} />
            </button>
            <button 
              disabled={pagination.offset + pagination.limit >= pagination.total}
              onClick={() => setPagination(p => ({ ...p, offset: p.offset + p.limit }))}
              className="p-2 text-slate-500 hover:bg-white hover:text-blue-600 rounded-lg shadow-sm border border-slate-200 transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft size={18} />
            </button>
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="إنشاء مهمة جديدة" className="max-w-3xl">
        <TaskForm onSuccess={() => { setIsModalOpen(false); fetchData(); }} onCancel={() => setIsModalOpen(false)} />
      </Modal>

      <Modal isOpen={isBulkActionModalOpen} onClose={() => setIsBulkActionModalOpen(false)} title="إجراء جماعي">
        <div className="space-y-6">
          <p className="text-sm font-bold text-slate-600">
            سيتم {bulkActionType === 'assign' ? 'تعيين الموظف المختار لـ' : 'تغيير حالة'} {selectedTasks.length} مهمة.
          </p>
          
          {bulkActionType === 'assign' ? (
            <Select 
              label="اختر الموظف"
              options={[{ value: '', label: 'اختر...' }, ...lookups.users.map(u => ({ value: u.id, label: u.name }))]}
              onChange={(e) => handleBulkAction(Number(e.target.value))}
            />
          ) : (
            <Select 
              label="اختر الحالة"
              options={[{ value: '', label: 'اختر...' }, ...lookups.statuses.map(s => ({ value: s.id, label: s.name }))]}
              onChange={(e) => handleBulkAction(Number(e.target.value))}
            />
          )}

          <div className="flex justify-end pt-4">
            <Button variant="ghost" onClick={() => setIsBulkActionModalOpen(false)}>إلغاء</Button>
          </div>
        </div>
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
