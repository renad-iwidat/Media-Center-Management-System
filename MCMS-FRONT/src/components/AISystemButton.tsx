import React, { useState } from 'react';
import { Task, TaskType } from '../types';
import { Button } from './ui/Inputs';
import { ExternalLink, Loader, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

interface AISystemButtonProps {
  task: Task | any;
  taskType?: TaskType | null;
  onUsageRecorded?: () => void;
}

export default function AISystemButton({ 
  task, 
  taskType,
  onUsageRecorded 
}: AISystemButtonProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check if task.id is available
  const isDisabled = !task || !task.id;

  const handleOpenAISystem = async () => {
    if (isDisabled) {
      setMessage({ type: 'error', text: 'معرف المهمة غير متاح' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      // الحصول على التوكن
      const token = localStorage.getItem('token');
      
      // تمرير معاملات المهمة إلى النظام الخارجي
      const params = new URLSearchParams({
        task_id: task.id.toString(),
        task_title: task.title,
        task_description: task.description || '',
        order_id: task.order_id?.toString() || '',
        return_url: window.location.href,
        token: token || '',
        user_id: user?.id?.toString() || '',
        user_email: user?.email || ''
      });

      // فتح النظام في نافذة جديدة
      const aiWindow = window.open(
        `https://automation-and-ai-hub-frontend.onrender.com/?${params.toString()}`,
        'ai-system',
        'width=1200,height=800,resizable=yes,scrollbars=yes'
      );

      if (!aiWindow) {
        setMessage({ type: 'error', text: 'فشل فتح النافذة. تحقق من إعدادات المتصفح' });
        setIsLoading(false);
        return;
      }

      // تسجيل الاستخدام
      try {
        await api.post(`/api/tasks/${task.id}/ai-system-usage`, {
          ai_system_url: 'https://automation-and-ai-hub-frontend.onrender.com/',
          timestamp: new Date().toISOString()
        });
        
        setMessage({ type: 'success', text: 'تم فتح النظام بنجاح وتسجيل الاستخدام' });
        
        if (onUsageRecorded) {
          onUsageRecorded();
        }

        // Clear message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
      } catch (err) {
        console.error('Error recording AI system usage:', err);
        setMessage({ type: 'error', text: 'تم فتح النظام لكن فشل تسجيل الاستخدام' });
      }
    } catch (err) {
      console.error('Error opening AI system:', err);
      setMessage({ type: 'error', text: 'حدث خطأ أثناء فتح النظام' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button 
        onClick={handleOpenAISystem}
        isLoading={isLoading}
        disabled={isDisabled}
        className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl"
        title="نفذ المهمة باستخدام النظام الاخباري"
      >
        {isLoading ? (
          <>
            <Loader size={18} className="animate-spin" />
            جاري الفتح...
          </>
        ) : (
          <>
            <ExternalLink size={18} />
            نفذ المهمة باستخدام النظام الاخباري
          </>
        )}
      </Button>

      {message && (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700' 
            : 'bg-red-50 text-red-700'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          {message.text}
        </div>
      )}
    </div>
  );
}
