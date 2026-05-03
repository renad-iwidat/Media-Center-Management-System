import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, FileVideo, User, Calendar, 
  Globe, HardDrive, Clock, Tag, Plus, 
  Trash2, RefreshCw, Link as LinkIcon, 
  CheckCircle2, Archive, Edit, Info, ExternalLink, X,
  Briefcase
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ContentDetails, Task } from '../types';
import { Button, Input, Select } from './ui/Inputs';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export default function ContentDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<ContentDetails | null>(null);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [newTag, setNewTag] = useState('');
  
  const [isReuseModalOpen, setIsReuseModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  
  const [selectedTaskId, setSelectedTaskId] = useState('');

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: ContentDetails }>(`/api/content/${id}`);
      if (res.success) setContent(res.data);
      
      const tasksRes = await api.get<{ success: boolean; data: Task[] }>('/api/tasks?limit=100');
      if (tasksRes.success) setAllTasks(tasksRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleMarkFinal = async () => {
    if (!window.confirm('هل تريد تعليم هذا المحتوى كنسخة نهائية؟ سيتم أرشفته تلقائياً.')) return;
    try {
      const res = await api.put<{ success: boolean }>(`/api/content/${id}`, { is_final: true });
      if (res.success) fetchDetails();
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchive = async () => {
    if (!user) return;
    try {
      const res = await api.post<{ success: boolean }>(`/api/content/${id}/archive`, { archived_by: user.id });
      if (res.success) fetchDetails();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim()) return;
    try {
      // Assuming a generic endpoint for adding tags to content
      const res = await api.post<{ success: boolean }>(`/api/content/${id}/tags`, { tag_name: newTag.trim() });
      if (res.success) {
        setNewTag('');
        fetchDetails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveTag = async (tagName: string) => {
    try {
      const res = await api.delete<{ success: boolean }>(`/api/content/${id}/tags/${tagName}`);
      if (res.success) fetchDetails();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReuse = async () => {
    if (!user || !selectedTaskId) return;
    try {
      const res = await api.post<{ success: boolean }>(`/api/content/${id}/reuse`, {
        task_id: Number(selectedTaskId),
        reused_by: user.id
      });
      if (res.success) {
        setIsReuseModalOpen(false);
        setSelectedTaskId('');
        fetchDetails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLinkTask = async () => {
    if (!user || !selectedTaskId) return;
    try {
      const res = await api.post<{ success: boolean }>(`/api/content/${id}/link-task`, {
        task_id: Number(selectedTaskId),
        linked_by: user.id,
        usage_type: 'reference'
      });
      if (res.success) {
        setIsLinkModalOpen(false);
        setSelectedTaskId('');
        fetchDetails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnlinkTask = async (taskId: number) => {
    try {
      const res = await api.delete<{ success: boolean }>(`/api/content/${id}/unlink-task/${taskId}`);
      if (res.success) fetchDetails();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المحتوى نهائياً؟')) return;
    try {
      const res = await api.delete<{ success: boolean }>(`/api/content/${id}`);
      if (res.success) navigate('/content');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-400 font-bold">جاري جلب تفاصيل المحتوى...</div>;
  if (!content) return <div className="p-12 text-center text-red-500 font-bold">لم يتم العثور على المحتوى المطلوبة</div>;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-6">
        <Link to="/content" className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors w-fit group">
          <ArrowRight size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold">العودة للأرشيف</span>
        </Link>
        
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge variant="blue" className="px-4 py-1 text-[12px]">
                  {content.content_type_name}
                </Badge>
                {content.is_final && <Badge variant="green" className="gap-1.5"><CheckCircle2 size={12}/> نسخة نهائية</Badge>}
                {content.archived && <Badge variant="purple" className="gap-1.5"><Archive size={12}/> مؤرشف</Badge>}
                <span className="text-xs font-mono font-bold text-slate-400">#{content.id}</span>
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">{content.title}</h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {!content.is_final && (
                <Button onClick={handleMarkFinal} variant="secondary" className="gap-2 bg-green-50 border-green-100 text-green-700 hover:bg-green-100">
                  <CheckCircle2 size={18} />
                  تعليم كنهائي
                </Button>
              )}
              {!content.archived && (
                <Button onClick={handleArchive} variant="secondary" className="gap-2 bg-purple-50 border-purple-100 text-purple-700 hover:bg-purple-100">
                  <Archive size={18} />
                  أرشفة يدوية
                </Button>
              )}
              <Button onClick={() => setIsReuseModalOpen(true)} className="gap-2 shadow-lg shadow-blue-600/20">
                <RefreshCw size={18} />
                إعادة استخدام
              </Button>
              <Button onClick={handleDelete} variant="ghost" className="gap-2 text-red-600 hover:bg-red-100">
                <Trash2 size={18} />
                حذف
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-10 pt-8 border-t border-slate-100">
            <InfoItem icon={<User size={18} />} label="المنشئ" value={content.created_by_name || 'غير معروف'} isHighlight />
            <InfoItem icon={<Calendar size={18} />} label="تاريخ الإنشاء" value={format(new Date(content.created_at), 'yyyy/MM/dd HH:mm')} />
            <InfoItem icon={<HardDrive size={18} />} label="الحجم" value={content.file_size ? `${(content.file_size / 1024 / 1024).toFixed(2)} MB` : 'غير متوفر'} />
            <InfoItem icon={<Clock size={18} />} label="المدة" value={content.duration ? `${Math.floor(content.duration / 60)}:${(content.duration % 60).toString().padStart(2, '0')}` : 'غير متوفر'} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           {/* Section 1: Preview & Tags */}
           <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8">
              <div className="aspect-video bg-slate-900 rounded-2xl flex items-center justify-center relative group overflow-hidden border-4 border-slate-50">
                 <FileVideo size={64} className="text-white/10" />
                 {content.cloud_url && (
                   <a 
                     href="#"
                     onClick={async (e) => {
                       e.preventDefault();
                       try {
                         const res = await api.get<{ success: boolean; data: { download_url: string } }>(`/api/content/${id}/download-url`);
                         if (res.success && res.data?.download_url) {
                           window.open(res.data.download_url, '_blank');
                         } else {
                           window.open(content.cloud_url, '_blank');
                         }
                       } catch (err) {
                         console.error('Error getting download URL:', err);
                         window.open(content.cloud_url, '_blank');
                       }
                     }}
                     className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2 text-white font-bold text-lg"
                   >
                     <ExternalLink size={24} />
                     فتح الرابط السحابي
                   </a>
                 )}
              </div>

              <div className="space-y-4">
                 <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                   <Tag size={20} className="text-blue-600" />
                   الوسوم والمواضيع
                 </h4>
                 <div className="flex flex-wrap gap-2">
                    {content.tags.map((tag, idx) => (
                      <span key={idx} className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 text-sm font-bold flex items-center gap-2 group">
                        {tag}
                        <button onClick={() => handleRemoveTag(tag)} className="text-slate-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100">
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                    <form onSubmit={handleAddTag} className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="وسم جديد..." 
                        className="bg-transparent border-b border-slate-200 outline-none focus:border-blue-600 px-1 text-sm font-bold w-24 transition-all focus:w-32"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                      />
                      <button type="submit" className="text-blue-600 hover:scale-110 transition-transform"><Plus size={18} /></button>
                    </form>
                 </div>
              </div>
           </div>

           {/* Section 2: Linked Tasks & Missions */}
           <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                 <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                   <LinkIcon size={20} className="text-blue-600" />
                   الربط مع المهام
                 </h4>
                 <Button onClick={() => setIsLinkModalOpen(true)} variant="secondary" size="sm" className="bg-slate-50 font-bold">ربط بمهمة</Button>
              </div>
              <div className="divide-y divide-slate-50">
                 {content.linked_tasks.map((link) => (
                   <div key={link.task_id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-black">
                           <Briefcase size={20} />
                         </div>
                         <div>
                            <Link to={`/tasks/${link.task_id}`} className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors">{link.task_title}</Link>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">
                               <span>بواسطة: {link.linked_by_name}</span>
                               <span>•</span>
                               <span>نوع: {link.usage_type}</span>
                            </div>
                         </div>
                      </div>
                      <button onClick={() => handleUnlinkTask(link.task_id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 size={18} />
                      </button>
                   </div>
                 ))}
                 {content.linked_tasks.length === 0 && (
                   <div className="p-12 text-center text-slate-400 font-bold">لا توجد مهام مرتبطة حالياً</div>
                 )}
              </div>
           </div>
        </div>

        <div className="space-y-8">
           {/* Section 3: Reuse Statistics */}
           <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2.5rem] text-white shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                 <h4 className="text-lg font-black flex items-center gap-2">
                   <RefreshCw size={20} className="text-blue-400" />
                   إحصائيات الاستخدام
                 </h4>
                 <div className="bg-blue-600 px-3 py-1 rounded-full font-black text-xs">
                   {content.reuse_count} مرة
                 </div>
              </div>
              
              <div className="space-y-6">
                 <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-3">آخر المحطات الزمنية</p>
                    <div className="space-y-4">
                       {content.reuse_history.map((reuse) => (
                         <div key={reuse.id} className="flex gap-3">
                            <div className="w-1 h-1 w-1 bg-blue-400 rounded-full mt-2" />
                            <div className="flex-1">
                               <p className="text-xs font-bold leading-tight">{reuse.task_title}</p>
                               <div className="flex items-center justify-between mt-1">
                                  <span className="text-[9px] text-slate-500">{reuse.reused_by_name}</span>
                                  <span className="text-[9px] text-slate-500 font-mono">{format(new Date(reuse.reused_at), 'MM/dd HH:mm')}</span>
                               </div>
                            </div>
                         </div>
                       ))}
                       {content.reuse_history.length === 0 && (
                         <p className="text-xs text-center text-slate-500 py-2 font-bold">لم يتم تسجيل عمليات إعادة استخدام بعد</p>
                       )}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={isReuseModalOpen} onClose={() => setIsReuseModalOpen(false)} title="إعادة استخدام المحتوى في مهمة">
         <div className="space-y-6">
            <Select 
              label="اختر المهمة الهدف"
              required
              options={[{ value: '', label: 'اختر مهمة...' }, ...allTasks.map(t => ({ value: t.id.toString(), label: t.title }))]}
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
            />
            <p className="text-xs text-slate-500 leading-relaxed font-bold">
              سيتم تسجيل عملية إعادة الاستخدام في سجل المحتوى، وربط المحتوى بالمهمة المختارة فوراً.
            </p>
            <div className="flex justify-end gap-3 pt-4">
               <Button variant="ghost" onClick={() => setIsReuseModalOpen(false)}>إلغاء</Button>
               <Button onClick={handleReuse} disabled={!selectedTaskId}>تأكيد النقل</Button>
            </div>
         </div>
      </Modal>

      <Modal isOpen={isLinkModalOpen} onClose={() => setIsLinkModalOpen(false)} title="ربط المحتوى بمرجع مهمة">
         <div className="space-y-6">
            <Select 
              label="المهمة المرتبطة"
              required
              options={[{ value: '', label: 'اختر مهمة...' }, ...allTasks.map(t => ({ value: t.id.toString(), label: t.title }))]}
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
            />
            <div className="flex justify-end gap-3 pt-4">
               <Button variant="ghost" onClick={() => setIsLinkModalOpen(false)}>إلغاء</Button>
               <Button onClick={handleLinkTask} disabled={!selectedTaskId}>إتمام الربط</Button>
            </div>
         </div>
      </Modal>
    </div>
  );
}

function InfoItem({ icon, label, value, isHighlight }: any) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-slate-400 font-sans">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-widest leading-none mt-0.5">{label}</span>
      </div>
      <span className={cn(
        "text-sm font-black truncate font-sans",
        isHighlight ? "text-blue-600" : "text-slate-900"
      )} title={value}>
        {value}
      </span>
    </div>
  );
}
