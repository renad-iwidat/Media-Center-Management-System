import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, PlayCircle, Calendar, Users, List, 
  Plus, Edit, Trash2, Search, UserPlus, FileText, 
  Layers, ChevronLeft, CheckCircle2, AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { EpisodeDetails, Guest, Task, Content } from '../types';
import { Button, Input, Select, Textarea } from './ui/Inputs';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export default function EpisodeDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [episode, setEpisode] = useState<EpisodeDetails | null>(null);
  
  // Guest Management
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [isNewGuestModalOpen, setIsNewGuestModalOpen] = useState(false);
  const [guestSearch, setGuestSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Guest[]>([]);
  const [newGuest, setNewGuest] = useState({ name: '', title: '', bio: '', phone: '' });

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: EpisodeDetails }>(`/api/portal/episodes/${id}/full`);
      if (res.success) setEpisode(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  useEffect(() => {
    if (guestSearch.length > 2) {
      api.get<{ success: boolean; data: Guest[] }>(`/api/portal/guests/search?query=${guestSearch}`)
        .then(res => { if (res.success) setSearchResults(res.data); });
    } else {
      setSearchResults([]);
    }
  }, [guestSearch]);

  const handleAddExistingGuest = async (guestId: number) => {
    try {
      const res = await api.post<{ success: boolean }>(`/api/portal/episodes/${id}/guests`, { guest_id: guestId });
      if (res.success) {
        setIsGuestModalOpen(false);
        setGuestSearch('');
        fetchDetails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateNewGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const gRes = await api.post<{ success: boolean; data: Guest }>('/api/portal/guests', newGuest);
      if (gRes.success && gRes.data) {
        await api.post<{ success: boolean }>(`/api/portal/episodes/${id}/guests`, { guest_id: gRes.data.id });
        setIsNewGuestModalOpen(false);
        setNewGuest({ name: '', title: '', bio: '', phone: '' });
        fetchDetails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveGuest = async (guestId: number) => {
    if (!window.confirm('هل تريد حذف الضيف من الحلقة؟')) return;
    try {
      const res = await api.delete<{ success: boolean }>(`/api/portal/episodes/${id}/guests/${guestId}`);
      if (res.success) fetchDetails();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-400 font-bold">جاري تحميل تفاصيل الحلقة...</div>;
  if (!episode) return <div className="p-12 text-center text-red-500 font-bold">لم يتم العثور على الحلقة</div>;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-6">
        <Link to="/programs" state={{ activeTab: 'episodes' }} className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors w-fit group">
          <ArrowRight size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold font-sans">العودة للحلقات</span>
        </Link>

        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden">
           {/* Decorative background element */}
           <div className="absolute top-0 left-0 w-32 h-32 bg-blue-50/50 -translate-x-16 -translate-y-16 rounded-full" />
           
           <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3">
                 <div className="flex items-center gap-3">
                    <Badge variant="blue">{episode.program_title}</Badge>
                    <span className="text-xs font-mono font-bold text-slate-400 tracking-tighter">EPISODE #{episode.episode_number}</span>
                 </div>
                 <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                   <PlayCircle size={36} className="text-blue-600" />
                   {episode.title}
                 </h1>
                 <div className="flex flex-wrap gap-4 pt-2">
                    <div className="flex items-center gap-2 text-slate-500 font-bold text-sm bg-slate-50 px-4 py-1.5 rounded-full">
                       <Calendar size={16} />
                       {episode.air_date ? format(new Date(episode.air_date), 'yyyy/MM/dd') : 'تاريخ غير محدد'}
                    </div>
                    {episode.status_name && (
                      <Badge variant={getStatusVariant(episode.status_name)} className="px-5 py-1.5 rounded-full shadow-sm">
                        {episode.status_name}
                      </Badge>
                    )}
                 </div>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" className="gap-2 h-12 px-6">
                  <Edit size={18} />
                  تعديل
                </Button>
                <Button variant="ghost" className="text-red-600 hover:bg-red-50 gap-2 h-12 px-6">
                  <Trash2 size={18} />
                  حذف
                </Button>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Guests & Tasks */}
        <div className="lg:col-span-2 space-y-8">
           {/* Guests Section */}
           <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                 <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                   <Users size={20} className="text-purple-600" />
                   ضيوف الحلقة
                 </h4>
                 <div className="flex gap-2">
                    <Button size="sm" variant="secondary" className="gap-1.5 font-bold" onClick={() => setIsGuestModalOpen(true)}>
                      <Search size={14} />
                      إضافة ضيف
                    </Button>
                    <Button size="sm" className="gap-1.5 font-bold" onClick={() => setIsNewGuestModalOpen(true)}>
                      <Plus size={14} />
                      ضيف جديد
                    </Button>
                 </div>
              </div>
              <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                 {episode.guests.map(g => (
                   <div key={g.id} className="p-4 rounded-2xl hover:bg-slate-50 border border-slate-50 transition-all flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                         <div className="w-12 h-12 bg-white rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-purple-600 transition-colors shadow-sm">
                           <Users size={24} />
                         </div>
                         <div>
                            <p className="font-black text-slate-900">{g.name}</p>
                            <p className="text-xs font-bold text-slate-400">{g.title || 'بدون مسمى وظيفي'}</p>
                         </div>
                      </div>
                      <button onClick={() => handleRemoveGuest(g.id)} className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 size={18} />
                      </button>
                   </div>
                 ))}
                 {episode.guests.length === 0 && (
                   <div className="col-span-full py-12 text-center text-slate-400 font-bold">لا يوجد ضيوف مضافين لهذه الحلقة</div>
                 )}
              </div>
           </div>

           {/* Tasks Section */}
           <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                 <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                   <List size={20} className="text-blue-600" />
                   المهام المرتبطة
                 </h4>
                 {episode.tasks.length > 0 && <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-widest">{episode.tasks.length} مهمة</span>}
              </div>
              <div className="divide-y divide-slate-50">
                 {episode.tasks.map(t => (
                   <Link key={t.id} to={`/tasks/${t.id}`} className="p-5 flex items-center justify-between hover:bg-slate-50/50 transition-all group">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                           <Layers size={20} />
                         </div>
                         <div>
                            <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{t.title}</p>
                            <div className="flex items-center gap-3 mt-1.5">
                               <p className="text-[10px] font-black text-slate-400 flex items-center gap-1 uppercase tracking-tight">
                                  <Calendar size={12} />
                                  {format(new Date(t.deadline), 'yyyy/MM/dd')}
                               </p>
                               <Badge variant={t.status_name === 'Completed' ? 'green' : 'blue'}>{t.status_name}</Badge>
                            </div>
                         </div>
                      </div>
                      <ChevronLeft size={18} className="text-slate-300 group-hover:text-blue-600 transition-all" />
                   </Link>
                 ))}
                 {episode.tasks.length === 0 && (
                   <div className="p-12 text-center text-slate-400 font-bold">لا توجد مهام مرتبطة مباشرة بهذه الحلقة</div>
                 )}
              </div>
           </div>
        </div>

        {/* Right Column: Content */}
        <div className="space-y-8">
           <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden h-full flex flex-col">
              <div className="p-6 border-b border-slate-100 bg-slate-50/30">
                 <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                   <FileText size={20} className="text-green-600" />
                   المحتوى المنتج
                 </h4>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[700px]">
                 {episode.content.map(c => (
                   <Link key={c.id} to={`/content/${c.id}`} className="block p-4 bg-slate-50/50 hover:bg-white border border-transparent hover:border-slate-100 rounded-2xl shadow-sm transition-all group">
                      <p className="font-bold text-slate-900 mb-2 group-hover:text-green-600 transition-colors">{c.title}</p>
                      <div className="flex items-center justify-between">
                         <Badge variant="blue">{c.content_type_name}</Badge>
                         {c.is_final && <div className="flex items-center gap-1 text-[10px] font-black text-green-600"><CheckCircle2 size={12}/> نهائي</div>}
                      </div>
                   </Link>
                 ))}
                 {episode.content.length === 0 && (
                   <div className="p-8 text-center bg-slate-50/30 rounded-2xl border border-dashed border-slate-100">
                      <AlertCircle size={32} className="mx-auto text-slate-200 mb-2" />
                      <p className="text-xs text-slate-400 font-bold">لم يتم إنتاج محتوى بعد لهذه الحلقة</p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      </div>

      {/* Guest Selection Modal */}
      <Modal isOpen={isGuestModalOpen} onClose={() => setIsGuestModalOpen(false)} title="البحث عن ضيف موجود">
        <div className="space-y-6">
           <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input 
                placeholder="ابحث بالاسم أو اللقب..." 
                className="pr-12" 
                value={guestSearch} 
                onChange={e => setGuestSearch(e.target.value)} 
                autoFocus
              />
           </div>
           <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-50 -mx-1 px-1">
              {searchResults.map(g => (
                <div key={g.id} className="p-4 hover:bg-slate-50 flex items-center justify-between rounded-xl transition-all cursor-pointer group" onClick={() => handleAddExistingGuest(g.id)}>
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                        <Users size={20} />
                      </div>
                      <div>
                         <p className="font-bold text-slate-900">{g.name}</p>
                         <p className="text-xs font-bold text-slate-400">{g.title}</p>
                      </div>
                   </div>
                   <Button variant="ghost" size="sm" className="text-blue-600 font-black">إضافة</Button>
                </div>
              ))}
              {guestSearch.length > 2 && searchResults.length === 0 && (
                <div className="py-8 text-center text-slate-400 font-bold">لم يتم العثور على نتائج للـ "{guestSearch}"</div>
              )}
              {guestSearch.length <= 2 && (
                <div className="py-8 text-center text-slate-300 font-bold">ابدأ بالكتابة للبحث (3 أحرف على الأقل)</div>
              )}
           </div>
        </div>
      </Modal>

      {/* New Guest Modal */}
      <Modal isOpen={isNewGuestModalOpen} onClose={() => setIsNewGuestModalOpen(false)} title="إضافة ضيف جديد كلياً">
         <form onSubmit={handleCreateNewGuest} className="space-y-4">
            <Input label="الاسم الكامل" required value={newGuest.name} onChange={e => setNewGuest({...newGuest, name: e.target.value})} />
            <Input label="اللقب / المسمى الوظيفي" placeholder="مثل: محلل سياسي" value={newGuest.title} onChange={e => setNewGuest({...newGuest, title: e.target.value})} />
            <Input label="رقم الهاتف" type="tel" value={newGuest.phone} onChange={e => setNewGuest({...newGuest, phone: e.target.value})} />
            <Textarea label="نبذة مختصرة" rows={3} value={newGuest.bio} onChange={e => setNewGuest({...newGuest, bio: e.target.value})} />
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
               <Button variant="ghost" type="button" onClick={() => setIsNewGuestModalOpen(false)}>إلغاء</Button>
               <Button type="submit" disabled={!newGuest.name}>إنشاء وإضافة للحلقة</Button>
            </div>
         </form>
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
