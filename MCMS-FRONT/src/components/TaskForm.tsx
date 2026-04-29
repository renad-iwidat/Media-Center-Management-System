import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Order, User, Status, Task } from '../types';
import { Button, Input, Select, Textarea } from './ui/Inputs';
import { format } from 'date-fns';

interface TaskFormProps {
  initialData?: Partial<Task>;
  fixedOrderId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function TaskForm({ initialData, fixedOrderId, onSuccess, onCancel }: TaskFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [lookups, setLookups] = useState<{
    orders: Order[];
    users: User[];
    taskTypes: Status[];
  }>({ orders: [], users: [], taskTypes: [] });

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    order_id: fixedOrderId || initialData?.order_id || '',
    assigned_to: initialData?.assigned_to || '',
    priority_id: initialData?.priority_id || 3,
    deadline: initialData?.deadline ? format(new Date(initialData.deadline), 'yyyy-MM-dd') : format(new Date(new Date().setDate(new Date().getDate() + 3)), 'yyyy-MM-dd'),
    task_type_id: initialData?.task_type_id || ''
  });

  const fetchLookups = async () => {
    try {
      const [ordersRes, usersRes, typesRes] = await Promise.all([
        api.get<{ success: boolean; data: Order[] }>('/api/orders?limit=100'),
        api.get<{ success: boolean; data: User[] }>('/api/portal/users'),
        api.get<{ success: boolean; data: Status[] }>('/api/tasks/statuses')
      ]);

      setLookups({
        orders: ordersRes.data || [],
        users: usersRes.data || [],
        taskTypes: typesRes.data || []
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLookups();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      const payload = {
        ...formData,
        order_id: Number(formData.order_id),
        assigned_to: Number(formData.assigned_to),
        priority_id: Number(formData.priority_id),
        task_type_id: formData.task_type_id ? Number(formData.task_type_id) : undefined,
        status_id: initialData?.status_id || 1 // New tasks are Created(1)
      };

      const res = initialData?.id 
        ? await api.patch<{ success: boolean }>(`/api/tasks/${initialData.id}`, payload)
        : await api.post<{ success: boolean }>('/api/tasks', payload);

      if (res.success) {
        onSuccess();
      }
    } catch (err) {
      console.error(err);
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
            label="عنوان المهمة" 
            placeholder="مثلاً: مونتاج الفيديو، تصوير اللقاء..." 
            value={formData.title}
            onChange={(e) => setFormData(f => ({ ...f, title: e.target.value }))}
            required
            className="bg-slate-50 border-slate-200"
          />
        </div>

        <div className="md:col-span-2">
          <Textarea 
            label="وصف المهمة" 
            placeholder="تعليمات تفصيلية للمنفذ..." 
            value={formData.description}
            onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
            className="bg-slate-50 border-slate-200"
          />
        </div>

        {!fixedOrderId && (
          <Select 
            label="الأوردر المرتبط"
            options={[
              { value: '', label: 'اختر الأوردر...' },
              ...lookups.orders.map(o => ({ value: o.id, label: o.title }))
            ]}
            value={formData.order_id}
            onChange={(e) => setFormData(f => ({ ...f, order_id: e.target.value }))}
            required
          />
        )}

        <Select 
          label="الموظف المعين"
          options={[
            { value: '', label: 'اختر الموظف...' },
            ...lookups.users.map(u => ({ value: u.id, label: u.name }))
          ]}
          value={formData.assigned_to}
          onChange={(e) => setFormData(f => ({ ...f, assigned_to: e.target.value }))}
          required
          className={fixedOrderId ? "md:col-span-2" : ""}
        />

        <Select 
          label="الأولوية"
          options={priorityOptions}
          value={formData.priority_id}
          onChange={(e) => setFormData(f => ({ ...f, priority_id: e.target.value }))}
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
          label="نوع المهمة"
          options={[
            { value: '', label: 'اختر النوع (اختياري)...' },
            ...lookups.taskTypes.map(t => ({ value: t.id, label: t.name }))
          ]}
          value={formData.task_type_id}
          onChange={(e) => setFormData(f => ({ ...f, task_type_id: e.target.value }))}
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
        <Button variant="ghost" type="button" onClick={onCancel} disabled={loading}>
          إلغاء
        </Button>
        <Button type="submit" isLoading={loading} className="min-w-[120px] bg-[#3d6a8a] hover:bg-[#2d5570] text-white shadow-lg hover:shadow-xl">
          {initialData?.id ? 'تحديث المهمة' : 'إنشاء المهمة'}
        </Button>
      </div>
    </form>
  );
}
