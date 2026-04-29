import React, { useState, useEffect } from 'react';
import { 
  Filter, Search, Plus, ChevronLeft, ChevronRight,
  TrendingUp, Clock, AlertCircle, CheckCircle2,
  MoreHorizontal, Eye, Edit, Trash2, Archive, XCircle
} from 'lucide-react';
import { api } from '../services/api';
import { Order, Desk, Status, Program } from '../types';
import { Button, Input, Select } from './ui/Inputs';
import { Badge } from './ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Modal } from './ui/Modal';
import OrderForm from './OrderForm';
import TaskForm from './TaskForm';

export default function OrdersPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState({ limit: 10, offset: 0, total: 0 });
  const [filters, setFilters] = useState({
    desk_id: '',
    status_id: '',
    program_id: '',
    search: ''
  });

  const [lookups, setLookups] = useState<{
    desks: Desk[];
    statuses: Status[];
    programs: Program[];
  }>({ desks: [], statuses: [], programs: [] });

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
        ...(filters.desk_id && { desk_id: filters.desk_id }),
        ...(filters.status_id && { status_id: filters.status_id }),
        ...(filters.program_id && { program_id: filters.program_id }),
        ...(filters.search && { search: filters.search })
      }).toString();

      const res = await api.get<{ success: boolean; data: Order[]; total: number }>(`/api/orders?${query}`);
      console.log('Orders Response:', res);
      console.log('Orders Data:', res.data);
      if (res.data && res.data.length > 0) {
        console.log('First Order:', res.data[0]);
      }
      
      if (res.success) {
        setOrders(res.data);
        // If total is not provided, use the length of data
        setPagination(p => ({ ...p, total: res.total || res.data?.length || 0 }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLookups = async () => {
    try {
      const [desksRes, statusesRes, programsRes] = await Promise.all([
        api.get<{ success: boolean; data: Desk[] }>('/api/portal/desks'),
        api.get<{ success: boolean; data: Status[] }>('/api/orders/statuses'),
        api.get<{ success: boolean; data: Program[] }>('/api/portal/programs')
      ]);

      setLookups({
        desks: desksRes.data || [],
        statuses: statusesRes.data || [],
        programs: programsRes.data || []
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLookups();
  }, []);

  useEffect(() => {
    fetchData();
  }, [pagination.offset, filters]);

  const handleOrderSuccess = (id?: number) => {
    if (id) {
      setCreatedOrderId(id);
      setIsOrderModalOpen(false);
      setIsTaskModalOpen(true);
    } else {
      setIsOrderModalOpen(false);
      fetchData();
    }
  };

  const handleTaskSuccess = () => {
    setIsTaskModalOpen(false);
    if (createdOrderId) {
      navigate(`/orders/${createdOrderId}`);
    } else {
      fetchData();
    }
  };

  const getStatusVariant = (id: number) => {
    const variants: Record<number, any> = {
      1: 'gray',   // Created
      2: 'yellow', // Pending
      3: 'blue',   // In Progress
      4: 'purple', // Review
      5: 'green',  // Done
      6: 'red'     // Cancelled
    };
    return variants[id] || 'gray';
  };

  const getPriorityLabel = (id: number) => {
    const labels: Record<number, string> = {
      1: 'عاجل',
      2: 'عالي',
      3: 'متوسط',
      4: 'منخفض'
    };
    return labels[id] || 'غير محدد';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">الأوردرات</h1>
          <p className="text-slate-500 font-medium">إدارة ومتابعة طلبات الإنتاج الإعلامي</p>
        </div>
        <Button 
          onClick={() => setIsOrderModalOpen(true)} 
          className="gap-2 bg-[#3d6a8a] hover:bg-[#2d5570] text-white shadow-lg hover:shadow-xl"
        >
          <Plus size={20} />
          أوردر جديد
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/50">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[250px] relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <Input 
              placeholder="ابحث عن أوردر..." 
              className="pr-12 h-12 text-base bg-slate-50 border-slate-200 focus:bg-white shadow-sm"
              value={filters.search}
              onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
            />
          </div>
          
          <div className="w-56">
            <Select 
              options={[{ value: '', label: 'كل الأقسام' }, ...lookups.desks.map(d => ({ value: d.id, label: d.name }))]}
              value={filters.desk_id}
              onChange={(e) => setFilters(f => ({ ...f, desk_id: e.target.value }))}
              className="h-12 text-base shadow-sm"
            />
          </div>

          <div className="w-56">
            <Select 
              options={[{ value: '', label: 'كل الحالات' }, ...lookups.statuses.map(s => ({ value: s.id, label: s.name }))]}
              value={filters.status_id}
              onChange={(e) => setFilters(f => ({ ...f, status_id: e.target.value }))}
              className="h-12 text-base shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xl shadow-slate-200/50">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-gradient-to-l from-slate-50 to-slate-100 text-xs text-slate-600 uppercase font-bold border-b-2 border-slate-200">
                <th className="px-6 py-4">العنوان</th>
                <th className="px-6 py-4">الحالة</th>
                <th className="px-6 py-4">أنشئ بواسطة</th>
                <th className="px-6 py-4">الأولوية</th>
                <th className="px-6 py-4">الموعد النهائي</th>
                <th className="px-6 py-4">الإنجاز</th>
                <th className="px-6 py-4">تاريخ الإنشاء</th>
                <th className="px-6 py-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <AnimatePresence mode="popLayout">
                {orders.map((order, index) => (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={order.id} 
                    className={cn(
                      "hover:bg-blue-50 transition-all group cursor-pointer border-b border-slate-100",
                      index % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                    )}
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <span className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {order.title}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="px-2 py-0.5 bg-slate-100 rounded-md font-medium">{order.desk_name}</span>
                          {order.program_name && (
                            <>
                              <span>•</span>
                              <span>{order.program_name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <Badge variant={getStatusVariant(order.status_id)}>
                        {order.status_name}
                      </Badge>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm font-semibold text-slate-700">
                        {order.created_by_name || 'غير معروف'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={cn(
                        "text-sm font-bold px-3 py-1 rounded-lg",
                        order.priority_id === 1 && "bg-red-100 text-red-700",
                        order.priority_id === 2 && "bg-orange-100 text-orange-700",
                        order.priority_id === 3 && "bg-yellow-100 text-yellow-700",
                        order.priority_id === 4 && "bg-slate-100 text-slate-600"
                      )}>
                        {getPriorityLabel(order.priority_id)}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-slate-400" />
                        <span className="font-mono text-sm text-slate-700 font-medium">
                          {order.deadline ? format(new Date(order.deadline), 'yyyy-MM-dd') : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-2 w-32">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-500">
                            {order.completion_percentage}%
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              order.completion_percentage === 100 ? "bg-green-500" :
                              order.completion_percentage >= 50 ? "bg-blue-500" :
                              "bg-yellow-500"
                            )}
                            style={{ width: `${order.completion_percentage}%` }} 
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="font-mono text-sm text-slate-500">
                        {order.created_at ? format(new Date(order.created_at), 'yyyy/MM/dd') : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center">
                        <button 
                          className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-sm hover:shadow-md" 
                          onClick={(e) => { e.stopPropagation(); navigate(`/orders/${order.id}`); }}
                          title="عرض التفاصيل"
                        >
                          <Eye size={20} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          
          {loading && orders.length === 0 && (
            <div className="p-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-slate-600 font-medium">جاري تحميل الأوردرات...</p>
            </div>
          )}
          
          {!loading && orders.length === 0 && (
            <div className="p-24 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 rounded-full mb-6 shadow-inner">
                <Search className="text-slate-400" size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">لا يوجد أوردرات</h3>
              <p className="text-slate-500 mb-6">لم يتم العثور على أوردرات تطابق معايير البحث</p>
              <Button onClick={() => setIsOrderModalOpen(true)} className="gap-2">
                <Plus size={18} />
                إنشاء أوردر جديد
              </Button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {orders.length > 0 && (
          <div className="px-6 py-4 bg-slate-50 border-t-2 border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 font-medium">
                عرض <span className="font-bold text-slate-900">{orders.length}</span> من أصل <span className="font-bold text-slate-900">{pagination.total}</span> أوردر
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button 
                disabled={pagination.offset === 0}
                onClick={() => setPagination(p => ({ ...p, offset: p.offset - p.limit }))}
                className="px-4 py-2 text-slate-600 hover:bg-white hover:text-blue-600 rounded-lg shadow-sm border border-slate-200 transition-all disabled:opacity-30 disabled:pointer-events-none font-medium flex items-center gap-2"
              >
                <ChevronRight size={18} />
                السابق
              </button>
              <button 
                disabled={pagination.offset + pagination.limit >= pagination.total}
                onClick={() => setPagination(p => ({ ...p, offset: p.offset + p.limit }))}
                className="px-4 py-2 text-slate-600 hover:bg-white hover:text-blue-600 rounded-lg shadow-sm border border-slate-200 transition-all disabled:opacity-30 disabled:pointer-events-none font-medium flex items-center gap-2"
              >
                التالي
                <ChevronLeft size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isOrderModalOpen} 
        onClose={() => setIsOrderModalOpen(false)} 
        title="إنشاء أوردر جديد"
        className="max-w-3xl"
      >
        <OrderForm onSuccess={handleOrderSuccess} onCancel={() => setIsOrderModalOpen(false)} />
      </Modal>

      <Modal 
        isOpen={isTaskModalOpen} 
        onClose={() => setIsTaskModalOpen(false)} 
        title="إنشاء المهمة الأولى"
        className="max-w-3xl"
      >
        <TaskForm 
          fixedOrderId={createdOrderId || undefined} 
          onSuccess={handleTaskSuccess} 
          onCancel={() => setIsTaskModalOpen(false)} 
        />
      </Modal>
    </div>
  );
}
