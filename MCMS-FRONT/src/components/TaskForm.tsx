import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Order, User, Status, Task, TaskType, TaskShootingData } from '../types';
import { Button, Input, Select, Textarea } from './ui/Inputs';
import { format } from 'date-fns';

interface TaskFormProps {
  initialData?: Partial<Task>;
  fixedOrderId?: number;
  onSuccess: (newTaskId?: number) => void;
  onCancel: () => void;
}

export default function TaskForm({ initialData, fixedOrderId, onSuccess, onCancel }: TaskFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [lookups, setLookups] = useState<{
    orders: Order[];
    users: User[];
    taskTypes: TaskType[];
    statuses: Status[];
  }>({ 
    orders: [], 
    users: [], 
    taskTypes: [
      { id: 1, name: 'تصوير', category: 'shooting', color: '#3b82f6', icon: '📹' },
      { id: 2, name: 'اخبارية', category: 'reporting', color: '#a855f7', icon: '📰' },
      { id: 3, name: 'أخرى', category: 'other', color: '#64748b', icon: '📋' }
    ],
    statuses: [] 
  });

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    order_id: fixedOrderId || initialData?.order_id || '',
    assigned_to: initialData?.assigned_to || '',
    status_id: initialData?.status_id || 1,
    priority_id: initialData?.priority_id || 3,
    deadline: initialData?.deadline ? format(new Date(initialData.deadline), 'yyyy-MM-dd') : format(new Date(new Date().setDate(new Date().getDate() + 3)), 'yyyy-MM-dd'),
    task_type_id: initialData?.task_type_id || ''
  });

  const [shootingData, setShootingData] = useState<Partial<TaskShootingData>>({
    location: '',
    start_time: '',
    end_time: '',
    equipment: [],
    crew: [],
    notes: ''
  });

  const fetchLookups = async () => {
    try {
      const [ordersRes, usersRes, statusesRes, typesRes] = await Promise.all([
        api.get<{ success: boolean; data: Order[] }>('/api/orders?limit=100'),
        api.get<{ success: boolean; data: User[] }>('/api/portal/users'),
        api.get<{ success: boolean; data: Status[] }>('/api/tasks/statuses'),
        api.get<{ success: boolean; data: TaskType[] }>('/api/tasks/types')
      ]);

      // Task types - use API data if available
      let taskTypes: TaskType[] = [];
      if (typesRes.success && Array.isArray(typesRes.data) && typesRes.data.length > 0) {
        taskTypes = typesRes.data;
      } else {
        // Fallback to hardcoded task types
        taskTypes = [
          { id: 1, name: 'تصوير', category: 'shooting', color: '#3b82f6', icon: '📹' },
          { id: 2, name: 'اخبارية', category: 'reporting', color: '#a855f7', icon: '📰' },
          { id: 3, name: 'أخرى', category: 'other', color: '#64748b', icon: '📋' }
        ];
      }

      setLookups({
        orders: ordersRes.data || [],
        users: usersRes.data || [],
        taskTypes: taskTypes,
        statuses: statusesRes.data || []
      });
    } catch (err) {
      console.error(err);
    }
  };

  const loadShootingData = async () => {
    if (!initialData?.id) return;
    
    try {
      const res = await api.get<{ success: boolean; data: TaskShootingData }>(`/api/tasks/${initialData.id}/shooting-data`);
      if (res.success && res.data) {
        setShootingData(res.data);
      }
    } catch (err) {
      console.error('Error loading shooting data:', err);
    }
  };

  useEffect(() => {
    fetchLookups();
  }, []);

  useEffect(() => {
    if (initialData?.id && initialData?.task_type_id) {
      loadShootingData();
    }
  }, [initialData?.id, initialData?.task_type_id]);

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
        status_id: Number(formData.status_id),
        task_type_id: formData.task_type_id ? Number(formData.task_type_id) : undefined
      };

      const res = initialData?.id 
        ? await api.patch<{ success: boolean; data: Task }>(`/api/tasks/${initialData.id}`, payload)
        : await api.post<{ success: boolean; data: Task }>('/api/tasks', payload);

      if (res.success) {
        const selectedType = lookups.taskTypes.find(t => t.id === Number(formData.task_type_id));
        
        // إذا كانت مهمة تصوير، حفظ بيانات التصوير
        if (selectedType?.category === 'shooting' && shootingData && shootingData.location) {
          const taskId = initialData?.id || res.data?.id;
          if (taskId) {
            try {
              if (initialData?.id) {
                await api.patch(`/api/tasks/${taskId}/shooting-data`, shootingData);
              } else {
                await api.post(`/api/tasks/${taskId}/shooting-data`, shootingData);
              }
            } catch (err) {
              console.error('Error saving shooting data:', err);
            }
          }
        }

        // إذا كانت مهمة اخبارية وجديدة، افتح تفاصيل المهمة
        if (selectedType?.category === 'reporting' && !initialData?.id && res.data) {
          onSuccess(res.data.id);
        } else {
          onSuccess();
        }
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

  const handleTaskTypeChange = (typeId: string) => {
    const selectedType = lookups.taskTypes.find(t => t.id === Number(typeId));
    setFormData(f => ({
      ...f,
      task_type_id: typeId
    }));
    
    // إعادة تعيين بيانات التصوير إذا كان النوع "تصوير"
    if (selectedType?.category === 'shooting') {
      setShootingData({
        location: '',
        start_time: '',
        end_time: '',
        equipment: [],
        crew: [],
        notes: ''
      });
    }
  };

  const renderDynamicFields = () => {
    if (!formData.task_type_id) return null;
    
    const taskType = lookups.taskTypes.find(t => t.id === Number(formData.task_type_id));
    
    if (taskType?.category === 'shooting') {
      return (
        <div className="md:col-span-2 space-y-6 p-6 bg-blue-50 rounded-2xl border-2 border-blue-200">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="text-2xl">📹</span>
            بيانات التصوير
          </h3>
          
          <Input 
            label="الموقع" 
            placeholder="مثلاً: استوديو 1، الشارع الرئيسي..." 
            value={shootingData.location || ''}
            onChange={(e) => setShootingData(s => ({ ...s, location: e.target.value }))}
            required
            className="bg-white border-blue-300"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label="وقت البدء" 
              type="datetime-local"
              value={shootingData.start_time || ''}
              onChange={(e) => setShootingData(s => ({ ...s, start_time: e.target.value }))}
              required
              className="bg-white border-blue-300"
            />

            <Input 
              label="وقت الانتهاء" 
              type="datetime-local"
              value={shootingData.end_time || ''}
              onChange={(e) => setShootingData(s => ({ ...s, end_time: e.target.value }))}
              className="bg-white border-blue-300"
            />
          </div>

          <Textarea 
            label="المعدات (مفصولة بفواصل)" 
            placeholder="كاميرا، ميكروفون، إضاءة..." 
            value={Array.isArray(shootingData.equipment) ? shootingData.equipment.join(', ') : ''}
            onChange={(e) => setShootingData(s => ({ ...s, equipment: e.target.value.split(',').map(x => x.trim()).filter(x => x) }))}
            className="bg-white border-blue-300"
          />

          <Textarea 
            label="الطاقم (مفصول بفواصل)" 
            placeholder="المخرج، المصور، الصوتي..." 
            value={Array.isArray(shootingData.crew) ? shootingData.crew.join(', ') : ''}
            onChange={(e) => setShootingData(s => ({ ...s, crew: e.target.value.split(',').map(x => x.trim()).filter(x => x) }))}
            className="bg-white border-blue-300"
          />

          <Textarea 
            label="ملاحظات" 
            placeholder="ملاحظات إضافية عن التصوير..." 
            value={shootingData.notes || ''}
            onChange={(e) => setShootingData(s => ({ ...s, notes: e.target.value }))}
            className="bg-white border-blue-300"
          />
        </div>
      );
    }

    if (taskType?.category === 'reporting') {
      return (
        <div className="md:col-span-2 space-y-6 p-6 bg-purple-50 rounded-2xl border-2 border-purple-200">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="text-2xl">📰</span>
            نظام الأخبار الذكي
          </h3>
          
          <div className="bg-white p-4 rounded-xl border border-purple-200">
            <p className="text-sm text-slate-600 mb-4">
              بعد إنشاء هذه المهمة، ستتمكن من فتح نظام الأخبار الذكي لتنفيذ المهمة مباشرة.
            </p>
            <p className="text-xs text-slate-500">
              سيتم تمرير بيانات المهمة تلقائياً إلى النظام الخارجي.
            </p>
          </div>
        </div>
      );
    }
    
    return null;
  };

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
            label="الطلب المرتبط"
            options={[
              { value: '', label: 'اختر الطلب...' },
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

        <Select 
          label="حالة المهمة"
          options={[
            { value: '', label: 'اختر الحالة...' },
            ...lookups.statuses.map(s => ({ value: s.id, label: s.name }))
          ]}
          value={formData.status_id}
          onChange={(e) => setFormData(f => ({ ...f, status_id: e.target.value }))}
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
          onChange={(e) => handleTaskTypeChange(e.target.value)}
        />
      </div>

      {renderDynamicFields()}

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
