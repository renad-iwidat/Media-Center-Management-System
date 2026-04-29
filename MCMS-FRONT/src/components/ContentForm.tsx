import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Video, FileVideo, Tags, Globe, HardDrive, Clock } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ContentType, Task, MediaUnit } from '../types';
import { Button, Input, Select, Textarea } from './ui/Inputs';

interface ContentFormProps {
  fromShootingId?: number;
  fixedTaskId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ContentForm({ fromShootingId, fixedTaskId, onSuccess, onCancel }: ContentFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [mediaUnits, setMediaUnits] = useState<MediaUnit[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    content_type_id: '',
    task_id: fixedTaskId?.toString() || '',
    media_unit_id: '',
    cloud_url: '',
    file_size_kb: '',
    duration_sec: '',
    output_type: 'video' as 'report' | 'social' | 'video' | 'archive',
  });

  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const [typesRes, unitsRes] = await Promise.all([
        api.get<{ success: boolean; data: ContentType[] }>('/api/content/types'),
        api.get<{ success: boolean; data: MediaUnit[] }>('/api/portal/media-units'),
      ]);
      if (typesRes.success) setContentTypes(typesRes.data);
      if (unitsRes.success) setMediaUnits(unitsRes.data);

      if (!fixedTaskId && !fromShootingId) {
        const tasksRes = await api.get<{ success: boolean; data: Task[] }>('/api/tasks?limit=50');
        if (tasksRes.success) setTasks(tasksRes.data);
      }
    };
    fetchData();
  }, [fixedTaskId, fromShootingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const payload = {
        ...formData,
        content_type_id: Number(formData.content_type_id),
        task_id: formData.task_id ? Number(formData.task_id) : null,
        media_unit_id: formData.media_unit_id ? Number(formData.media_unit_id) : null,
        file_size: formData.file_size_kb ? Number(formData.file_size_kb) * 1024 : null,
        duration: formData.duration_sec ? Number(formData.duration_sec) : null,
        tags,
        created_by: user.id,
        shooting_id: fromShootingId || null
      };

      const endpoint = fromShootingId ? '/api/content/from-shooting' : '/api/content';
      const res = await api.post<{ success: boolean }>(endpoint, payload);
      if (res.success) {
        onSuccess();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(prev => [...prev, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (t: string) => setTags(prev => prev.filter(tag => tag !== t));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <Input 
            label="عنوان المحتوى"
            required
            placeholder="مثال: تقرير الافتتاح النهائي، لقطات خام..."
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          />
        </div>

        <Select 
          label="نوع المحتوى"
          required
          options={[{ value: '', label: 'اختر النوع...' }, ...contentTypes.map(t => ({ value: t.id.toString(), label: t.name }))]}
          value={formData.content_type_id}
          onChange={(e) => setFormData(prev => ({ ...prev, content_type_id: e.target.value }))}
        />

        {!fromShootingId && (
          <Select 
            label="المهمة المرتبطة"
            disabled={!!fixedTaskId}
            options={[{ value: '', label: 'اختر المهمة...' }, ...tasks.map(t => ({ value: t.id.toString(), label: t.title }))]}
            value={formData.task_id}
            onChange={(e) => setFormData(prev => ({ ...prev, task_id: e.target.value }))}
          />
        )}

        {fromShootingId && (
          <Select 
            label="نوع المخرج"
            options={[
              { value: 'video', label: 'فيديو' },
              { value: 'social', label: 'سوشال ميديا' },
              { value: 'report', label: 'تقرير' },
              { value: 'archive', label: 'أرشيف' }
            ]}
            value={formData.output_type}
            onChange={(e) => setFormData(prev => ({ ...prev, output_type: e.target.value as any }))}
          />
        )}

        <Select 
          label="الوحدة الإعلامية"
          options={[{ value: '', label: 'اختر الوحدة...' }, ...mediaUnits.map(u => ({ value: u.id.toString(), label: u.name }))]}
          value={formData.media_unit_id}
          onChange={(e) => setFormData(prev => ({ ...prev, media_unit_id: e.target.value }))}
        />

        <Input 
          label="رابط الملف السحابي"
          placeholder="https://..."
          icon={<Globe size={16} />}
          value={formData.cloud_url}
          onChange={(e) => setFormData(prev => ({ ...prev, cloud_url: e.target.value }))}
        />

        <Input 
          label="حجم الملف (KB)"
          type="number"
          icon={<HardDrive size={16} />}
          value={formData.file_size_kb}
          onChange={(e) => setFormData(prev => ({ ...prev, file_size_kb: e.target.value }))}
        />

        <Input 
          label="المدة (ثواني)"
          type="number"
          icon={<Clock size={16} />}
          value={formData.duration_sec}
          onChange={(e) => setFormData(prev => ({ ...prev, duration_sec: e.target.value }))}
        />
      </div>

      <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
        <label className="text-sm font-black text-slate-700 mb-3 block flex items-center gap-2">
          <Tags size={16} />
          الوسوم (Tags)
        </label>
        <div className="flex gap-2 mb-4">
          <Input 
            placeholder="أضف وسم..." 
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          />
          <Button type="button" variant="secondary" onClick={addTag}>إضافة</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, idx) => (
            <span key={idx} className="bg-white px-3 py-1 rounded-lg border border-slate-200 text-xs font-bold flex items-center gap-2 pr-1.5">
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500">
                <Trash2 size={12} />
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <Button variant="ghost" type="button" onClick={onCancel}>إلغاء</Button>
        <Button type="submit" loading={loading} disabled={!formData.title || !formData.content_type_id} className="bg-[#3d6a8a] hover:bg-[#2d5570] text-white shadow-lg hover:shadow-xl">إضافة المحتوى</Button>
      </div>
    </form>
  );
}
