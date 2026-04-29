import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, User, Users, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../services/api';
import { DeskDetails, User as UserType } from '../types';
import { Button, Input, Select } from './ui/Inputs';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function DeskDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [desk, setDesk] = useState<DeskDetails | null>(null);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [users, setUsers] = useState<UserType[]>([]);
  const [teamPage, setTeamPage] = useState(0);
  const TEAMS_PER_PAGE = 8;

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const [res, usersRes] = await Promise.all([
        api.get<{ success: boolean; data: DeskDetails }>(`/api/portal/desks/${id}/with-teams`),
        api.get<{ success: boolean; data: UserType[] }>('/api/portal/users'),
      ]);
      if (res.success) setDesk(res.data);
      if (usersRes.success) setUsers(usersRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDetails(); }, [id]);

  const handleDeleteTeam = async (teamId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('هل أنت متأكد من حذف هذا الفريق؟')) return;
    try { await api.delete<{ success: boolean }>(`/api/portal/teams/${teamId}`); fetchDetails(); } catch (err) { console.error(err); }
  };

  if (loading) return (
    <div className="p-16 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
        <div className="w-8 h-8 border-4 border-[#3d6a8a] border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-slate-600 font-medium">جاري تحميل تفاصيل القسم...</p>
    </div>
  );
  if (!desk) return <div className="p-16 text-center"><h3 className="text-xl font-bold text-red-600">لم يتم العثور على القسم</h3></div>;

  return (
    <div className="space-y-8 pb-12">
      {/* Back Link */}
      <Link to="/departments" className="flex items-center gap-2 text-slate-400 hover:text-[#3d6a8a] transition-colors w-fit group">
        <ArrowRight size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-bold">العودة للأقسام</span>
      </Link>

      {/* Desk Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#3d6a8a] to-[#2d5570] p-8 border-b-4 border-[#FF9F4A]">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge variant="blue" className="bg-white/20 text-white border-white/30">قسم رئيسي</Badge>
              <span className="text-xs font-mono font-bold text-white/60">#{desk.id}</span>
            </div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <Building2 size={32} className="text-[#FF9F4A]" />
              {desk.name}
            </h1>
            {desk.description && <p className="text-white/70 font-medium max-w-2xl">{desk.description}</p>}
          </div>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 rtl:divide-x-reverse">
          <div className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-[#3d6a8a]"><User size={24} /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">مدير القسم</p>
              <p className="text-lg font-black text-slate-900">{desk.manager_name || 'غير محدد'}</p>
            </div>
          </div>
          <div className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600"><Users size={24} /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">عدد الفرق</p>
              <p className="text-lg font-black text-slate-900">{desk.teams?.length || 0} فريق</p>
            </div>
          </div>
        </div>
      </div>

      {/* Teams Table */}
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xl">
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Users size={22} className="text-purple-600" />
            الفرق التابعة لهذا القسم
          </h2>
          <Button onClick={() => setIsTeamModalOpen(true)} className="gap-2 bg-[#3d6a8a] hover:bg-[#2d5570] text-white">
            <Plus size={18} /> فريق جديد
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-gradient-to-r from-[#3d6a8a] to-[#2d5570] text-white text-sm font-bold border-b-4 border-[#FF9F4A]">
                <th className="px-6 py-4 border border-[#FF9F4A]">اسم الفريق</th>
                <th className="px-6 py-4 border border-[#FF9F4A]">المدير</th>
                <th className="px-6 py-4 border border-[#FF9F4A]">عدد الأعضاء</th>
                <th className="px-6 py-4 border border-[#FF9F4A]">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#FF9F4A] border-b-4 border-[#FF9F4A]">
              <AnimatePresence mode="popLayout">
                {(desk.teams || []).slice(teamPage * TEAMS_PER_PAGE, (teamPage + 1) * TEAMS_PER_PAGE).map((team, index) => (
                  <motion.tr layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key={team.id}
                    className={cn("hover:bg-blue-50 transition-all group cursor-pointer border-l-4 border-l-[#FF9F4A]", index % 2 === 0 ? "bg-white" : "bg-slate-50")}
                    onClick={() => navigate(`/teams/${team.id}`)}
                  >
                    <td className="px-6 py-5 border border-[#FF9F4A]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 shrink-0"><Users size={20} /></div>
                        <span className="text-base font-bold text-slate-900 group-hover:text-[#3d6a8a] transition-colors">{team.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 border border-[#FF9F4A]">
                      <span className="text-sm font-semibold text-slate-700 px-3 py-1.5 bg-slate-100 rounded-lg inline-block">{team.manager_name || 'غير محدد'}</span>
                    </td>
                    <td className="px-6 py-5 border border-[#FF9F4A]">
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-purple-500" />
                        <span className="text-sm font-bold text-slate-700">{team.member_count || 0} عضو</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 border border-[#FF9F4A]">
                      <button onClick={(e) => handleDeleteTeam(team.id, e)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>

          {(!desk.teams || desk.teams.length === 0) && (
            <div className="p-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4"><Users className="text-slate-400" size={32} /></div>
              <p className="text-slate-500 font-bold mb-4">لا توجد فرق تابعة لهذا القسم</p>
              <Button onClick={() => setIsTeamModalOpen(true)} className="gap-2 bg-[#3d6a8a] hover:bg-[#2d5570] text-white"><Plus size={16} /> إنشاء فريق</Button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {desk.teams && desk.teams.length > TEAMS_PER_PAGE && (
          <div className="px-6 py-4 bg-gradient-to-r from-[#3d6a8a] to-[#2d5570] border-t-4 border-[#FF9F4A] flex items-center justify-between">
            <span className="text-sm text-white font-medium">
              عرض <span className="font-bold text-[#FF9F4A]">{Math.min(TEAMS_PER_PAGE, desk.teams.length - teamPage * TEAMS_PER_PAGE)}</span> من أصل <span className="font-bold text-[#FF9F4A]">{desk.teams.length}</span> فريق
            </span>
            <div className="flex items-center gap-3">
              <button disabled={teamPage === 0} onClick={() => setTeamPage(p => p - 1)} className="px-4 py-2 text-white bg-white/20 hover:bg-white/30 rounded-lg border border-white/30 transition-all disabled:opacity-30 disabled:pointer-events-none font-medium flex items-center gap-2">
                <ChevronRight size={18} /> السابق
              </button>
              <span className="text-white text-sm font-bold">{teamPage + 1} / {Math.ceil(desk.teams.length / TEAMS_PER_PAGE)}</span>
              <button disabled={teamPage >= Math.ceil(desk.teams.length / TEAMS_PER_PAGE) - 1} onClick={() => setTeamPage(p => p + 1)} className="px-4 py-2 text-white bg-white/20 hover:bg-white/30 rounded-lg border border-white/30 transition-all disabled:opacity-30 disabled:pointer-events-none font-medium flex items-center gap-2">
                التالي <ChevronLeft size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Team Modal */}
      <Modal isOpen={isTeamModalOpen} onClose={() => setIsTeamModalOpen(false)} title="إضافة فريق للقسم">
        <TeamForm deskId={desk.id} users={users} onSuccess={() => { setIsTeamModalOpen(false); fetchDetails(); }} onCancel={() => setIsTeamModalOpen(false)} />
      </Modal>
    </div>
  );
}

function TeamForm({ deskId, users, onSuccess, onCancel }: { deskId: number; users: UserType[]; onSuccess: () => void; onCancel: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', manager_id: '' });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try { const res = await api.post<{ success: boolean }>('/api/portal/teams', { name: formData.name, desk_id: deskId, manager_id: Number(formData.manager_id) }); if (res.success) onSuccess(); }
    catch (err) { console.error(err); } finally { setLoading(false); }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="اسم الفريق" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
      <Select label="مدير الفريق" required options={[{ value: '', label: 'اختر مدير...' }, ...users.map(u => ({ value: u.id.toString(), label: u.name }))]} value={formData.manager_id} onChange={e => setFormData({ ...formData, manager_id: e.target.value })} />
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <Button variant="ghost" type="button" onClick={onCancel}>إلغاء</Button>
        <Button type="submit" isLoading={loading} disabled={!formData.name || !formData.manager_id} className="bg-[#3d6a8a] hover:bg-[#2d5570] text-white">إنشاء الفريق</Button>
      </div>
    </form>
  );
}
