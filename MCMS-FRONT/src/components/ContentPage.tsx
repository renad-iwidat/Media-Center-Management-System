import React, { useState, useEffect } from 'react';
import { 
  FileVideo, Search,
  ChevronLeft, ChevronRight,
  Archive, Tag, RefreshCw, X, Calendar, ArrowDownNarrowWide, ArrowUpWideNarrow
} from 'lucide-react';
import { api } from '../services/api';
import { Content, ContentType, User as UserType, MediaUnit } from '../types';
import { Button, Input, Select } from './ui/Inputs';
import { Badge } from './ui/Badge';
import { useNavigate } from 'react-router-dom';
import { Modal } from './ui/Modal';
import ContentForm from './ContentForm';

interface Program {
  id: number;
  title?: string;
  name?: string;
}

interface Desk {
  id: number;
  name: string;
}

export default function ContentPage() {
  const navigate = useNavigate();
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [pagination, setPagination] = useState({ limit: 12, offset: 0, total: 0 });
  const [filters, setFilters] = useState({
    keyword: '',
    type: '',
    creator: '',
    media_unit: '',
    program: '',
    desk: '',
    from: '',
    to: '',
    sort: 'newest' as 'newest' | 'oldest'
  });

  const [lookups, setLookups] = useState<{
    types: ContentType[];
    users: UserType[];
    units: MediaUnit[];
    programs: Program[];
    desks: Desk[];
  }>({ types: [], users: [], units: [], programs: [], desks: [] });

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchLookups = async () => {
      const [typeRes, userRes, unitRes, programRes, deskRes] = await Promise.all([
        api.get<{ success: boolean; data: ContentType[] }>('/api/content/types'),
        api.get<{ success: boolean; data: UserType[] }>('/api/portal/users'),
        api.get<{ success: boolean; data: MediaUnit[] }>('/api/portal/media-units'),
        api.get<{ success: boolean; data: Program[] }>('/api/portal/programs'),
        api.get<{ success: boolean; data: Desk[] }>('/api/portal/desks'),
      ]);
      setLookups({
        types: typeRes.data || [],
        users: userRes.data || [],
        units: unitRes.data || [],
        programs: programRes.data || [],
        desks: deskRes.data || []
      });
    };
    fetchLookups();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = {
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
        archived: 'true', // Always show archived content only
        sort: filters.sort,
      };

      if (filters.keyword) params.keyword = filters.keyword;
      if (filters.type) params.content_type_id = filters.type;
      if (filters.creator) params.created_by = filters.creator;
      if (filters.media_unit) params.media_unit_id = filters.media_unit;
      if (filters.program) params.program_id = filters.program;
      if (filters.desk) params.desk_id = filters.desk;
      if (filters.from) params.from_date = filters.from;
      if (filters.to) params.to_date = filters.to;

      const query = new URLSearchParams(params);
      const res = await api.get<{ success: boolean; data: Content[]; total: number }>(`/api/content?${query.toString()}`);
      if (res.success) {
        setContent(res.data);
        setPagination(prev => ({ ...prev, total: res.total || 0 }));
      }
    } catch (err) {
      console.error('Error fetching content:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.offset, filters]);

  const handlePageChange = (newOffset: number) => {
    setPagination(prev => ({ ...prev, offset: newOffset }));
  };

  const resetFilters = () => {
    setFilters({
      keyword: '', type: '', creator: '', media_unit: '',
      program: '', desk: '', from: '', to: '', sort: 'newest'
    });
    setPagination(prev => ({ ...prev, offset: 0 }));
  };

  const hasActiveFilters = filters.keyword || filters.type || filters.creator || 
    filters.media_unit || filters.program || filters.desk || filters.from || filters.to;

  return (
    <div className="space-y-6 pb-12 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">الأرشيف الذكي</h1>
          <p className="text-slate-500 font-bold">إدارة المخرجات الإعلامية المؤرشفة</p>
        </div>
      </div>

      <div className="flex items-center gap-8 border-b border-slate-100 px-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
        <div className="flex items-center gap-2 px-4 py-5 font-bold text-sm text-purple-600 border-b-2 border-purple-600">
          <Archive size={18} />
          الأرشيف الرقمي
        </div>
      </div>

      {/* صندوق الفلاتر */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
        {/* السطر الأول: البحث + الترتيب + رست */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="البحث بالكلمة المفتاحية أو الوسوم..." 
              className="pr-12"
              value={filters.keyword}
              onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
            />
          </div>

          {/* ترتيب */}
          <button
            type="button"
            onClick={() => setFilters(prev => ({ 
              ...prev, 
              sort: prev.sort === 'newest' ? 'oldest' : 'newest' 
            }))}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-200 transition-colors text-sm font-bold whitespace-nowrap"
            title={filters.sort === 'newest' ? 'الأحدث أولاً' : 'الأقدم أولاً'}
          >
            {filters.sort === 'newest' ? (
              <>
                <ArrowDownNarrowWide size={16} />
                الأحدث أولاً
              </>
            ) : (
              <>
                <ArrowUpWideNarrow size={16} />
                الأقدم أولاً
              </>
            )}
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center gap-1 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 border border-red-200 text-sm font-bold whitespace-nowrap"
            >
              <X size={14} />
              مسح الفلاتر
            </button>
          )}
        </div>

        {/* السطر الثاني: الفلاتر */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* صاحب الملف */}
          <Select 
            options={[
              { value: '', label: 'كل من رفع الملف' }, 
              ...lookups.users.map(u => ({ value: u.id.toString(), label: u.name }))
            ]}
            value={filters.creator}
            onChange={(e) => setFilters(prev => ({ ...prev, creator: e.target.value }))}
          />

          {/* البرنامج */}
          <Select 
            options={[
              { value: '', label: 'كل البرامج' }, 
              ...lookups.programs.map(p => ({ value: p.id.toString(), label: p.title || p.name || `برنامج ${p.id}` }))
            ]}
            value={filters.program}
            onChange={(e) => setFilters(prev => ({ ...prev, program: e.target.value }))}
          />

          {/* القسم/الديسك */}
          <Select 
            options={[
              { value: '', label: 'كل الأقسام' }, 
              ...lookups.desks.map(d => ({ value: d.id.toString(), label: d.name }))
            ]}
            value={filters.desk}
            onChange={(e) => setFilters(prev => ({ ...prev, desk: e.target.value }))}
          />

          {/* نوع المحتوى */}
          <Select 
            options={[
              { value: '', label: 'كل الأنواع' }, 
              ...lookups.types.map(t => ({ value: t.id.toString(), label: t.name }))
            ]}
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
          />
        </div>

        {/* السطر الثالث: التواريخ */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-slate-400" />
            <span className="text-xs font-bold text-slate-600">من:</span>
            <Input 
              type="date" 
              className="w-40"
              value={filters.from}
              onChange={(e) => setFilters(prev => ({ ...prev, from: e.target.value }))}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">إلى:</span>
            <Input 
              type="date" 
              className="w-40"
              value={filters.to}
              onChange={(e) => setFilters(prev => ({ ...prev, to: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* عدد النتائج */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-500">
          عدد النتائج: <span className="text-slate-900">{pagination.total}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {content.length > 0 ? (
          content.map((c) => (
            <div 
              key={c.id} 
              className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all cursor-pointer flex flex-col active:scale-95"
              onClick={async () => {
                if (c.cloud_url) {
                  try {
                    const res = await api.get<{ success: boolean; data: { download_url: string } }>(`/api/content/${c.id}/download-url`);
                    if (res.success && res.data?.download_url) {
                      window.open(res.data.download_url, '_blank');
                    } else {
                      window.open(c.cloud_url, '_blank');
                    }
                  } catch (err) {
                    console.error('Error getting download URL:', err);
                    window.open(c.cloud_url, '_blank');
                  }
                } else {
                  navigate(`/content/${c.id}`);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center relative overflow-hidden group/preview">
                 {(() => {
                   // تحديد نوع الملف من الـ URL
                   const url = c.cloud_url || '';
                   const lower = url.toLowerCase();
                   const isVideo = /\.(mp4|mov|avi|mkv|webm|m4v)/.test(lower);
                   const isImage = /\.(jpg|jpeg|png|gif|webp|svg)/.test(lower);
                   const isPdf = /\.pdf/.test(lower);
                   const isAudio = /\.(mp3|wav|ogg|m4a)/.test(lower);
                   
                   if (isImage) {
                     return (
                       <>
                         <img 
                           src={url} 
                           alt={c.title}
                           loading="lazy"
                           className="w-full h-full object-cover group-hover/preview:scale-110 transition-transform duration-300"
                           onError={(e) => {
                             const img = e.target as HTMLImageElement;
                             img.style.display = 'none';
                             const parent = img.parentElement;
                             if (parent) {
                               parent.innerHTML = '<div class="text-white/40 flex flex-col items-center"><svg width="48" height="48" fill="currentColor" viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2z"/></svg></div>';
                             }
                           }}
                         />
                         <div className="absolute inset-0 bg-black/0 group-hover/preview:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover/preview:opacity-100">
                           <div className="text-white text-center">
                             <FileVideo size={32} className="mx-auto mb-2" />
                             <p className="text-xs font-bold">فتح في تاب جديد</p>
                           </div>
                         </div>
                       </>
                     );
                   } else if (isVideo) {
                     // فيديو - عرض أيقونة فقط، مش الفيديو كله
                     return (
                       <div className="text-white/60 flex flex-col items-center gap-2">
                         <div className="w-20 h-20 rounded-full bg-blue-600/30 flex items-center justify-center backdrop-blur-sm">
                           <FileVideo size={40} className="text-blue-300" />
                         </div>
                         <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">فيديو</span>
                       </div>
                     );
                   } else if (isAudio) {
                     return (
                       <div className="text-white/60 flex flex-col items-center gap-2">
                         <div className="w-20 h-20 rounded-full bg-purple-600/30 flex items-center justify-center backdrop-blur-sm">
                           <span className="text-3xl">🎙️</span>
                         </div>
                         <span className="text-[10px] font-bold uppercase tracking-wider text-purple-200">صوت</span>
                       </div>
                     );
                   } else if (isPdf) {
                     return (
                       <div className="text-white/60 flex flex-col items-center gap-2">
                         <div className="w-20 h-20 rounded-full bg-red-600/30 flex items-center justify-center backdrop-blur-sm">
                           <span className="text-3xl">📄</span>
                         </div>
                         <span className="text-[10px] font-bold uppercase tracking-wider text-red-200">PDF</span>
                       </div>
                     );
                   } else {
                     return (
                       <div className="text-white/60 flex flex-col items-center gap-2">
                         <div className="w-20 h-20 rounded-full bg-slate-600/30 flex items-center justify-center backdrop-blur-sm">
                           <FileVideo size={40} />
                         </div>
                         <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">ملف</span>
                       </div>
                     );
                   }
                 })()}
                 <div className="absolute top-3 left-3 flex flex-col gap-2">
                   {c.is_final && <Badge variant="green" className="border-none shadow-lg">FINAL</Badge>}
                 </div>
                 <div className="absolute bottom-3 right-3 flex gap-2">
                   <Badge variant="blue" className="bg-blue-600 text-white border-none text-[9px] font-black">{c.content_type_name}</Badge>
                 </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                 <div>
                    <h3 className="font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">{c.title}</h3>
                    {/* البرنامج والقسم */}
                    {((c as any).program_name || (c as any).desk_name) && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(c as any).program_name && (
                          <span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">
                            📺 {(c as any).program_name}
                          </span>
                        )}
                        {(c as any).desk_name && (
                          <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                            🏢 {(c as any).desk_name}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1 mt-3">
                      {(c.tags || []).slice(0, 3).map((t, idx) => (
                        <span key={idx} className="text-[9px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 flex items-center gap-1">
                          <Tag size={8} />
                          {t}
                        </span>
                      ))}
                      {(c.tags || []).length > 3 && <span className="text-[9px] font-bold text-slate-300">+{(c.tags || []).length - 3}</span>}
                    </div>
                 </div>

                 <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">من رفع الملف</span>
                      <span className="text-xs font-bold text-slate-700">{c.created_by_name || 'غير معروف'}</span>
                      {c.created_at && (
                        <span className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(c.created_at).toLocaleDateString('ar-SA')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end">
                         <div className="flex items-center gap-1.5 text-blue-600">
                           <RefreshCw size={12} />
                           <span className="text-xs font-black">{c.reuse_count || 0}</span>
                         </div>
                         <span className="text-[8px] font-black text-slate-300 uppercase">إعادة استخدام</span>
                      </div>
                    </div>
                 </div>
              </div>
            </div>
          ))
        ) : null}
        
        {loading && content.length === 0 && (
          <div className="col-span-full py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100 flex items-center justify-center">
            <p className="text-slate-400 font-bold animate-pulse">جاري تحميل المحتوى من الأرشيف...</p>
          </div>
        )}

        {!loading && content.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <Archive size={64} className="mx-auto text-slate-100 mb-6" />
            <h3 className="text-xl font-black text-slate-900 mb-2">الأرشيف فارغ حالياً</h3>
            <p className="text-slate-400 font-bold max-w-sm mx-auto">لم يتم العثور على أي محتوى مطابق لفلاتر البحث المطبقة حالياً.</p>
            {hasActiveFilters && (
              <Button variant="ghost" className="mt-8 text-blue-600 font-black" onClick={resetFilters}>مسح الفلاتر</Button>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.total > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-600">
              عرض <span className="text-blue-600">{pagination.offset + 1}</span> -{' '}
              <span className="text-blue-600">{Math.min(pagination.offset + pagination.limit, pagination.total)}</span>{' '}
              من أصل <span className="text-slate-900">{pagination.total}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* السابق */}
            <button
              type="button"
              onClick={() => handlePageChange(Math.max(0, pagination.offset - pagination.limit))}
              disabled={pagination.offset === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all font-bold text-sm shadow-md hover:shadow-lg disabled:shadow-none"
            >
              <ChevronRight size={18} />
              السابق
            </button>

            {/* رقم الصفحة الحالية */}
            <div className="flex items-center gap-1 px-4 py-2 bg-slate-100 rounded-xl">
              <span className="text-sm font-bold text-slate-600">صفحة</span>
              <span className="text-base font-black text-blue-600">
                {Math.floor(pagination.offset / pagination.limit) + 1}
              </span>
              <span className="text-sm font-bold text-slate-600">من</span>
              <span className="text-base font-black text-slate-900">
                {Math.ceil(pagination.total / pagination.limit)}
              </span>
            </div>

            {/* التالي */}
            <button
              type="button"
              onClick={() => handlePageChange(pagination.offset + pagination.limit)}
              disabled={pagination.offset + pagination.limit >= pagination.total}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all font-bold text-sm shadow-md hover:shadow-lg disabled:shadow-none"
            >
              التالي
              <ChevronLeft size={18} />
            </button>
          </div>
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="إضافة محتوى للأرشيف"
        className="max-w-3xl"
      >
        <ContentForm onSuccess={() => { setIsModalOpen(false); fetchData(); }} onCancel={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
}
