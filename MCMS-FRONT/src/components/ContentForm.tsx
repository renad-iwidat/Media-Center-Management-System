import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Upload, FileVideo, Tags, HardDrive, Clock } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ContentType, MediaUnit } from '../types';
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
  const [error, setError] = useState('');
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [mediaUnits, setMediaUnits] = useState<MediaUnit[]>([]);

  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    media_unit_id: '',
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
    };
    fetchData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
      // Auto-fill title from filename if empty
      if (!formData.title) {
        setFormData(prev => ({ ...prev, title: selectedFile.name.split('.')[0] }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!file || !formData.title.trim()) {
      setError('الملف والعنوان مطلوبان');
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('file', file);
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('media_unit_id', formData.media_unit_id || '');
      formDataToSend.append('tags', JSON.stringify(tags));
      formDataToSend.append('created_by', user.id.toString());

      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'https://media-center-management-system.onrender.com'}/api/content/upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formDataToSend
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || data.message || 'فشل رفع المحتوى';
        throw new Error(errorMessage);
      }

      setFile(null);
      setFormData({ title: '', description: '', media_unit_id: '' });
      setTags([]);
      onSuccess();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'حدث خطأ أثناء رفع المحتوى';
      console.error('Upload error:', errorMsg);
      setError(errorMsg);
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
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-bold">
          {error}
        </div>
      )}

      {/* File Input */}
      <div className="space-y-2">
        <label className="block text-sm font-bold text-slate-700">الملف *</label>
        <div className="relative">
          <input
            type="file"
            onChange={handleFileChange}
            className="hidden"
            id="file-input"
            disabled={loading}
          />
          <label
            htmlFor="file-input"
            className="flex items-center justify-center gap-3 p-6 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all"
          >
            <Upload size={24} className="text-slate-400" />
            <div className="text-center">
              <p className="text-sm font-bold text-slate-700">
                {file ? file.name : 'اختر ملفاً أو اسحبه هنا'}
              </p>
              <p className="text-xs text-slate-400 mt-1">الحد الأقصى: 100 ميجابايت</p>
            </div>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <Input 
            label="عنوان المحتوى"
            required
            placeholder="مثال: تقرير الافتتاح النهائي"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            disabled={loading}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-slate-700 mb-2">وصف المحتوى</label>
          <textarea
            placeholder="أضف وصفاً للمحتوى (اختياري)"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            disabled={loading}
            className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[100px] font-bold text-slate-700"
          />
        </div>

        <Select 
          label="الوحدة الإعلامية"
          options={[{ value: '', label: 'اختر الوحدة...' }, ...mediaUnits.map(u => ({ value: u.id.toString(), label: u.name }))]}
          value={formData.media_unit_id}
          onChange={(e) => setFormData(prev => ({ ...prev, media_unit_id: e.target.value }))}
          disabled={loading}
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
            disabled={loading}
          />
          <Button type="button" variant="secondary" onClick={addTag} disabled={loading}>إضافة</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, idx) => (
            <span key={idx} className="bg-white px-3 py-1 rounded-lg border border-slate-200 text-xs font-bold flex items-center gap-2 pr-1.5">
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500" disabled={loading}>
                <Trash2 size={12} />
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <Button variant="ghost" type="button" onClick={onCancel} disabled={loading}>إلغاء</Button>
        <Button type="submit" disabled={loading || !file || !formData.title} className="gap-2">
          {loading ? 'جاري الرفع...' : 'رفع المحتوى'}
        </Button>
      </div>
    </form>
  );
}
