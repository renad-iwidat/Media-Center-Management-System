import React, { useState } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import { Button, Input } from './ui/Inputs';
import { api } from '../services/api';

interface FileUploadFormProps {
  taskId: number;
  userId: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function FileUploadForm({ taskId, userId, onSuccess, onCancel }: FileUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !title.trim()) {
      setError('الملف والعنوان مطلوبان');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', userId.toString());
      formData.append('title', title);
      formData.append('description', description);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'https://media-center-management-system.onrender.com'}/api/tasks/${taskId}/upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        }
      );

      if (!response.ok) {
        throw new Error('فشل رفع الملف');
      }

      setFile(null);
      setTitle('');
      setDescription('');
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء رفع الملف');
    } finally {
      setLoading(false);
    }
  };

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

      {/* Title Input */}
      <div className="space-y-2">
        <label className="block text-sm font-bold text-slate-700">عنوان الملف *</label>
        <Input
          type="text"
          placeholder="مثال: تقرير المشروع النهائي"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      {/* Description Input */}
      <div className="space-y-2">
        <label className="block text-sm font-bold text-slate-700">الوصف</label>
        <textarea
          placeholder="أضف وصفاً للملف (اختياري)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
          className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[100px] font-bold text-slate-700"
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3 justify-end pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={loading}
        >
          إلغاء
        </Button>
        <Button
          type="submit"
          disabled={loading || !file || !title.trim()}
          className="gap-2"
        >
          {loading ? 'جاري الرفع...' : 'رفع الملف'}
        </Button>
      </div>
    </form>
  );
}
