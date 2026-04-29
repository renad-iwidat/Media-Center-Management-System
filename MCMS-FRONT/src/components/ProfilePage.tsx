import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Shield, Calendar, Clock, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">بياناتي</h1>
        <p className="text-gray-400">معلومات الحساب والصلاحيات</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass p-8 rounded-2xl flex flex-col md:flex-row gap-8 items-center md:items-start">
            <div className="w-32 h-32 bg-blue-600/10 rounded-3xl flex items-center justify-center border border-blue-500/20">
              <User size={64} className="text-blue-500" />
            </div>
            <div className="flex-1 space-y-4 text-center md:text-right">
              <div>
                <h2 className="text-3xl font-bold">{user.name}</h2>
                <p className="text-gray-400">{user.email}</p>
              </div>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                {user.roles.map(role => (
                  <span key={role.id} className="px-3 py-1 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-lg text-sm font-medium">
                    {role.name}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 pt-6 border-t border-white/5">
                <div className="flex items-center gap-3 text-gray-400">
                  <Calendar size={18} className="text-blue-500" />
                  <div className="flex flex-col items-start pr-3">
                    <span className="text-xs text-gray-500">أيام العمل</span>
                    <span className="text-sm text-gray-200">{user.days_of_work || 'غير محدد'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-gray-400">
                  <Clock size={18} className="text-blue-500" />
                  <div className="flex flex-col items-start pr-3">
                    <span className="text-xs text-gray-500">ساعات الدوام</span>
                    <span className="text-sm text-gray-200">
                      {user.start_time && user.end_time ? `${user.start_time} - ${user.end_time}` : 'غير محدد'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-gray-400">
                  <LogIn size={18} className="text-blue-500" />
                  <div className="flex flex-col items-start pr-3">
                    <span className="text-xs text-gray-500">آخر تسجيل دخول</span>
                    <span className="text-sm text-gray-200 font-mono">{user.last_login || 'لا يوجد'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass p-8 rounded-2xl">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Shield size={24} className="text-blue-500" />
              الصلاحيات الممنوحة
            </h3>
            <div className="flex flex-wrap gap-2">
              {user.permissions?.map((perm, index) => (
                <span key={index} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300 font-mono">
                  {perm}
                </span>
              ))}
              {(!user.permissions || user.permissions.length === 0) && (
                <p className="text-gray-500 text-sm">لا توجد صلاحيات مخصصة مضافة</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats or sidebar info */}
        <div className="space-y-6">
          <div className="glass p-6 rounded-2xl border-r-4 border-blue-600">
            <h4 className="text-sm font-medium text-gray-400 mb-1">الرتبة الوظيفية</h4>
            <p className="text-xl font-bold">{user.roles[0]?.name || 'موظف'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
