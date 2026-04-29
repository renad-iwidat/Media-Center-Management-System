import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, Plus, Search, ChevronRight, 
  MapPin, Shield, Layers, Layout, User, 
  MoreHorizontal, Edit, Trash2, ShieldCheck,
  Settings, Radio, Tag
} from 'lucide-react';
import { api } from '../services/api';
import { Desk, Team, MediaUnit, Role, User as UserType } from '../types';
import { Button, Input, Select, Textarea } from './ui/Inputs';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function DepartmentsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'desks' | 'teams' | 'units' | 'roles'>('desks');
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [desks, setDesks] = useState<Desk[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [units, setUnits] = useState<MediaUnit[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);

  // Modals
  const [isDeskModalOpen, setIsDeskModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [desksRes, teamsRes, unitsRes, rolesRes, usersRes] = await Promise.all([
        api.get<{ success: boolean; data: Desk[] }>('/api/portal/desks'),
        api.get<{ success: boolean; data: Team[] }>('/api/portal/teams'),
        api.get<{ success: boolean; data: MediaUnit[] }>('/api/portal/media-units'),
        api.get<{ success: boolean; data: Role[] }>('/api/portal/roles'),
        api.get<{ success: boolean; data: UserType[] }>('/api/portal/users')
      ]);

      if (desksRes.success) setDesks(desksRes.data);
      if (teamsRes.success) setTeams(teamsRes.data);
      if (unitsRes.success) setUnits(unitsRes.data);
      if (rolesRes.success) setRoles(rolesRes.data);
      if (usersRes.success) setUsers(usersRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">الهيكل التنظيمي</h1>
          <p className="text-slate-500 font-bold">إدارة الأقسام، الفرق، الوحدات الإعلامية والأدوار</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'desks' && (
            <Button onClick={() => setIsDeskModalOpen(true)} className="gap-2">
              <Plus size={20} />
              قسم جديد
            </Button>
          )}
          {activeTab === 'teams' && (
            <Button onClick={() => setIsTeamModalOpen(true)} className="gap-2">
              <Plus size={20} />
              فريق جديد
            </Button>
          )}
          {activeTab === 'units' && (
            <Button onClick={() => setIsUnitModalOpen(true)} className="gap-2">
              <Plus size={20} />
              وحدة إعلامية جديدة
            </Button>
          )}
          {activeTab === 'roles' && (
            <Button onClick={() => setIsRoleModalOpen(true)} className="gap-2">
              <Plus size={20} />
              دور جديد
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-8 border-b border-slate-100 px-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
        <TabButton active={activeTab === 'desks'} onClick={() => setActiveTab('desks')} icon={<Building2 size={18} />} label="الأقسام" />
        <TabButton active={activeTab === 'teams'} onClick={() => setActiveTab('teams')} icon={<Users size={18} />} label="الفرق" />
        <TabButton active={activeTab === 'units'} onClick={() => setActiveTab('units')} icon={<Radio size={18} />} label="الوحدات الإعلامية" />
        <TabButton active={activeTab === 'roles'} onClick={() => setActiveTab('roles')} icon={<Tag size={18} />} label="الأدوار البرامجية" />
      </div>

      {activeTab === 'desks' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {desks.map((d) => (
            <div 
              key={d.id} 
              className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 hover:shadow-xl transition-all group cursor-pointer"
              onClick={() => navigate(`/desks/${d.id}`)}
            >
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                <Building2 size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2 truncate group-hover:text-blue-600 transition-colors">{d.name}</h3>
              <p className="text-slate-400 text-sm font-bold line-clamp-2 mb-6 h-10">{d.description || 'لا يوجد وصف متاح لهذا القسم'}</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">المدير</span>
                  <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                    <User size={12} />
                    {d.manager_name || 'غير محدد'}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight size={18} />
                </div>
              </div>
            </div>
          ))}
          {desks.length === 0 && !loading && <EmptyState label="لا توجد أقسام معرفة بعد" />}
        </div>
      )}

      {activeTab === 'teams' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">اسم الفريق</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">القسم</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">المدير</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">الأعضاء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {teams.map((t) => (
                  <tr 
                    key={t.id} 
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/teams/${t.id}`)}
                  >
                    <td className="px-6 py-4 font-bold text-slate-900 group-hover:text-blue-600">{t.name}</td>
                    <td className="px-6 py-4">
                      <Badge variant="gray">{t.desk_name}</Badge>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-600 text-sm">{t.manager_name}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs font-mono font-black text-slate-400">
                        <Users size={14} />
                        {t.member_count || 0}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {teams.length === 0 && !loading && <EmptyState label="لا توجد فرق معرفة بعد" />}
          </div>
        </div>
      )}

      {activeTab === 'units' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {units.map((u) => (
            <div key={u.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group flex items-start justify-between">
              <div>
                <h4 className="font-black text-slate-900 group-hover:text-blue-600 transition-colors">{u.name}</h4>
                <p className="text-xs text-slate-400 font-bold mt-1">{u.description || 'وحدة إعلامية إنتاجية'}</p>
              </div>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Radio size={18} />
              </div>
            </div>
          ))}
          {units.length === 0 && !loading && <div className="col-span-full py-12 text-center text-slate-400 font-bold">لا يوجد وحدات إعلامية</div>}
        </div>
      )}

      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {roles.map((r) => (
            <div key={r.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group flex items-start justify-between">
              <div>
                <h4 className="font-black text-slate-900 group-hover:text-purple-600 transition-colors">{r.name}</h4>
                <p className="text-xs text-slate-400 font-bold mt-1 line-clamp-1">{r.description || 'دور برامجي إبداعي'}</p>
              </div>
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                <Tag size={18} />
              </div>
            </div>
          ))}
          {roles.length === 0 && !loading && <div className="col-span-full py-12 text-center text-slate-400 font-bold">لا يوجد أدوار مضافة</div>}
        </div>
      )}

      {loading && <div className="p-12 text-center text-slate-400 font-bold">جاري تحميل البيانات...</div>}

      {/* Desk Modal */}
      <Modal isOpen={isDeskModalOpen} onClose={() => setIsDeskModalOpen(false)} title="إنشاء قسم جديد">
         <DeskForm users={users} onSuccess={() => { setIsDeskModalOpen(false); fetchData(); }} onCancel={() => setIsDeskModalOpen(false)} />
      </Modal>

      {/* Team Modal */}
      <Modal isOpen={isTeamModalOpen} onClose={() => setIsTeamModalOpen(false)} title="إنشاء فريق عمل">
         <TeamForm users={users} desks={desks} onSuccess={() => { setIsTeamModalOpen(false); fetchData(); }} onCancel={() => setIsTeamModalOpen(false)} />
      </Modal>

      {/* Unit Modal */}
      <Modal isOpen={isUnitModalOpen} onClose={() => setIsUnitModalOpen(false)} title="إضافة وحدة إعلامية">
         <UnitForm onSuccess={() => { setIsUnitModalOpen(false); fetchData(); }} onCancel={() => setIsUnitModalOpen(false)} />
      </Modal>

      {/* Role Modal */}
      <Modal isOpen={isRoleModalOpen} onClose={() => setIsRoleModalOpen(false)} title="إضافة دور برامجي">
         <RoleForm onSuccess={() => { setIsRoleModalOpen(false); fetchData(); }} onCancel={() => setIsRoleModalOpen(false)} />
      </Modal>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-5 font-bold text-sm transition-all border-b-2",
        active ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="col-span-full py-12 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
      <Building2 size={48} className="mx-auto text-slate-200 mb-4" />
      <p className="text-slate-400 font-bold">{label}</p>
    </div>
  );
}

/**
 * Forms
 */

function DeskForm({ users, onSuccess, onCancel }: { users: UserType[], onSuccess: () => void, onCancel: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', manager_id: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post<{ success: boolean }>('/api/portal/desks', {
        ...formData,
        manager_id: Number(formData.manager_id)
      });
      if (res.success) onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="اسم القسم" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
      <Textarea label="الوصف" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
      <Select 
        label="مدير القسم" 
        required
        options={[{ value: '', label: 'اختر مدير...' }, ...users.map(u => ({ value: u.id.toString(), label: u.name }))]}
        value={formData.manager_id}
        onChange={e => setFormData({...formData, manager_id: e.target.value})}
      />
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <Button variant="ghost" type="button" onClick={onCancel}>إلغاء</Button>
        <Button type="submit" loading={loading} disabled={!formData.name || !formData.manager_id}>إنشاء القسم</Button>
      </div>
    </form>
  );
}

function TeamForm({ users, desks, onSuccess, onCancel }: { users: UserType[], desks: Desk[], onSuccess: () => void, onCancel: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', desk_id: '', manager_id: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post<{ success: boolean }>('/api/portal/teams', {
        ...formData,
        desk_id: Number(formData.desk_id),
        manager_id: Number(formData.manager_id)
      });
      if (res.success) onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="اسم الفريق" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
      <Select 
        label="القسم التابع له" 
        required
        options={[{ value: '', label: 'اختر القسم...' }, ...desks.map(d => ({ value: d.id.toString(), label: d.name }))]}
        value={formData.desk_id}
        onChange={e => setFormData({...formData, desk_id: e.target.value})}
      />
      <Select 
        label="مدير الفريق" 
        required
        options={[{ value: '', label: 'اختر مدير...' }, ...users.map(u => ({ value: u.id.toString(), label: u.name }))]}
        value={formData.manager_id}
        onChange={e => setFormData({...formData, manager_id: e.target.value})}
      />
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <Button variant="ghost" type="button" onClick={onCancel}>إلغاء</Button>
        <Button type="submit" loading={loading} disabled={!formData.name || !formData.desk_id || !formData.manager_id}>إنشاء الفريق</Button>
      </div>
    </form>
  );
}

function UnitForm({ onSuccess, onCancel }: { onSuccess: () => void, onCancel: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post<{ success: boolean }>('/api/portal/media-units', formData);
      if (res.success) onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="اسم الوحدة" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
      <Textarea label="وصف الوحدة" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <Button variant="ghost" type="button" onClick={onCancel}>إلغاء</Button>
        <Button type="submit" loading={loading} disabled={!formData.name}>إضافة</Button>
      </div>
    </form>
  );
}

function RoleForm({ onSuccess, onCancel }: { onSuccess: () => void, onCancel: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post<{ success: boolean }>('/api/portal/roles', formData);
      if (res.success) onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="اسم الدور" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
      <Textarea label="وصف الدور" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <Button variant="ghost" type="button" onClick={onCancel}>إلغاء</Button>
        <Button type="submit" loading={loading} disabled={!formData.name}>إضافة</Button>
      </div>
    </form>
  );
}
