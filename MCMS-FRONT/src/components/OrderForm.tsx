import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Desk, MediaUnit, Program, Episode, Order } from '../types';
import { Button, Input, Select, Textarea } from './ui/Inputs';
import { format } from 'date-fns';

interface OrderFormProps {
  initialData?: Partial<Order>;
  onSuccess: (orderId?: number) => void;
  onCancel: () => void;
}

export default function OrderForm({ initialData, onSuccess, onCancel }: OrderFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lookups, setLookups] = useState<{
    desks: Desk[];
    mediaUnits: MediaUnit[];
    programs: Program[];
  }>({ desks: [], mediaUnits: [], programs: [] });

  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    desk_id: initialData?.desk_id ? initialData.desk_id.toString() : '',
    priority_id: initialData?.priority_id ? initialData.priority_id.toString() : '3', // Default to Medium
    media_unit_id: initialData?.media_unit_id ? initialData.media_unit_id.toString() : '',
    program_id: initialData?.program_id ? initialData.program_id.toString() : '',
    episode_id: initialData?.episode_id ? initialData.episode_id.toString() : '',
    deadline: initialData?.deadline ? format(new Date(initialData.deadline), 'yyyy-MM-dd') : format(new Date(new Date().setDate(new Date().getDate() + 7)), 'yyyy-MM-dd'),
    notes: initialData?.notes || ''
  });

  const fetchLookups = async () => {
    try {
      const [desksRes, muRes, programsRes] = await Promise.all([
        api.get<{ success: boolean; data: Desk[] }>('/api/portal/desks'),
        api.get<{ success: boolean; data: MediaUnit[] }>('/api/portal/media-units'),
        api.get<{ success: boolean; data: Program[] }>('/api/portal/programs')
      ]);

      console.log('Desks Response:', desksRes);
      console.log('Media Units Response:', muRes);
      console.log('Programs Response:', programsRes);
      console.log('Programs Data:', programsRes.data);

      // Handle both array and object responses
      const programsData = Array.isArray(programsRes.data) 
        ? programsRes.data 
        : (programsRes as any).data || [];

      setLookups({
        desks: Array.isArray(desksRes.data) ? desksRes.data : [],
        mediaUnits: Array.isArray(muRes.data) ? muRes.data : [],
        programs: programsData
      });

      console.log('Lookups set:', {
        desks: Array.isArray(desksRes.data) ? desksRes.data.length : 0,
        mediaUnits: Array.isArray(muRes.data) ? muRes.data.length : 0,
        programs: programsData.length
      });
    } catch (err) {
      console.error('Error fetching lookups:', err);
    }
  };

  const fetchEpisodes = async (programId: string | number) => {
    if (!programId) {
      setEpisodes([]);
      return;
    }
    try {
      const res = await api.get<{ success: boolean; data: Episode[] }>(`/api/portal/episodes?program_id=${programId}`);
      if (res.success) {
        setEpisodes(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLookups();
  }, []);

  useEffect(() => {
    if (formData.program_id) {
      fetchEpisodes(formData.program_id);
    }
  }, [formData.program_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...formData,
        desk_id: Number(formData.desk_id),
        media_unit_id: Number(formData.media_unit_id),
        priority_id: Number(formData.priority_id),
        program_id: formData.program_id ? Number(formData.program_id) : undefined,
        episode_id: formData.episode_id ? Number(formData.episode_id) : undefined,
        created_by: user.id,
        status_id: 1 // Created
      };

      const res = initialData?.id 
        ? await api.put<{ success: boolean; error?: string }>(`/api/orders/${initialData.id}`, payload)
        : await api.post<{ success: boolean; data: { id: number }; error?: string }>('/api/orders', payload);

      if (res.success) {
        onSuccess(initialData?.id || (res as any).data?.id);
      } else {
        setError(res.error || 'حدث خطأ أثناء حفظ الطلب');
      }
    } catch (err) {
      console.error(err);
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const priorityOptions = [
    { value: 1, label: 'عاجل (P1)' },
    { value: 2, label: 'عالي (P2)' },
    { value: 3, label: 'متوسط (P3)' },
    { value: 4, label: 'منخفض (P4)' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <Input 
            label="العنوان" 
            placeholder="أدخل عنوان الطلب..." 
            value={formData.title}
            onChange={(e) => setFormData(f => ({ ...f, title: e.target.value }))}
            required
            className="bg-slate-50 border-slate-200"
          />
        </div>

        <div className="md:col-span-2">
          <Textarea 
            label="الوصف" 
            placeholder="تفاصيل الطلب..." 
            value={formData.description}
            onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
            className="bg-slate-50 border-slate-200"
          />
        </div>

        <Select 
          label="القسم المسؤول"
          options={[
            { value: '', label: 'اختر القسم...' },
            ...lookups.desks.map(d => ({ value: d.id, label: d.name }))
          ]}
          value={formData.desk_id}
          onChange={(e) => setFormData(f => ({ ...f, desk_id: e.target.value }))}
          required
        />

        <Select 
          label="الأولوية"
          options={priorityOptions}
          value={formData.priority_id}
          onChange={(e) => setFormData(f => ({ ...f, priority_id: e.target.value }))}
          required
        />

        <Select 
          label="الوحدة الإعلامية"
          options={[
            { value: '', label: 'اختر الوحدة...' },
            ...lookups.mediaUnits.map(m => ({ value: m.id, label: m.name }))
          ]}
          value={formData.media_unit_id}
          onChange={(e) => setFormData(f => ({ ...f, media_unit_id: e.target.value }))}
          required
        />

        <Input 
          label="الموعد النهائي"
          type="date"
          value={formData.deadline}
          onChange={(e) => setFormData(f => ({ ...f, deadline: e.target.value }))}
          required
          className="bg-slate-50 border-slate-200"
        />

        <Select 
          label="البرنامج"
          options={[
            { value: '', label: 'اختياري...' },
            ...lookups.programs.map(p => ({ value: p.id, label: p.title || p.name || 'بدون عنوان' }))
          ]}
          value={formData.program_id}
          onChange={(e) => setFormData(f => ({ ...f, program_id: e.target.value }))}
        />

        {formData.program_id && (
          <Select 
            label="الحلقة"
            options={[
              { value: '', label: 'حلقة جديدة...' },
              ...episodes.map(ep => ({ value: ep.id, label: ep.title }))
            ]}
            value={formData.episode_id}
            onChange={(e) => setFormData(f => ({ ...f, episode_id: e.target.value }))}
          />
        )}

        <div className="md:col-span-2">
          <Textarea 
            label="ملاحظات إضافية" 
            placeholder="أي تعليمات خاصة..." 
            value={formData.notes}
            onChange={(e) => setFormData(f => ({ ...f, notes: e.target.value }))}
            className="bg-slate-50 border-slate-200"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
        {error && (
          <p className="flex-1 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
            ⚠️ {error}
          </p>
        )}
        <Button variant="ghost" type="button" onClick={onCancel} disabled={loading}>
          إلغاء
        </Button>
        <Button type="submit" isLoading={loading} className="min-w-[120px] bg-[#3d6a8a] hover:bg-[#2d5570] text-white shadow-lg hover:shadow-xl">
          {initialData?.id ? 'تحديث الطلب' : 'إنشاء الطلب'}
        </Button>
      </div>
    </form>
  );
}