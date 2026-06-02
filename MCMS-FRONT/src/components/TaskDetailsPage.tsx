import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowRight, Clock, Calendar, User, Briefcase, 
  Settings, CheckCircle2, AlertCircle, Trash2, 
  Edit, Plus, History, MessageSquare, Paperclip,
  GitBranch, UserCheck, Send, Download, ExternalLink,
  ShieldAlert, Lock, Unlock, UserPlus, Camera, Layers, Zap
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { TaskDetails, Status, User as UserType, TaskRelation, TaskType } from '../types';
import { Button, Input, Select, Textarea } from './ui/Inputs';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import ShootingForm from './ShootingForm';
import FileUploadForm from './FileUploadForm';
import TaskTypeIndicator from './TaskTypeIndicator';
import ShootingDataForm from './ShootingDataForm';
import ShootingDataDisplay from './ShootingDataDisplay';
import AISystemButton from './AISystemButton';
import CommentsSection from './CommentsSection';
import AttachmentItem from './AttachmentItem';
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
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [aiUsageRecords, setAiUsageRecords] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<'comments' | 'attachments' | 'relations' | 'shootings' | 'history' | 'shooting-data' | 'ai-usage'>('comments');
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isRelationModalOpen, setIsRelationModalOpen] = useState(false);
  const [isShootingModalOpen, setIsShootingModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [isShootingDataModalOpen, setIsShootingDataModalOpen] = useState(false);
  const [showReportingTaskPopup, setShowReportingTaskPopup] = useState(false);

  const [commentText, setCommentText] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const [detailsRes, statusesRes, usersRes, tasksRes, depRes, shootRes, typesRes, aiUsageRes] = await Promise.all([
        api.get<{ success: boolean; data: TaskDetails }>(`/api/tasks/${id}/details`).catch(() => ({ success: false, data: null })),
        api.get<{ success: boolean; data: Status[] }>('/api/tasks/statuses').catch(() => ({ success: false, data: [] })),
        api.get<{ success: boolean; data: UserType[] }>('/api/portal/users').catch(() => ({ success: false, data: [] })),
        api.get<{ success: boolean; data: any[] }>('/api/tasks?limit=100').catch(() => ({ success: false, data: [] })),
        api.get<{ success: boolean; data: any }>(`/api/tasks/${id}/dependency`).catch(() => ({ success: false, data: null })),
        api.get<{ success: boolean; data: any[] }>(`/api/shootings/task/${id}`).catch(() => ({ success: false, data: [] })),
        api.get<{ success: boolean; data: TaskType[] }>('/api/tasks/types').catch(() => ({ success: false, data: [] })),
        api.get<{ success: boolean; data: any[] }>(`/api/tasks/${id}/ai-system-usage`).catch(() => ({ success: false, data: [] }))
      ]);

      if (detailsRes.success && detailsRes.data) setTask(detailsRes.data);
      if (statusesRes.success && Array.isArray(statusesRes.data)) setAvailableStatuses(statusesRes.data);
      if (usersRes.success && Array.isArray(usersRes.data)) setUsers(usersRes.data);
      if (tasksRes.success && Array.isArray(tasksRes.data)) setAllTasks(tasksRes.data);
      if (depRes.success && depRes.data) setDependencyStatus(depRes.data);
      if (shootRes.success && Array.isArray(shootRes.data)) setShootings(shootRes.data);
      
      // Task types - use API data if available, otherwise use hardcoded
      if (typesRes.success && Array.isArray(typesRes.data) && typesRes.data.length > 0) {
        setTaskTypes(typesRes.data);
      } else {
        // Fallback to hardcoded task types
        setTaskTypes([
          { id: 1, name: 'تصوير', category: 'shooting', color: '#3b82f6', icon: '📹' },
          { id: 2, name: 'اخبارية', category: 'reporting', color: '#a855f7', icon: '📰' },
          { id: 3, name: 'أخرى', category: 'other', color: '#64748b', icon: '📋' }
        ]);
      }
      
      if (aiUsageRes.success && Array.isArray(aiUsageRes.data)) setAiUsageRecords(aiUsageRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDetails(); }, [id]);

  // عرض popup للمهام الاخبارية الجديدة فقط
  useEffect(() => {
    if (task && taskTypes.length > 0) {
      const taskType = taskTypes.find(t => t.id === task.task_type_id);
      // عرض popup إذا كانت مهمة اخبارية ولم تكن قد عُرضت من قبل
      // وتحقق من أن المهمة جديدة (تم إنشاؤها للتو) بالتحقق من وقت الإنشاء
      if (taskType?.category === 'reporting' && !showReportingTaskPopup) {
        // تحقق من أن المهمة تم إنشاؤها في آخر دقيقة
        const createdAt = new Date(task.created_at || task.updated_at || new Date());
        const now = new Date();
        const diffInSeconds = (now.getTime() - createdAt.getTime()) / 1000;
        
        // إذا تم إنشاء المهمة في آخر دقيقة، اعرض الـ popup
        if (diffInSeconds < 60) {
          setShowReportingTaskPopup(true);
        }
      }
    }
  }, [task, taskTypes]);

  const handleStatusChange = async (statusId: number) => {
    if (!currentUser || !task) return;
    try {
      console.log('Changing task status:', { taskId: id, statusId, changedBy: currentUser.id });
      const res = await api.patch<{ success: boolean }>(`/api/tasks/${id}/status`, {
        status_id: statusId,
        changed_by: currentUser.id
      });
      console.log('Status change response:', res);
      if (res.success) {
        console.log('✅ Status changed successfully');
        fetchDetails();
        setIsStatusMenuOpen(false);
      } else {
        console.error('❌ Status change failed:', res);
      }
    } catch (err) {
      console.error('❌ Status change error:', err);
    }
  };

  const handleOpenAISystemAndChangeStatus = async () => {
    if (!currentUser || !task) return;
    
    try {
      // ابحث عن حالة "في التنفيذ" (in progress)
      const inProgressStatus = availableStatuses.find(s => s.name.toLowerCase().includes('تنفيذ') || s.name.toLowerCase().includes('progress'));
      
      if (inProgressStatus) {
        // غيّر الحالة إلى "في التنفيذ"
        await handleStatusChange(inProgressStatus.id);
      }
    } catch (err) {
      console.error('Error changing status:', err);
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
      const res = await api.delete<{ success: boolean; error?: string }>(`/api/tasks/${id}`);
      if (res.success) {
        navigate('/tasks');
      } else {
        alert('فشل حذف المهمة: ' + (res.error || 'خطأ غير معروف'));
      }
    } catch (err: any) {
      console.error('Delete task error:', err);
      alert('فشل حذف المهمة: ' + (err?.message || 'خطأ في الاتصال'));
    }
  };

  const handleSaveShootingData = async (data: any) => {
    try {
      if (task?.shooting_data?.id) {
        await api.patch(`/api/tasks/${id}/shooting-data`, data);
      } else {
        await api.post(`/api/tasks/${id}/shooting-data`, data);
      }
      fetchDetails();
      setIsShootingDataModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteShootingData = async () => {
    if (!window.confirm('هل أنت متأكد من حذف بيانات التصوير؟')) return;
    try {
      await api.delete(`/api/tasks/${id}/shooting-data`);
      fetchDetails();
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
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">{task.title}</h1>
              <p className="text-slate-500 max-w-2xl leading-relaxed font-medium">{task.description || 'لا يوجد وصف متاح'}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {task.task_type_id && (
                <AISystemButton 
                  task={task}
                  taskType={taskTypes.find(t => t.id === task.task_type_id)}
                  onUsageRecorded={fetchDetails}
                />
              )}

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
            <InfoItem icon={<Briefcase size={18} />} label="الطلب المرتبط" value={task.order_title || 'غير متوفر'} isLink link={`/orders/${task.order_id}`} />
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
             {task.task_type_id && taskTypes.find(t => t.id === task.task_type_id)?.category === 'shooting' && (
               <TabLink active={activeTab === 'shooting-data'} onClick={() => setActiveTab('shooting-data')} icon={<Camera size={18}/>} label="بيانات التصوير" />
             )}
             <TabLink active={activeTab === 'shootings'} onClick={() => setActiveTab('shootings')} icon={<Camera size={18}/>} label="التصوير" count={shootings.length} />
             {task.task_type_id && taskTypes.find(t => t.id === task.task_type_id)?.category === 'reporting' && (
               <TabLink active={activeTab === 'ai-usage'} onClick={() => setActiveTab('ai-usage')} icon={<Zap size={18}/>} label="سجل النظام الذكي" count={aiUsageRecords.length} />
             )}
             <TabLink active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History size={18}/>} label="السجل الكامل" />
          </div>

          {activeTab === 'shooting-data' && (
            <div className="space-y-6">
              {task.shooting_data ? (
                <ShootingDataDisplay 
                  data={task.shooting_data}
                  onEdit={() => setIsShootingDataModalOpen(true)}
                  onDelete={handleDeleteShootingData}
                />
              ) : (
                <div className="py-12 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                  <Camera size={48} className="mx-auto text-slate-200 mb-4" />
                  <p className="text-slate-400 font-bold">لا توجد بيانات تصوير لهذه المهمة بعد</p>
                  <Button variant="ghost" onClick={() => setIsShootingDataModalOpen(true)} className="mt-4 text-blue-600">
                    ابدأ بإضافة بيانات التصوير
                  </Button>
                </div>
              )}
            </div>
          )}

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

          {activeTab === 'ai-usage' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-white">
                      <Zap size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">سجل استخدام النظام الذكي</h3>
                      <p className="text-xs text-slate-500 font-medium">تسجيل جميع مرات استخدام نظام الأخبار الذكي</p>
                    </div>
                  </div>
                </div>

                {aiUsageRecords.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50">
                          <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase tracking-widest">الوقت</th>
                          <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase tracking-widest">المستخدم</th>
                          <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase tracking-widest">رابط النظام</th>
                        </tr>
                      </thead>
                      <tbody>
                        {aiUsageRecords.map((record) => (
                          <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 text-sm font-bold text-slate-900">
                              {record.timestamp ? format(new Date(record.timestamp), 'yyyy-MM-dd HH:mm:ss') : 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-sm font-bold text-slate-700">
                              {record.used_by_name || 'غير معروف'}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <a 
                                href={record.ai_system_url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-2 w-fit"
                              >
                                <ExternalLink size={14} />
                                فتح النظام
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <Zap size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-400 font-bold">لم يتم استخدام النظام الذكي بعد</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-6">
              <CommentsSection taskId={parseInt(id!)} onCommentAdded={() => {
                // إعادة تحميل بيانات المهمة
                fetchDetails();
              }} />
            </div>
          )}

          {activeTab === 'attachments' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-bold text-slate-900">الملفات المرفقة</h4>
                <Button onClick={() => setIsUploadModalOpen(true)} className="gap-2">
                  <Plus size={18}/>
                  رفع ملف جديد
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(task.attachments || []).map((file) => (
                  <AttachmentItem
                    key={file.id}
                    taskId={parseInt(id!)}
                    attachment={file as any}
                    onChange={fetchDetails}
                  />
                ))}
                {(task.attachments || []).length === 0 && (
                  <div className="col-span-2 py-12 text-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
                    <Paperclip size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-400 font-bold">لا توجد ملفات مرفقة</p>
                    <Button variant="ghost" onClick={() => setIsUploadModalOpen(true)} className="mt-4 text-blue-600">ابدأ برفع أول ملف</Button>
                  </div>
                )}
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

      <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="رفع ملف جديد" className="max-w-2xl">
        {currentUser && (
          <FileUploadForm 
            taskId={task?.id || 0}
            userId={currentUser.id}
            onSuccess={() => { setIsUploadModalOpen(false); fetchDetails(); }} 
            onCancel={() => setIsUploadModalOpen(false)} 
          />
        )}
      </Modal>

      <Modal isOpen={isShootingDataModalOpen} onClose={() => setIsShootingDataModalOpen(false)} title={task?.shooting_data ? "تعديل بيانات التصوير" : "إضافة بيانات التصوير"} className="max-w-3xl">
        <ShootingDataForm 
          initialData={task?.shooting_data}
          onSubmit={handleSaveShootingData}
          onCancel={() => setIsShootingDataModalOpen(false)}
        />
      </Modal>

      {/* Reporting Task Popup */}
      {showReportingTaskPopup && task && (
        <Modal isOpen={showReportingTaskPopup} onClose={() => setShowReportingTaskPopup(false)}>
          <div className="space-y-6 p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">📰 مهمة اخبارية</h2>
              <p className="text-slate-600">هل تريد فتح نظام الأخبار الذكي لتنفيذ هذه المهمة؟</p>
            </div>

            <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
              <p className="text-sm text-slate-700 mb-3">
                <strong>المهمة:</strong> {task.title}
              </p>
              <p className="text-sm text-slate-600">
                سيتم فتح نظام الأخبار الذكي في نافذة جديدة مع تمرير بيانات المهمة تلقائياً.
              </p>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="ghost" 
                onClick={() => setShowReportingTaskPopup(false)}
                className="flex-1"
              >
                لاحقاً
              </Button>
              <div className="flex-1">
                <AISystemButton 
                  task={task}
                  taskType={taskTypes.find(t => t.id === task.task_type_id)}
                  onUsageRecorded={() => {
                    setShowReportingTaskPopup(false);
                    handleOpenAISystemAndChangeStatus();
                  }}
                />
              </div>
            </div>
          </div>
        </Modal>
      )}
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
