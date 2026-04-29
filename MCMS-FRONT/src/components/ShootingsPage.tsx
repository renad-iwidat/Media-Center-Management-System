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

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="البحث في التصويرات..." 
              className="pr-12"
            />
          </div>
          
          <Select 
            className="w-48"
            options={[{ value: '', label: 'كل الأوردارات' }, ...orders.map(o => ({ value: o.id.toString(), label: o.title }))]}
            value={filters.order_id}
            onChange={(e) => setFilters(prev => ({ ...prev, order_id: e.target.value }))}
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">الموقع / الموعد</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">الأوردر المرتبط</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">النوع / المنشئ</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">المحتوى المنتج</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {shootings.map((s) => (
                <tr 
                  key={s.id} 
                  className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/shootings/${s.id}`)}
                >
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-blue-600" />
                        <span className="font-bold text-slate-900">{s.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono font-bold">
                        <Calendar size={12} />
                        {s.start_time ? format(new Date(s.start_time), 'yyyy/MM/dd HH:mm') : 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-700 truncate max-w-[200px]">{s.order_title}</p>
                      {s.task_status_name && (
                        <Badge variant={getTaskStatusVariant(s.task_status_name)}>{s.task_status_name}</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <Badge variant={s.source_type === 'internal' ? 'blue' : 'purple'}>
                        {s.source_type === 'internal' ? 'داخلي' : 'خارجي'}
                      </Badge>
                      <p className="text-[10px] text-slate-400 font-bold">{s.created_by_name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                        {s.content_count || 0}
                      </div>
                      <span className="text-xs text-slate-400 font-bold">محتوى منتج</span>
                    </div>
                  </td>
                  <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/shootings/${s.id}`)}>
                        <Eye size={16} />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {loading && shootings.length === 0 && (
            <div className="p-12 text-center text-slate-400">جاري تحميل بيانات التصوير...</div>
          )}
          
          {!loading && shootings.length === 0 && (
            <div className="p-12 text-center">
              <Camera size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-500 font-bold text-lg">لم يتم العثور على أوردارات تصوير</p>
              <p className="text-slate-400 text-sm">جرب تغيير الفلاتر أو أضف تصوير جديد</p>
            </div>
          )}
        </div>
        
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500">
            عرض {shootings.length} من أصل {pagination.total}
          </span>
          <div className="flex items-center gap-2">
            <Button 
              variant="secondary" 
              size="sm" 
              disabled={pagination.offset === 0}
              onClick={() => handlePageChange(pagination.offset - pagination.limit)}
            >
              <ChevronRight size={16} />
            </Button>
            <Button 
              variant="secondary" 
              size="sm"
              disabled={pagination.offset + pagination.limit >= pagination.total}
              onClick={() => handlePageChange(pagination.offset + pagination.limit)}
            >
              <ChevronLeft size={16} />
            </Button>
          </div>
        </div>
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
