import React, { useState, useEffect } from 'react';
import { 
  Video, Calendar, MapPin, Search, Plus, 
  ChevronLeft, ChevronRight, Filter, Users, 
  MoreHorizontal, Eye, Edit, Trash2, Camera
} from 'lucide-react';
import { api } from '../services/api';
import { Shooting, Order, Lookup } from '../types';
import { Button, Input, Select } from './ui/Inputs';
import { Badge } from './ui/Badge';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Modal } from './ui/Modal';
import ShootingForm from './ShootingForm';
import { cn } from '../lib/utils';

export default function ShootingsPage() {
  const navigate = useNavigate();
  const [shootings, setShootings] = useState<Shooting[]>([]);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  
  const [pagination, setPagination] = useState({ limit: 10, offset: 0, total: 0 });
  const [filters, setFilters] = useState({
    order_id: '',
    creator: '',
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
      });
      
      const res = await api.get<{ success: boolean; data: Shooting[]; total: number }>(`/api/shootings/enriched?${query.toString()}`);
      if (res.success) {
        setShootings(res.data);
        setPagination(prev => ({ ...prev, total: res.total || 0 }));
      }

      const ordersRes = await api.get<{ success: boolean; data: Order[] }>('/api/orders?limit=100');
      if (ordersRes.success) {
        setOrders(ordersRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination.offset]);

  const handlePageChange = (newOffset: number) => {
    setPagination(prev => ({ ...prev, offset: newOffset }));
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">عمليات التصوير</h1>
          <p className="text-slate-500 font-bold">إدارة المواعيد، المواقع، وطواقم الإنتاج</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus size={20} />
          تصوير جديد
        </Button>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/50">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[250px] relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <Input 
              placeholder="البحث في التصويرات..." 
              className="pr-12 h-12 text-base bg-slate-50 border-slate-200 focus:bg-white shadow-sm"
            />
          </div>
          
          <div className="w-56">
            <Select 
              className="h-12 text-base shadow-sm"
              options={[{ value: '', label: 'كل الأوردارات' }, ...orders.map(o => ({ value: o.id.toString(), label: o.title }))]}
              value={filters.order_id}
              onChange={(e) => setFilters(prev => ({ ...prev, order_id: e.target.value }))}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-gradient-to-r from-[#3d6a8a] to-[#2d5570] text-white text-sm font-bold border-b-4 border-[#FF9F4A]">
                <th className="px-6 py-4 border-r border-white/20">الموقع / الموعد</th>
                <th className="px-6 py-4 border-r border-white/20">الأوردر المرتبط</th>
                <th className="px-6 py-4 border-r border-white/20">النوع / المنشئ</th>
                <th className="px-6 py-4 border-r border-white/20">المحتوى المنتج</th>
                <th className="px-6 py-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {shootings.map((s, index) => (
                <tr 
                  key={s.id} 
                  className={cn(
                    "hover:bg-blue-50 transition-all group cursor-pointer border-l-4 border-l-[#FF9F4A]",
                    index % 2 === 0 ? "bg-white" : "bg-slate-50"
                  )}
                  onClick={() => navigate(`/shootings/${s.id}`)}
                >
                  <td className="px-6 py-5 border-r border-slate-200">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-[#FF9F4A]" />
                        <span className="font-bold text-slate-900 group-hover:text-[#3d6a8a] transition-colors">{s.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono font-bold">
                        <Calendar size={12} />
                        {s.start_time ? format(new Date(s.start_time), 'yyyy/MM/dd HH:mm') : 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 border-r border-slate-200">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-700 truncate max-w-[200px]">{s.order_title}</p>
                      {s.task_status_name && (
                        <Badge variant={getTaskStatusVariant(s.task_status_name)}>{s.task_status_name}</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5 border-r border-slate-200">
                    <div className="space-y-1">
                      <Badge variant={s.source_type === 'internal' ? 'blue' : 'purple'}>
                        {s.source_type === 'internal' ? 'داخلي' : 'خارجي'}
                      </Badge>
                      <p className="text-[10px] text-slate-400 font-bold">{s.created_by_name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5 border-r border-slate-200">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                        {s.content_count || 0}
                      </div>
                      <span className="text-xs text-slate-400 font-bold">محتوى منتج</span>
                    </div>
                  </td>
                  <td className="px-6 py-5" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-center">
                      <button 
                        className="p-2.5 text-slate-500 hover:text-white hover:bg-[#3d6a8a] rounded-lg transition-all shadow-sm hover:shadow-md" 
                        onClick={(e) => { e.stopPropagation(); navigate(`/shootings/${s.id}`); }}
                        title="عرض التفاصيل"
                      >
                        <Eye size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {loading && shootings.length === 0 && (
            <div className="p-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <div className="w-8 h-8 border-4 border-[#3d6a8a] border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-slate-600 font-medium">جاري تحميل بيانات التصوير...</p>
            </div>
          )}
          
          {!loading && shootings.length === 0 && (
            <div className="p-24 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 rounded-full mb-6 shadow-inner">
                <Camera className="text-slate-400" size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">لم يتم العثور على أوردارات تصوير</h3>
              <p className="text-slate-500 mb-6">جرب تغيير الفلاتر أو أضف تصوير جديد</p>
              <Button onClick={() => setIsModalOpen(true)} className="gap-2">
                <Plus size={18} />
                إنشاء تصوير جديد
              </Button>
            </div>
          )}
        </div>
        
        {shootings.length > 0 && (
          <div className="px-6 py-4 bg-gradient-to-r from-[#3d6a8a] to-[#2d5570] border-t-4 border-[#FF9F4A] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-white font-medium">
                عرض <span className="font-bold text-[#FF9F4A]">{shootings.length}</span> من أصل <span className="font-bold text-[#FF9F4A]">{pagination.total}</span> تصوير
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button 
                disabled={pagination.offset === 0}
                onClick={() => handlePageChange(pagination.offset - pagination.limit)}
                className="px-4 py-2 text-white bg-white/20 hover:bg-white/30 rounded-lg border border-white/30 transition-all disabled:opacity-30 disabled:pointer-events-none font-medium flex items-center gap-2"
              >
                <ChevronRight size={18} />
                السابق
              </button>
              <button 
                disabled={pagination.offset + pagination.limit >= pagination.total}
                onClick={() => handlePageChange(pagination.offset + pagination.limit)}
                className="px-4 py-2 text-white bg-white/20 hover:bg-white/30 rounded-lg border border-white/30 transition-all disabled:opacity-30 disabled:pointer-events-none font-medium flex items-center gap-2"
              >
                التالي
                <ChevronLeft size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="إضافة تصوير جديد"
        className="max-w-3xl"
      >
        <ShootingForm onSuccess={() => { setIsModalOpen(false); fetchData(); }} onCancel={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
}

const getTaskStatusVariant = (statusName: string) => {
  const s = statusName.toLowerCase();
  if (s.includes('done') || s.includes('complete') || s.includes('مكتمل')) return 'green';
  if (s.includes('progress') || s.includes('جاري')) return 'blue';
  if (s.includes('pending') || s.includes('معلق')) return 'yellow';
  return 'gray';
};
