import React, { useState, useEffect } from 'react';
import { TaskShootingData } from '../types';
import { Button, Input, Textarea } from './ui/Inputs';
import { Camera, Plus, Trash2 } from 'lucide-react';

interface ShootingDataFormProps {
  initialData?: TaskShootingData;
  onSubmit: (data: Partial<TaskShootingData>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ShootingDataForm({ 
  initialData, 
  onSubmit, 
  onCancel,
  isLoading = false 
}: ShootingDataFormProps) {
  const [formData, setFormData] = useState<Partial<TaskShootingData>>({
    location: initialData?.location || '',
    start_time: initialData?.start_time || '',
    end_time: initialData?.end_time || '',
    equipment: initialData?.equipment || [],
    crew: initialData?.crew || [],
    notes: initialData?.notes || ''
  });

  const [equipmentInput, setEquipmentInput] = useState('');
  const [crewInput, setCrewInput] = useState('');

  const handleAddEquipment = () => {
    if (equipmentInput.trim()) {
      setFormData(f => ({
        ...f,
        equipment: [...(f.equipment || []), equipmentInput.trim()]
      }));
      setEquipmentInput('');
    }
  };

  const handleRemoveEquipment = (index: number) => {
    setFormData(f => ({
      ...f,
      equipment: (f.equipment || []).filter((_, i) => i !== index)
    }));
  };

  const handleAddCrew = () => {
    if (crewInput.trim()) {
      setFormData(f => ({
        ...f,
        crew: [...(f.crew || []), crewInput.trim()]
      }));
      setCrewInput('');
    }
  };

  const handleRemoveCrew = (index: number) => {
    setFormData(f => ({
      ...f,
      crew: (f.crew || []).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
          <Camera size={20} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">بيانات التصوير</h3>
          <p className="text-xs text-slate-500 font-medium">أدخل تفاصيل حدث التصوير</p>
        </div>
      </div>

      <Input 
        label="الموقع" 
        placeholder="مثلاً: استوديو 1، الشارع الرئيسي..." 
        value={formData.location || ''}
        onChange={(e) => setFormData(f => ({ ...f, location: e.target.value }))}
        required
        className="bg-slate-50 border-slate-200"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input 
          label="وقت البدء" 
          type="datetime-local"
          value={formData.start_time || ''}
          onChange={(e) => setFormData(f => ({ ...f, start_time: e.target.value }))}
          required
          className="bg-slate-50 border-slate-200"
        />

        <Input 
          label="وقت الانتهاء" 
          type="datetime-local"
          value={formData.end_time || ''}
          onChange={(e) => setFormData(f => ({ ...f, end_time: e.target.value }))}
          className="bg-slate-50 border-slate-200"
        />
      </div>

      {/* المعدات */}
      <div className="space-y-3">
        <label className="block text-sm font-bold text-slate-900">المعدات</label>
        <div className="flex gap-2">
          <Input 
            placeholder="أضف معدة (كاميرا، ميكروفون، إضاءة...)" 
            value={equipmentInput}
            onChange={(e) => setEquipmentInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddEquipment())}
            className="flex-1 bg-slate-50 border-slate-200"
          />
          <Button 
            type="button"
            onClick={handleAddEquipment}
            variant="secondary"
            className="gap-2"
          >
            <Plus size={18} />
            إضافة
          </Button>
        </div>
        
        {(formData.equipment || []).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.equipment.map((item, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-bold"
              >
                <span>{item}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveEquipment(idx)}
                  className="hover:text-red-600 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* الطاقم */}
      <div className="space-y-3">
        <label className="block text-sm font-bold text-slate-900">الطاقم</label>
        <div className="flex gap-2">
          <Input 
            placeholder="أضف عضو طاقم (المخرج، المصور، الصوتي...)" 
            value={crewInput}
            onChange={(e) => setCrewInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCrew())}
            className="flex-1 bg-slate-50 border-slate-200"
          />
          <Button 
            type="button"
            onClick={handleAddCrew}
            variant="secondary"
            className="gap-2"
          >
            <Plus size={18} />
            إضافة
          </Button>
        </div>
        
        {(formData.crew || []).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.crew.map((item, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg text-sm font-bold"
              >
                <span>{item}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveCrew(idx)}
                  className="hover:text-red-600 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Textarea 
        label="ملاحظات" 
        placeholder="ملاحظات إضافية عن التصوير..." 
        value={formData.notes || ''}
        onChange={(e) => setFormData(f => ({ ...f, notes: e.target.value }))}
        className="bg-slate-50 border-slate-200"
      />

      <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
        <Button variant="ghost" type="button" onClick={onCancel} disabled={isLoading}>
          إلغاء
        </Button>
        <Button type="submit" isLoading={isLoading} className="min-w-[120px] bg-[#3d6a8a] hover:bg-[#2d5570] text-white">
          {initialData?.id ? 'تحديث البيانات' : 'حفظ البيانات'}
        </Button>
      </div>
    </form>
  );
}
