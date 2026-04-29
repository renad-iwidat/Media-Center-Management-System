import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Search, MoreHorizontal, 
  Eye, Calendar, Clock, Mail, Shield,
  ChevronLeft, ChevronRight, Filter
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
  const [page, setPage] = useState(0);
  const USERS_PER_PAGE = 8;

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
        <Button onClick={() => setIsRegisterModalOpen(true)} className="gap-2 bg-[#3d6a8a] hover:bg-[#2d5570] text-white shadow-lg hover:shadow-xl">
          <UserPlus size={20} />
          مستخدم جديد
        </Button>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xl">
        <div className="p-6 border-b border-slate-200 flex flex-wrap gap-4 items-center bg-white">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <Input 
              placeholder="بحث باسم الموظف أو البريد الإلكتروني..." 
              className="pr-12 h-12 text-base bg-slate-50 border-slate-200 focus:bg-white shadow-sm"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
            />
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-white bg-[#3d6a8a] px-3 py-2 rounded-lg">
            <Filter size={14} />
            إجمالي: {filteredUsers.length} موظف
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-gradient-to-r from-[#3d6a8a] to-[#2d5570] text-white text-sm font-bold border-b-4 border-[#FF9F4A]">
                <th className="px-6 py-4 border-r border-white/20">الموظف</th>
                <th className="px-6 py-4 border-r border-white/20">الدور الأساسي</th>
                <th className="px-6 py-4 border-r border-white/20">أيام العمل</th>
                <th className="px-6 py-4 border-r border-white/20">الدوام</th>
                <th className="px-6 py-4 border-r border-white/20">آخر ظهور</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredUsers.slice(page * USERS_PER_PAGE, (page + 1) * USERS_PER_PAGE).map((u, index) => (
                <tr 
                  key={u.id} 
                  className={cn(
                    "hover:bg-blue-50 transition-all group cursor-pointer border-l-4 border-l-[#FF9F4A]",
                    index % 2 === 0 ? "bg-white" : "bg-slate-50"
                  )}
                  onClick={() => navigate(`/users/${u.id}`)}
                >
                  <td className="px-6 py-5 border-r border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-[#3d6a8a] group-hover:text-white transition-colors">
                        <Users size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 group-hover:text-[#3d6a8a] transition-colors">{u.name}</p>
                        <p className="text-xs font-bold text-slate-400 flex items-center gap-1">
                          <Mail size={12} />
                          {u.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 border-r border-slate-200">
                    <span className="px-3 py-1.5 bg-[#3d6a8a] text-white rounded-md font-semibold text-xs inline-block">
                      {u.role_name}
                    </span>
                  </td>
                  <td className="px-6 py-5 border-r border-slate-200">
                    <p className="text-[10px] font-bold text-slate-500 max-w-[150px] leading-relaxed bg-slate-100 px-2.5 py-1 rounded-lg inline-block">
                      {u.work_days || 'غير محدد'}
                    </p>
                  </td>
                  <td className="px-6 py-5 border-r border-slate-200">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-[#FF9F4A]" />
                      <span className="text-xs font-bold text-slate-600 bg-orange-50 px-2.5 py-1 rounded-lg">
                        {formatTime12(u.start_time)} - {formatTime12(u.end_time)}
                      </span>
                      <Badge variant={getShiftType(u.start_time) === 'صباحي' ? 'blue' : 'purple'}>
                        {getShiftType(u.start_time)}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-6 py-5 border-r border-slate-200">
                     <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg inline-block">
                       {u.last_login ? format(new Date(u.last_login), 'yyyy/MM/dd HH:mm') : 'لم يسجل دخول'}
                     </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && (
            <div className="p-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <div className="w-8 h-8 border-4 border-[#3d6a8a] border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-slate-600 font-medium">جاري تحميل قائمة الموظفين...</p>
            </div>
          )}
          {!loading && filteredUsers.length === 0 && (
            <div className="p-24 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 rounded-full mb-6 shadow-inner">
                <Users className="text-slate-400" size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">لم يتم العثور على موظفين</h3>
              <p className="text-slate-500">لم يتم العثور على موظفين مطابقين للبحث</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredUsers.length > 0 && (
          <div className="px-6 py-4 bg-gradient-to-r from-[#3d6a8a] to-[#2d5570] border-t-4 border-[#FF9F4A] flex items-center justify-between">
            <span className="text-sm text-white font-medium">
              عرض <span className="font-bold text-[#FF9F4A]">{Math.min(USERS_PER_PAGE, filteredUsers.length - page * USERS_PER_PAGE)}</span> من أصل <span className="font-bold text-[#FF9F4A]">{filteredUsers.length}</span> موظف
            </span>
            <div className="flex items-center gap-3">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-4 py-2 text-white bg-white/20 hover:bg-white/30 rounded-lg border border-white/30 transition-all disabled:opacity-30 disabled:pointer-events-none font-medium flex items-center gap-2">
                <ChevronRight size={18} /> السابق
              </button>
              <span className="text-white text-sm font-bold">{page + 1} / {Math.ceil(filteredUsers.length / USERS_PER_PAGE)}</span>
              <button disabled={page >= Math.ceil(filteredUsers.length / USERS_PER_PAGE) - 1} onClick={() => setPage(p => p + 1)} className="px-4 py-2 text-white bg-white/20 hover:bg-white/30 rounded-lg border border-white/30 transition-all disabled:opacity-30 disabled:pointer-events-none font-medium flex items-center gap-2">
                التالي <ChevronLeft size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Register Modal */}
      <Modal isOpen={isRegisterModalOpen} onClose={() => setIsRegisterModalOpen(false)} title="تسجيل موظف جديد">
        <RegisterForm onSuccess={() => { setIsRegisterModalOpen(false); fetchUsers(); }} onCancel={() => setIsRegisterModalOpen(false)} />
      </Modal>
    </div>
  );
}

function getShiftType(startTime?: string): string {
  if (!startTime) return 'غير محدد';
  const hour = parseInt(startTime.split(':')[0]);
  if (hour < 12) return 'صباحي';
  return 'مسائي';
}

function formatTime12(time?: string): string {
  if (!time) return '';
  const [h, m] = time.split(':');
  let hour = parseInt(h);
  const period = hour >= 12 ? 'مساءً' : 'صباحاً';
  if (hour === 0) hour = 12;
  else if (hour > 12) hour -= 12;
  return `${hour}:${m} ${period}`;
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
