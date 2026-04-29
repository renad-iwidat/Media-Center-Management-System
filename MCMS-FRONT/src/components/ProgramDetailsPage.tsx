import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Tv, Clock, PlayCircle, Users, UserPlus, Trash2, Plus, ShieldCheck, User, Calendar } from 'lucide-react';
import { api } from '../services/api';
import { User as UserType, Lookup, Episode } from '../types';
import { Button, Input, Select } from './ui/Inputs';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

interface ProgramRoleItem { id?: number; user_id: number; user_name?: string; role_id: number; role_name?: string; }

export default function ProgramDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<any>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [team, setTeam] = useState<ProgramRoleItem[]>([]);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isEpisodeModalOpen, setIsEpisodeModalOpen] = useState(false);
  const [users, setUsers] = useState<UserType[]>([]);
  const [roles, setRoles] = useState<Lookup[]>([]);
  const [roleForm, setRoleForm] = useState({ user_id: '', role_id: '' });
  const [roleLoading, setRoleLoading] = useState(false);
  const [episodeForm, setEpisodeForm] = useState({ title: '', episode_number: '', air_date: '' });
  const [episodeLoading, setEpisodeLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [detailsRes, episodesRes, rolesRes, allUsersRes, allRolesRes] = await Promise.all([
        api.get<{ success: boolean; data: any }>(`/api/portal/programs/${id}`),
        api.get<{ success: boolean; data: any[] }>(`/api/portal/episodes?program_id=${id}`),
        api.get<{ success: boolean; data: any[] }>(`/api/portal/program-roles?program_id=${id}`),
        api.get<{ success: boolean; data: UserType[] }>('/api/portal/users'),
        api.get<{ success: boolean; data: Lookup[] }>('/api/portal/roles'),
      ]);
      if (detailsRes.success) setProgram(detailsRes.data);
      if (episodesRes.success) setEpisodes(episodesRes.data || []);
      if (rolesRes.success) setTeam(rolesRes.data || []);
      if (allUsersRes.success) setUsers(allUsersRes.data);
      if (allRolesRes.success) setRoles(allRolesRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setRoleLoading(true);
    try {
      const res = await api.post<{ success: boolean }>('/api/portal/program-roles', {
        program_id: Number(id), user_id: Number(roleForm.user_id), role_id: Number(roleForm.role_id),
      });
      if (res.success) { setIsRoleModalOpen(false); setRoleForm({ user_id: '', role_id: '' }); fetchData(); }
    } catch (err) { console.error(err); }
    finally { setRoleLoading(false); }
  };

  const handleAddEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    setEpisodeLoading(true);
    try {
      const res = await api.post<{ success: boolean }>('/api/portal/episodes', {
        program_id: Number(id), title: episodeForm.title,
        episode_number: Number(episodeForm.episode_number), air_date: episodeForm.air_date,
      });
      if (res.success) { setIsEpisodeModalOpen(false); setEpisodeForm({ title: '', episode_number: '', air_date: '' }); fetchData(); }
    } catch (err) { console.error(err); }
    finally { setEpisodeLoading(false); }
  };

  const handleDeleteRole = async (roleItem: ProgramRoleItem) => {
    if (!confirm('هل تريد حذف هذا العضو من فريق البرنامج؟')) return;
    try { if (roleItem.id) { await api.delete<{ success: boolean }>(`/api/portal/program-roles/${roleItem.id}`); fetchData(); } } catch (err) { console.error(err); }
  };

  const handleDeleteEpisode = async (episodeId: number) => {
    if (!confirm('هل تريد حذف هذه الحلقة؟')) return;
    try { await api.delete<{ success: boolean }>(`/api/portal/episodes/${episodeId}`); fetchData(); } catch (err) { console.error(err); }
  };

  const formatTime12 = (time?: string): string => {
    if (!time) return 'غير محدد';
    const [h, m] = time.split(':');
    let hour = parseInt(h);
    const period = hour >= 12 ? 'مساءً' : 'صباحاً';
    if (hour === 0) hour = 12;
    else if (hour > 12) hour -= 12;
    return `${hour}:${m} ${period}`;
  };

  const getRoleBadgeVariant = (roleName: string): 'blue' | 'purple' | 'green' | 'yellow' | 'red' | 'gray' => {
    const r = (roleName || '').toLowerCase();
    if (r.includes('مقدم') || r.includes('presenter')) return 'purple';
    if (r.includes('منتج') || r.includes('producer')) return 'blue';
    if (r.includes('مخرج') || r.includes('director')) return 'green';
    if (r.includes('معد') || r.includes('writer')) return 'yellow';
    return 'gray';
  };

  if (loading) return (
    <div className="p-16 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
        <div className="w-8 h-8 border-4 border-[#3d6a8a] border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-slate-600 font-medium">جاري تحميل تفاصيل البرنامج...</p>
    </div>
  );

  if (!program) return <div className="p-16 text-center"><h3 className="text-xl font-bold text-red-600">لم يتم العثور على البرنامج</h3></div>;

  return (
    <div className="space-y-8 pb-12">
      {/* Back Link */}
      <Link to="/programs" className="flex items-center gap-2 text-slate-400 hover:text-[#3d6a8a] transition-colors w-fit group">
        <ArrowRight size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-bold">العودة للبرامج</span>
      </Link>

      {/* Program Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#3d6a8a] to-[#2d5570] p-8 border-b-4 border-[#FF9F4A]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge variant="blue" className="bg-white/20 text-white border-white/30">{program.media_unit_name || 'غير محدد'}</Badge>
                <span className="text-xs font-mono font-bold text-white/60">#{program.id}</span>
              </div>
              <h1 className="text-3xl font-black text-white flex items-center gap-3">
                <Tv size={32} className="text-[#FF9F4A]" />
                {program.name || program.title}
              </h1>
              {program.description && <p className="text-white/70 font-medium max-w-2xl">{program.description}</p>}
            </div>
          </div>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 rtl:divide-x-reverse">
          <div className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-[#FF9F4A]"><Clock size={24} /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">وقت البث</p>
              <p className="text-lg font-black text-slate-900">{formatTime12(program.air_time)}</p>
            </div>
          </div>
          <div className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600"><PlayCircle size={24} /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">عدد الحلقات</p>
              <p className="text-lg font-black text-slate-900">{episodes.length} حلقة</p>
            </div>
          </div>
          <div className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600"><Users size={24} /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">فريق العمل</p>
              <p className="text-lg font-black text-slate-900">{team.length} عضو</p>
            </div>
          </div>
        </div>
      </div>

      {/* ========== EPISODES TABLE ========== */}
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xl">
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <PlayCircle size={22} className="text-[#3d6a8a]" />
            الحلقات المسجلة
          </h2>
          <Button onClick={() => setIsEpisodeModalOpen(true)} className="gap-2 bg-[#3d6a8a] hover:bg-[#2d5570] text-white">
            <Plus size={18} /> حلقة جديدة
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-gradient-to-r from-[#3d6a8a] to-[#2d5570] text-white text-sm font-bold border-b-4 border-[#FF9F4A]">
                <th className="px-6 py-4 border border-[#FF9F4A]">عنوان الحلقة</th>
                <th className="px-6 py-4 border border-[#FF9F4A]">رقم الحلقة</th>
                <th className="px-6 py-4 border border-[#FF9F4A]">تاريخ البث</th>
                <th className="px-6 py-4 border border-[#FF9F4A]">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#FF9F4A] border-b-4 border-[#FF9F4A]">
              <AnimatePresence mode="popLayout">
                {episodes.map((ep, index) => (
                  <motion.tr
                    layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    key={ep.id}
                    className={cn(
                      "hover:bg-blue-50 transition-all group cursor-pointer border-l-4 border-l-[#FF9F4A]",
                      index % 2 === 0 ? "bg-white" : "bg-slate-50"
                    )}
                    onClick={() => navigate(`/episodes/${ep.id}`)}
                  >
                    <td className="px-6 py-5 border border-[#FF9F4A]">
                      <span className="text-base font-bold text-slate-900 group-hover:text-[#3d6a8a] transition-colors">
                        {ep.title}
                      </span>
                    </td>
                    <td className="px-6 py-5 border border-[#FF9F4A]">
                      <span className="text-sm font-bold text-slate-700 px-3 py-1.5 bg-slate-100 rounded-lg inline-block">
                        #{ep.episode_number}
                      </span>
                    </td>
                    <td className="px-6 py-5 border border-[#FF9F4A]">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-[#FF9F4A]" />
                        <span className="font-mono text-sm text-slate-700 font-medium bg-orange-50 px-2.5 py-1 rounded-lg">
                          {ep.air_date ? format(new Date(ep.air_date), 'yyyy/MM/dd') : 'غير محدد'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 border border-[#FF9F4A]">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteEpisode(ep.id); }}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>

          {episodes.length === 0 && (
            <div className="p-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                <PlayCircle className="text-slate-400" size={32} />
              </div>
              <p className="text-slate-500 font-bold">لا توجد حلقات مسجلة لهذا البرنامج</p>
              <Button onClick={() => setIsEpisodeModalOpen(true)} className="gap-2 mt-4">
                <Plus size={16} /> إضافة حلقة
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ========== TEAM TABLE ========== */}
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xl">
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Users size={22} className="text-purple-600" />
            فريق العمل
          </h2>
          <Button onClick={() => setIsRoleModalOpen(true)} className="gap-2 bg-[#3d6a8a] hover:bg-[#2d5570] text-white">
            <UserPlus size={18} /> إضافة عضو
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-gradient-to-r from-[#3d6a8a] to-[#2d5570] text-white text-sm font-bold border-b-4 border-[#FF9F4A]">
                <th className="px-6 py-4 border border-[#FF9F4A]">الموظف</th>
                <th className="px-6 py-4 border border-[#FF9F4A]">الدور</th>
                <th className="px-6 py-4 border border-[#FF9F4A]">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#FF9F4A] border-b-4 border-[#FF9F4A]">
              <AnimatePresence mode="popLayout">
                {team.map((member, index) => (
                  <motion.tr
                    layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    key={`${member.user_id}-${member.role_id}-${index}`}
                    className={cn(
                      "hover:bg-blue-50 transition-all group border-l-4 border-l-[#FF9F4A]",
                      index % 2 === 0 ? "bg-white" : "bg-slate-50"
                    )}
                  >
                    <td className="px-6 py-5 border border-[#FF9F4A]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 shrink-0">
                          <User size={20} />
                        </div>
                        <span className="text-base font-bold text-slate-900">
                          {member.user_name || `مستخدم #${member.user_id}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 border border-[#FF9F4A]">
                      <Badge variant={getRoleBadgeVariant(member.role_name || '')}>
                        {member.role_name || `دور #${member.role_id}`}
                      </Badge>
                    </td>
                    <td className="px-6 py-5 border border-[#FF9F4A]">
                      <button
                        onClick={() => handleDeleteRole(member)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>

          {team.length === 0 && (
            <div className="p-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                <Users className="text-slate-400" size={32} />
              </div>
              <p className="text-slate-500 font-bold">لم يتم تعيين فريق عمل لهذا البرنامج</p>
              <Button onClick={() => setIsRoleModalOpen(true)} className="gap-2 mt-4">
                <UserPlus size={16} /> إضافة عضو
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ========== MODALS ========== */}
      {/* Episode Modal */}
      <Modal isOpen={isEpisodeModalOpen} onClose={() => setIsEpisodeModalOpen(false)} title="إضافة حلقة جديدة">
        <form onSubmit={handleAddEpisode} className="space-y-4">
          <Input label="عنوان الحلقة" required value={episodeForm.title} onChange={e => setEpisodeForm({ ...episodeForm, title: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="رقم الحلقة" type="number" required value={episodeForm.episode_number} onChange={e => setEpisodeForm({ ...episodeForm, episode_number: e.target.value })} />
            <Input label="تاريخ البث" type="date" required value={episodeForm.air_date} onChange={e => setEpisodeForm({ ...episodeForm, air_date: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="ghost" type="button" onClick={() => setIsEpisodeModalOpen(false)}>إلغاء</Button>
            <Button type="submit" isLoading={episodeLoading} disabled={!episodeForm.title || !episodeForm.episode_number} className="bg-[#3d6a8a] hover:bg-[#2d5570] text-white">
              إنشاء الحلقة
            </Button>
          </div>
        </form>
      </Modal>

      {/* Role Modal */}
      <Modal isOpen={isRoleModalOpen} onClose={() => setIsRoleModalOpen(false)} title="إضافة عضو لفريق البرنامج">
        <form onSubmit={handleAddRole} className="space-y-4">
          <Select
            label="الموظف" required
            options={[{ value: '', label: 'اختر الموظف...' }, ...users.map(u => ({ value: u.id.toString(), label: u.name }))]}
            value={roleForm.user_id}
            onChange={e => setRoleForm({ ...roleForm, user_id: e.target.value })}
          />
          <Select
            label="الدور" required
            options={[{ value: '', label: 'اختر الدور...' }, ...roles.map(r => ({ value: r.id.toString(), label: r.name }))]}
            value={roleForm.role_id}
            onChange={e => setRoleForm({ ...roleForm, role_id: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="ghost" type="button" onClick={() => setIsRoleModalOpen(false)}>إلغاء</Button>
            <Button type="submit" isLoading={roleLoading} disabled={!roleForm.user_id || !roleForm.role_id} className="bg-[#3d6a8a] hover:bg-[#2d5570] text-white">
              إضافة للفريق
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
