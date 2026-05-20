import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Archive,
  Search,
  ArrowRight,
  RotateCcw,
  FileText,
  ListTodo,
  User,
  Clock,
  Lock,
  AlertTriangle,
  Download,
  Paperclip,
  Image as ImageIcon,
  FileVideo,
  File as FileIcon,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { api, BASE_URL } from '../../services/api';
import { 
  AdminProcArchive,
  AdminProcResponse, 
  AdminProcListResponse 
} from '../../types/administrative';

// أنواع الملفات
const getFileIcon = (fileType?: string) => {
  if (!fileType) return FileIcon;
  if (fileType.startsWith('image/')) return ImageIcon;
  if (fileType.startsWith('video/')) return FileVideo;
  if (fileType.includes('pdf') || fileType.includes('document')) return FileText;
  return Paperclip;
};

const formatFileSize = (size: number | string | undefined): string => {
  if (!size) return '';
  const sizeNum = typeof size === 'string' ? parseInt(size) : size;
  if (sizeNum < 1024) return `${sizeNum} B`;
  if (sizeNum < 1024 * 1024) return `${(sizeNum / 1024).toFixed(1)} KB`;
  if (sizeNum < 1024 * 1024 * 1024) return `${(sizeNum / 1024 / 1024).toFixed(1)} MB`;
  return `${(sizeNum / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

export default function AdminProcArchivePage() {
  const navigate = useNavigate();
  const [archive, setArchive] = useState<AdminProcArchive[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'order' | 'task' | 'attachment'>('all');
  const [filterFileType, setFilterFileType] = useState<'all' | 'image' | 'video' | 'document' | 'other'>('all');

  useEffect(() => {
    loadArchive();
  }, []);

  const loadArchive = async () => {
    try {
      // فحص الصلاحية
      const accessRes = await api.get<AdminProcResponse<{ has_access: boolean }>>(
        '/api/administrative/access/check'
      );

      if (!accessRes.success || !accessRes.data?.has_access) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      setHasAccess(true);

      // جلب الأرشيف
      const res = await api.get<AdminProcListResponse<AdminProcArchive>>(
        '/api/administrative/archive?limit=200'
      );

      if (res.success) {
        setArchive(res.data);
      }
    } catch (err) {
      console.error('Failed to load archive:', err);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (archiveId: string) => {
    if (!confirm('هل أنت متأكد من استعادة هذا العنصر من الأرشيف؟')) return;
    
    try {
      const res = await api.post<AdminProcResponse<{ restored: boolean }>>(
        `/api/administrative/archive/${archiveId}/restore`,
        {}
      );

      if (res.success) {
        loadArchive();
      } else {
        alert(res.error || 'فشل الاستعادة');
      }
    } catch (err) {
      console.error(err);
      alert('فشل الاستعادة');
    }
  };

  const handleDownload = async (item: AdminProcArchive) => {
    try {
      // تحميل الملف مباشرة من الـ backend (streaming من S3)
      if (item.admin_attachment_id) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/api/administrative/attachments/${item.admin_attachment_id}/download`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = item.title || item.file_name || 'file';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        return;
      }
      
      alert('لا يمكن تنزيل هذا الملف');
    } catch (err) {
      console.error('Download error:', err);
      alert('فشل تنزيل الملف');
    }
  };

  const filteredArchive = archive.filter((a) => {
    // فلتر النوع
    if (filterType !== 'all' && a.entity_type !== filterType) return false;
    
    // فلتر نوع الملف (فقط للمرفقات)
    if (filterFileType !== 'all' && a.entity_type === 'attachment') {
      const ft = a.file_type || '';
      if (filterFileType === 'image' && !ft.startsWith('image/')) return false;
      if (filterFileType === 'video' && !ft.startsWith('video/')) return false;
      if (filterFileType === 'document' && !ft.includes('pdf') && !ft.includes('document') && !ft.includes('word') && !ft.includes('sheet') && !ft.includes('text')) return false;
      if (filterFileType === 'other' && (ft.startsWith('image/') || ft.startsWith('video/') || ft.includes('pdf') || ft.includes('document') || ft.includes('word'))) return false;
    }
    if (filterFileType !== 'all' && a.entity_type !== 'attachment') return false;
    
    // فلتر البحث
    if (search) {
      const data = a.entity_data;
      const searchLower = search.toLowerCase();
      
      const title = (a.title || data?.title || '').toLowerCase();
      const description = (a.description || data?.description || '').toLowerCase();
      const fileName = (a.file_name || '').toLowerCase();
      const orderTitle = (a.order_title || '').toLowerCase();
      const taskTitle = (a.task_title || '').toLowerCase();
      
      return title.includes(searchLower) 
        || description.includes(searchLower) 
        || fileName.includes(searchLower)
        || orderTitle.includes(searchLower)
        || taskTitle.includes(searchLower);
    }
    
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (hasAccess === false) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md p-8 bg-red-50 border-2 border-red-200 rounded-2xl"
        >
          <Lock className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-700 mb-2">صلاحية مرفوضة</h2>
          <p className="text-red-600">
            هذا الأرشيف خاص بالإداريين فقط
          </p>
          <button
            onClick={() => navigate('/administrative')}
            className="mt-6 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            العودة للأقسام
          </button>
        </motion.div>
      </div>
    );
  }

  // إحصائيات
  const stats = {
    total: archive.length,
    orders: archive.filter(a => a.entity_type === 'order').length,
    tasks: archive.filter(a => a.entity_type === 'task').length,
    attachments: archive.filter(a => a.entity_type === 'attachment').length,
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/administrative')}
        className="flex items-center gap-2 text-gray-500 hover:text-[#FF9F4A] transition-colors"
      >
        <ArrowRight className="w-4 h-4" />
        <span>العودة للأقسام</span>
      </button>

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="p-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg shadow-amber-500/30">
            <Archive className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">الأرشيف الخاص بالإداريين</h1>
            <p className="text-gray-500 mt-1">
              أرشيف منفصل للطلبات والمهام والملفات الإدارية
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <StatCard label="إجمالي" count={stats.total} color="amber" icon={<Archive className="w-5 h-5" />} />
        <StatCard label="طلبات" count={stats.orders} color="blue" icon={<FileText className="w-5 h-5" />} />
        <StatCard label="مهام" count={stats.tasks} color="purple" icon={<ListTodo className="w-5 h-5" />} />
        <StatCard label="ملفات" count={stats.attachments} color="green" icon={<Paperclip className="w-5 h-5" />} />
      </motion.div>

      {/* Warning */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 flex items-start gap-3"
      >
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-bold text-amber-900">أرشيف ملفات حقيقي</p>
          <p className="text-amber-700 mt-1">
            كل ملف يتم رفعه على مهمة إدارية يُسجل تلقائياً هنا مع رابطه وكل تفاصيله. الملفات محفوظة على bucket منفصل وآمن.
          </p>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="ابحث في الأرشيف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-[#FF9F4A] focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <FilterButton 
            active={filterType === 'all'} 
            onClick={() => { setFilterType('all'); setFilterFileType('all'); }}
            label="الكل"
            count={stats.total}
          />
          <FilterButton 
            active={filterType === 'attachment'} 
            onClick={() => { setFilterType('attachment'); setFilterFileType('all'); }}
            label="الملفات"
            count={stats.attachments}
            icon={<Paperclip className="w-4 h-4" />}
          />
          <FilterButton 
            active={filterType === 'order'} 
            onClick={() => { setFilterType('order'); setFilterFileType('all'); }}
            label="الطلبات"
            count={stats.orders}
            icon={<FileText className="w-4 h-4" />}
          />
          <FilterButton 
            active={filterType === 'task'} 
            onClick={() => { setFilterType('task'); setFilterFileType('all'); }}
            label="المهام"
            count={stats.tasks}
            icon={<ListTodo className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* فلترة نوع الملف - تظهر فقط عند اختيار "الملفات" */}
      {filterType === 'attachment' && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500 font-semibold">نوع الملف:</span>
          <FilterButton 
            active={filterFileType === 'all'} 
            onClick={() => setFilterFileType('all')}
            label="الكل"
            count={stats.attachments}
          />
          <FilterButton 
            active={filterFileType === 'image'} 
            onClick={() => setFilterFileType('image')}
            label="صور"
            count={archive.filter(a => a.entity_type === 'attachment' && a.file_type?.startsWith('image/')).length}
            icon={<ImageIcon className="w-4 h-4" />}
          />
          <FilterButton 
            active={filterFileType === 'video'} 
            onClick={() => setFilterFileType('video')}
            label="فيديو"
            count={archive.filter(a => a.entity_type === 'attachment' && a.file_type?.startsWith('video/')).length}
            icon={<FileVideo className="w-4 h-4" />}
          />
          <FilterButton 
            active={filterFileType === 'document'} 
            onClick={() => setFilterFileType('document')}
            label="مستندات"
            count={archive.filter(a => a.entity_type === 'attachment' && (a.file_type?.includes('pdf') || a.file_type?.includes('document') || a.file_type?.includes('word'))).length}
            icon={<FileText className="w-4 h-4" />}
          />
          <FilterButton 
            active={filterFileType === 'other'} 
            onClick={() => setFilterFileType('other')}
            label="أخرى"
            count={archive.filter(a => a.entity_type === 'attachment' && !a.file_type?.startsWith('image/') && !a.file_type?.startsWith('video/') && !a.file_type?.includes('pdf') && !a.file_type?.includes('document') && !a.file_type?.includes('word')).length}
            icon={<FileIcon className="w-4 h-4" />}
          />
        </div>
      )}

      {/* Archive List */}
      {filteredArchive.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300"
        >
          <Archive className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-500 mb-2">
            {search || filterType !== 'all' ? 'لا توجد نتائج' : 'الأرشيف فارغ'}
          </h3>
          <p className="text-gray-400">
            {search ? 'جرب كلمات بحث أخرى' : 'لم يتم رفع أو أرشفة أي شيء بعد'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filteredArchive.map((item, index) => (
            <ArchiveCard 
              key={item.id.toString()} 
              item={item} 
              index={index}
              onRestore={handleRestore}
              onDownload={handleDownload}
              onView={(orderId) => navigate(`/administrative/orders/${orderId}`)}
              onViewTask={(taskId) => navigate(`/administrative/tasks/${taskId}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============ Components ============

function StatCard({ label, count, color, icon }: any) {
  const colorClasses: any = {
    amber: 'from-amber-500 to-orange-600',
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-emerald-600',
  };
  
  return (
    <div className="bg-white rounded-2xl p-5 shadow-md border-2 border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg bg-gradient-to-br ${colorClasses[color]} text-white`}>
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold text-gray-800">{count}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function FilterButton({ active, onClick, label, count, icon }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
        active
          ? 'bg-[#FF9F4A] text-white shadow-lg shadow-orange-500/30'
          : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-[#FF9F4A]'
      }`}
    >
      {icon}
      <span>{label}</span>
      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
        active ? 'bg-white/30' : 'bg-gray-100 text-gray-500'
      }`}>
        {count}
      </span>
    </button>
  );
}

function ArchiveCard({ item, index, onRestore, onDownload, onView, onViewTask }: any) {
  const isOrder = item.entity_type === 'order';
  const isTask = item.entity_type === 'task';
  const isAttachment = item.entity_type === 'attachment';
  const data = item.entity_data;

  // معلومات العرض
  const title = item.title || data?.title || 'بدون عنوان';
  const description = item.description || data?.description;
  const FileIconComponent = isAttachment ? getFileIcon(item.file_type) : (isOrder ? FileText : ListTodo);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="bg-white rounded-2xl shadow-md border-2 border-gray-100 hover:border-amber-200 transition-all p-6"
    >
      <div className="flex items-start gap-4 flex-wrap">
        {/* أيقونة كبيرة */}
        <div className={`p-4 rounded-xl flex-shrink-0 ${
          isAttachment 
            ? 'bg-green-100 text-green-600'
            : isOrder
            ? 'bg-blue-100 text-blue-600'
            : 'bg-purple-100 text-purple-600'
        }`}>
          <FileIconComponent className="w-8 h-8" />
        </div>

        <div className="flex-1 min-w-[250px]">
          {/* Tags */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
              isAttachment 
                ? 'bg-green-100 text-green-700'
                : isOrder 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-purple-100 text-purple-700'
            }`}>
              {isAttachment ? '📎 ملف' : isOrder ? '📋 طلب' : '✅ مهمة'}
            </span>
            
            {item.category_name && (
              <span 
                className="px-3 py-1 rounded-full text-xs font-bold"
                style={{ 
                  backgroundColor: (item.category_color || '#FF9F4A') + '20',
                  color: item.category_color || '#FF9F4A'
                }}
              >
                {item.category_name}
              </span>
            )}

            {item.file_type && isAttachment && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-mono">
                {item.file_type.split('/')[1]?.toUpperCase() || item.file_type}
              </span>
            )}
            
            {item.file_size && (
              <span className="text-xs text-gray-500">
                {formatFileSize(item.file_size)}
              </span>
            )}
          </div>

          {/* العنوان */}
          <h3 className="text-xl font-bold text-gray-800 mb-1">
            {title}
          </h3>

          {/* الوصف */}
          {description && (
            <p className="text-gray-600 mb-3 line-clamp-2">{description}</p>
          )}

          {/* السياق - أي طلب وأي مهمة */}
          {isAttachment && (item.order_title || item.task_title) && (
            <div className="bg-gray-50 rounded-lg p-3 mb-3 text-sm">
              {item.order_title && (
                <p className="text-gray-600">
                  <strong className="text-gray-700">الطلب:</strong> {item.order_title}
                </p>
              )}
              {item.task_title && (
                <p className="text-gray-600 mt-1">
                  <strong className="text-gray-700">المهمة:</strong> {item.task_title}
                </p>
              )}
            </div>
          )}

          {/* تفاصيل الكتاب الرسمي */}
          {data?.notes && isOrder && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs font-bold text-amber-800 mb-1">تفاصيل الكتاب الرسمي:</p>
              <p className="text-sm text-amber-900 line-clamp-3 whitespace-pre-wrap">
                {data.notes}
              </p>
            </div>
          )}

          {/* Meta */}
          <div className="flex items-center gap-4 flex-wrap text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100">
            {(item.uploaded_by_name || data?.created_by_name) && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {isAttachment ? 'رفع' : 'منشئ'}: <strong className="text-gray-600">
                  {item.uploaded_by_name || data?.created_by_name}
                </strong>
              </span>
            )}
            {item.archived_at && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {format(new Date(item.archived_at), 'dd MMMM yyyy - hh:mm a', { locale: ar })}
              </span>
            )}
          </div>
        </div>

        {/* أزرار الإجراءات */}
        <div className="flex flex-col gap-2">
          {/* تنزيل (للملفات) */}
          {isAttachment && item.file_url && (
            <button
              onClick={() => onDownload(item)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-xl font-semibold text-sm transition-colors"
              title="تنزيل الملف"
            >
              <Download className="w-4 h-4" />
              تنزيل
            </button>
          )}

          {/* استعادة (للطلبات والمهام) */}
          {!isAttachment && (
            <button
              onClick={() => onRestore(item.id.toString())}
              className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-xl font-semibold text-sm transition-colors"
              title="استعادة من الأرشيف"
            >
              <RotateCcw className="w-4 h-4" />
              استعادة
            </button>
          )}

          {/* عرض الطلب */}
          {item.admin_order_id && (
            <button
              onClick={() => onView(item.admin_order_id)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-xl font-semibold text-sm transition-colors"
            >
              عرض الطلب
            </button>
          )}

          {/* عرض المهمة */}
          {item.admin_task_id && isAttachment && (
            <button
              onClick={() => onViewTask(item.admin_task_id)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-xl font-semibold text-sm transition-colors"
            >
              عرض المهمة
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
