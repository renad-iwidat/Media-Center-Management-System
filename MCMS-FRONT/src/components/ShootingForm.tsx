import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Video, Users, Package } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Order, Task } from '../types';
import { Button, Input, Select, Textarea } from './ui/Inputs';

interface ShootingFormProps {
  initialOrderId?: number;
  initialTaskId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ShootingForm({ initialOrderId, initialTaskId, onSuccess, onCancel }: ShootingFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  
  const [formData, setFormData] = useState({
    order_id: initialOrderId?.toString() || '',
    task_id: initialTaskId?.toString() || '',
    location: '',
    start_time: '',
    end_time: '',
    source_type: 'internal' as 'internal' | 'external',
    notes: '',
  });

  const [equipmentList, setEquipmentList] = useState<string[]>([]);
  const [newEquipment, setNewEquipment] = useState('');
  
  const [crewList, setCrewList] = useState<string[]>([]);
  const [newCrew, setNewCrew] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      const res = await api.get<{ success: boolean; data: Order[] }>('/api/orders?limit=100');
      if (res.success) setOrders(res.data);
    };
    fetchOrders();
  }, []);

  useEffect(() => {
    if (formData.order_id) {
      const fetchTasks = async () => {
        const res = await api.get<{ success: boolean; data: Task[] }>(`/api/tasks/order/${formData.order_id}`);
        if (res.success) setTasks(res.data);
      };
      fetchTasks();
    } else {
      setTasks([]);
      setFormData(prev => ({ ...prev, task_id: '' }));
    }
  }, [formData.order_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const payload = {
        ...formData,
        order_id: Number(formData.order_id),
        task_id: formData.task_id ? Number(formData.task_id) : null,
        equipment: equipmentList,
        crew: crewList,
        created_by: user.id
      };

      const res = await api.post<{ success: boolean }>('/api/shootings', payload);
      if (res.success) {
        onSuccess();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addItem = (type: 'equipment' | 'crew') => {
    if (type === 'equipment' && newEquipment.trim()) {
      setEquipmentList(prev => [...prev, newEquipment.trim()]);
      setNewEquipment('');
    } else if (type === 'crew' && newCrew.trim()) {
      setCrewList(prev => [...prev, newCrew.trim()]);
      setNewCrew('');
    }
  };

  const removeItem = (type: 'equipment' | 'crew', index: number) => {
    if (type === 'equipment') {
      setEquipmentList(prev => prev.filter((_, i) => i !== index));
    } else if (type === 'crew') {
      setCrewList(prev => prev.filter((_, i) => i !== index));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Select 
          label="الأوردر المرتبط"
          required
          options={[{ value: '', label: 'اختر الأوردر...' }, ...orders.map(o => ({ value: o.id.toString(), label: o.title }))]}
          value={formData.order_id}
          onChange={(e) => setFormData(prev => ({ ...prev, order_id: e.target.value }))}
        />
        
        <Select 
          label="المهمة المرتبطة (اختياري)"
          disabled={!formData.order_id}
          options={[{ value: '', label: 'اختر المهمة...' }, ...tasks.map(t => ({ value: t.id.toString(), label: t.title }))]}
          value={formData.task_id}
          onChange={(e) => setFormData(prev => ({ ...prev, task_id: e.target.value }))}
        />

        <Input 
          label="الموقع"
          required
          placeholder="مثال: استديو المركز، رام الله..."
          value={formData.location}
          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
        />

        <Select 
          label="نوع المصدر"
          required
          options={[
            { value: 'internal', label: 'إنتاج داخلي' },
            { value: 'external', label: 'إنتاج خارجي / تزويد' }
          ]}
          value={formData.source_type}
          onChange={(e) => setFormData(prev => ({ ...prev, source_type: e.target.value as any }))}
        />

        <Input 
          label="وقت البدء"
          type="datetime-local"
          required
          value={formData.start_time}
          onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
        />

        <Input 
          label="وقت الانتهاء (اختياري)"
          type="datetime-local"
          value={formData.end_time}
          onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
        />
      </div>

      <div className="space-y-4">
        <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
          <label className="text-sm font-black text-slate-700 mb-3 block flex items-center gap-2">
            <Package size={16} />
            قائمة المعدات
          </label>
          <div className="flex gap-2 mb-4">
            <Input 
              placeholder="أضف معدة..." 
              value={newEquipment}
              onChange={(e) => setNewEquipment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('equipment'))}
            />
            <Button type="button" variant="secondary" onClick={() => addItem('equipment')}>إضافة</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {equipmentList.map((item, idx) => (
              <span key={idx} className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-sm font-bold flex items-center gap-2 pr-2">
                {item}
                <button type="button" onClick={() => removeItem('equipment', idx)} className="hover:text-red-600 transition-colors">
                  <Trash2 size={14} />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
          <label className="text-sm font-black text-slate-700 mb-3 block flex items-center gap-2">
            <Users size={16} />
            طاقم العمل
          </label>
          <div className="flex gap-2 mb-4">
            <Input 
              placeholder="أضف موظف..." 
              value={newCrew}
              onChange={(e) => setNewCrew(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('crew'))}
            />
            <Button type="button" variant="secondary" onClick={() => addItem('crew')}>إضافة</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {crewList.map((item, idx) => (
              <span key={idx} className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-sm font-bold flex items-center gap-2 pr-2">
                {item}
                <button type="button" onClick={() => removeItem('crew', idx)} className="hover:text-red-600 transition-colors">
                  <Trash2 size={14} />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      <Textarea 
        label="ملاحظات إضافية"
        placeholder="أي تفاصيل أخرى عن التصوير..."
        value={formData.notes}
        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
      />

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="ghost" type="button" onClick={onCancel} disabled={loading}>إلغاء</Button>
        <Button type="submit" loading={loading} disabled={!formData.order_id || !formData.location || !formData.start_time} className="bg-[#3d6a8a] hover:bg-[#2d5570] text-white shadow-lg hover:shadow-xl">إنشاء التصوير</Button>
      </div>
    </form>
  );
}
