import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Search, MoreHorizontal, 
  Eye, Calendar, Clock, Mail, Shield,
  ChevronLeft, Filter
} from 'lucide-react';
import { api } from '../services/api';
import { UserWithRoles, Role } from '../types';
import { Button, Input, Select } from './ui/Inputs';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

export default function UsersPage() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [search, setSearch] = useState('');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: UserWithRoles[] }>('/api/portal/users');
      if (res.success) setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  // Check management permission
  if (currentUser && !currentUser.permissions?.includes('users.manage')) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Shield size={64} className="mb-4 opacity-20" />
        <h2 className="text-xl font-black">عذراً، لا تملك صلاحية إدارة المستخدمين</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">إدارة المستخدمين</h1>
          <p className="text-slate-500 font-bold">إضافة الموظفين وتعيين أدوارهم الأساسية وإدارة صيانة الحسابات</p>
        </div>
        <Button onClick={() => setIsRegisterModalOpen(true)} className="gap-2">
          <UserPlus size={20} />
          مستخدم جديد
        </Button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="بحث باسم الموظف أو البريد الإلكتروني..." 
              className="pr-12 bg-slate-50/50 border-transparent focus:bg-white"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <Filter size={14} />
            إجمالي: {filteredUsers.length} موظف
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">الموظف</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">الدور الأساسي</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">أيام العمل</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">الدوام</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">آخر ظهور</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map((u) => (
                <tr 
                  key={u.id} 
                  className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/users/${u.id}`)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                        <Users size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{u.name}</p>
                        <p className="text-xs font-bold text-slate-400 flex items-center gap-1">
                          <Mail size={12} />
                          {u.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="blue" className="font-sans">{u.role_name}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[10px] font-bold text-slate-500 max-w-[150px] leading-relaxed">
                      {u.work_days || 'غير محدد'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                      <Clock size={14} className="text-slate-300" />
                      <span>{u.start_time} - {u.end_time}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <span className="text-xs font-bold text-slate-400">
                       {u.last_login ? format(new Date(u.last_login), 'yyyy/MM/dd HH:mm') : 'لم يسجل دخول'}
                     </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && <div className="p-12 text-center text-slate-400 font-bold">جاري تحميل قائمة الموظفين...</div>}
          {!loading && filteredUsers.length === 0 && (
            <div className="p-20 text-center text-slate-400 font-bold">لم يتم العثور على موظفين مطابقين للبحث</div>
          )}
        </div>
      </div>

      {/* Register Modal */}
      <Modal isOpen={isRegisterModalOpen} onClose={() => setIsRegisterModalOpen(false)} title="تسجيل موظف جديد">
        <RegisterForm onSuccess={() => { setIsRegisterModalOpen(false); fetchUsers(); }} onCancel={() => setIsRegisterModalOpen(false)} />
      </Modal>
    </div>
  );
}

function RegisterForm({ onSuccess, onCancel }: { onSuccess: () => void, onCancel: () => void }) {
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role_id: '',
    work_days: [] as string[],
    start_time: '08:00',
    end_time: '16:00'
  });

  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  useEffect(() => {
    api.get<{ success: boolean; data: Role[] }>('/api/portal/roles').then(res => {
      if (res.success) setRoles(res.data);
    });
  }, []);

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
    if (formData.password.length < 6) {
      alert('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<{ success: boolean }>('/api/auth/register', {
        ...formData,
        role_id: Number(formData.role_id),
        work_days: formData.work_days.join(',')
      });
      if (res.success) onSuccess();
    } catch (err) {
      console.error(err);
      alert('فشل في تسجيل المستخدم، ربما البريد الإلكتروني مستخدم مسبقاً');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="الاسم الكامل" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
        <Input label="البريد الإلكتروني (@najah.edu)" type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="كلمة المرور (6+ أحرف)" type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
        <Select 
          label="الدور الأساسي" 
          required
          options={[{ value: '', label: 'اختر الدور...' }, ...roles.map(r => ({ value: r.id.toString(), label: r.name }))]}
          value={formData.role_id}
          onChange={e => setFormData({...formData, role_id: e.target.value})}
        />
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
                  ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200"
                  : "bg-white border-slate-200 text-slate-500 hover:border-blue-400"
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
        <Button type="submit" loading={loading}>تسجيل الموظف</Button>
      </div>
    </form>
  );
}
