import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowRight, PlayCircle, Calendar, Users, List, Plus, Trash2, Search, FileText, Layers, ChevronLeft, CheckCircle2, User, Phone } from 'lucide-react';
import { api } from '../services/api';
import { EpisodeDetails, Guest, Task, Content } from '../types';
import { Button, Input, Textarea } from './ui/Inputs';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function EpisodeDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [episode, setEpisode] = useState<EpisodeDetails | null>(null);
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [isNewGuestModalOpen, setIsNewGuestModalOpen] = useState(false);
  const [guestSearch, setGuestSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Guest[]>([]);
  const [newGuest, setNewGuest] = useState({ name: '', title: '', bio: '', phone: '' });
  const [newGuestLoading, setNewGuestLoading] = useState(false);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: EpisodeDetails }>(`/api/portal/episodes/${id}/full`);
      if (res.success) setEpisode(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDetails(); }, [id]);

  useEffect(() => {
    if (guestSearch.length > 1) {
      api.get<{ success: boolean; data: Guest[] }>(`/api/portal/guests/search?name=${encodeURIComponent(guestSearch)}`)
        .then(res => { if (res.success) setSearchResults(res.data); })
        .catch(() => setSearchResults([]));
    } else {
      setSearchResults([]);
    }
  }, [guestSearch]);

  const handleAddExistingGuest = async (guestId: number) => {
    try {
      const res = await api.post<{ success: boolean }>(`/api/portal/episodes/${id}/guests`, { guest_id: guestId });
      if (res.success) { setIsGuestModalOpen(false); setGuestSearch(''); fetchDetails(); }
    } catch (err) { console.error(err); }
  };

  const handleCreateNewGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewGuestLoading(true);
    try {
      const gRes = await api.post<{ success: boolean; data: Guest }>('/api/portal/guests', newGuest);
      if (gRes.success && gRes.data) {
        await api.post<{ success: boolean }>(`/api/portal/episodes/${id}/guests`, { guest_id: gRes.data.id });
        setIsNewGuestModalOpen(false);
        setNewGuest({ name: '', title: '', bio: '', phone: '' });
        fetchDetails();
      }
    } catch (err) { console.error(err); }
    finally { setNewGuestLoading(false); }
  };

  const handleRemoveGuest = async (guestId: number) => {
    if (!confirm('هل تريد حذف الضيف من الحلقة؟')) return;
    try {
      const res = await api.delete<{ success: boolean }>(`/api/portal/episodes/${id}/guests/${guestId}`);
      if (res.success) fetchDetails();
    } catch (err) { console.error(err); }
  };

  if (loading) return (
    <div className="p-16 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
        <div className="w-8 h-8 border-4 border-[#3d6a8a] border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-slate-600 font-medium">جاري تحميل تفاصيل الحلقة...</p>
    </div>
  );

  if (!episode) return <div className="p-16 text-center"><h3 className="text-xl font-bold text-red-600">لم يتم العثور على الحلقة</h3></div>;

  return (
    <div className="space-y-8 pb-12">
      {/* Back Link - goes to the program that owns this episode */}
      <Link to={episode.program_id ? `/programs/${episode.program_id}` : '/programs'} className="flex items-center gap-2 text-slate-400 hover:text-[#3d6a8a] transition-colors w-fit group">
        <ArrowRight size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-bold">العودة للبرنامج</span>
      </Link>

      {/* Episode Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#3d6a8a] to-[#2d5570] p-8 border-b-4 border-[#FF9F4A]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge variant="blue" className="bg-white/20 text-white border-white/30">{episode.program_title}</Badge>
                <span className="text-xs font-mono font-bold text-white/60">الحلقة #{episode.episode_number}</span>
              </div>
              <h1 className="text-3xl font-black text-white flex items-center gap-3">
                <PlayCircle size={32} className="text-[#FF9F4A]" />
                {episode.title}
              </h1>
              <div className="flex flex-wrap gap-3 pt-1">
                <div className="flex items-center gap-2 text-white/80 text-sm font-medium bg-white/10 px-4 py-1.5 rounded-lg">
                  <Calendar size={16} className="text-[#FF9F4A]" />
                  {episode.air_date ? format(new Date(episode.air_date), 'yyyy/MM/dd') : 'تاريخ غير محدد'}
                </div>
                {episode.status_name && (
                  <Badge variant={getStatusVariant(episode.status_name)} className="px-4 py-1.5">{episode.status_name}</Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 rtl:divide-x-reverse">
          <div className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600"><Users size={24} /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الضيوف</p>
              <p className="text-lg font-black text-slate-900">{episode.guests?.length || 0} ضيف</p>
            </div>
          </div>
          <div className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600"><List size={24} /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المهام</p>
              <p className="text-lg font-black text-slate-900">{episode.tasks?.length || 0} مهمة</p>
            </div>
          </div>
          <div className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600"><FileText size={24} /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المحتوى</p>
              <p className="text-lg font-black text-slate-900">{episode.content?.length || 0} محتوى</p>
            </div>
          </div>
        </div>
      </div>

      {/* ========== GUESTS TABLE ========== */}
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xl">
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Users size={22} className="text-purple-600" />
            ضيوف الحلقة
          </h2>
          <div className="flex gap-2">
            <Button onClick={() => setIsGuestModalOpen(true)} variant="ghost" className="gap-2 text-slate-600 hover:bg-slate-100">
              <Search size={16} /> بحث وإضافة
            </Button>
            <Button onClick={() => setIsNewGuestModalOpen(true)} className="gap-2 bg-[#3d6a8a] hover:bg-[#2d5570] text-white">
              <Plus size={18} /> ضيف جديد
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-gradient-to-r from-[#3d6a8a] to-[#2d5570] text-white text-sm font-bold border-b-4 border-[#FF9F4A]">
                <th className="px-6 py-4 border border-[#FF9F4A]">الاسم</th>
                <th className="px-6 py-4 border border-[#FF9F4A]">اللقب / المنصب</th>
                <th className="px-6 py-4 border border-[#FF9F4A]">الهاتف</th>
                <th className="px-6 py-4 border border-[#FF9F4A]">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#FF9F4A] border-b-4 border-[#FF9F4A]">
              <AnimatePresence mode="popLayout">
                {(episode.guests || []).map((guest, index) => (
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
                          <span className="font-mono text-sm text-slate-700 bg-green-50 px-2.5 py-1 rounded-lg" dir="ltr">{guest.phone}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-5 border border-[#FF9F4A]">
                      <button
                        onClick={() => handleRemoveGuest(guest.id)}
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

          {(!episode.guests || episode.guests.length === 0) && (
            <div className="p-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                <Users className="text-slate-400" size={32} />
              </div>
              <p className="text-slate-500 font-bold mb-4">لا يوجد ضيوف مضافين لهذه الحلقة</p>
              <Button onClick={() => setIsNewGuestModalOpen(true)} className="gap-2 bg-[#3d6a8a] hover:bg-[#2d5570] text-white">
                <Plus size={16} /> إضافة ضيف
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ========== TASKS TABLE ========== */}
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xl">
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <List size={22} className="text-blue-600" />
            المهام المرتبطة
          </h2>
          {episode.tasks && episode.tasks.length > 0 && (
            <Badge variant="blue">{episode.tasks.length} مهمة</Badge>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-gradient-to-r from-[#3d6a8a] to-[#2d5570] text-white text-sm font-bold border-b-4 border-[#FF9F4A]">
                <th className="px-6 py-4 border border-[#FF9F4A]">المهمة</th>
                <th className="px-6 py-4 border border-[#FF9F4A]">الحالة</th>
                <th className="px-6 py-4 border border-[#FF9F4A]">الموعد النهائي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#FF9F4A] border-b-4 border-[#FF9F4A]">
              <AnimatePresence mode="popLayout">
                {(episode.tasks || []).map((task, index) => (
                  <motion.tr
                    layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    key={task.id}
                    className={cn(
                      "hover:bg-blue-50 transition-all group cursor-pointer border-l-4 border-l-[#FF9F4A]",
                      index % 2 === 0 ? "bg-white" : "bg-slate-50"
                    )}
                    onClick={() => navigate(`/tasks/${task.id}`)}
                  >
                    <td className="px-6 py-5 border border-[#FF9F4A]">
                      <span className="text-base font-bold text-slate-900 group-hover:text-[#3d6a8a] transition-colors">
                        {task.title}
                      </span>
                    </td>
                    <td className="px-6 py-5 border border-[#FF9F4A]">
                      <Badge variant={getTaskStatusVariant(task.status_name || '')}>{task.status_name || 'غير محدد'}</Badge>
                    </td>
                    <td className="px-6 py-5 border border-[#FF9F4A]">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-[#FF9F4A]" />
                        <span className="font-mono text-sm text-slate-700 font-medium bg-orange-50 px-2.5 py-1 rounded-lg">
                          {task.deadline ? format(new Date(task.deadline), 'yyyy/MM/dd') : 'غير محدد'}
                        </span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>

          {(!episode.tasks || episode.tasks.length === 0) && (
            <div className="p-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                <List className="text-slate-400" size={32} />
              </div>
              <p className="text-slate-500 font-bold">لا توجد مهام مرتبطة بهذه الحلقة</p>
            </div>
          )}
        </div>
      </div>

      {/* ========== CONTENT TABLE ========== */}
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xl">
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <FileText size={22} className="text-green-600" />
            المحتوى المنتج
          </h2>
          {episode.content && episode.content.length > 0 && (
            <Badge variant="green">{episode.content.length} محتوى</Badge>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-gradient-to-r from-[#3d6a8a] to-[#2d5570] text-white text-sm font-bold border-b-4 border-[#FF9F4A]">
                <th className="px-6 py-4 border border-[#FF9F4A]">العنوان</th>
                <th className="px-6 py-4 border border-[#FF9F4A]">النوع</th>
                <th className="px-6 py-4 border border-[#FF9F4A]">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#FF9F4A] border-b-4 border-[#FF9F4A]">
              <AnimatePresence mode="popLayout">
                {(episode.content || []).map((content, index) => (
                  <motion.tr
                    layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    key={content.id}
                    className={cn(
                      "hover:bg-blue-50 transition-all group cursor-pointer border-l-4 border-l-[#FF9F4A]",
                      index % 2 === 0 ? "bg-white" : "bg-slate-50"
                    )}
                    onClick={() => navigate(`/content/${content.id}`)}
                  >
                    <td className="px-6 py-5 border border-[#FF9F4A]">
                      <span className="text-base font-bold text-slate-900 group-hover:text-[#3d6a8a] transition-colors">
                        {content.title}
                      </span>
                    </td>
                    <td className="px-6 py-5 border border-[#FF9F4A]">
                      <Badge variant="blue">{content.content_type_name || 'غير محدد'}</Badge>
                    </td>
                    <td className="px-6 py-5 border border-[#FF9F4A]">
                      {content.is_final ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-green-500" />
                          <span className="text-sm font-bold text-green-600">نهائي</span>
                        </div>
                      ) : (
                        <span className="text-sm font-bold text-slate-500">مسودة</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>

          {(!episode.content || episode.content.length === 0) && (
            <div className="p-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                <FileText className="text-slate-400" size={32} />
              </div>
              <p className="text-slate-500 font-bold">لم يتم إنتاج محتوى بعد لهذه الحلقة</p>
            </div>
          )}
        </div>
      </div>

      {/* ========== MODALS ========== */}
      {/* Search Guest Modal */}
      <Modal isOpen={isGuestModalOpen} onClose={() => { setIsGuestModalOpen(false); setGuestSearch(''); }} title="البحث عن ضيف وإضافته">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input
              placeholder="ابحث بالاسم (حرفين على الأقل)..."
              className="pr-12 h-12 text-base bg-slate-50 border-slate-200 focus:bg-white"
              value={guestSearch}
              onChange={e => setGuestSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200">
            {searchResults.map(g => (
              <div key={g.id} className="p-4 hover:bg-blue-50 flex items-center justify-between transition-all cursor-pointer group" onClick={() => handleAddExistingGuest(g.id)}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{g.name}</p>
                    <p className="text-xs text-slate-400">{g.title || 'بدون لقب'}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#3d6a8a] bg-blue-50 px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">+ إضافة</span>
              </div>
            ))}
            {guestSearch.length > 1 && searchResults.length === 0 && (
              <div className="p-8 text-center text-slate-400 font-bold">لم يتم العثور على نتائج</div>
            )}
            {guestSearch.length <= 1 && (
              <div className="p-8 text-center text-slate-300 font-medium">ابدأ بالكتابة للبحث...</div>
            )}
          </div>
        </div>
      </Modal>

      {/* New Guest Modal */}
      <Modal isOpen={isNewGuestModalOpen} onClose={() => setIsNewGuestModalOpen(false)} title="إضافة ضيف جديد">
        <form onSubmit={handleCreateNewGuest} className="space-y-4">
          <Input label="الاسم الكامل" required value={newGuest.name} onChange={e => setNewGuest({ ...newGuest, name: e.target.value })} />
          <Input label="اللقب / المنصب" placeholder="مثال: محلل سياسي، دكتور..." value={newGuest.title} onChange={e => setNewGuest({ ...newGuest, title: e.target.value })} />
          <Input label="رقم الهاتف" value={newGuest.phone} onChange={e => setNewGuest({ ...newGuest, phone: e.target.value })} dir="ltr" placeholder="+962..." />
          <Textarea label="نبذة مختصرة" value={newGuest.bio} onChange={e => setNewGuest({ ...newGuest, bio: e.target.value })} placeholder="معلومات عن الضيف..." />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="ghost" type="button" onClick={() => setIsNewGuestModalOpen(false)}>إلغاء</Button>
            <Button type="submit" isLoading={newGuestLoading} disabled={!newGuest.name} className="bg-[#3d6a8a] hover:bg-[#2d5570] text-white">
              إنشاء وإضافة للحلقة
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function getStatusVariant(status: string): 'gray' | 'yellow' | 'blue' | 'purple' | 'green' | 'red' {
  const s = status.toLowerCase();
  if (s.includes('done') || s.includes('complete') || s.includes('بث')) return 'green';
  if (s.includes('progress') || s.includes('جاري')) return 'blue';
  if (s.includes('review') || s.includes('مراجعة')) return 'purple';
  if (s.includes('pending') || s.includes('معلق')) return 'yellow';
  if (s.includes('cancel') || s.includes('ملغ')) return 'red';
  return 'gray';
}

function getTaskStatusVariant(status: string): 'gray' | 'yellow' | 'blue' | 'purple' | 'green' | 'red' {
  const s = status.toLowerCase();
  if (s.includes('done') || s.includes('complete') || s.includes('منجز')) return 'green';
  if (s.includes('progress') || s.includes('جاري')) return 'blue';
  if (s.includes('review') || s.includes('مراجعة')) return 'purple';
  if (s.includes('pending') || s.includes('معلق')) return 'yellow';
  if (s.includes('cancel') || s.includes('ملغ')) return 'red';
  return 'gray';
}
