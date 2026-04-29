import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowRight, Clock, Calendar, User, Briefcase, 
  Settings, CheckCircle2, AlertCircle, Trash2, 
  Edit, Plus, History, MessageSquare, Paperclip,
  GitBranch, UserCheck, Send, Download, ExternalLink,
  ShieldAlert, Lock, Unlock, UserPlus, Camera, Layers
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { TaskDetails, Status, User as UserType, TaskRelation } from '../types';
import { Button, Input, Select, Textarea } from './ui/Inputs';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import ShootingForm from './ShootingForm';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import TaskForm from './TaskForm';

export default function TaskDetailsPage() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<TaskDetails | null>(null);
  const [availableStatuses, setAvailableStatuses] = useState<Status[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [allTasks, setAllTasks] = useState<{id: number, title: string}[]>([]);
  const [dependencyStatus, setDependencyStatus] = useState<{can_start: boolean, blocked_by: any[]} | null>(null);
  const [shootings, setShootings] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<'comments' | 'attachments' | 'relations' | 'shootings' | 'history'>('comments');
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isRelationModalOpen, setIsRelationModalOpen] = useState(false);
  const [isShootingModalOpen, setIsShootingModalOpen] = useState(false);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);

  const [commentText, setCommentText] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const [detailsRes, statusesRes, usersRes, tasksRes, depRes, shootRes] = await Promise.all([
        api.get<{ success: boolean; data: TaskDetails }>(`/api/tasks/${id}/details`).catch(() => ({ success: false, data: null })),
        api.get<{ success: boolean; data: Status[] }>('/api/tasks/statuses').catch(() => ({ success: false, data: [] })),
        api.get<{ success: boolean; data: UserType[] }>('/api/portal/users').catch(() => ({ success: false, data: [] })),
        api.get<{ success: boolean; data: any[] }>('/api/tasks?limit=100').catch(() => ({ success: false, data: [] })),
        api.get<{ success: boolean; data: any }>(`/api/tasks/${id}/dependency`).catch(() => ({ success: false, data: null })),
        api.get<{ success: boolean; data: any[] }>(`/api/shootings/task/${id}`).catch(() => ({ success: false, data: [] }))
      ]);

      if (detailsRes.success && detailsRes.data) setTask(detailsRes.data);
      if (statusesRes.success && Array.isArray(statusesRes.data)) setAvailableStatuses(statusesRes.data);
      if (usersRes.success && Array.isArray(usersRes.data)) setUsers(usersRes.data);
      if (tasksRes.success && Array.isArray(tasksRes.data)) setAllTasks(tasksRes.data);
      if (depRes.success && depRes.data) setDependencyStatus(depRes.data);
      if (shootRes.success && Array.isArray(shootRes.data)) setShootings(shootRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDetails(); }, [id]);

  const handleStatusChange = async (statusId: number) => {
    if (!currentUser || !task) return;
    try {
      const res = await api.patch<{ success: boolean }>(`/api/tasks/${id}/status`, {
        status_id: statusId,
        changed_by: currentUser.id
      });
      if (res.success) {
        fetchDetails();
        setIsStatusMenuOpen(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssign = async (userId: number) => {
    if (!currentUser) return;
    try {
      const res = await api.post<{ success: boolean }>(`/api/tasks/${id}/assign`, {
        assigned_to: userId,
        assigned_by: currentUser.id
      });
      if (res.success) {
        fetchDetails();
        setIsAssignModalOpen(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !commentText.trim()) return;
    try {
      const res = await api.post<{ success: boolean }>(`/api/tasks/${id}/comments`, {
        user_id: currentUser.id,
        comment: commentText
      });
      if (res.success) {
        setCommentText('');
        fetchDetails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddAttachment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !attachmentUrl.trim()) return;
    try {
      const res = await api.post<{ success: boolean }>(`/api/tasks/${id}/attachments`, {
        user_id: currentUser.id,
        file_url: attachmentUrl,
        file_type: 'link' // Simplified for demo
      });
      if (res.success) {
        setAttachmentUrl('');
        fetchDetails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddRelation = async (relatedId: number, type: string) => {
    try {
      const res = await api.post<{ success: boolean }>(`/api/tasks/${id}/relations`, {
        related_task_id: relatedId,
        relation_type: type
      });
      if (res.success) {
        fetchDetails();
        setIsRelationModalOpen(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('هل أنت متأكد من حذف هذه المهمة؟')) return;
    try {
      const res = await api.delete<{ success: boolean }>(`/api/tasks/${id}`);
      if (res.success) navigate('/tasks');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-400">جاري تحميل تفاصيل المهمة...</div>;
  if (!task) return <div className="p-12 text-center text-red-500 font-bold">لم يتم العثور على المهمة</div>;

  return (
    <div className="space-y-8 pb-12">
      {/* Header Info */}
      <div className="flex flex-col gap-6">
        <Link to="/tasks" className="flex items-center gap-3 text-white hover:text-white transition-all w-fit group bg-[#3d6a8a] hover:bg-[#2d5570] px-6 py-3 rounded-xl shadow-lg hover:shadow-xl">
          <ArrowRight size={24} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-lg font-bold">العودة لقائمة المهام</span>
        </Link>

        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge variant={getStatusVariant(task.status_id)} className="px-4 py-1 text-[12px]">
                  {task.status_name}
                </Badge>
                <span className="text-xs font-mono font-bold text-slate-400">#{task.id}</span>
                {dependencyStatus && (
                  <Badge variant={dependencyStatus.can_start ? 'green' : 'red'} className="gap-1.5">
                    {dependencyStatus.can_start ? <Unlock size={12} /> : <Lock size={12} />}
                    {dependencyStatus.can_start ? 'قابلة للبدء' : 'محجوبة'}
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">{task.title}</h1>
              <p className="text-slate-500 max-w-2xl leading-relaxed font-medium">{task.description || 'لا يوجد وصف متاح'}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Button onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)} variant="secondary" className="gap-2 bg-slate-50 border-slate-200 text-slate-700">
                  <Clock size={18} />
                  تغيير الحالة
                </Button>
                <AnimatePresence>
                  {isStatusMenuOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                      className="absolute left-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden"
                    >
                      {availableStatuses.map(s => (
                        <button key={s.id} onClick={() => handleStatusChange(s.id)} className={cn("w-full text-right px-4 py-3 text-sm font-bold transition-all hover:bg-slate-50", task.status_id === s.id ? "text-blue-600 bg-blue-50/50" : "text-slate-600")}>
                          {s.name}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Button onClick={() => setIsAssignModalOpen(true)} variant="secondary" className="gap-2 bg-slate-50 border-slate-200 text-slate-700">
                <UserCheck size={18} />
                إعادة تعيين
              </Button>

              <Button onClick={() => setIsEditModalOpen(true)} variant="secondary" className="gap-2 bg-slate-50 border-slate-200 text-slate-700">
                <Edit size={18} />
                تعديل
              </Button>

              {task.can_delete && (
                <Button onClick={handleDelete} variant="ghost" className="gap-2 text-red-600 hover:bg-red-100">
                  <Trash2 size={18} />
                  حذف
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-10 pt-8 border-t border-slate-100">
            <InfoItem icon={<Briefcase size={18} />} label="الأوردر المرتبط" value={task.order_title || 'غير متوفر'} isLink link={`/orders/${task.order_id}`} />
            <InfoItem icon={<User size={18} />} label="الموظف المعين" value={task.assigned_to_name || 'غير معين'} isHighlight />
            <InfoItem icon={<Calendar size={18} />} label="الموعد النهائي" value={task.deadline ? format(new Date(task.deadline), 'yyyy/MM/dd') : 'N/A'} />
            <InfoItem icon={<ShieldAlert size={18} />} label="الأولوية" value={task.priority_name || 'متوسط'} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Tabs Navigation */}
          <div className="flex items-center gap-8 border-b border-slate-100 px-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
             <TabLink active={activeTab === 'comments'} onClick={() => setActiveTab('comments')} icon={<MessageSquare size={18}/>} label="التعليقات" count={(task.comments || []).length} />
             <TabLink active={activeTab === 'attachments'} onClick={() => setActiveTab('attachments')} icon={<Paperclip size={18}/>} label="المرفقات" count={(task.attachments || []).length} />
             <TabLink active={activeTab === 'shootings'} onClick={() => setActiveTab('shootings')} icon={<Camera size={18}/>} label="التصوير" count={shootings.length} />
             <TabLink active={activeTab === 'relations'} onClick={() => setActiveTab('relations')} icon={<GitBranch size={18}/>} label="العلاقات" count={(task.relations || []).length} />
             <TabLink active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History size={18}/>} label="السجل الكامل" />
          </div>

          {activeTab === 'shootings' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-black text-slate-900">أحداث التصوير المرتبطة</h4>
                <Button onClick={() => setIsShootingModalOpen(true)} size="sm" className="gap-2">
                  <Plus size={18} />
                  إنشاء حدث تصوير
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {shootings.map((s) => (
                  <Link key={s.id} to={`/shootings/${s.id}`} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                        <Camera size={24} />
                      </div>
                      <div>
                        <h5 className="font-black text-slate-900 group-hover:text-blue-600 transition-colors">{s.location}</h5>
                        <p className="text-xs text-slate-400 font-bold">{s.start_time ? format(new Date(s.start_time), 'yyyy/MM/dd HH:mm') : 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                       <Badge variant={s.source_type === 'internal' ? 'blue' : 'purple'}>
                         {s.source_type === 'internal' ? 'داخلي' : 'خارجي'}
                       </Badge>
                       <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                         <Layers size={14} />
                         <span>{s.content_count || 0} محتوى</span>
                       </div>
                    </div>
                  </Link>
                ))}
                {shootings.length === 0 && (
                  <div className="col-span-full py-12 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                    <Camera size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-400 font-bold">لا توجد أحداث تصوير لهذه المهمة بعد</p>
                    <Button variant="ghost" onClick={() => setIsShootingModalOpen(true)} className="mt-4 text-blue-600">ابدأ بإنشاء أول حدث تصوير</Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <form onSubmit={handleAddComment} className="flex gap-4">
                  <Textarea 
                    placeholder="اكتب تعليقاً..." 
                    className="flex-1 min-h-[80px]" 
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                  <Button type="submit" className="self-end px-4 py-3">
                    <Send size={18} />
                  </Button>
                </form>
              </div>
              <div className="space-y-4">
                {(task.comments || []).map((comment) => (
                  <div key={comment.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                      {comment.user_name.substring(0, 2)}
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900">{comment.user_name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{comment.created_at ? format(new Date(comment.created_at), 'yyyy-MM-dd HH:mm') : 'N/A'}</span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed font-bold">{comment.comment}</p>
                    </div>
                  </div>
                ))}
                {(task.comments || []).length === 0 && <p className="text-center text-slate-400 py-12">لا يوجد تعليقات بعد</p>}
              </div>
            </div>
          )}

          {activeTab === 'attachments' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <form onSubmit={handleAddAttachment} className="flex gap-4">
                  <Input 
                    placeholder="رابط الملف..." 
                    className="flex-1" 
                    value={attachmentUrl}
                    onChange={(e) => setAttachmentUrl(e.target.value)}
                  />
                  <Button type="submit" className="gap-2">
                    <Plus size={18}/>
                    إضافة
                  </Button>
                </form>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(task.attachments || []).map((file) => (
                  <div key={file.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 group">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-all">
                      <Paperclip size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{file.file_url}</p>
                      <span className="text-[10px] text-slate-400 font-bold">{file.user_name} • {file.created_at ? format(new Date(file.created_at), 'MM/dd') : 'N/A'}</span>
                    </div>
                    <a href={file.file_url} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-blue-600 transition-all">
                      <Download size={18} />
                    </a>
                  </div>
                ))}
                {(task.attachments || []).length === 0 && <p className="col-span-2 text-center text-slate-400 py-12">لا توجد مرفقات</p>}
              </div>
            </div>
          )}

          {activeTab === 'relations' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-bold text-slate-900">التبعيات والعلاقات</h4>
                <Button onClick={() => setIsRelationModalOpen(true)} variant="secondary" className="gap-2 bg-slate-50">
                  <Plus size={18} />
                  إضافة علاقة
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {(task.relations || []).map((rel) => (
                  <div key={rel.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                        <GitBranch size={20} />
                      </div>
                      <div>
                        <Link to={`/tasks/${rel.related_task_id}`} className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-all">
                          {rel.related_task_title}
                        </Link>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{getRelationLabel(rel.relation_type)}</p>
                      </div>
                    </div>
                    <Badge variant={rel.relation_type === 'blocks' ? 'red' : 'blue'}>
                      {rel.relation_type}
                    </Badge>
                  </div>
                ))}
                {(task.relations || []).length === 0 && <p className="text-center text-slate-400 py-12">لا توجد علاقات معرفة</p>}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-8">
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <h4 className="text-lg font-bold text-slate-900 mb-8">سجل التغييرات الكامل</h4>
                <div className="space-y-8">
                  {(task.history || []).map((log) => (
                    <div key={log.id} className="flex gap-4">
                      <div className="w-1 bg-slate-100 rounded-full flex-shrink-0" />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">{log.changed_by_name}</span>
                          <span className="text-sm text-slate-500">حدث حالة المهمة</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <Badge variant={getStatusVariant(log.old_status_id || 0)}>{log.old_status_name || 'بدون'}</Badge>
                          <ArrowRight size={12} className="text-slate-300" />
                          <Badge variant={getStatusVariant(log.new_status_id)}>{log.new_status_name}</Badge>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono mt-1">{log.changed_at ? format(new Date(log.changed_at), 'yyyy-MM-dd HH:mm:ss') : 'N/A'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

               <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm border-r-4 border-r-blue-600">
                <h4 className="text-lg font-bold text-slate-900 mb-8 flex items-center gap-2">
                  <UserPlus size={20} className="text-blue-600" />
                  تسلسل التعيينات (Assignment Path)
                </h4>
                <div className="space-y-6">
                  {(task.assignments || []).map((asgn, idx) => (
                    <div key={asgn.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-[10px] font-bold border border-blue-100">
                          {idx + 1}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">{asgn.assigned_by_name}</span>
                          <ArrowRight size={14} className="text-slate-300" />
                          <span className="font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">{asgn.assigned_to_name}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-slate-400 font-mono font-bold">{asgn.assigned_at ? format(new Date(asgn.assigned_at), 'yyyy/MM/dd') : 'N/A'}</span>
                        <span className="text-[9px] text-slate-300 font-mono">{asgn.assigned_at ? format(new Date(asgn.assigned_at), 'HH:mm') : 'N/A'}</span>
                      </div>
                    </div>
                  ))}
                  {(task.assignments || []).length === 0 && (
                    <p className="text-center text-slate-400 py-4">لم يتم تسجيل تعيينات رسمية لهذا السجل</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[2.5rem] text-white shadow-xl shadow-blue-600/30">
            <h4 className="text-lg font-bold mb-6 flex items-center gap-2">
              <History size={20} />
              ملخص الحالة
            </h4>
            <div className="space-y-6">
              <div className="space-y-1.5 font-bold">
                <p className="text-blue-200 text-xs uppercase tracking-widest">تاريخ الإنشاء</p>
                <p className="text-sm font-mono">{task.created_at ? format(new Date(task.created_at), 'yyyy-MM-dd HH:mm') : 'N/A'}</p>
              </div>
              <div className="space-y-1.5 font-bold">
                <p className="text-blue-200 text-xs uppercase tracking-widest">الموعد النهائي</p>
                <p className="text-sm font-mono flex items-center gap-2">
                  <Calendar size={14} />
                  {task.deadline ? format(new Date(task.deadline), 'yyyy-MM-dd') : 'N/A'}
                </p>
              </div>
              <div className="pt-6 border-t border-white/10">
                 <p className="text-[10px] text-blue-200 uppercase tracking-widest font-black">الموظف المعين حالياً</p>
                 <p className="text-lg font-black mt-1">{task.assigned_to_name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="تعديل المهمة">
        <TaskForm initialData={task} onSuccess={() => { setIsEditModalOpen(false); fetchDetails(); }} onCancel={() => setIsEditModalOpen(false)} />
      </Modal>

      <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title="تعيين موظف آخر">
        <AssignForm 
          users={users}
          onSubmit={(userId) => handleAssign(userId)}
          onCancel={() => setIsAssignModalOpen(false)}
        />
      </Modal>

      <Modal isOpen={isRelationModalOpen} onClose={() => setIsRelationModalOpen(false)} title="إضافة علاقة جديدة">
        <RelationForm 
          tasks={allTasks.filter(t => t.id !== task.id)} 
          onSubmit={handleAddRelation} 
          onCancel={() => setIsRelationModalOpen(false)} 
        />
      </Modal>

      <Modal isOpen={isShootingModalOpen} onClose={() => setIsShootingModalOpen(false)} title="إضافة حدث تصوير للمهمة">
        <ShootingForm 
          initialOrderId={task.order_id}
          initialTaskId={task.id}
          onSuccess={() => { setIsShootingModalOpen(false); fetchDetails(); }} 
          onCancel={() => setIsShootingModalOpen(false)} 
        />
      </Modal>
    </div>
  );
}

function InfoItem({ icon, label, value, isHighlight, isLink, link }: any) {
  const content = (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-widest leading-none mt-0.5">{label}</span>
      </div>
      <span className={cn(
        "text-sm font-bold truncate",
        isHighlight || isLink ? "text-blue-600" : "text-slate-800",
        isLink && "hover:underline underline-offset-4"
      )} title={value}>
        {value}
      </span>
    </div>
  );

  return isLink ? <Link to={link}>{content}</Link> : content;
}

function TabLink({ active, onClick, icon, label, count }: any) {
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
      {count !== undefined && (
        <span className={cn(
          "text-[10px] px-1.5 py-0.5 rounded-full font-mono",
          active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
        )}>{count}</span>
      )}
    </button>
  );
}

function RelationForm({ tasks, onSubmit, onCancel }: any) {
  const [relId, setRelId] = useState('');
  const [type, setType] = useState('depends_on');

  return (
    <div className="space-y-6">
      <Select 
        label="المهمة المرتبطة"
        options={[{ value: '', label: 'اختر مهمة...' }, ...tasks.map((t: any) => ({ value: t.id, label: t.title }))]}
        value={relId}
        onChange={(e) => setRelId(e.target.value)}
      />
      <Select 
        label="نوع العلاقة"
        options={[
          { value: 'depends_on', label: 'تعتمد على' },
          { value: 'blocks', label: 'تحجب' },
          { value: 'related_to', label: 'مرتبطة بـ' },
          { value: 'subtask_of', label: 'مهمة فرعية لـ' },
          { value: 'parent_of', label: 'مهمة رئيسية لـ' }
        ]}
        value={type}
        onChange={(e) => setType(e.target.value)}
      />
      <div className="flex justify-end gap-3 pt-4">
        <Button variant="ghost" onClick={onCancel}>إلغاء</Button>
        <Button onClick={() => onSubmit(Number(relId), type)} disabled={!relId}>حفظ</Button>
      </div>
    </div>
  );
}

const getStatusVariant = (id: number) => {
  const variants: Record<number, any> = {
    1: 'gray', 2: 'yellow', 3: 'blue', 4: 'purple', 5: 'green', 6: 'red'
  };
  return variants[id] || 'gray';
};

const getRelationLabel = (type: string) => {
  const labels: Record<string, string> = {
    depends_on: 'تعتمد على هذه المهمة للبدء',
    blocks: 'تحجب هذه المهمة عن البدء',
    related_to: 'مرتبطة سياقياً بهذه المهمة',
    subtask_of: 'مهمة فرعية تابعة لهذه المهمة',
    parent_of: 'تحتوي على هذه كمهة فرعية'
  };
  return labels[type] || type;
};

function AssignForm({ users, onSubmit, onCancel }: { users: any[]; onSubmit: (userId: number) => void; onCancel: () => void }) {
  const [selectedUser, setSelectedUser] = React.useState('');

  return (
    <div className="space-y-6">
      <Select
        label="اختر الموظف"
        options={[{ value: '', label: 'اختر...' }, ...users.map(u => ({ value: u.id, label: u.name }))]}
        value={selectedUser}
        onChange={(e) => setSelectedUser(e.target.value)}
      />
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <Button variant="ghost" onClick={onCancel}>إلغاء</Button>
        <Button
          onClick={() => selectedUser && onSubmit(Number(selectedUser))}
          disabled={!selectedUser}
          className="bg-[#3d6a8a] hover:bg-[#2d5570] text-white"
        >
          حفظ التعيين
        </Button>
      </div>
    </div>
  );
}
