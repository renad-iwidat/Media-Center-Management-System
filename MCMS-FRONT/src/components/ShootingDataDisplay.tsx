import React from 'react';
import { TaskShootingData } from '../types';
import { Button } from './ui/Inputs';
import { Camera, MapPin, Clock, Zap, Users, FileText, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ShootingDataDisplayProps {
  data: TaskShootingData;
  onEdit: () => void;
  onDelete: () => void;
  isLoading?: boolean;
}

export default function ShootingDataDisplay({ 
  data, 
  onEdit, 
  onDelete,
  isLoading = false 
}: ShootingDataDisplayProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <Camera size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">بيانات التصوير</h3>
            <p className="text-xs text-slate-500 font-medium">معلومات حدث التصوير المرتبط بهذه المهمة</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={onEdit}
            variant="secondary"
            size="sm"
            className="gap-2"
            disabled={isLoading}
          >
            <Edit size={16} />
            تعديل
          </Button>
          <Button 
            onClick={onDelete}
            variant="ghost"
            size="sm"
            className="gap-2 text-red-600 hover:bg-red-100"
            disabled={isLoading}
          >
            <Trash2 size={16} />
            حذف
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* الموقع */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 flex-shrink-0">
            <MapPin size={20} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">الموقع</p>
            <p className="text-lg font-bold text-slate-900">{data.location || 'غير محدد'}</p>
          </div>
        </div>

        {/* الأوقات */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-green-600 flex-shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">وقت البدء</p>
              <p className="text-base font-bold text-slate-900">
                {data.start_time ? format(new Date(data.start_time), 'yyyy/MM/dd HH:mm', { locale: ar }) : 'غير محدد'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600 flex-shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">وقت الانتهاء</p>
              <p className="text-base font-bold text-slate-900">
                {data.end_time ? format(new Date(data.end_time), 'yyyy/MM/dd HH:mm', { locale: ar }) : 'غير محدد'}
              </p>
            </div>
          </div>
        </div>

        {/* المعدات */}
        {(data.equipment || []).length > 0 && (
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600 flex-shrink-0">
              <Zap size={20} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">المعدات</p>
              <div className="flex flex-wrap gap-2">
                {data.equipment.map((item, idx) => (
                  <span 
                    key={idx}
                    className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-bold"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* الطاقم */}
        {(data.crew || []).length > 0 && (
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 flex-shrink-0">
              <Users size={20} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">الطاقم</p>
              <div className="flex flex-wrap gap-2">
                {data.crew.map((item, idx) => (
                  <span 
                    key={idx}
                    className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-bold"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* الملاحظات */}
        {data.notes && (
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center text-yellow-600 flex-shrink-0">
              <FileText size={20} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">الملاحظات</p>
              <p className="text-sm text-slate-700 leading-relaxed font-medium">{data.notes}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
