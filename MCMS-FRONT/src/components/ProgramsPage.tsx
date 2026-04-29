import React, { useState, useEffect } from 'react';
import { 
  Tv, PlayCircle, Plus, Search, ChevronRight, 
  Calendar, Clock, User, Users, Filter, 
  MoreHorizontal, Eye, Edit, Trash2, List
} from 'lucide-react';
import { api } from '../services/api';
import { Program, Episode, MediaUnit, Role, User as UserType } from '../types';
import { Button, Input, Select, Textarea } from './ui/Inputs';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export default function ProgramsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { openEpisodeModal?: boolean, programId?: number } | null;
  
  const [activeTab, setActiveTab] = useState<'programs' | 'episodes'>(state?.openEpisodeModal ? 'episodes' : 'programs');
  const [loading, setLoading] = useState(true);
  
  // Programs Data
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  
  // Episodes Data
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isEpisodeModalOpen, setIsEpisodeModalOpen] = useState(state?.openEpisodeModal || false);
  const [pagination, setPagination] = useState({ limit: 20, offset: 0, total: 0 });
  const [episodeFilter, setEpisodeFilter] = useState({ program_id: state?.programId?.toString() || '' });

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: Program[] }>('/api/portal/programs');
      if (res.success) setPrograms(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEpisodes = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
        ...episodeFilter
      });
      const res = await api.get<{ success: boolean; data: Episode[]; total: number }>(`/api/portal/episodes/enriched?${query.toString()}`);
      if (res.success) {
        setEpisodes(res.data);
        setPagination(prev => ({ ...prev, total: res.total || 0 }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'programs') {
      fetchPrograms();
    } else {
      fetchEpisodes();
    }
  }, [activeTab, pagination.offset, episodeFilter]);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">البرامج والإنتاج البرامجي</h1>
          <p className="text-slate-500 font-bold">إدارة خريطة البرامج، الحلقات، والضيوف</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'programs' ? (
            <Button onClick={() => setIsProgramModalOpen(true)} className="gap-2">
              <Plus size={20} />
              برنامج جديد
            </Button>
          ) : (
            <Button onClick={() => setIsEpisodeModalOpen(true)} className="gap-2">
              <Plus size={20} />
              حلقة جديدة
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-8 border-b border-slate-100 px-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
        <button 
          onClick={() => setActiveTab('programs')}
          className={cn(
            "flex items-center gap-2 px-4 py-5 font-bold text-sm transition-all border-b-2",
            activeTab === 'programs' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"
          )}
        >
          <Tv size={18} />
          البرامج
        </button>
        <button 
          onClick={() => setActiveTab('episodes')}
          className={cn(
            "flex items-center gap-2 px-4 py-5 font-bold text-sm transition-all border-b-2",
            activeTab === 'episodes' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"
          )}
        >
          <PlayCircle size={18} />
          الحلقات
        </button>
      </div>

      {activeTab === 'programs' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map((p) => (
            <div 
              key={p.id} 
              className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 hover:shadow-xl hover:shadow-slate-200/50 transition-all group cursor-pointer"
              onClick={() => navigate(`/programs/${p.id}`)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                  <Tv size={24} />
                </div>
                <Badge variant="blue">{p.media_unit_name}</Badge>
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2 truncate group-hover:text-blue-600 transition-colors">{p.name}</h3>
              <p className="text-slate-400 text-sm font-bold line-clamp-2 mb-6 h-10">{p.description || 'لا يوجد وصف متاح'}</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">موعد البث</span>
                    <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                      <Clock size={12} />
                      {p.air_time}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">عدد الحلقات</span>
                    <span className="text-xs font-bold text-slate-600">{p.episode_count || 0}</span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight size={18} />
                </div>
              </div>
            </div>
          ))}
          {loading && <div className="col-span-full py-12 text-center text-slate-400 font-bold">جاري تحميل البرامج...</div>}
        </div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xl">
          <div className="p-6 border-b border-slate-200 flex flex-wrap gap-4 items-center bg-white">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <Input placeholder="بحث في الحلقات..." className="pr-12 h-12 text-base bg-slate-50 border-slate-200 focus:bg-white shadow-sm" />
            </div>
            <div className="w-56">
              <Select 
                className="h-12 text-base shadow-sm"
                options={[{ value: '', label: 'كل البرامج' }, ...programs.map(p => ({ value: p.id.toString(), label: p.name }))]}
                value={episodeFilter.program_id}
                onChange={(e) => setEpisodeFilter({ program_id: e.target.value })}
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-gradient-to-r from-[#3d6a8a] to-[#2d5570] text-white text-sm font-bold border-b-4 border-[#FF9F4A]">
                  <th className="px-6 py-4 border-r border-white/20">الحلقة</th>
                  <th className="px-6 py-4 border-r border-white/20">البرنامج</th>
                  <th className="px-6 py-4 border-r border-white/20">تاريخ البث</th>
                  <th className="px-6 py-4 border-r border-white/20">الحالة</th>
                  <th className="px-6 py-4 border-r border-white/20">الضيوف / المحتوى</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {episodes.map((e, index) => (
                  <tr 
                    key={e.id} 
                    className={cn(
                      "hover:bg-blue-50 transition-all group cursor-pointer border-l-4 border-l-[#FF9F4A]",
                      index % 2 === 0 ? "bg-white" : "bg-slate-50"
                    )}
                    onClick={() => navigate(`/episodes/${e.id}`)}
                  >
                    <td className="px-6 py-5 border-r border-slate-200">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 group-hover:text-[#3d6a8a] transition-colors">{e.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono font-bold">الحلقة #{e.episode_number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 border-r border-slate-200 font-bold text-slate-700 text-sm">{e.program_title}</td>
                    <td className="px-6 py-5 border-r border-slate-200">
                      <span className="font-mono text-sm text-slate-700 font-medium bg-orange-50 px-2.5 py-1 rounded-lg inline-block">
                        {e.air_date ? format(new Date(e.air_date), 'yyyy/MM/dd') : 'غير محدد'}
                      </span>
                    </td>
                    <td className="px-6 py-5 border-r border-slate-200">
                      {e.status_name && <Badge variant={getStatusVariant(e.status_name)}>{e.status_name}</Badge>}
                    </td>
                    <td className="px-6 py-5 border-r border-slate-200">
                      <div className="flex items-center gap-3">
                         <div className="flex items-center gap-1 text-[10px] font-black text-slate-400">
                           <Users size={12} />
                           {e.guest_count || 0} ضيوف
                         </div>
                         <div className="flex items-center gap-1 text-[10px] font-black text-slate-400">
                           <PlayCircle size={12} />
                           {e.content_count || 0} محتوى
                         </div>
                      </div>
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
                <p className="text-slate-600 font-medium">جاري تحميل الحلقات...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Program Modal */}
      <Modal isOpen={isProgramModalOpen} onClose={() => setIsProgramModalOpen(false)} title="إضافة برنامج جديد">
        <ProgramForm onSuccess={() => { setIsProgramModalOpen(false); fetchPrograms(); }} onCancel={() => setIsProgramModalOpen(false)} />
      </Modal>

      {/* Episode Modal */}
      <Modal isOpen={isEpisodeModalOpen} onClose={() => setIsEpisodeModalOpen(false)} title="إضافة حلقة جديدة">
        <EpisodeForm 
          programs={programs}
          initialProgramId={episodeFilter.program_id}
          onSuccess={() => { setIsEpisodeModalOpen(false); fetchEpisodes(); }} 
          onCancel={() => setIsEpisodeModalOpen(false)} 
        />
      </Modal>
    </div>
  );
}

function getStatusVariant(status: string) {
  const s = status.toLowerCase();
  if (s.includes('done') || s.includes('complete') || s.includes('بث')) return 'green';
  if (s.includes('progress') || s.includes('جاري')) return 'blue';
  if (s.includes('pending') || s.includes('معلق')) return 'yellow';
  return 'gray';
}

/** 
 * Forms Components 
*/

function ProgramForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [loading, setLoading] = useState(false);
  const [units, setUnits] = useState<MediaUnit[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    media_unit_id: '',
    air_time: ''
  });

  useEffect(() => {
    api.get<{ success: boolean, data: MediaUnit[] }>('/api/portal/media-units').then(res => {
      if (res.success) setUnits(res.data);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post<{ success: boolean }>('/api/portal/programs', {
        ...formData,
        media_unit_id: Number(formData.media_unit_id)
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
      <Input label="اسم البرنامج" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
      <Textarea label="وصف البرنامج" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
      <div className="grid grid-cols-2 gap-4">
        <Select 
          label="الوحدة الإعلامية" 
          required 
          options={[{ value: '', label: 'اختر الوحدة...' }, ...units.map(u => ({ value: u.id.toString(), label: u.name }))]}
          value={formData.media_unit_id}
          onChange={e => setFormData({...formData, media_unit_id: e.target.value})}
        />
        <Input label="وقت البث" type="time" required value={formData.air_time} onChange={e => setFormData({...formData, air_time: e.target.value})} />
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <Button variant="ghost" type="button" onClick={onCancel}>إلغاء</Button>
        <Button type="submit" loading={loading} disabled={!formData.title || !formData.media_unit_id}>إنشاء البرنامج</Button>
      </div>
    </form>
  );
}

function EpisodeForm({ programs, initialProgramId, onSuccess, onCancel }: { programs: Program[], initialProgramId?: string, onSuccess: () => void, onCancel: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    program_id: initialProgramId || '',
    title: '',
    episode_number: '',
    air_date: ''
  });

  useEffect(() => {
    if (initialProgramId) {
      setFormData(prev => ({ ...prev, program_id: initialProgramId }));
    }
  }, [initialProgramId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post<{ success: boolean }>('/api/portal/episodes', {
        ...formData,
        program_id: Number(formData.program_id),
        episode_number: Number(formData.episode_number)
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
      <Select 
        label="البرنامج" 
        required 
        options={[{ value: '', label: 'اختر البرنامج...' }, ...programs.map(p => ({ value: p.id.toString(), label: p.name }))]}
        value={formData.program_id}
        onChange={e => setFormData({...formData, program_id: e.target.value})}
      />
      <Input label="عنوان الحلقة" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
      <div className="grid grid-cols-2 gap-4">
        <Input label="رقم الحلقة" type="number" required value={formData.episode_number} onChange={e => setFormData({...formData, episode_number: e.target.value})} />
        <Input label="تاريخ البث" type="date" required value={formData.air_date} onChange={e => setFormData({...formData, air_date: e.target.value})} />
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <Button variant="ghost" type="button" onClick={onCancel}>إلغاء</Button>
        <Button type="submit" loading={loading} disabled={!formData.program_id || !formData.title}>إنشاء الحلقة</Button>
      </div>
    </form>
  );
}
