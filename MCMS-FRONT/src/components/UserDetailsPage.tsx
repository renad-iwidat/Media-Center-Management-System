import React, { useState, useEffect } from 'react';
import { 
  Users, Shield, Calendar, Clock, Mail, 
  ChevronRight, Key, Edit, Plus, Trash2,
  Trophy, CheckCircle, AlertCircle, TrendingUp, Sparkles,
  Check, X
} from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { UserWithRoles, Role, UserKPI, UserPermissionGroup } from '../types';
import { Button, Input, Select } from './ui/Inputs';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

export default function UserDetailsPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserWithRoles | null>(null);
  const [userRoles, setUserRoles] = useState<Role[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<UserPermissionGroup[]>([]);
  const [kpi, setKpi] = useState<UserKPI | null>(null);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  const fetchUserDetails = async () => {
    setLoading(true);
    try {
      const [userRes, userRolesRes, allRolesRes, permsRes, kpiRes] = await Promise.all([
        api.get<{ success: boolean; data: UserWithRoles }>(`/api/portal/users/${id}/with-role`),
        api.get<{ success: boolean; data: Role[] }>(`/api/permissions/users/${id}/roles`),
        api.get<{ success: boolean; data: Role[] }>('/api/portal/roles'),
        api.get<{ success: boolean; data: UserPermissionGroup[] }>(`/api/permissions/users/${id}/permissions`),
        api.get<{ success: boolean; data: UserKPI }>(`/api/kpi/users/${id}`)
      ]);

      if (userRes.success) setUser(userRes.data);
      if (userRolesRes.success) setUserRoles(userRolesRes.data);
      if (allRolesRes.success) setAllRoles(allRolesRes.data);
      if (permsRes.success) setPermissions(permsRes.data);
      if (kpiRes.success) setKpi(kpiRes.data);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDetails();
  }, [id]);

  const removeRole = async (roleId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الدور عن المستخدم؟')) return;
    try {
      const res = await api.delete<{ success: boolean }>(`/api/permissions/users/${id}/roles/${roleId}`);
      if (res.success) fetchUserDetails();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-20 text-center text-slate-400 font-bold">جاري تحميل بيانات المستخدم...</div>;
  if (!user) return <div className="p-20 text-center text-slate-400 font-bold text-red-500">مستخدم غير موجود</div>;

  return (
    <div className="space-y-8 pb-20">
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <Link to="/users" className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors">
            <ChevronRight size={14} />
            العودة للمستخدمين
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-3xl flex items-center justify-center text-blue-600">
               <Users size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-900">{user.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <Badge variant="blue" className="font-sans text-sm">{user.role_name}</Badge>
                <div className="text-xs font-bold text-slate-400 flex items-center gap-1">
                   <Mail size={12} />
                   {user.email}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="gap-2 text-slate-600 border border-slate-200" onClick={() => setIsPasswordModalOpen(true)}>
            <Key size={18} />
            تعيين كلمة سر
          </Button>
          <Button className="gap-2" onClick={() => setIsEditModalOpen(true)}>
            <Edit size={18} />
            تعديل البيانات
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Work Info */}
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Calendar size={20} className="text-blue-600" />
              أيام الدوام وساعات العمل
            </h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map(day => (
                <div 
                  key={day}
                  className={cn(
                    "px-4 py-2 rounded-2xl text-sm font-bold border transition-all",
                    user.work_days.includes(day)
                      ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm"
                      : "bg-slate-50 border-slate-100 text-slate-400 opacity-50"
                  )}
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
               <div>
                  <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-1">وقت البداية</p>
                  <p className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Clock size={20} className="text-slate-300" />
                    {user.start_time}
                  </p>
               </div>
               <div>
                  <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-1">وقت النهاية</p>
                  <p className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Clock size={20} className="text-slate-300" />
                    {user.end_time}
                  </p>
               </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 bg-slate-50/30">
               <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                 <Shield size={20} className="text-blue-600" />
                 صلاحيات المستخدم المكتسبة
               </h3>
               <p className="text-xs font-bold text-slate-400 mt-1">يتم تجميع الصلاحيات آلياً بناءً على الأدوار المعينة للموظف</p>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {permissions.map((group) => (
                  <div key={group.category} className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-r-2 border-blue-600 pr-3">
                      {group.category}
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {group.permissions.map((p) => (
                        <div key={p.key} className={cn(
                          "flex items-center justify-between p-3 rounded-2xl border transition-all",
                          p.has ? "bg-blue-50/30 border-blue-100" : "bg-slate-50/50 border-slate-100 opacity-40grayscale"
                        )}>
                          <span className={cn("text-sm font-bold", p.has ? "text-slate-700" : "text-slate-400")}>{p.label}</span>
                          {p.has ? <CheckCircle size={18} className="text-green-500" /> : <X size={18} className="text-slate-300" />}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Roles Widget */}
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
               <h3 className="font-bold text-slate-900">الأدوار الوظيفية</h3>
               <Button size="icon" variant="ghost" className="rounded-full w-8 h-8 text-blue-600 bg-blue-50" onClick={() => setIsRoleModalOpen(true)}>
                 <Plus size={16} />
               </Button>
            </div>
            <div className="space-y-3">
               {userRoles.map(r => (
                 <div key={r.id} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-2xl border border-slate-100 group">
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xs">
                        {r.name.substring(0, 1)}
                     </div>
                     <span className="text-sm font-bold text-slate-700">{r.name}</span>
                   </div>
                   <button 
                    onClick={() => removeRole(r.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                   >
                     <Trash2 size={16} />
                   </button>
                 </div>
               ))}
               {userRoles.length === 0 && (
                 <div className="py-8 text-center text-slate-400 font-bold text-xs">لا توجد أدوار إضافية</div>
               )}
            </div>
          </div>

          {/* KPI Display */}
          {kpi && (
            <div className="bg-slate-900 rounded-[32px] p-6 text-white overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-blue-500/20 transition-all duration-500"></div>
              
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <Trophy size={20} className="text-blue-400" />
                  </div>
                  <h3 className="font-bold text-lg">مؤشرات الأداء</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">المهام المكتملة</p>
                    <p className="text-2xl font-bold flex items-center gap-2">
                      {kpi.completed_tasks}
                      <span className="text-[10px] text-slate-500 font-normal">من {kpi.total_tasks_assigned}</span>
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">نسبة الالتزام</p>
                    <p className="text-2xl font-bold">{kpi.on_time_percentage}%</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-400">
                    <span>الالتزام بالمواعيد</span>
                    <span className="text-blue-400">{kpi.on_time_percentage}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                      style={{ width: `${kpi.on_time_percentage}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                   <div className="flex items-center justify-between text-xs p-2.5 bg-white/5 rounded-xl border border-white/5">
                      <div className="flex items-center gap-2 text-slate-300 font-bold">
                        <TrendingUp size={14} className="text-green-500" />
                        المحتوى المنتج
                      </div>
                      <span className="font-black text-blue-400">{kpi.content_produced_count}</span>
                   </div>
                   <div className="flex items-center justify-between text-xs p-2.5 bg-white/5 rounded-xl border border-white/5">
                      <div className="flex items-center gap-2 text-slate-300 font-bold">
                        <Sparkles size={14} className="text-purple-400" />
                        استخدام AI
                      </div>
                      <span className="font-black text-purple-400">{kpi.ai_usage_count}</span>
                   </div>
                   <div className="flex items-center justify-between text-xs p-2.5 bg-white/5 rounded-xl border border-white/5">
                      <div className="flex items-center gap-2 text-slate-300 font-bold">
                        <AlertCircle size={14} className="text-red-500" />
                        المهام المتأخرة
                      </div>
                      <span className="font-black text-red-500">{kpi.overdue_tasks}</span>
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="تعديل بيانات المستخدم">
         <EditUserForm 
           user={user} 
           onSuccess={() => { setIsEditModalOpen(false); fetchUserDetails(); }} 
           onCancel={() => setIsEditModalOpen(false)} 
         />
      </Modal>

      <Modal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} title="تعيين كلمة سر جديدة">
         <SetPasswordForm 
           userId={user.id} 
           onSuccess={() => setIsPasswordModalOpen(false)} 
           onCancel={() => setIsPasswordModalOpen(false)} 
         />
      </Modal>

      <Modal isOpen={isRoleModalOpen} onClose={() => setIsRoleModalOpen(false)} title="إضافة دور للمستخدم">
         <AddRoleForm 
           userId={user.id} 
           roles={allRoles.filter(r => !userRoles.some(ur => ur.id === r.id))}
           onSuccess={() => { setIsRoleModalOpen(false); fetchUserDetails(); }} 
           onCancel={() => setIsRoleModalOpen(false)} 
         />
      </Modal>
    </div>
  );
}

function EditUserForm({ user, onSuccess, onCancel }: { user: UserWithRoles, onSuccess: () => void, onCancel: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    work_days: user.work_days.split(','),
    start_time: user.start_time,
    end_time: user.end_time
  });

  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      work_days: prev.work_days.includes(day) 
        ? prev.work_days.filter(d => d !== day) 
        : [...prev.work_days, day]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put<{ success: boolean }>(`/api/portal/users/${user.id}`, {
        ...formData,
        work_days: formData.work_days.join(',')
      });
      if (res.success) onSuccess();
    } catch (err) {
      console.error(err);
      alert('فشل في تحديث بيانات المستخدم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="الاسم الكامل" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
        <Input label="البريد الإلكتروني" type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">أيام العمل</label>
        <div className="flex flex-wrap gap-2">
          {days.map(day => (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-bold transition-all border",
                formData.work_days.includes(day)
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-white border-slate-200 text-slate-500"
              )}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="وقت بداية الدوام" type="time" required value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} />
        <Input label="وقت نهاية الدوام" type="time" required value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <Button variant="ghost" type="button" onClick={onCancel}>إلغاء</Button>
        <Button type="submit" loading={loading}>حفظ التغييرات</Button>
      </div>
    </form>
  );
}

function SetPasswordForm({ userId, onSuccess, onCancel }: { userId: number, onSuccess: () => void, onCancel: () => void }) {
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return alert('الحد الأدنى 6 أحرف');
    setLoading(true);
    try {
      const res = await api.post<{ success: boolean }>(`/api/auth/set-password/${userId}`, { new_password: password });
      if (res.success) onSuccess();
    } catch (err) {
      console.error(err);
      alert('فشل في تعيين كلمة السر');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input 
        label="كلمة السر الجديدة" 
        type="password" 
        required 
        value={password} 
        onChange={e => setPassword(e.target.value)} 
        placeholder="أدخل 6 أحرف على الأقل..."
      />
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <Button variant="ghost" type="button" onClick={onCancel}>إلغاء</Button>
        <Button type="submit" loading={loading} className="bg-red-600 hover:bg-red-700">تحديث كلمة السر</Button>
      </div>
    </form>
  );
}

function AddRoleForm({ userId, roles, onSuccess, onCancel }: { userId: number, roles: Role[], onSuccess: () => void, onCancel: () => void }) {
  const [loading, setLoading] = useState(false);
  const [roleId, setRoleId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleId) return;
    setLoading(true);
    try {
      const res = await api.post<{ success: boolean }>(`/api/permissions/users/${userId}/roles`, { role_id: Number(roleId) });
      if (res.success) onSuccess();
    } catch (err) {
      console.error(err);
      alert('فشل في إضافة الدور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select 
        label="اختر الدور الوظيفي" 
        required
        options={[{ value: '', label: 'اختر الدور...' }, ...roles.map(r => ({ value: r.id.toString(), label: r.name }))]}
        value={roleId}
        onChange={e => setRoleId(e.target.value)}
      />
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <Button variant="ghost" type="button" onClick={onCancel}>إلغاء</Button>
        <Button type="submit" loading={loading}>إضافة الدور</Button>
      </div>
    </form>
  );
}
