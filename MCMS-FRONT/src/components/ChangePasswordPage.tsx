import React, { useState } from 'react';
import { Button, Input } from './ui/Inputs';
import { api } from '../services/api';
import { motion } from 'framer-motion';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function ChangePasswordPage() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'كلمة السر الجديدة غير متطابقة' });
      return;
    }

    setLoading(true);
    try {
      const res = await api.post<any>('/api/auth/change-password', {
        old_password: oldPassword,
        new_password: newPassword,
      });

      if (res.success) {
        setMessage({ type: 'success', text: 'تم تغيير كلمة السر بنجاح' });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage({ type: 'error', text: res.error || 'فشل تغيير كلمة السر' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'حدث خطأ أثناء الاتصال بالسيرفر' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex flex-col gap-1 mb-8">
        <h1 className="text-2xl font-bold">تغيير كلمة السر</h1>
        <p className="text-gray-400">يرجى اختيار كلمة سر قوية للحفاظ على أمان حسابك</p>
      </div>

      <div className="glass p-8 rounded-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="كلمة السر الحالية"
            type="password"
            placeholder="••••••••"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="كلمة السر الجديدة"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <Input
              label="تأكيد كلمة السر الجديدة"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {message.text && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "p-4 rounded-xl flex items-center gap-3 text-sm border",
                message.type === 'success' ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-red-500/10 border-red-500/20 text-red-500"
              )}
            >
              {message.type === 'success' ? <CheckCircle2 size={18} /> : <ShieldAlert size={18} />}
              {message.text}
            </motion.div>
          )}

          <div className="pt-4">
            <Button type="submit" isLoading={loading} className="w-full md:w-auto min-w-[160px]">
              تغيير كلمة السر
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
