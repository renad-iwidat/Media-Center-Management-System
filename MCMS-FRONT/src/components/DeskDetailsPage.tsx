import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, Building2, User, Users, 
  Plus, Edit, Trash2, Info, ChevronLeft,
  Layout
} from 'lucide-react';
import { api } from '../services/api';
import { DeskDetails, Team, User as UserType } from '../types';
import { Button, Input, Select, Textarea } from './ui/Inputs';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { cn } from '../lib/utils';

export default function DeskDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [desk, setDesk] = useState<DeskDetails | null>(null);
  
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [users, setUsers] = useState<UserType[]>([]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: DeskDetails }>(`/api/portal/desks/${id}/with-teams`);
      const usersRes = await api.get<{ success: boolean; data: UserType[] }>('/api/portal/users');
      
      if (res.success) setDesk(res.data);
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

  if (loading) return <div className="p-12 text-center text-slate-400 font-bold">جاري تحميل تفاصيل القسم...</div>;
  if (!desk) return <div className="p-12 text-center text-red-500 font-bold">لم يتم العثور على القسم</div>;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-6">
        <Link to="/departments" className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors w-fit group">
          <ArrowRight size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold font-sans">العودة للهيكل التنظيمي</span>
        </Link>

        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40">
           <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3">
                 <div className="flex items-center gap-3">
                    <Badge variant="blue">قسم رئيسي</Badge>
                    <span className="text-xs font-mono font-bold text-slate-400">ID: {desk.id}</span>
                 </div>
                 <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                   <Building2 size={32} className="text-blue-600" />
                   {desk.name}
                 </h1>
                 <p className="text-slate-500 font-bold max-w-2xl">{desk.description}</p>
                 <div className="flex items-center gap-2 pt-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                       <User size={16} />
                    </div>
                    <span className="text-sm font-bold text-slate-600">مدير القسم: {desk.manager_name}</span>
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
        </div>
      </div>

      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <h4 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Users size={24} className="text-blue-600" />
              الفرق التابعة لهذا القسم
            </h4>
            <Button onClick={() => setIsTeamModalOpen(true)} className="gap-2">
              <Plus size={20} />
              فريق جديد
            </Button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {desk.teams.map((team) => (
              <div 
                key={team.id} 
                className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 hover:shadow-xl transition-all group cursor-pointer"
                onClick={() => navigate(`/teams/${team.id}`)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                    <Users size={20} />
                  </div>
                  <Badge variant="gray">{team.member_count || 0} عضو</Badge>
                </div>
                <h5 className="text-lg font-black text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{team.name}</h5>
                <p className="text-xs font-bold text-slate-400 flex items-center gap-1">
                  <User size={12} />
                  مدير الفريق: {team.manager_name}
                </p>
                <div className="mt-4 pt-4 border-t border-slate-50 flex justify-end">
                   <ChevronLeft size={18} className="text-slate-300 group-hover:text-blue-600 transition-all" />
                </div>
              </div>
            ))}
            {desk.teams.length === 0 && (
              <div className="col-span-full py-12 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                <Users size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 font-bold">لا توجد فرق تابعة لهذا القسم حالياً</p>
                <Button variant="ghost" onClick={() => setIsTeamModalOpen(true)} className="mt-4 text-blue-600 font-black">ابدأ بإنشاء أول فريق</Button>
              </div>
            )}
         </div>
      </div>

      <Modal isOpen={isTeamModalOpen} onClose={() => setIsTeamModalOpen(false)} title="إضافة فريق للقسم">
         <TeamForm 
            deskId={desk.id} 
            users={users} 
            onSuccess={() => { setIsTeamModalOpen(false); fetchDetails(); }} 
            onCancel={() => setIsTeamModalOpen(false)} 
         />
      </Modal>
    </div>
  );
}

function TeamForm({ deskId, users, onSuccess, onCancel }: { deskId: number, users: UserType[], onSuccess: () => void, onCancel: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', manager_id: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post<{ success: boolean }>('/api/portal/teams', {
        ...formData,
        desk_id: deskId,
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
        label="مدير الفريق" 
        required
        options={[{ value: '', label: 'اختر مدير...' }, ...users.map(u => ({ value: u.id.toString(), label: u.name }))]}
        value={formData.manager_id}
        onChange={e => setFormData({...formData, manager_id: e.target.value})}
      />
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <Button variant="ghost" type="button" onClick={onCancel}>إلغاء</Button>
        <Button type="submit" loading={loading} disabled={!formData.name || !formData.manager_id}>إنشاء الفريق</Button>
      </div>
    </form>
  );
}
