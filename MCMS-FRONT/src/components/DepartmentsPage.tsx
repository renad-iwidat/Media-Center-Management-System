import React, { useState, useEffect } from 'react';
import { Building2, Users, Plus, Search, ChevronLeft, ChevronRight, User, Edit, Trash2, Radio, Tag } from 'lucide-react';
import { api } from '../services/api';
import { Desk, Team, MediaUnit, Role, User as UserType } from '../types';
import { Button, Input, Select, Textarea } from './ui/Inputs';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type ActiveTab = 'desks' | 'teams' | 'units' | 'roles';
const PER_PAGE = 5;

export default function DepartmentsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ActiveTab>('desks');
  const [loading, setLoading] = useState(true);

  const [desks, setDesks] = useState<Desk[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [units, setUnits] = useState<MediaUnit[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);

  const [isDeskModalOpen, setIsDeskModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  const [deskPage, setDeskPage] = useState(0);
  const [teamPage, setTeamPage] = useState(0);
  const [unitPage, setUnitPage] = useState(0);
  const [rolePage, setRolePage] = useState(0);
  const [teamFilter, setTeamFilter] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [desksRes, teamsRes, unitsRes, rolesRes, usersRes] = await Promise.all([
        api.get<{ success: boolean; data: Desk[] }>('/api/portal/desks'),
        api.get<{ success: boolean; data: Team[] }>('/api/portal/teams'),
        api.get<{ success: boolean; data: MediaUnit[] }>('/api/portal/media-units'),
        api.get<{ success: boolean; data: Role[] }>('/api/portal/roles'),
        api.get<{ success: boolean; data: UserType[] }>('/api/portal/users'),
      ]);
      if (desksRes.success) setDesks(desksRes.data);
      if (teamsRes.success) setTeams(teamsRes.data);
      if (unitsRes.success) setUnits(unitsRes.data);
      if (rolesRes.success) setRoles(rolesRes.data);
      if (usersRes.success) setUsers(usersRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDeleteDesk = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('هل أنت متأكد من حذف هذا القسم؟')) return;
    try { await api.delete<{ success: boolean }>(`/api/portal/desks/${id}`); fetchData(); } catch (err) { console.error(err); }
  };
  const handleDeleteTeam = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('هل أنت متأكد من حذف هذا الفريق؟')) return;
    try { await api.delete<{ success: boolean }>(`/api/portal/teams/${id}`); fetchData(); } catch (err) { console.error(err); }
  };
  const handleDeleteUnit = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه الوحدة؟')) return;
    try { await api.delete<{ success: boolean }>(`/api/portal/media-units/${id}`); fetchData(); } catch (err) { console.error(err); }
  };
  const handleDeleteRole = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الدور؟')) return;
    try { await api.delete<{ success: boolean }>(`/api/portal/roles/${id}`); fetchData(); } catch (err) { console.error(err); }
  };

  const filteredTeams = teamFilter ? teams.filter(t => String(t.desk_id) === teamFilter) : teams;

  const getAddBtn = () => {
    const c: Record<ActiveTab, { label: string; onClick: () => void }> = {
      desks: { label: 'قسم جديد', onClick: () => setIsDeskModalOpen(true) },
      teams: { label: 'فريق جديد', onClick: () => setIsTeamModalOpen(true) },
      units: { label: 'وحدة إعلامية جديدة', onClick: () => setIsUnitModalOpen(true) },
      roles: { label: 'دور جديد', onClick: () => setIsRoleModalOpen(true) },
    };
    return c[activeTab];
  };
  const addBtn = getAddBtn();

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">الأقسام والفرق</h1>
          <p className="text-slate-500 font-medium">إدارة الهيكل التنظيمي، الفرق، الوحدات الإعلامية والأدوار</p>
        </div>
        <Button onClick={addBtn.onClick} className="gap-2 bg-[#3d6a8a] hover:bg-[#2d5570] text-white shadow-lg hover:shadow-xl">
          <Plus size={20} /> {addBtn.label}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl w-fit border border-slate-200">
        <TabBtn active={activeTab === 'desks'} onClick={() => setActiveTab('desks')}><Building2 size={16} /> الأقسام</TabBtn>
        <TabBtn active={activeTab === 'teams'} onClick={() => setActiveTab('teams')}><Users size={16} /> الفرق</TabBtn>
        <TabBtn active={activeTab === 'units'} onClick={() => setActiveTab('units')}><Radio size={16} /> الوحدات الإعلامية</TabBtn>
        <TabBtn active={activeTab === 'roles'} onClick={() => setActiveTab('roles')}><Tag size={16} /> الأدوار</TabBtn>
      </div>

      {/* ========== DESKS TAB ========== */}
      {activeTab === 'desks' && (
        <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-gradient-to-r from-[#3d6a8a] to-[#2d5570] text-white text-sm font-bold border-b-4 border-[#FF9F4A]">
                  <th className="px-6 py-4 border border-[#FF9F4A]">القسم</th>
                  <th className="px-6 py-4 border border-[#FF9F4A]">الوصف</th>
                  <th className="px-6 py-4 border border-[#FF9F4A]">المدير</th>
                  <th className="px-6 py-4 border border-[#FF9F4A]">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FF9F4A] border-b-4 border-[#FF9F4A]">
                <AnimatePresence mode="popLayout">
                  {desks.slice(deskPage * PER_PAGE, (deskPage + 1) * PER_PAGE).map((d, index) => (
                    <motion.tr layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key={d.id}
                      className={cn("hover:bg-blue-50 transition-all group cursor-pointer border-l-4 border-l-[#FF9F4A]", index % 2 === 0 ? "bg-white" : "bg-slate-50")}
                      onClick={() => navigate(`/desks/${d.id}`)}
                    >
                      <td className="px-6 py-5 border border-[#FF9F4A]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-[#3d6a8a] shrink-0"><Building2 size={20} /></div>
                          <span className="text-base font-bold text-slate-900 group-hover:text-[#3d6a8a] transition-colors">{d.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 border border-[#FF9F4A]">
                        <span className="text-sm text-slate-500 line-clamp-1 max-w-[250px] inline-block">{d.description || 'لا يوجد وصف'}</span>
                      </td>
                      <td className="px-6 py-5 border border-[#FF9F4A]">
                        <span className="text-sm font-semibold text-slate-700 px-3 py-1.5 bg-slate-100 rounded-lg inline-block">{d.manager_name || 'غير محدد'}</span>
                      </td>
                      <td className="px-6 py-5 border border-[#FF9F4A]">
                        <button onClick={(e) => handleDeleteDesk(d.id, e)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
            {loading && desks.length === 0 && <LoadingState text="جاري تحميل الأقسام..." />}
            {!loading && desks.length === 0 && <EmptyState icon={<Building2 size={40} />} text="لا توجد أقسام" btnLabel="إنشاء قسم" onClick={() => setIsDeskModalOpen(true)} />}
          </div>
          <PaginationBar total={desks.length} page={deskPage} setPage={setDeskPage} label="قسم" />
        </div>
      )}

      {/* ========== TEAMS TAB ========== */}
      {activeTab === 'teams' && (
        <>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/50">
            <div className="w-64">
              <Select options={[{ value: '', label: 'كل الأقسام' }, ...desks.map(d => ({ value: d.id.toString(), label: d.name }))]}
                value={teamFilter} onChange={(e) => { setTeamFilter(e.target.value); setTeamPage(0); }} className="h-12 text-base shadow-sm" />
            </div>
          </div>
          <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-gradient-to-r from-[#3d6a8a] to-[#2d5570] text-white text-sm font-bold border-b-4 border-[#FF9F4A]">
                    <th className="px-6 py-4 border border-[#FF9F4A]">الفريق</th>
                    <th className="px-6 py-4 border border-[#FF9F4A]">القسم</th>
                    <th className="px-6 py-4 border border-[#FF9F4A]">المدير</th>
                    <th className="px-6 py-4 border border-[#FF9F4A]">الأعضاء</th>
                    <th className="px-6 py-4 border border-[#FF9F4A]">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#FF9F4A] border-b-4 border-[#FF9F4A]">
                  <AnimatePresence mode="popLayout">
                    {filteredTeams.slice(teamPage * PER_PAGE, (teamPage + 1) * PER_PAGE).map((t, index) => (
                      <motion.tr layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key={t.id}
                        className={cn("hover:bg-blue-50 transition-all group cursor-pointer border-l-4 border-l-[#FF9F4A]", index % 2 === 0 ? "bg-white" : "bg-slate-50")}
                        onClick={() => navigate(`/teams/${t.id}`)}
                      >
                        <td className="px-6 py-5 border border-[#FF9F4A]">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 shrink-0"><Users size={20} /></div>
                            <span className="text-base font-bold text-slate-900 group-hover:text-[#3d6a8a] transition-colors">{t.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 border border-[#FF9F4A]"><Badge variant="blue">{t.desk_name || 'غير محدد'}</Badge></td>
                        <td className="px-6 py-5 border border-[#FF9F4A]">
                          <span className="text-sm font-semibold text-slate-700 px-3 py-1.5 bg-slate-100 rounded-lg inline-block">{t.manager_name || 'غير محدد'}</span>
                        </td>
                        <td className="px-6 py-5 border border-[#FF9F4A]">
                          <div className="flex items-center gap-2"><Users size={14} className="text-purple-500" /><span className="text-sm font-bold text-slate-700">{t.member_count || 0}</span></div>
                        </td>
                        <td className="px-6 py-5 border border-[#FF9F4A]">
                          <button onClick={(e) => handleDeleteTeam(t.id, e)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
              {loading && filteredTeams.length === 0 && <LoadingState text="جاري تحميل الفرق..." />}
              {!loading && filteredTeams.length === 0 && <EmptyState icon={<Users size={40} />} text="لا توجد فرق" btnLabel="إنشاء فريق" onClick={() => setIsTeamModalOpen(true)} />}
            </div>
            <PaginationBar total={filteredTeams.length} page={teamPage} setPage={setTeamPage} label="فريق" />
          </div>
        </>
      )}

      {/* ========== UNITS TAB ========== */}
      {activeTab === 'units' && (
        <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-gradient-to-r from-[#3d6a8a] to-[#2d5570] text-white text-sm font-bold border-b-4 border-[#FF9F4A]">
                  <th className="px-6 py-4 border border-[#FF9F4A]">الوحدة الإعلامية</th>
                  <th className="px-6 py-4 border border-[#FF9F4A]">الوصف</th>
                  <th className="px-6 py-4 border border-[#FF9F4A]">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FF9F4A] border-b-4 border-[#FF9F4A]">
                <AnimatePresence mode="popLayout">
                  {units.slice(unitPage * PER_PAGE, (unitPage + 1) * PER_PAGE).map((u, index) => (
                    <motion.tr layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key={u.id}
                      className={cn("hover:bg-blue-50 transition-all group border-l-4 border-l-[#FF9F4A]", index % 2 === 0 ? "bg-white" : "bg-slate-50")}
                    >
                      <td className="px-6 py-5 border border-[#FF9F4A]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600 shrink-0"><Radio size={20} /></div>
                          <span className="text-base font-bold text-slate-900">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 border border-[#FF9F4A]">
                        <span className="text-sm text-slate-500 line-clamp-1 max-w-[300px] inline-block">{u.description || 'لا يوجد وصف'}</span>
                      </td>
                      <td className="px-6 py-5 border border-[#FF9F4A]">
                        <button onClick={() => handleDeleteUnit(u.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
            {loading && units.length === 0 && <LoadingState text="جاري تحميل الوحدات..." />}
            {!loading && units.length === 0 && <EmptyState icon={<Radio size={40} />} text="لا توجد وحدات إعلامية" btnLabel="إضافة وحدة" onClick={() => setIsUnitModalOpen(true)} />}
          </div>
          <PaginationBar total={units.length} page={unitPage} setPage={setUnitPage} label="وحدة" />
        </div>
      )}

      {/* ========== ROLES TAB ========== */}
      {activeTab === 'roles' && (
        <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-gradient-to-r from-[#3d6a8a] to-[#2d5570] text-white text-sm font-bold border-b-4 border-[#FF9F4A]">
                  <th className="px-6 py-4 border border-[#FF9F4A]">الدور</th>
                  <th className="px-6 py-4 border border-[#FF9F4A]">الوصف</th>
                  <th className="px-6 py-4 border border-[#FF9F4A]">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FF9F4A] border-b-4 border-[#FF9F4A]">
                <AnimatePresence mode="popLayout">
                  {roles.slice(rolePage * PER_PAGE, (rolePage + 1) * PER_PAGE).map((r, index) => (
                    <motion.tr layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key={r.id}
                      className={cn("hover:bg-blue-50 transition-all group border-l-4 border-l-[#FF9F4A]", index % 2 === 0 ? "bg-white" : "bg-slate-50")}
                    >
                      <td className="px-6 py-5 border border-[#FF9F4A]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 shrink-0"><Tag size={20} /></div>
                          <span className="text-base font-bold text-slate-900">{r.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 border border-[#FF9F4A]">
                        <span className="text-sm text-slate-500 line-clamp-1 max-w-[300px] inline-block">{r.description || 'لا يوجد وصف'}</span>
                      </td>
                      <td className="px-6 py-5 border border-[#FF9F4A]">
                        <button onClick={() => handleDeleteRole(r.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
            {loading && roles.length === 0 && <LoadingState text="جاري تحميل الأدوار..." />}
            {!loading && roles.length === 0 && <EmptyState icon={<Tag size={40} />} text="لا توجد أدوار" btnLabel="إضافة دور" onClick={() => setIsRoleModalOpen(true)} />}
          </div>
          <PaginationBar total={roles.length} page={rolePage} setPage={setRolePage} label="دور" />
        </div>
      )}

      {/* ========== MODALS ========== */}
      <Modal isOpen={isDeskModalOpen} onClose={() => setIsDeskModalOpen(false)} title="إنشاء قسم جديد">
        <DeskForm users={users} onSuccess={() => { setIsDeskModalOpen(false); fetchData(); }} onCancel={() => setIsDeskModalOpen(false)} />
      </Modal>
      <Modal isOpen={isTeamModalOpen} onClose={() => setIsTeamModalOpen(false)} title="إنشاء فريق عمل">
        <TeamForm users={users} desks={desks} onSuccess={() => { setIsTeamModalOpen(false); fetchData(); }} onCancel={() => setIsTeamModalOpen(false)} />
      </Modal>
      <Modal isOpen={isUnitModalOpen} onClose={() => setIsUnitModalOpen(false)} title="إضافة وحدة إعلامية">
        <UnitForm onSuccess={() => { setIsUnitModalOpen(false); fetchData(); }} onCancel={() => setIsUnitModalOpen(false)} />
      </Modal>
      <Modal isOpen={isRoleModalOpen} onClose={() => setIsRoleModalOpen(false)} title="إضافة دور برامجي">
        <RoleForm onSuccess={() => { setIsRoleModalOpen(false); fetchData(); }} onCancel={() => setIsRoleModalOpen(false)} />
      </Modal>
    </div>
  );
}

// ========== HELPER COMPONENTS ==========

function TabBtn({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("px-5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2", active ? "bg-white text-[#3d6a8a] shadow-sm" : "text-slate-500 hover:text-slate-700")}>
      {children}
    </button>
  );
}

function PaginationBar({ total, page, setPage, label }: { total: number; page: number; setPage: (fn: (p: number) => number) => void; label: string }) {
  if (total === 0) return null;
  const totalPages = Math.ceil(total / PER_PAGE);
  return (
    <div className="px-6 py-4 bg-gradient-to-r from-[#3d6a8a] to-[#2d5570] border-t-4 border-[#FF9F4A] flex items-center justify-between">
      <span className="text-sm text-white font-medium">
        عرض <span className="font-bold text-[#FF9F4A]">{Math.min(PER_PAGE, total - page * PER_PAGE)}</span> من أصل <span className="font-bold text-[#FF9F4A]">{total}</span> {label}
      </span>
      <div className="flex items-center gap-3">
        <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-4 py-2 text-white bg-white/20 hover:bg-white/30 rounded-lg border border-white/30 transition-all disabled:opacity-30 disabled:pointer-events-none font-medium flex items-center gap-2">
          <ChevronRight size={18} /> السابق
        </button>
        <span className="text-white text-sm font-bold">{page + 1} / {totalPages}</span>
        <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="px-4 py-2 text-white bg-white/20 hover:bg-white/30 rounded-lg border border-white/30 transition-all disabled:opacity-30 disabled:pointer-events-none font-medium flex items-center gap-2">
          التالي <ChevronLeft size={18} />
        </button>
      </div>
    </div>
  );
}

function LoadingState({ text }: { text: string }) {
  return (
    <div className="p-16 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
        <div className="w-8 h-8 border-4 border-[#3d6a8a] border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-slate-600 font-medium">{text}</p>
    </div>
  );
}

function EmptyState({ icon, text, btnLabel, onClick }: { icon: React.ReactNode; text: string; btnLabel: string; onClick: () => void }) {
  return (
    <div className="p-20 text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 rounded-full mb-6 shadow-inner text-slate-400">{icon}</div>
      <h3 className="text-xl font-bold text-slate-700 mb-2">{text}</h3>
      <Button onClick={onClick} className="gap-2 mt-4"><Plus size={16} /> {btnLabel}</Button>
    </div>
  );
}

// ========== FORMS ==========

function DeskForm({ users, onSuccess, onCancel }: { users: UserType[]; onSuccess: () => void; onCancel: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', manager_id: '' });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try { const res = await api.post<{ success: boolean }>('/api/portal/desks', { ...formData, manager_id: Number(formData.manager_id) }); if (res.success) onSuccess(); }
    catch (err) { console.error(err); } finally { setLoading(false); }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="اسم القسم" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
      <Textarea label="الوصف" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
      <Select label="مدير القسم" required options={[{ value: '', label: 'اختر مدير...' }, ...users.map(u => ({ value: u.id.toString(), label: u.name }))]} value={formData.manager_id} onChange={e => setFormData({ ...formData, manager_id: e.target.value })} />
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <Button variant="ghost" type="button" onClick={onCancel}>إلغاء</Button>
        <Button type="submit" isLoading={loading} disabled={!formData.name || !formData.manager_id} className="bg-[#3d6a8a] hover:bg-[#2d5570] text-white">إنشاء القسم</Button>
      </div>
    </form>
  );
}

function TeamForm({ users, desks, onSuccess, onCancel }: { users: UserType[]; desks: Desk[]; onSuccess: () => void; onCancel: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', desk_id: '', manager_id: '' });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try { const res = await api.post<{ success: boolean }>('/api/portal/teams', { ...formData, desk_id: Number(formData.desk_id), manager_id: Number(formData.manager_id) }); if (res.success) onSuccess(); }
    catch (err) { console.error(err); } finally { setLoading(false); }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="اسم الفريق" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
      <Select label="القسم التابع له" required options={[{ value: '', label: 'اختر القسم...' }, ...desks.map(d => ({ value: d.id.toString(), label: d.name }))]} value={formData.desk_id} onChange={e => setFormData({ ...formData, desk_id: e.target.value })} />
      <Select label="مدير الفريق" required options={[{ value: '', label: 'اختر مدير...' }, ...users.map(u => ({ value: u.id.toString(), label: u.name }))]} value={formData.manager_id} onChange={e => setFormData({ ...formData, manager_id: e.target.value })} />
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <Button variant="ghost" type="button" onClick={onCancel}>إلغاء</Button>
        <Button type="submit" isLoading={loading} disabled={!formData.name || !formData.desk_id || !formData.manager_id} className="bg-[#3d6a8a] hover:bg-[#2d5570] text-white">إنشاء الفريق</Button>
      </div>
    </form>
  );
}

function UnitForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try { const res = await api.post<{ success: boolean }>('/api/portal/media-units', formData); if (res.success) onSuccess(); }
    catch (err) { console.error(err); } finally { setLoading(false); }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="اسم الوحدة" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
      <Textarea label="وصف الوحدة" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <Button variant="ghost" type="button" onClick={onCancel}>إلغاء</Button>
        <Button type="submit" isLoading={loading} disabled={!formData.name} className="bg-[#3d6a8a] hover:bg-[#2d5570] text-white">إضافة</Button>
      </div>
    </form>
  );
}

function RoleForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try { const res = await api.post<{ success: boolean }>('/api/portal/roles', formData); if (res.success) onSuccess(); }
    catch (err) { console.error(err); } finally { setLoading(false); }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="اسم الدور" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
      <Textarea label="وصف الدور" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <Button variant="ghost" type="button" onClick={onCancel}>إلغاء</Button>
        <Button type="submit" isLoading={loading} disabled={!formData.name} className="bg-[#3d6a8a] hover:bg-[#2d5570] text-white">إضافة</Button>
      </div>
    </form>
  );
}
