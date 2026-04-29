import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, Tv, Clock, Info, PlayCircle, 
  Users, UserPlus, Trash2, Edit, Plus, 
  ShieldCheck, Layout, User, Eye
} from 'lucide-react';
import { api } from '../services/api';
import { ProgramDetails, User as UserType, Lookup } from '../types';
import { Button, Input, Select } from './ui/Inputs';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { cn } from '../lib/utils';

export default function ProgramDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<ProgramDetails | null>(null);
  
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [users, setUsers] = useState<UserType[]>([]);
  const [roles, setRoles] = useState<Lookup[]>([]);
  const [roleForm, setRoleForm] = useState({ user_id: '', role_id: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [detailsRes, episodesRes, rolesRes] = await Promise.all([
        api.get<{ success: boolean; data: any }>(`/api/portal/programs/${id}`),
        api.get<{ success: boolean; data: any[] }>(`/api/portal/episodes?program_id=${id}`),
        api.get<{ success: boolean; data: any[] }>(`/api/portal/program-roles?program_id=${id}`)
      ]);
      
      const allUsersRes = await api.get<{ success: boolean; data: UserType[] }>('/api/portal/users');
      const allRolesRes = await api.get<{ success: boolean; data: Lookup[] }>('/api/portal/roles');
      
      if (detailsRes.success) {
        setProgram({
          ...detailsRes.data,
          episodes: episodesRes.data || [],
          team: rolesRes.data || []
        });
      }
      
      if (allUsersRes.success) setUsers(allUsersRes.data);
      if (allRolesRes.success) setRoles(allRolesRes.data);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post<{ success: boolean }>('/api/portal/program-roles', {
        program_id: Number(id),
        user_id: Number(roleForm.user_id),
        role_id: Number(roleForm.role_id)
      });
      if (res.success) {
        setIsRoleModalOpen(false);
        setRoleForm({ user_id: '', role_id: '' });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRole = async (userId: number, roleId: number) => {
    if (!window.confirm('هل تريد حذف العضو من فريق البرنامج؟')) return;
    try {
      // Assuming a composite key delete or searching for id
      // Since specific endpoint was not provided for delete program-role, we assume nested or query based
      const res = await api.delete<{ success: boolean }>(`/api/portal/program-roles?program_id=${id}&user_id=${userId}&role_id=${roleId}`);
      if (res.success) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-400 font-bold">جاري تحميل تفاصيل البرنامج...</div>;
  if (!program) return <div className="p-12 text-center text-red-500 font-bold">لم يتم العثور على البرنامج</div>;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-6">
        <Link to="/programs" className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors w-fit group">
          <ArrowRight size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold font-sans">العودة للبرامج</span>
        </Link>

        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40">
           <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3">
                 <div className="flex items-center gap-3">
                    <Badge variant="blue">{program.media_unit_name}</Badge>
                    <span className="text-xs font-mono font-bold text-slate-400">#{program.id}</span>
                 </div>
                 <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                   <Tv size={32} className="text-blue-600" />
                   {program.name}
                 </h1>
                 <p className="text-slate-500 font-bold max-w-2xl">{program.description}</p>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" className="gap-2">
                  <Edit size={18} />
                  تعديل
                </Button>
                <Button variant="ghost" className="text-red-600 hover:bg-red-50 gap-2">
                  <Trash2 size={18} />
                  حذف
                </Button>
              </div>
           </div>
           
           <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                   <Clock size={20} />
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">وقت البث</p>
                    <p className="text-sm font-black text-slate-800">{program.air_time || 'غير محدد'}</p>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                   <PlayCircle size={20} />
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">عدد الحلقات</p>
                    <p className="text-sm font-black text-slate-800">{program.episodes.length}</p>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                   <Users size={20} />
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">فريق العمل</p>
                    <p className="text-sm font-black text-slate-800">{program.team.length} عضو</p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Episodes Section */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
           <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-lg font-black text-slate-900 flex items-center gap-2 underline underline-offset-8 decoration-blue-600 decoration-4">
                الحلقات المسجلة
              </h4>
              <Button size="sm" className="gap-1.5" onClick={() => navigate('/programs', { state: { openEpisodeModal: true, programId: program.id } })}>
                <Plus size={16} />
                حلقة جديدة
              </Button>
           </div>
           <div className="overflow-x-auto flex-1 h-[400px]">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 sticky top-0 z-10">
                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">العنوان</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">رقم</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">التاريخ</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {program.episodes.map(eb => (
                     <tr key={eb.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer group" onClick={() => navigate(`/episodes/${eb.id}`)}>
                        <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">{eb.title}</td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-500">#{eb.episode_number}</td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-500">{eb.air_date}</td>
                        <td className="px-6 py-4">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Eye size={16} className="text-blue-600" />
                          </div>
                        </td>
                     </tr>
                   ))}
                </tbody>
              </table>
              {program.episodes.length === 0 && (
                <div className="p-12 text-center text-slate-400 font-bold">لا توجد حلقات مدرجة لهذا البرنامج</div>
              )}
           </div>
        </div>

        {/* Team Section */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-lg font-black text-slate-900 flex items-center gap-2 underline underline-offset-8 decoration-purple-600 decoration-4">
                فريق العمل
              </h4>
              <Button onClick={() => setIsRoleModalOpen(true)} size="sm" variant="secondary" className="gap-1.5 font-bold">
                <UserPlus size={16} />
                إضافة عضو
              </Button>
           </div>
           <div className="divide-y divide-slate-50 flex-1 overflow-y-auto max-h-[400px]">
              {program.team.map((member) => (
                <div key={`${member.user_id}-${member.role_id}`} className="p-5 hover:bg-slate-50/50 transition-colors flex items-center justify-between group">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                        <User size={20} />
                      </div>
                      <div>
                         <p className="font-black text-slate-900">{member.user_name}</p>
                         <p className="text-xs font-bold text-purple-600 flex items-center gap-1 mt-1">
                           <ShieldCheck size={12} />
                           {member.role_name}
                         </p>
                      </div>
                   </div>
                   <button 
                    onClick={() => handleDeleteRole(member.user_id, member.role_id)}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                   >
                     <Trash2 size={18} />
                   </button>
                </div>
              ))}
              {program.team.length === 0 && (
                <div className="p-12 text-center text-slate-400 font-bold">لم يتم تعريف فريق العمل بعد</div>
              )}
           </div>
        </div>
      </div>

      {/* Role Modal */}
      <Modal isOpen={isRoleModalOpen} onClose={() => setIsRoleModalOpen(false)} title="إضافة عضو لفريق البرنامج">
         <form onSubmit={handleAddRole} className="space-y-6">
            <Select 
              label="الموظف"
              required
              options={[{ value: '', label: 'اختر الموظف...' }, ...users.map(u => ({ value: u.id.toString(), label: u.name }))]}
              value={roleForm.user_id}
              onChange={e => setRoleForm({...roleForm, user_id: e.target.value})}
            />
            <Select 
              label="الدور"
              required
              options={[{ value: '', label: 'اختر الدور...' }, ...roles.map(r => ({ value: r.id.toString(), label: r.name }))]}
              value={roleForm.role_id}
              onChange={e => setRoleForm({...roleForm, role_id: e.target.value})}
            />
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
               <Button variant="ghost" type="button" onClick={() => setIsRoleModalOpen(false)}>إلغاء</Button>
               <Button type="submit" disabled={!roleForm.user_id || !roleForm.role_id}>إضافة للفريق</Button>
            </div>
         </form>
      </Modal>
    </div>
  );
}
