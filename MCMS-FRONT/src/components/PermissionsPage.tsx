import React, { useState, useEffect } from 'react';
import { 
  Shield, CheckCircle, X, ChevronLeft, 
  Lock, Settings, Users, BookOpen
} from 'lucide-react';
import { api } from '../services/api';
import { Role, UserPermissionGroup } from '../types';
import { Badge } from './ui/Badge';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

export default function PermissionsPage() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [permissions, setPermissions] = useState<UserPermissionGroup[]>([]);
  const [permsLoading, setPermsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ success: boolean; data: Role[] }>('/api/portal/roles');
      if (res.success && Array.isArray(res.data)) {
        setRoles(res.data);
        if (res.data.length > 0) {
          setSelectedRoleId(res.data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
      setError('فشل تحميل الأدوار. تأكد من اتصالك بالسيرفر.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRolePermissions = async (roleId: number) => {
    setPermsLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: UserPermissionGroup[] }>(`/api/permissions/roles/${roleId}`);
      if (res.success && Array.isArray(res.data)) setPermissions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setPermsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && currentUser) {
      fetchRoles();
    }
  }, [authLoading, currentUser]);

  useEffect(() => {
    if (selectedRoleId) {
      fetchRolePermissions(selectedRoleId);
    }
  }, [selectedRoleId]);

  // Show loading while auth is still loading
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-bold">جاري التحميل...</p>
      </div>
    );
  }

  // Check management permission
  if (currentUser && !currentUser.permissions?.includes('roles.manage')) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Lock size={64} className="mb-4 opacity-20" />
        <h2 className="text-xl font-black">عذراً، لا تملك صلاحية إدارة الأدوار والصلاحيات</h2>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Shield size={64} className="mb-4 opacity-20" />
        <h2 className="text-xl font-black text-red-400 mb-2">خطأ</h2>
        <p className="text-sm font-bold">{error}</p>
        <button onClick={fetchRoles} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors">
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-1">الأدوار والصلاحيات</h1>
        <p className="text-slate-500 font-bold">استعرض الصلاحيات الممنوحة لكل دور وظيفي في النظام</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Roles List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">الأدوار المتاحة</span>
            </div>
            <div className="p-2 space-y-1">
              {roles.map(role => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRoleId(role.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-2xl text-right transition-all",
                    selectedRoleId === role.id 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                      : "hover:bg-slate-50 text-slate-600 font-bold"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black",
                    selectedRoleId === role.id ? "bg-white/20" : "bg-slate-100 text-slate-400"
                  )}>
                    {role.name.substring(0, 1)}
                  </div>
                  <span className="flex-1 text-sm font-bold truncate">{role.name}</span>
                </button>
              ))}
              {loading && <div className="p-4 text-center text-xs text-slate-400 font-bold">جاري التحميل...</div>}
            </div>
          </div>

          <div className="bg-blue-600 rounded-[32px] p-6 text-white overflow-hidden relative">
             <Shield size={64} className="absolute -bottom-4 -left-4 opacity-10" />
             <h4 className="font-bold mb-2">تنبيه إداري</h4>
             <p className="text-xs text-blue-100 leading-relaxed font-bold">
               الصلاحيات في هذا النظام تراكمية. إذا كان للموظف أكثر من دور، فإنه يحصل على كامل صلاحيات جميع الأدوار مجتمعة.
             </p>
          </div>
        </div>

        {/* Permissions Grid */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm min-h-[600px] flex flex-col">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                   صلاحيات {roles.find(r => r.id === selectedRoleId)?.name || 'الدور المختارة'}
                </h3>
                <p className="text-xs font-bold text-slate-400 mt-1">تحديث الصلاحيات يتم عبر تغيير مهام الدور من قاعدة البيانات</p>
              </div>
              <Badge variant="blue" className="px-4 py-1.5 font-sans">
                {permissions.reduce((acc, g) => acc + (g.permissions || []).filter(p => p.has).length, 0)} صلاحية فعالة
              </Badge>
            </div>

            <div className="p-8 flex-1">
              {permsLoading ? (
                <div className="h-full flex flex-col items-center justify-center py-20 text-slate-400">
                   <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                   <p className="font-bold">جاري تحميل مصفوفة الصلاحيات...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                   {permissions.map((group) => (
                     <div key={group.category} className="space-y-5">
                       <div className="flex items-center gap-3">
                         <div className="w-2 h-6 bg-blue-600 rounded-full" />
                         <h4 className="text-lg font-black text-slate-900">{group.category}</h4>
                       </div>
                       <div className="grid grid-cols-1 gap-3">
                         {(group.permissions || []).map((p) => (
                           <div 
                            key={p.key} 
                            className={cn(
                              "flex items-center justify-between p-4 rounded-[20px] border transition-all",
                              p.has 
                                ? "bg-white border-slate-200 shadow-sm" 
                                : "bg-slate-50/50 border-slate-100 opacity-40 grayscale"
                            )}
                           >
                             <div className="flex items-center gap-3">
                               <div className={cn(
                                 "w-10 h-10 rounded-xl flex items-center justify-center",
                                 p.has ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-400"
                               )}>
                                 {getIconForCategory(group.category)}
                               </div>
                               <div>
                                 <p className={cn("text-sm font-bold", p.has ? "text-slate-800" : "text-slate-400")}>{p.label}</p>
                                 <p className="text-[10px] font-mono font-bold text-slate-300">{p.key}</p>
                               </div>
                             </div>
                             {p.has ? <CheckCircle size={20} className="text-green-500" /> : <X size={20} className="text-slate-300" />}
                           </div>
                         ))}
                       </div>
                     </div>
                   ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getIconForCategory(category: string) {
  if (category.includes('أوردرات')) return <BookOpen size={18} />;
  if (category.includes('مهام')) return <CheckCircle size={18} />;
  if (category.includes('صنع')) return <Shield size={18} />;
  if (category.includes('محتوى')) return <Settings size={18} />;
  if (category.includes('مستخدم')) return <Users size={18} />;
  return <Settings size={18} />;
}
