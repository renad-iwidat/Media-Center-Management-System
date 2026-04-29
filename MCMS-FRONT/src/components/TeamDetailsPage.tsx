import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, Users, User, UserPlus, 
  Trash2, Edit, Info, ShieldCheck, Mail,
  Layout, Building2
} from 'lucide-react';
import { api } from '../services/api';
import { TeamDetails, User as UserType } from '../types';
import { Button, Select } from './ui/Inputs';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { cn } from '../lib/utils';

export default function TeamDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<TeamDetails | null>(null);
  
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [users, setUsers] = useState<UserType[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: TeamDetails }>(`/api/portal/teams/${id}/members`);
      const usersRes = await api.get<{ success: boolean; data: UserType[] }>('/api/portal/users');
      
      if (res.success) setTeam(res.data);
      if (usersRes.success) setUsers(usersRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post<{ success: boolean }>(`/api/portal/teams/${id}/members`, { userId: Number(selectedUserId) });
      if (res.success) {
        setIsMemberModalOpen(false);
        setSelectedUserId('');
        fetchDetails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!window.confirm('هل تريد حذف العضو من الفريق؟')) return;
    try {
      const res = await api.delete<{ success: boolean }>(`/api/portal/teams/${id}/members/${userId}`);
      if (res.success) fetchDetails();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-400 font-bold">جاري تحميل تفاصيل الفريق...</div>;
  if (!team) return <div className="p-12 text-center text-red-500 font-bold">لم يتم العثور على الفريق</div>;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-6">
        <Link to="/departments" state={{ activeTab: 'teams' }} className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors w-fit group">
          <ArrowRight size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold font-sans">العودة للفرق</span>
        </Link>

        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40 divide-y divide-slate-100 overflow-hidden relative">
           <div className="pb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-4">
                 <div className="flex items-center gap-3">
                    <Badge variant="purple">{team.desk_name}</Badge>
                    <span className="text-xs font-mono font-bold text-slate-400">TEAM ID: {team.id}</span>
                 </div>
                 <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                   <Users size={32} className="text-purple-600" />
                   {team.name}
                 </h1>
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                       <ShieldCheck size={18} className="text-blue-500" />
                       مدير الفريق: {team.manager_name}
                    </div>
                    <div className="text-slate-200">|</div>
                    <div className="text-sm font-bold text-slate-400">
                       عدد الأعضاء: {team.members.length}
                    </div>
                 </div>
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
           
           <div className="pt-8">
              <div className="flex items-center justify-between mb-6">
                 <h4 className="text-xl font-black text-slate-900 flex items-center gap-2">
                   أعضاء الفريق
                 </h4>
                 <Button onClick={() => setIsMemberModalOpen(true)} size="sm" className="gap-1.5 font-bold">
                    <UserPlus size={16} />
                    إضافة عضو
                 </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {team.members.map((member) => (
                   <div key={member.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-md transition-all">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-white rounded-xl border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-purple-600 transition-colors">
                            <User size={20} />
                         </div>
                         <div>
                            <p className="font-bold text-slate-900">{member.name}</p>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mt-0.5">
                               <Mail size={10} />
                               {member.email}
                            </div>
                         </div>
                      </div>
                      <button 
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                         <Trash2 size={18} />
                      </button>
                   </div>
                 ))}
                 {team.members.length === 0 && (
                   <div className="col-span-full py-12 text-center text-slate-400 font-bold">لا يوجد أعضاء مضافين لهذا الفريق</div>
                 )}
              </div>
           </div>
        </div>
      </div>

      <Modal isOpen={isMemberModalOpen} onClose={() => setIsMemberModalOpen(false)} title="إضافة عضو للفريق">
         <form onSubmit={handleAddMember} className="space-y-6">
            <Select 
              label="الموظف"
              required
              options={[{ value: '', label: 'اختر الموظف...' }, ...users.map(u => ({ value: u.id.toString(), label: u.name }))]}
              value={selectedUserId}
              onChange={e => setSelectedUserId(e.target.value)}
            />
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
               <Button variant="ghost" type="button" onClick={() => setIsMemberModalOpen(false)}>إلغاء</Button>
               <Button type="submit" disabled={!selectedUserId}>إضافة للعضوية</Button>
            </div>
         </form>
      </Modal>
    </div>
  );
}
