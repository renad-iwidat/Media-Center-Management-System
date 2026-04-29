import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Users, User, UserPlus, Trash2, Mail, Building2, Plus, ChevronRight, ChevronLeft } from 'lucide-react';
import { api } from '../services/api';
import { User as UserType, Team } from '../types';
import { Button, Select } from './ui/Inputs';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function TeamDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<any>(null);
  const [members, setMembers] = useState<UserType[]>([]);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [memberPage, setMemberPage] = useState(0);
  const MEMBERS_PER_PAGE = 8;

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const [teamRes, membersRes, usersRes] = await Promise.all([
        api.get<{ success: boolean; data: any }>(`/api/portal/teams/${id}`),
        api.get<{ success: boolean; data: UserType[] }>(`/api/portal/teams/${id}/members`),
        api.get<{ success: boolean; data: UserType[] }>('/api/portal/users'),
      ]);
      if (teamRes.success) setTeam(teamRes.data);
      if (membersRes.success) {
        const membersList = Array.isArray(membersRes.data) ? membersRes.data : (membersRes as any).data || [];
        setMembers(membersList);
      }
      if (usersRes.success) setAllUsers(usersRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDetails(); }, [id]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      const res = await api.post<{ success: boolean }>(`/api/portal/teams/${id}/members`, { user_id: Number(selectedUserId) });
      if (res.success) { setIsMemberModalOpen(false); setSelectedUserId(''); fetchDetails(); }
    } catch (err) { console.error(err); }
    finally { setAddLoading(false); }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!confirm('هل تريد حذف العضو من الفريق؟')) return;
    try { await api.delete<{ success: boolean }>(`/api/portal/teams/${id}/members/${userId}`); fetchDetails(); }
    catch (err) { console.error(err); }
  };

  if (loading) return (
    <div className="p-16 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
        <div className="w-8 h-8 border-4 border-[#3d6a8a] border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-slate-600 font-medium">جاري تحميل تفاصيل الفريق...</p>
    </div>
  );
  if (!team) return <div className="p-16 text-center"><h3 className="text-xl font-bold text-red-600">لم يتم العثور على الفريق</h3></div>;

  return (
    <div className="space-y-8 pb-12">
      {/* Back Link */}
      <Link to={team.desk_id ? `/desks/${team.desk_id}` : '/departments'} className="flex items-center gap-2 text-slate-400 hover:text-[#3d6a8a] transition-colors w-fit group">
        <ArrowRight size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-bold">العودة للقسم</span>
      </Link>

      {/* Team Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#3d6a8a] to-[#2d5570] p-8 border-b-4 border-[#FF9F4A]">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge variant="purple" className="bg-white/20 text-white border-white/30">{team.desk_name || 'قسم'}</Badge>
              <span className="text-xs font-mono font-bold text-white/60">#{team.id}</span>
            </div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <Users size={32} className="text-[#FF9F4A]" />
              {team.name}
            </h1>
          </div>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 rtl:divide-x-reverse">
          <div className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-[#3d6a8a]"><Building2 size={24} /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">القسم</p>
              <p className="text-lg font-black text-slate-900">{team.desk_name || 'غير محدد'}</p>
            </div>
          </div>
          <div className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-[#FF9F4A]"><User size={24} /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">مدير الفريق</p>
              <p className="text-lg font-black text-slate-900">{team.manager_name || 'غير محدد'}</p>
            </div>
          </div>
          <div className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600"><Users size={24} /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">عدد الأعضاء</p>
              <p className="text-lg font-black text-slate-900">{members.length} عضو</p>
            </div>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xl">
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Users size={22} className="text-purple-600" />
            أعضاء الفريق
          </h2>
          <Button onClick={() => setIsMemberModalOpen(true)} className="gap-2 bg-[#3d6a8a] hover:bg-[#2d5570] text-white">
            <UserPlus size={18} /> إضافة عضو
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-gradient-to-r from-[#3d6a8a] to-[#2d5570] text-white text-sm font-bold border-b-4 border-[#FF9F4A]">
                <th className="px-6 py-4 border border-[#FF9F4A]">الاسم</th>
                <th className="px-6 py-4 border border-[#FF9F4A]">البريد الإلكتروني</th>
                <th className="px-6 py-4 border border-[#FF9F4A]">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#FF9F4A] border-b-4 border-[#FF9F4A]">
              <AnimatePresence mode="popLayout">
                {members.slice(memberPage * MEMBERS_PER_PAGE, (memberPage + 1) * MEMBERS_PER_PAGE).map((member, index) => (
                  <motion.tr layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key={member.id}
                    className={cn("hover:bg-blue-50 transition-all group border-l-4 border-l-[#FF9F4A]", index % 2 === 0 ? "bg-white" : "bg-slate-50")}
                  >
                    <td className="px-6 py-5 border border-[#FF9F4A]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 shrink-0"><User size={20} /></div>
                        <span className="text-base font-bold text-slate-900">{member.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 border border-[#FF9F4A]">
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-slate-400" />
                        <span className="text-sm text-slate-600 font-mono" dir="ltr">{member.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 border border-[#FF9F4A]">
                      <button onClick={() => handleRemoveMember(member.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>

          {members.length === 0 && (
            <div className="p-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4"><Users className="text-slate-400" size={32} /></div>
              <p className="text-slate-500 font-bold mb-4">لا يوجد أعضاء في هذا الفريق</p>
              <Button onClick={() => setIsMemberModalOpen(true)} className="gap-2 bg-[#3d6a8a] hover:bg-[#2d5570] text-white"><UserPlus size={16} /> إضافة عضو</Button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {members.length > MEMBERS_PER_PAGE && (
          <div className="px-6 py-4 bg-gradient-to-r from-[#3d6a8a] to-[#2d5570] border-t-4 border-[#FF9F4A] flex items-center justify-between">
            <span className="text-sm text-white font-medium">
              عرض <span className="font-bold text-[#FF9F4A]">{Math.min(MEMBERS_PER_PAGE, members.length - memberPage * MEMBERS_PER_PAGE)}</span> من أصل <span className="font-bold text-[#FF9F4A]">{members.length}</span> عضو
            </span>
            <div className="flex items-center gap-3">
              <button disabled={memberPage === 0} onClick={() => setMemberPage(p => p - 1)} className="px-4 py-2 text-white bg-white/20 hover:bg-white/30 rounded-lg border border-white/30 transition-all disabled:opacity-30 disabled:pointer-events-none font-medium flex items-center gap-2">
                <ChevronRight size={18} /> السابق
              </button>
              <span className="text-white text-sm font-bold">{memberPage + 1} / {Math.ceil(members.length / MEMBERS_PER_PAGE)}</span>
              <button disabled={memberPage >= Math.ceil(members.length / MEMBERS_PER_PAGE) - 1} onClick={() => setMemberPage(p => p + 1)} className="px-4 py-2 text-white bg-white/20 hover:bg-white/30 rounded-lg border border-white/30 transition-all disabled:opacity-30 disabled:pointer-events-none font-medium flex items-center gap-2">
                التالي <ChevronLeft size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      <Modal isOpen={isMemberModalOpen} onClose={() => setIsMemberModalOpen(false)} title="إضافة عضو للفريق">
        <form onSubmit={handleAddMember} className="space-y-4">
          <Select label="الموظف" required
            options={[{ value: '', label: 'اختر الموظف...' }, ...allUsers.map(u => ({ value: u.id.toString(), label: u.name }))]}
            value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="ghost" type="button" onClick={() => setIsMemberModalOpen(false)}>إلغاء</Button>
            <Button type="submit" isLoading={addLoading} disabled={!selectedUserId} className="bg-[#3d6a8a] hover:bg-[#2d5570] text-white">إضافة للفريق</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
