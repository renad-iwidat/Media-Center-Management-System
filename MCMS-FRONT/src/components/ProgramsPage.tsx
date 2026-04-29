import React, { useState, useEffect } from 'react';
import {
  Tv, PlayCircle, Plus, Search, ChevronLeft, ChevronRight,
  Clock, Users, UserCheck, Trash2, Edit, Phone, User,
  Calendar, Film, Mic, Star
} from 'lucide-react';
import { api } from '../services/api';
import { Program, Episode, Guest, MediaUnit, Role, User as UserType } from '../types';
import { Button, Input, Select, Textarea } from './ui/Inputs';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type ActiveTab = 'programs' | 'episodes' | 'guests' | 'roles';

interface ProgramRoleItem {
  id: number;
  program_id: number;
  program_title?: string;
  program_name?: string;
  user_id: number;
  user_name?: string;
  role_id: number;
  role_name?: string;
}

export default function ProgramsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { openEpisodeModal?: boolean; programId?: number } | null;

  const [activeTab, setActiveTab] = useState<ActiveTab>(state?.openEpisodeModal ? 'episodes' : 'programs');
  const [loading, setLoading] = useState(true);

  // ========== Programs ==========
  const [programs, setPrograms] = useState<Program[]>([]);
  const [programSearch, setProgramSearch] = useState('');
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [programPage, setProgramPage] = useState(0);
  const PROGRAMS_PER_PAGE = 8;

  // ========== Episodes ==========
  const [allEpisodes, setAllEpisodes] = useState<Episode[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isEpisodeModalOpen, setIsEpisodeModalOpen] = useState(state?.openEpisodeModal || false);
  const [episodePagination, setEpisodePagination] = useState({ limit: 10, offset: 0, total: 0 });
  const [episodeFilters, setEpisodeFilters] = useState({ program_id: state?.programId?.toString() || '', search: '' });

  // ========== Guests ==========
  const [guests, setGuests] = useState<Guest[]>([]);
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [guestSearch, setGuestSearch] = useState('');
  const [guestPage, setGuestPage] = useState(0);
  const GUESTS_PER_PAGE = 8;

  // ========== Program Roles ==========
  const [programRoles, setProgramRoles] = useState<ProgramRoleItem[]>([]);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState({ program_id: '' });
  const [rolePage, setRolePage] = useState(0);
  const ROLES_PER_PAGE = 8;

  // ========== Lookups ==========
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [mediaUnits, setMediaUnits] = useState<MediaUnit[]>([]);

  // ========== Fetch Functions ==========
  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: Program[] }>('/api/portal/programs');
      if (res.success) setPrograms(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchEpisodes = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: any[]; total: number; count: number }>(`/api/portal/episodes/enriched?limit=200&offset=0`);
      if (res.success) {
        const mapped: Episode[] = (res.data || []).map((e: any) => ({
          id: e.id,
          title: e.title,
          program_id: e.program_id,
          program_title: e.program_name || e.program_title,
          episode_number: e.episode_number,
          air_date: e.air_date,
          status_name: e.status || e.status_name,
          guest_count: e.guests_count ?? e.guest_count ?? 0,
          content_count: e.content_count ?? 0,
        }));
        setAllEpisodes(mapped);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  // Client-side filtering for episodes
  useEffect(() => {
    let filtered = [...allEpisodes];
    if (episodeFilters.program_id) {
      filtered = filtered.filter(e => String(e.program_id) === episodeFilters.program_id);
    }
    if (episodeFilters.search.trim()) {
      const s = episodeFilters.search.toLowerCase();
      filtered = filtered.filter(e => e.title.toLowerCase().includes(s) || (e.program_title || '').toLowerCase().includes(s));
    }
    setEpisodePagination(p => ({ ...p, total: filtered.length, offset: 0 }));
    setEpisodes(filtered);
  }, [allEpisodes, episodeFilters.program_id, episodeFilters.search]);

  const fetchGuests = async () => {
    setLoading(true);
    try {
      if (guestSearch.trim()) {
        const res = await api.get<{ success: boolean; data: Guest[] }>(`/api/portal/guests/search?name=${encodeURIComponent(guestSearch)}`);
        if (res.success) setGuests(res.data);
      } else {
        const res = await api.get<{ success: boolean; data: Guest[] }>('/api/portal/guests');
        if (res.success) setGuests(res.data);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchProgramRoles = async () => {
    setLoading(true);
    try {
      const query = roleFilter.program_id ? `?program_id=${roleFilter.program_id}` : '';
      const res = await api.get<{ success: boolean; data: ProgramRoleItem[] }>(`/api/portal/program-roles${query}`);
      if (res.success) setProgramRoles(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchLookups = async () => {
    try {
      const [usersRes, rolesRes, unitsRes] = await Promise.all([
        api.get<{ success: boolean; data: UserType[] }>('/api/portal/users'),
        api.get<{ success: boolean; data: Role[] }>('/api/portal/roles'),
        api.get<{ success: boolean; data: MediaUnit[] }>('/api/portal/media-units'),
      ]);
      if (usersRes.success) setAllUsers(usersRes.data);
      if (rolesRes.success) setAllRoles(rolesRes.data);
      if (unitsRes.success) setMediaUnits(unitsRes.data);
    } catch (err) { console.error(err); }
  };

  // ========== Effects ==========
  useEffect(() => { fetchLookups(); fetchPrograms(); }, []);

  useEffect(() => {
    if (activeTab === 'programs') fetchPrograms();
    else if (activeTab === 'episodes') fetchEpisodes();
    else if (activeTab === 'guests') fetchGuests();
    else if (activeTab === 'roles') fetchProgramRoles();
  }, [activeTab]);

  useEffect(() => { if (activeTab === 'guests') { fetchGuests(); setGuestPage(0); } }, [guestSearch]);
  useEffect(() => { if (activeTab === 'roles') { fetchProgramRoles(); setRolePage(0); } }, [roleFilter.program_id]);

  // ========== Delete Handlers ==========
  const handleDeleteProgram = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('هل أنت متأكد من حذف هذا البرنامج؟')) return;
    try {
      const res = await api.delete<{ success: boolean }>(`/api/portal/programs/${id}`);
      if (res.success) fetchPrograms();
    } catch (err) { console.error(err); }
  };

  const handleDeleteGuest = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الضيف؟')) return;
    try {
      const res = await api.delete<{ success: boolean }>(`/api/portal/guests/${id}`);
      if (res.success) fetchGuests();
    } catch (err) { console.error(err); }
  };

  const handleDeleteRole = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الدور؟')) return;
    try {
      const res = await api.delete<{ success: boolean }>(`/api/portal/program-roles/${id}`);
      if (res.success) fetchProgramRoles();
    } catch (err) { console.error(err); }
  };

  // ========== Filtered Programs ==========
  const filteredPrograms = programs.filter(p =>
    !programSearch || (p.name || p.title || '').toLowerCase().includes(programSearch.toLowerCase())
  );
  const totalProgramPages = Math.ceil(filteredPrograms.length / PROGRAMS_PER_PAGE);
  const paginatedPrograms = filteredPrograms.slice(programPage * PROGRAMS_PER_PAGE, (programPage + 1) * PROGRAMS_PER_PAGE);

  // ========== Tab Button ==========
  const getAddButton = () => {
    const config: Record<ActiveTab, { label: string; onClick: () => void }> = {
      programs: { label: 'برنامج جديد', onClick: () => { setEditingProgram(null); setIsProgramModalOpen(true); } },
      episodes: { label: 'حلقة جديدة', onClick: () => setIsEpisodeModalOpen(true) },
      guests: { label: 'ضيف جديد', onClick: () => { setEditingGuest(null); setIsGuestModalOpen(true); } },
      roles: { label: 'تعيين دور', onClick: () => setIsRoleModalOpen(true) },
    };
    return config[activeTab];
  };

  const addBtn = getAddButton();

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">البرامج والإنتاج البرامجي</h1>
          <p className="text-slate-500 font-medium">إدارة خريطة البرامج، الحلقات، الضيوف، وأدوار الفريق</p>
        </div>
        <Button
          onClick={addBtn.onClick}
          className="gap-2 bg-[#3d6a8a] hover:bg-[#2d5570] text-white shadow-lg hover:shadow-xl"
        >
          <Plus size={20} />
          {addBtn.label}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl w-fit border border-slate-200">
        <TabBtn active={activeTab === 'programs'} onClick={() => setActiveTab('programs')}>
          <Tv size={16} /> البرامج
        </TabBtn>
        <TabBtn active={activeTab === 'episodes'} onClick={() => setActiveTab('episodes')}>
          <PlayCircle size={16} /> الحلقات
        </TabBtn>
        <TabBtn active={activeTab === 'guests'} onClick={() => setActiveTab('guests')}>
          <Users size={16} /> الضيوف
        </TabBtn>
        <TabBtn active={activeTab === 'roles'} onClick={() => setActiveTab('roles')}>
          <UserCheck size={16} /> أدوار الفريق
        </TabBtn>
      </div>

      {/* ===================== PROGRAMS TAB ===================== */}
      {activeTab === 'programs' && (
        <>
          {/* Filters */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/50">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[250px] relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <Input
                  placeholder="ابحث عن برنامج..."
                  className="pr-12 h-12 text-base bg-slate-50 border-slate-200 focus:bg-white shadow-sm"
                  value={programSearch}
                  onChange={(e) => { setProgramSearch(e.target.value); setProgramPage(0); }}
                />
              </div>
            </div>
          </div>

          {/* Programs Table */}
          <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-gradient-to-r from-[#3d6a8a] to-[#2d5570] text-white text-sm font-bold border-b-4 border-[#FF9F4A]">
                    <th className="px-6 py-4 border border-[#FF9F4A]">البرنامج</th>
                    <th className="px-6 py-4 border border-[#FF9F4A]">الوحدة الإعلامية</th>
                    <th className="px-6 py-4 border border-[#FF9F4A]">وقت البث</th>
                    <th className="px-6 py-4 border border-[#FF9F4A]">عدد الحلقات</th>
                    <th className="px-6 py-4 border border-[#FF9F4A]">الوصف</th>
                    <th className="px-6 py-4 border border-[#FF9F4A]">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#FF9F4A] border-b-4 border-[#FF9F4A]">
                  <AnimatePresence mode="popLayout">
                    {paginatedPrograms.map((p, index) => (
                      <motion.tr
                        layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        key={p.id}
                        className={cn(
                          "hover:bg-blue-50 transition-all group cursor-pointer border-l-4 border-l-[#FF9F4A]",
                          index % 2 === 0 ? "bg-white" : "bg-slate-50"
                        )}
                        onClick={() => navigate(`/programs/${p.id}`)}
                      >
                        <td className="px-6 py-5 border border-[#FF9F4A]">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-[#3d6a8a] shrink-0">
                              <Tv size={20} />
                            </div>
                            <span className="text-base font-bold text-slate-900 group-hover:text-[#3d6a8a] transition-colors">
                              {p.name || p.title}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 border border-[#FF9F4A]">
                          <Badge variant="blue">{p.media_unit_name || 'غير محدد'}</Badge>
                        </td>
                        <td className="px-6 py-5 border border-[#FF9F4A]">
                          <div className="flex items-center gap-2">
                            <Clock size={16} className="text-[#FF9F4A]" />
                            <span className="font-mono text-sm text-slate-700 font-medium bg-orange-50 px-2.5 py-1 rounded-lg">
                              {formatTime12(p.air_time)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 border border-[#FF9F4A]">
                          <span className="text-sm font-bold text-slate-700 px-3 py-1.5 bg-slate-100 rounded-lg inline-block">
                            {p.episode_count || 0} حلقة
                          </span>
                        </td>
                        <td className="px-6 py-5 border border-[#FF9F4A]">
                          <span className="text-sm text-slate-500 line-clamp-1 max-w-[200px] inline-block">
                            {p.description || 'لا يوجد وصف'}
                          </span>
                        </td>
                        <td className="px-6 py-5 border border-[#FF9F4A]">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingProgram(p); setIsProgramModalOpen(true); }}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={(e) => handleDeleteProgram(p.id, e)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>

              {loading && paginatedPrograms.length === 0 && (
                <div className="p-16 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                    <div className="w-8 h-8 border-4 border-[#3d6a8a] border-t-transparent rounded-full animate-spin" />
                  </div>
                  <p className="text-slate-600 font-medium">جاري تحميل البرامج...</p>
                </div>
              )}

              {!loading && filteredPrograms.length === 0 && (
                <div className="p-24 text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 rounded-full mb-6 shadow-inner">
                    <Tv className="text-slate-400" size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-700 mb-2">لا يوجد برامج</h3>
                  <p className="text-slate-500 mb-6">لم يتم العثور على برامج تطابق معايير البحث</p>
                  <Button onClick={() => { setEditingProgram(null); setIsProgramModalOpen(true); }} className="gap-2">
                    <Plus size={18} /> إنشاء برنامج جديد
                  </Button>
                </div>
              )}
            </div>

            {/* Pagination */}
            {filteredPrograms.length > PROGRAMS_PER_PAGE && (
              <div className="px-6 py-4 bg-gradient-to-r from-[#3d6a8a] to-[#2d5570] border-t-4 border-[#FF9F4A] flex items-center justify-between">
                <span className="text-sm text-white font-medium">
                  عرض <span className="font-bold text-[#FF9F4A]">{paginatedPrograms.length}</span> من أصل <span className="font-bold text-[#FF9F4A]">{filteredPrograms.length}</span> برنامج
                </span>
                <div className="flex items-center gap-3">
                  <button
                    disabled={programPage === 0}
                    onClick={() => setProgramPage(p => p - 1)}
                    className="px-4 py-2 text-white bg-white/20 hover:bg-white/30 rounded-lg border border-white/30 transition-all disabled:opacity-30 disabled:pointer-events-none font-medium flex items-center gap-2"
                  >
                    <ChevronRight size={18} /> السابق
                  </button>
                  <span className="text-white text-sm font-bold">{programPage + 1} / {totalProgramPages}</span>
                  <button
                    disabled={programPage >= totalProgramPages - 1}
                    onClick={() => setProgramPage(p => p + 1)}
                    className="px-4 py-2 text-white bg-white/20 hover:bg-white/30 rounded-lg border border-white/30 transition-all disabled:opacity-30 disabled:pointer-events-none font-medium flex items-center gap-2"
                  >
                    التالي <ChevronLeft size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ===================== EPISODES TAB ===================== */}
      {activeTab === 'episodes' && (
        <>
          {/* Filters */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/50">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[250px] relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <Input
                  placeholder="ابحث عن حلقة..."
                  className="pr-12 h-12 text-base bg-slate-50 border-slate-200 focus:bg-white shadow-sm"
                  value={episodeFilters.search}
                  onChange={(e) => setEpisodeFilters(f => ({ ...f, search: e.target.value }))}
                />
              </div>
              <div className="w-56">
                <Select
                  options={[{ value: '', label: 'كل البرامج' }, ...programs.map(p => ({ value: p.id.toString(), label: p.name || p.title || '' }))]}
                  value={episodeFilters.program_id}
                  onChange={(e) => { setEpisodeFilters(f => ({ ...f, program_id: e.target.value })); setEpisodePagination(p => ({ ...p, offset: 0 })); }}
                  className="h-12 text-base shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Episodes Table */}
          <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-gradient-to-r from-[#3d6a8a] to-[#2d5570] text-white text-sm font-bold border-b-4 border-[#FF9F4A]">
                    <th className="px-6 py-4 border border-[#FF9F4A]">الحلقة</th>
                    <th className="px-6 py-4 border border-[#FF9F4A]">البرنامج</th>
                    <th className="px-6 py-4 border border-[#FF9F4A]">تاريخ البث</th>
                    <th className="px-6 py-4 border border-[#FF9F4A]">الضيوف</th>
                    <th className="px-6 py-4 border border-[#FF9F4A]">المحتوى</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#FF9F4A] border-b-4 border-[#FF9F4A]">
                  <AnimatePresence mode="popLayout">
                    {episodes.slice(episodePagination.offset, episodePagination.offset + episodePagination.limit).map((ep, index) => (
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
                          <div className="flex flex-col gap-1">
                            <span className="text-base font-bold text-slate-900 group-hover:text-[#3d6a8a] transition-colors">
                              {ep.title}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono font-bold">الحلقة #{ep.episode_number}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 border border-[#FF9F4A]">
                          <span className="text-sm font-semibold text-slate-700 px-3 py-1.5 bg-slate-100 rounded-lg inline-block">
                            {ep.program_title || 'غير محدد'}
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
                          <div className="flex items-center gap-2">
                            <Users size={14} className="text-purple-500" />
                            <span className="text-sm font-bold text-slate-700">{ep.guest_count || 0}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 border border-[#FF9F4A]">
                          <div className="flex items-center gap-2">
                            <Film size={14} className="text-blue-500" />
                            <span className="text-sm font-bold text-slate-700">{ep.content_count || 0}</span>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>

              {loading && episodes.length === 0 && (
                <div className="p-16 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                    <div className="w-8 h-8 border-4 border-[#3d6a8a] border-t-transparent rounded-full animate-spin" />
                  </div>
                  <p className="text-slate-600 font-medium">جاري تحميل الحلقات...</p>
                </div>
              )}

              {!loading && episodes.length === 0 && (
                <div className="p-24 text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 rounded-full mb-6 shadow-inner">
                    <PlayCircle className="text-slate-400" size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-700 mb-2">لا يوجد حلقات</h3>
                  <p className="text-slate-500 mb-6">لم يتم العثور على حلقات</p>
                  <Button onClick={() => setIsEpisodeModalOpen(true)} className="gap-2">
                    <Plus size={18} /> إنشاء حلقة جديدة
                  </Button>
                </div>
              )}
            </div>

            {/* Pagination */}
            {episodes.length > episodePagination.limit && (
              <div className="px-6 py-4 bg-gradient-to-r from-[#3d6a8a] to-[#2d5570] border-t-4 border-[#FF9F4A] flex items-center justify-between">
                <span className="text-sm text-white font-medium">
                  عرض <span className="font-bold text-[#FF9F4A]">{Math.min(episodePagination.limit, episodes.length - episodePagination.offset)}</span> من أصل <span className="font-bold text-[#FF9F4A]">{episodes.length}</span> حلقة
                </span>
                <div className="flex items-center gap-3">
                  <button
                    disabled={episodePagination.offset === 0}
                    onClick={() => setEpisodePagination(p => ({ ...p, offset: p.offset - p.limit }))}
                    className="px-4 py-2 text-white bg-white/20 hover:bg-white/30 rounded-lg border border-white/30 transition-all disabled:opacity-30 disabled:pointer-events-none font-medium flex items-center gap-2"
                  >
                    <ChevronRight size={18} /> السابق
                  </button>
                  <button
                    disabled={episodePagination.offset + episodePagination.limit >= episodes.length}
                    onClick={() => setEpisodePagination(p => ({ ...p, offset: p.offset + p.limit }))}
                    className="px-4 py-2 text-white bg-white/20 hover:bg-white/30 rounded-lg border border-white/30 transition-all disabled:opacity-30 disabled:pointer-events-none font-medium flex items-center gap-2"
                  >
                    التالي <ChevronLeft size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ===================== GUESTS TAB ===================== */}
      {activeTab === 'guests' && (
        <>
          {/* Filters */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/50">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[250px] relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <Input
                  placeholder="ابحث عن ضيف بالاسم..."
                  className="pr-12 h-12 text-base bg-slate-50 border-slate-200 focus:bg-white shadow-sm"
                  value={guestSearch}
                  onChange={(e) => setGuestSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Guests Table */}
          <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-gradient-to-r from-[#3d6a8a] to-[#2d5570] text-white text-sm font-bold border-b-4 border-[#FF9F4A]">
                    <th className="px-6 py-4 border border-[#FF9F4A]">الاسم</th>
                    <th className="px-6 py-4 border border-[#FF9F4A]">اللقب / المنصب</th>
                    <th className="px-6 py-4 border border-[#FF9F4A]">الهاتف</th>
                    <th className="px-6 py-4 border border-[#FF9F4A]">نبذة</th>
                    <th className="px-6 py-4 border border-[#FF9F4A]">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#FF9F4A] border-b-4 border-[#FF9F4A]">
                  <AnimatePresence mode="popLayout">
                    {guests.slice(guestPage * GUESTS_PER_PAGE, (guestPage + 1) * GUESTS_PER_PAGE).map((guest, index) => (
                      <motion.tr
                        layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        key={guest.id}
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
                            <span className="text-base font-bold text-slate-900">{guest.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 border border-[#FF9F4A]">
                          <span className="text-sm font-semibold text-slate-700 px-3 py-1.5 bg-slate-100 rounded-lg inline-block">
                            {guest.title || 'غير محدد'}
                          </span>
                        </td>
                        <td className="px-6 py-5 border border-[#FF9F4A]">
                          {guest.phone ? (
                            <div className="flex items-center gap-2">
                              <Phone size={14} className="text-green-500" />
                              <span className="font-mono text-sm text-slate-700 bg-green-50 px-2.5 py-1 rounded-lg" dir="ltr">
                                {guest.phone}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-5 border border-[#FF9F4A]">
                          <span className="text-sm text-slate-500 line-clamp-1 max-w-[250px] inline-block">
                            {guest.bio || 'لا يوجد نبذة'}
                          </span>
                        </td>
                        <td className="px-6 py-5 border border-[#FF9F4A]">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => { setEditingGuest(guest); setIsGuestModalOpen(true); }}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteGuest(guest.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>

              {loading && guests.length === 0 && (
                <div className="p-16 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                    <div className="w-8 h-8 border-4 border-[#3d6a8a] border-t-transparent rounded-full animate-spin" />
                  </div>
                  <p className="text-slate-600 font-medium">جاري تحميل الضيوف...</p>
                </div>
              )}

              {!loading && guests.length === 0 && (
                <div className="p-24 text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 rounded-full mb-6 shadow-inner">
                    <Users className="text-slate-400" size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-700 mb-2">لا يوجد ضيوف</h3>
                  <p className="text-slate-500 mb-6">لم يتم العثور على ضيوف</p>
                  <Button onClick={() => { setEditingGuest(null); setIsGuestModalOpen(true); }} className="gap-2">
                    <Plus size={18} /> إضافة ضيف جديد
                  </Button>
                </div>
              )}
            </div>

            {/* Guests Pagination */}
            {guests.length > GUESTS_PER_PAGE && (
              <div className="px-6 py-4 bg-gradient-to-r from-[#3d6a8a] to-[#2d5570] border-t-4 border-[#FF9F4A] flex items-center justify-between">
                <span className="text-sm text-white font-medium">
                  عرض <span className="font-bold text-[#FF9F4A]">{Math.min(GUESTS_PER_PAGE, guests.length - guestPage * GUESTS_PER_PAGE)}</span> من أصل <span className="font-bold text-[#FF9F4A]">{guests.length}</span> ضيف
                </span>
                <div className="flex items-center gap-3">
                  <button
                    disabled={guestPage === 0}
                    onClick={() => setGuestPage(p => p - 1)}
                    className="px-4 py-2 text-white bg-white/20 hover:bg-white/30 rounded-lg border border-white/30 transition-all disabled:opacity-30 disabled:pointer-events-none font-medium flex items-center gap-2"
                  >
                    <ChevronRight size={18} /> السابق
                  </button>
                  <span className="text-white text-sm font-bold">{guestPage + 1} / {Math.ceil(guests.length / GUESTS_PER_PAGE)}</span>
                  <button
                    disabled={guestPage >= Math.ceil(guests.length / GUESTS_PER_PAGE) - 1}
                    onClick={() => setGuestPage(p => p + 1)}
                    className="px-4 py-2 text-white bg-white/20 hover:bg-white/30 rounded-lg border border-white/30 transition-all disabled:opacity-30 disabled:pointer-events-none font-medium flex items-center gap-2"
                  >
                    التالي <ChevronLeft size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ===================== PROGRAM ROLES TAB ===================== */}
      {activeTab === 'roles' && (
        <>
          {/* Filters */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/50">
            <div className="flex flex-wrap items-center gap-4">
              <div className="w-64">
                <Select
                  options={[{ value: '', label: 'كل البرامج' }, ...programs.map(p => ({ value: p.id.toString(), label: p.name || p.title || '' }))]}
                  value={roleFilter.program_id}
                  onChange={(e) => setRoleFilter({ program_id: e.target.value })}
                  className="h-12 text-base shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Roles Table */}
          <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-gradient-to-r from-[#3d6a8a] to-[#2d5570] text-white text-sm font-bold border-b-4 border-[#FF9F4A]">
                    <th className="px-6 py-4 border border-[#FF9F4A]">البرنامج</th>
                    <th className="px-6 py-4 border border-[#FF9F4A]">الموظف</th>
                    <th className="px-6 py-4 border border-[#FF9F4A]">الدور</th>
                    <th className="px-6 py-4 border border-[#FF9F4A]">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#FF9F4A] border-b-4 border-[#FF9F4A]">
                  <AnimatePresence mode="popLayout">
                    {programRoles.slice(rolePage * ROLES_PER_PAGE, (rolePage + 1) * ROLES_PER_PAGE).map((role, index) => (
                      <motion.tr
                        layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        key={role.id}
                        className={cn(
                          "hover:bg-blue-50 transition-all group border-l-4 border-l-[#FF9F4A]",
                          index % 2 === 0 ? "bg-white" : "bg-slate-50"
                        )}
                      >
                        <td className="px-6 py-5 border border-[#FF9F4A]">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-[#3d6a8a] shrink-0">
                              <Tv size={18} />
                            </div>
                            <span className="text-sm font-bold text-slate-900">{role.program_title || role.program_name || `برنامج #${role.program_id}`}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 border border-[#FF9F4A]">
                          <span className="text-sm font-semibold text-slate-700 px-3 py-1.5 bg-slate-100 rounded-lg inline-block">
                            {role.user_name || `مستخدم #${role.user_id}`}
                          </span>
                        </td>
                        <td className="px-6 py-5 border border-[#FF9F4A]">
                          <Badge variant={getRoleBadgeVariant(role.role_name || '')}>
                            {role.role_name || `دور #${role.role_id}`}
                          </Badge>
                        </td>
                        <td className="px-6 py-5 border border-[#FF9F4A]">
                          <button
                            onClick={() => handleDeleteRole(role.id)}
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

              {loading && programRoles.length === 0 && (
                <div className="p-16 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                    <div className="w-8 h-8 border-4 border-[#3d6a8a] border-t-transparent rounded-full animate-spin" />
                  </div>
                  <p className="text-slate-600 font-medium">جاري تحميل أدوار الفريق...</p>
                </div>
              )}

              {!loading && programRoles.length === 0 && (
                <div className="p-24 text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 rounded-full mb-6 shadow-inner">
                    <UserCheck className="text-slate-400" size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-700 mb-2">لا يوجد أدوار</h3>
                  <p className="text-slate-500 mb-6">لم يتم تعيين أدوار لأي برنامج بعد</p>
                  <Button onClick={() => setIsRoleModalOpen(true)} className="gap-2">
                    <Plus size={18} /> تعيين دور جديد
                  </Button>
                </div>
              )}
            </div>

            {/* Roles Pagination */}
            {programRoles.length > ROLES_PER_PAGE && (
              <div className="px-6 py-4 bg-gradient-to-r from-[#3d6a8a] to-[#2d5570] border-t-4 border-[#FF9F4A] flex items-center justify-between">
                <span className="text-sm text-white font-medium">
                  عرض <span className="font-bold text-[#FF9F4A]">{Math.min(ROLES_PER_PAGE, programRoles.length - rolePage * ROLES_PER_PAGE)}</span> من أصل <span className="font-bold text-[#FF9F4A]">{programRoles.length}</span> دور
                </span>
                <div className="flex items-center gap-3">
                  <button
                    disabled={rolePage === 0}
                    onClick={() => setRolePage(p => p - 1)}
                    className="px-4 py-2 text-white bg-white/20 hover:bg-white/30 rounded-lg border border-white/30 transition-all disabled:opacity-30 disabled:pointer-events-none font-medium flex items-center gap-2"
                  >
                    <ChevronRight size={18} /> السابق
                  </button>
                  <span className="text-white text-sm font-bold">{rolePage + 1} / {Math.ceil(programRoles.length / ROLES_PER_PAGE)}</span>
                  <button
                    disabled={rolePage >= Math.ceil(programRoles.length / ROLES_PER_PAGE) - 1}
                    onClick={() => setRolePage(p => p + 1)}
                    className="px-4 py-2 text-white bg-white/20 hover:bg-white/30 rounded-lg border border-white/30 transition-all disabled:opacity-30 disabled:pointer-events-none font-medium flex items-center gap-2"
                  >
                    التالي <ChevronLeft size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ===================== MODALS ===================== */}

      {/* Program Modal */}
      <Modal
        isOpen={isProgramModalOpen}
        onClose={() => { setIsProgramModalOpen(false); setEditingProgram(null); }}
        title={editingProgram ? 'تعديل البرنامج' : 'إضافة برنامج جديد'}
      >
        <ProgramForm
          program={editingProgram}
          mediaUnits={mediaUnits}
          onSuccess={() => { setIsProgramModalOpen(false); setEditingProgram(null); fetchPrograms(); }}
          onCancel={() => { setIsProgramModalOpen(false); setEditingProgram(null); }}
        />
      </Modal>

      {/* Episode Modal */}
      <Modal
        isOpen={isEpisodeModalOpen}
        onClose={() => setIsEpisodeModalOpen(false)}
        title="إضافة حلقة جديدة"
      >
        <EpisodeForm
          programs={programs}
          initialProgramId={episodeFilters.program_id}
          onSuccess={() => { setIsEpisodeModalOpen(false); fetchEpisodes(); }}
          onCancel={() => setIsEpisodeModalOpen(false)}
        />
      </Modal>

      {/* Guest Modal */}
      <Modal
        isOpen={isGuestModalOpen}
        onClose={() => { setIsGuestModalOpen(false); setEditingGuest(null); }}
        title={editingGuest ? 'تعديل بيانات الضيف' : 'إضافة ضيف جديد'}
      >
        <GuestForm
          guest={editingGuest}
          onSuccess={() => { setIsGuestModalOpen(false); setEditingGuest(null); fetchGuests(); }}
          onCancel={() => { setIsGuestModalOpen(false); setEditingGuest(null); }}
        />
      </Modal>

      {/* Program Role Modal */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title="تعيين دور في برنامج"
      >
        <ProgramRoleForm
          programs={programs}
          users={allUsers}
          roles={allRoles}
          onSuccess={() => { setIsRoleModalOpen(false); fetchProgramRoles(); }}
          onCancel={() => setIsRoleModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

// ========== Helper Components & Functions ==========

function formatTime12(time?: string): string {
  if (!time) return 'غير محدد';
  const [h, m] = time.split(':');
  let hour = parseInt(h);
  const period = hour >= 12 ? 'مساءً' : 'صباحاً';
  if (hour === 0) hour = 12;
  else if (hour > 12) hour -= 12;
  return `${hour}:${m} ${period}`;
}

function TabBtn({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2",
        active ? "bg-white text-[#3d6a8a] shadow-sm" : "text-slate-500 hover:text-slate-700"
      )}
    >
      {children}
    </button>
  );
}

function getEpisodeStatusVariant(status: string): 'gray' | 'yellow' | 'blue' | 'purple' | 'green' | 'red' {
  const s = status.toLowerCase();
  if (s.includes('done') || s.includes('complete') || s.includes('بث')) return 'green';
  if (s.includes('progress') || s.includes('جاري')) return 'blue';
  if (s.includes('review') || s.includes('مراجعة')) return 'purple';
  if (s.includes('pending') || s.includes('معلق')) return 'yellow';
  if (s.includes('cancel') || s.includes('ملغ')) return 'red';
  return 'gray';
}

function getRoleBadgeVariant(roleName: string): 'blue' | 'purple' | 'green' | 'yellow' | 'red' | 'gray' {
  const r = roleName.toLowerCase();
  if (r.includes('مقدم') || r.includes('presenter')) return 'purple';
  if (r.includes('منتج') || r.includes('producer')) return 'blue';
  if (r.includes('مخرج') || r.includes('director')) return 'green';
  if (r.includes('معد') || r.includes('writer') || r.includes('editor')) return 'yellow';
  if (r.includes('مصور') || r.includes('camera')) return 'red';
  return 'gray';
}

// ========== PROGRAM FORM ==========
function ProgramForm({ program, mediaUnits, onSuccess, onCancel }: {
  program: Program | null;
  mediaUnits: MediaUnit[];
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: program?.name || program?.title || '',
    description: program?.description || '',
    media_unit_id: program?.media_unit_id?.toString() || '',
    air_time: program?.air_time || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...formData, media_unit_id: formData.media_unit_id ? Number(formData.media_unit_id) : undefined };
      let res;
      if (program) {
        res = await api.put<{ success: boolean }>(`/api/portal/programs/${program.id}`, payload);
      } else {
        res = await api.post<{ success: boolean }>('/api/portal/programs', payload);
      }
      if (res.success) onSuccess();
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="اسم البرنامج" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
      <Textarea label="وصف البرنامج" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="الوحدة الإعلامية"
          required
          options={[{ value: '', label: 'اختر الوحدة...' }, ...mediaUnits.map(u => ({ value: u.id.toString(), label: u.name }))]}
          value={formData.media_unit_id}
          onChange={e => setFormData({ ...formData, media_unit_id: e.target.value })}
        />
        <Input label="وقت البث" type="time" required value={formData.air_time} onChange={e => setFormData({ ...formData, air_time: e.target.value })} />
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <Button variant="ghost" type="button" onClick={onCancel}>إلغاء</Button>
        <Button type="submit" isLoading={loading} disabled={!formData.title || !formData.media_unit_id} className="bg-[#3d6a8a] hover:bg-[#2d5570] text-white">
          {program ? 'حفظ التعديلات' : 'إنشاء البرنامج'}
        </Button>
      </div>
    </form>
  );
}

// ========== EPISODE FORM ==========
function EpisodeForm({ programs, initialProgramId, onSuccess, onCancel }: {
  programs: Program[];
  initialProgramId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    program_id: initialProgramId || '',
    title: '',
    episode_number: '',
    air_date: '',
  });

  useEffect(() => {
    if (initialProgramId) setFormData(prev => ({ ...prev, program_id: initialProgramId }));
  }, [initialProgramId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post<{ success: boolean }>('/api/portal/episodes', {
        ...formData,
        program_id: Number(formData.program_id),
        episode_number: Number(formData.episode_number),
      });
      if (res.success) onSuccess();
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        label="البرنامج"
        required
        options={[{ value: '', label: 'اختر البرنامج...' }, ...programs.map(p => ({ value: p.id.toString(), label: p.name || p.title || '' }))]}
        value={formData.program_id}
        onChange={e => setFormData({ ...formData, program_id: e.target.value })}
      />
      <Input label="عنوان الحلقة" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
      <div className="grid grid-cols-2 gap-4">
        <Input label="رقم الحلقة" type="number" required value={formData.episode_number} onChange={e => setFormData({ ...formData, episode_number: e.target.value })} />
        <Input label="تاريخ البث" type="date" required value={formData.air_date} onChange={e => setFormData({ ...formData, air_date: e.target.value })} />
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <Button variant="ghost" type="button" onClick={onCancel}>إلغاء</Button>
        <Button type="submit" isLoading={loading} disabled={!formData.program_id || !formData.title} className="bg-[#3d6a8a] hover:bg-[#2d5570] text-white">
          إنشاء الحلقة
        </Button>
      </div>
    </form>
  );
}

// ========== GUEST FORM ==========
function GuestForm({ guest, onSuccess, onCancel }: {
  guest: Guest | null;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: guest?.name || '',
    title: guest?.title || '',
    bio: guest?.bio || '',
    phone: guest?.phone || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let res;
      if (guest) {
        res = await api.put<{ success: boolean }>(`/api/portal/guests/${guest.id}`, formData);
      } else {
        res = await api.post<{ success: boolean }>('/api/portal/guests', formData);
      }
      if (res.success) onSuccess();
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="اسم الضيف" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
      <Input label="اللقب / المنصب" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="مثال: دكتور، مهندس، وزير..." />
      <Input label="رقم الهاتف" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} dir="ltr" placeholder="+962..." />
      <Textarea label="نبذة عن الضيف" value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} placeholder="معلومات مختصرة عن الضيف..." />
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <Button variant="ghost" type="button" onClick={onCancel}>إلغاء</Button>
        <Button type="submit" isLoading={loading} disabled={!formData.name} className="bg-[#3d6a8a] hover:bg-[#2d5570] text-white">
          {guest ? 'حفظ التعديلات' : 'إضافة الضيف'}
        </Button>
      </div>
    </form>
  );
}

// ========== PROGRAM ROLE FORM ==========
function ProgramRoleForm({ programs, users, roles, onSuccess, onCancel }: {
  programs: Program[];
  users: UserType[];
  roles: Role[];
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    program_id: '',
    user_id: '',
    role_id: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post<{ success: boolean }>('/api/portal/program-roles', {
        program_id: Number(formData.program_id),
        user_id: Number(formData.user_id),
        role_id: Number(formData.role_id),
      });
      if (res.success) onSuccess();
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        label="البرنامج"
        required
        options={[{ value: '', label: 'اختر البرنامج...' }, ...programs.map(p => ({ value: p.id.toString(), label: p.name || p.title || '' }))]}
        value={formData.program_id}
        onChange={e => setFormData({ ...formData, program_id: e.target.value })}
      />
      <Select
        label="الموظف"
        required
        options={[{ value: '', label: 'اختر الموظف...' }, ...users.map(u => ({ value: u.id.toString(), label: u.name }))]}
        value={formData.user_id}
        onChange={e => setFormData({ ...formData, user_id: e.target.value })}
      />
      <Select
        label="الدور"
        required
        options={[{ value: '', label: 'اختر الدور...' }, ...roles.map(r => ({ value: r.id.toString(), label: r.name }))]}
        value={formData.role_id}
        onChange={e => setFormData({ ...formData, role_id: e.target.value })}
      />
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <Button variant="ghost" type="button" onClick={onCancel}>إلغاء</Button>
        <Button type="submit" isLoading={loading} disabled={!formData.program_id || !formData.user_id || !formData.role_id} className="bg-[#3d6a8a] hover:bg-[#2d5570] text-white">
          تعيين الدور
        </Button>
      </div>
    </form>
  );
}
