import React, { useState, useEffect } from 'react';
import { 
  FileVideo, Search, Plus, Filter, 
  ChevronLeft, ChevronRight, HardDrive, 
  User, Calendar, Eye, Archive, Trash2, Tag, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { Content, ContentType, User as UserType, MediaUnit } from '../types';
import { Button, Input, Select } from './ui/Inputs';
import { Badge } from './ui/Badge';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Modal } from './ui/Modal';
import ContentForm from './ContentForm';

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
    from: '',
    to: ''
  });

  const [lookups, setLookups] = useState<{
    types: ContentType[];
    users: UserType[];
    units: MediaUnit[];
  }>({ types: [], users: [], units: [] });

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchLookups = async () => {
      const [typeRes, userRes, unitRes] = await Promise.all([
        api.get<{ success: boolean; data: ContentType[] }>('/api/content/types'),
        api.get<{ success: boolean; data: UserType[] }>('/api/portal/users'),
        api.get<{ success: boolean; data: MediaUnit[] }>('/api/portal/media-units'),
      ]);
      setLookups({
        types: typeRes.data || [],
        users: userRes.data || [],
        units: unitRes.data || []
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
      };

      if (filters.keyword) params.keyword = filters.keyword;
      if (filters.type) params.content_type_id = filters.type;
      if (filters.creator) params.created_by = filters.creator;
      if (filters.media_unit) params.media_unit_id = filters.media_unit;
      if (filters.from) params.from_date = filters.from;
      if (filters.to) params.to_date = filters.to;

      const query = new URLSearchParams(params);
      const res = await api.get<{ success: boolean; data: Content[]; total: number }>(`/api/content?${query.toString()}`);
      console.log('API Response:', res);
      if (res.success) {
        console.log('Content loaded:', res.data);
        setContent(res.data);
        setPagination(prev => ({ ...prev, total: res.total || 0 }));
      } else {
        console.error('API returned success: false', res);
      }
    } catch (err) {
      console.error('Error fetching content:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination.offset, filters]);

  const handlePageChange = (newOffset: number) => {
    setPagination(prev => ({ ...prev, offset: newOffset }));
  };

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

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="البحث بالكلمة المفتاحية أو الوسوم..." 
              className="pr-12"
              value={filters.keyword}
              onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
            />
          </div>
          


          <Select 
            className="w-48"
            options={[{ value: '', label: 'كل المنشئين' }, ...lookups.users.map(u => ({ value: u.id.toString(), label: u.name }))]}
            value={filters.creator}
            onChange={(e) => setFilters(prev => ({ ...prev, creator: e.target.value }))}
          />
        </div>
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
                    // Get signed URL from backend
                    const res = await api.get<{ success: boolean; data: { download_url: string } }>(`/api/content/${c.id}/download-url`);
                    if (res.success && res.data?.download_url) {
                      window.open(res.data.download_url, '_blank');
                    } else {
                      // Fallback to direct URL if signed URL fails
                      window.open(c.cloud_url, '_blank');
                    }
                  } catch (err) {
                    console.error('Error getting download URL:', err);
                    // Fallback to direct URL
                    window.open(c.cloud_url, '_blank');
                  }
                } else {
                  navigate(`/content/${c.id}`);
                }
              }}
              role="button"
              tabIndex={0}
              onKeyDown={async (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
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
                }
              }}
            >
              <div className="aspect-video bg-slate-900 flex items-center justify-center relative overflow-hidden group/preview">
                 {c.cloud_url ? (
                   <>
                     <img 
                       src={c.cloud_url} 
                       alt={c.title}
                       className="w-full h-full object-cover group-hover/preview:scale-110 transition-transform duration-300"
                       onError={(e) => {
                         (e.target as HTMLImageElement).style.display = 'none';
                       }}
                     />
                     <div className="absolute inset-0 bg-black/0 group-hover/preview:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover/preview:opacity-100">
                       <div className="text-white text-center">
                         <FileVideo size={32} className="mx-auto mb-2" />
                         <p className="text-xs font-bold">فتح في تاب جديد</p>
                       </div>
                     </div>
                   </>
                 ) : (
                   <FileVideo size={48} className="text-white/20 group-hover:scale-110 transition-transform" />
                 )}
                 <div className="absolute top-3 left-3 flex flex-col gap-2">
                   {c.is_final && <Badge variant="green" className="border-none shadow-lg">FINAL</Badge>}
                   {c.archived && <Badge variant="purple" className="border-none shadow-lg">ARCHIVED</Badge>}
                 </div>
                 <div className="absolute bottom-3 right-3 flex gap-2">
                   <Badge variant="blue" className="bg-blue-600 text-white border-none text-[9px] font-black">{c.content_type_name}</Badge>
                 </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                 <div>
                    <h3 className="font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">{c.title}</h3>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {c.tags.slice(0, 3).map((t, idx) => (
                        <span key={idx} className="text-[9px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 flex items-center gap-1">
                          <Tag size={8} />
                          {t}
                        </span>
                      ))}
                      {c.tags.length > 3 && <span className="text-[9px] font-bold text-slate-300">+{c.tags.length - 3}</span>}
                    </div>
                 </div>

                 <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">المنشئ</span>
                      <span className="text-xs font-bold text-slate-700">{c.created_by_name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end">
                         <div className="flex items-center gap-1.5 text-blue-600">
                           <RefreshCw size={12} />
                           <span className="text-xs font-black">{c.reuse_count}</span>
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
            <Button variant="ghost" className="mt-8 text-blue-600 font-black" onClick={() => setFilters({ keyword: '', type: '', creator: '', from: '', to: '', media_unit: '' })}>رست الفلاتر</Button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-8">
        <span className="text-xs font-bold text-slate-400">مثال لعرض {content.length} عنصر أرشيفي</span>
        <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => handlePageChange(Math.max(0, pagination.offset - pagination.limit))} disabled={pagination.offset === 0}>
              <ChevronRight size={18} />
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handlePageChange(pagination.offset + pagination.limit)} disabled={pagination.offset + pagination.limit >= pagination.total}>
              <ChevronLeft size={18} />
            </Button>
        </div>
      </div>

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
