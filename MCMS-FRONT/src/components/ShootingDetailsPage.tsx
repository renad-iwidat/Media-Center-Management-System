import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, MapPin, Calendar, Users, Package, 
  Info, Video, Plus, FileVideo, Layers, ExternalLink,
  Edit, Trash2, Camera, User, Badge as BadgeIcon, Clock
} from 'lucide-react';
import { api } from '../services/api';
import { ShootingDetails, Content, ContentType } from '../types';
import { Button } from './ui/Inputs';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import ContentForm from './ContentForm';

export default function ShootingDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [shooting, setShooting] = useState<ShootingDetails | null>(null);
  
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: ShootingDetails }>(`/api/shootings/${id}/full`);
      if (res.success) {
        setShooting(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('هل أنت متأكد من حذف هذا التصوير؟')) return;
    try {
      const res = await api.delete<{ success: boolean }>(`/api/shootings/${id}`);
      if (res.success) navigate('/shootings');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-400">جاري تحميل تفاصيل التصوير...</div>;
  if (!shooting) return <div className="p-12 text-center text-red-500 font-bold">لم يتم العثور على بيانات التصوير</div>;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-6">
        <Link to="/shootings" className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors w-fit group">
          <ArrowRight size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold">العودة لقائمة التصويرات</span>
        </Link>

        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge variant={shooting.source_type === 'internal' ? 'blue' : 'purple'} className="px-4 py-1 text-[12px]">
                  {shooting.source_type === 'internal' ? 'تصوير داخلي' : 'تصوير خارجي'}
                </Badge>
                <span className="text-xs font-mono font-bold text-slate-400">#{shooting.id}</span>
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <Camera className="text-blue-600" size={32} />
                {shooting.location}
              </h1>
              <div className="flex items-center gap-4 text-slate-500 font-bold">
                 <Link to={`/orders/${shooting.order_id}`} className="hover:text-blue-600 transition-colors">
                   الأوردر: {shooting.order_title}
                 </Link>
                 {shooting.task_title && (
                   <>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500">المهمة: {shooting.task_title}</span>
                   </>
                 )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button variant="secondary" className="gap-2 bg-slate-50 border-slate-200 text-slate-700">
                <Edit size={18} />
                تعديل
              </Button>
              <Button onClick={handleDelete} variant="ghost" className="gap-2 text-red-600 hover:bg-red-100">
                <Trash2 size={18} />
                حذف
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-10 pt-8 border-t border-slate-100">
            <InfoItem icon={<Clock size={18} />} label="الموعد" value={shooting.start_time ? format(new Date(shooting.start_time), 'yyyy/MM/dd HH:mm') : 'N/A'} />
            <InfoItem icon={<User size={18} />} label="المنشئ" value={shooting.created_by_name || 'غير معروف'} isHighlight />
            <InfoItem icon={<Users size={18} />} label="الطاقم" value={shooting.crew.join('، ') || 'لا يوجد'} />
            <InfoItem icon={<Package size={18} />} label="المعدات" value={shooting.equipment.join('، ') || 'لا يوجد'} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers size={20} className="text-blue-600" />
                <h4 className="text-lg font-bold text-slate-900">المحتوى المنتج</h4>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => setIsBatchModalOpen(true)} variant="secondary" size="sm" className="bg-slate-50 font-bold">إنتاج دفعة</Button>
                <Button onClick={() => setIsContentModalOpen(true)} size="sm" className="gap-1.5 font-bold">
                  <Plus size={16} />
                  إضافة محتوى
                </Button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-black text-slate-500">عنوان المحتوى</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-500">النوع</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-500">المخرج</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-500">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {shooting.produced_content.map((c) => (
                    <tr 
                      key={c.id} 
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/content/${c.id}`)}
                    >
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-slate-900">{c.title}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-slate-500">{c.content_type_name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="gray">{getOutputTypeLabel(c.output_type)}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           {c.is_final && <Badge variant="green">نهائي</Badge>}
                           {c.archived && <Badge variant="purple">مؤرشف</Badge>}
                           {!c.is_final && !c.archived && <Badge variant="blue">مسودة</Badge>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {shooting.produced_content.length === 0 && (
                <div className="p-12 text-center text-slate-400">لم يتم إنتاج محتوى بعد من هذا التصوير</div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl">
             <h4 className="text-lg font-bold mb-6 flex items-center gap-2">
               <Info size={20} className="text-blue-400" />
               تفاصيل تقنية
             </h4>
             <div className="space-y-6">
                <div>
                   <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">الموقع</p>
                   <p className="font-bold flex items-center gap-2">
                     <MapPin size={14} className="text-blue-400" />
                     {shooting.location}
                   </p>
                </div>
                <div>
                   <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">وقت البدء</p>
                   <p className="font-bold flex items-center gap-2">
                     <Clock size={14} className="text-blue-400" />
                     {shooting.start_time ? format(new Date(shooting.start_time), 'yyyy/MM/dd HH:mm') : 'N/A'}
                   </p>
                </div>
                {shooting.end_time && (
                  <div>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">وقت الانتهاء</p>
                    <p className="font-bold flex items-center gap-2">
                      <Clock size={14} className="text-blue-400" />
                      {shooting.end_time ? format(new Date(shooting.end_time), 'yyyy/MM/dd HH:mm') : 'N/A'}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">ملاحظات</p>
                  <p className="text-sm text-slate-400 leading-relaxed">{shooting.notes || 'لا توجد ملاحظات'}</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      <Modal 
        isOpen={isContentModalOpen} 
        onClose={() => setIsContentModalOpen(false)} 
        title="إنتاج محتوى جديد"
        className="max-w-3xl"
      >
        <ContentForm 
          fromShootingId={shooting.id} 
          fixedTaskId={shooting.task_id}
          onSuccess={() => { setIsContentModalOpen(false); fetchDetails(); }} 
          onCancel={() => setIsContentModalOpen(false)} 
        />
      </Modal>

      <Modal 
        isOpen={isBatchModalOpen} 
        onClose={() => setIsBatchModalOpen(false)} 
        title="إنتاج دفعة محتويات"
        className="max-w-4xl"
      >
        <BatchContentForm 
          shootingId={shooting.id}
          onSuccess={() => { setIsBatchModalOpen(false); fetchDetails(); }} 
          onCancel={() => setIsBatchModalOpen(false)} 
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

function getOutputTypeLabel(type?: string) {
  const labels: Record<string, string> = {
    report: 'تقرير تنفيذي',
    social: 'سوشال ميديا',
    video: 'فيديو خام',
    archive: 'أرشيف'
  };
  return labels[type || ''] || type || 'أخرى';
}

/**
 * Batch Content Form Sub-Component
 */
import { Input, Select } from './ui/Inputs';

function BatchContentForm({ shootingId, onSuccess, onCancel }: any) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [items, setItems] = useState([{ title: '', content_type_id: '', output_type: 'video' }]);

  useEffect(() => {
    const fetchTypes = async () => {
      const res = await api.get<{ success: boolean; data: ContentType[] }>('/api/content/types');
      if (res.success) setContentTypes(res.data);
    };
    fetchTypes();
  }, []);

  const addItem = () => setItems([...items, { title: '', content_type_id: '', output_type: 'video' }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: string, value: string) => {
    const newItems = [...items];
    (newItems[idx] as any)[field] = value;
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const payload = {
        shooting_id: shootingId,
        created_by: user.id,
        items: items.map(it => ({
          ...it,
          content_type_id: Number(it.content_type_id)
        }))
      };

      const res = await api.post<{ success: boolean }>('/api/content/from-shooting/batch', payload);
      if (res.success) onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1 pr-4 scrollbar-hide">
        {items.map((item, idx) => (
          <div key={idx} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 relative">
            <div className="md:col-span-1">
              <Input 
                label="العنوان"
                required
                value={item.title}
                onChange={(e) => updateItem(idx, 'title', e.target.value)}
              />
            </div>
            <Select 
              label="نوع المحتوى"
              required
              options={[{ value: '', label: 'اختر النوع...' }, ...contentTypes.map(t => ({ value: t.id.toString(), label: t.name }))]}
              value={item.content_type_id}
              onChange={(e) => updateItem(idx, 'content_type_id', e.target.value)}
            />
            <Select 
              label="نوع المخرج"
              options={[
                { value: 'video', label: 'فيديو' },
                { value: 'social', label: 'سوشال ميديا' },
                { value: 'report', label: 'تقرير' },
                { value: 'archive', label: 'أرشيف' }
              ]}
              value={item.output_type}
              onChange={(e) => updateItem(idx, 'output_type', e.target.value)}
            />
            {items.length > 1 && (
              <button 
                type="button" 
                onClick={() => removeItem(idx)} 
                className="absolute -top-2 -left-2 bg-white p-1.5 rounded-full border border-slate-200 text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-slate-100">
        <Button type="button" variant="secondary" onClick={addItem} className="gap-2">
          <Plus size={18} />
          إضافة محتوى آخر
        </Button>
        <div className="flex gap-3">
          <Button variant="ghost" type="button" onClick={onCancel}>إلغاء</Button>
          <Button type="submit" loading={loading} disabled={items.some(it => !it.title || !it.content_type_id)}>إنتاج الدفعة الكاملة</Button>
        </div>
      </div>
    </form>
  );
}

import { useAuth } from '../contexts/AuthContext';
