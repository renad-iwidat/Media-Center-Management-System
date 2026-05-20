import { useState, useEffect, useCallback } from "react";
import { CheckCircle, Search, Zap, Eye, X, PenTool, Share2, MessageSquare, Globe, ExternalLink, Loader2, Archive } from "lucide-react";
import { motion } from "motion/react";
import { api } from "../../services/api";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { EmptyState } from "../shared/EmptyState";
import { Notification, NotificationData } from "../shared/Notification";

interface PublishedViewProps {
  unitId: number | null;
  onNavigateToAI?: (section: string, content: { title: string; content: string }) => void;
}

export function PublishedView({ unitId, onNavigateToAI }: PublishedViewProps) {
  const [items, setItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const [searchTitle, setSearchTitle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // حالة النشر الخارجي
  const [notification, setNotification] = useState<NotificationData | null>(null);
  const [publishTargets, setPublishTargets] = useState<any[]>([]);
  const [publishingToTarget, setPublishingToTarget] = useState<number | null>(null);
  const [selectedPublishItem, setSelectedPublishItem] = useState<any>(null);
  const [showPublishOptions, setShowPublishOptions] = useState(false);
  const [lastPublishedUrl, setLastPublishedUrl] = useState<string | null>(null);
  const [archivingId, setArchivingId] = useState<number | null>(null);

  const loadData = useCallback(() => {
    setLoading(true);
    api.getPublished(unitId)
      .then((res) => {
        // قسم النشر = فقط الأخبار التحريرية (اللي وافق عليها المحرر)
        const allItems = res.data || [];
        const editorialOnly = allItems.filter((item: any) => item.flow_type === 'editorial');
        setItems(editorialOnly);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [unitId]);

  useEffect(() => { loadData(); }, [loadData]);

  // فتح نافذة النشر الخارجي
  const handleOpenExternalPublish = async (item: any) => {
    setSelectedPublishItem(item);
    setLastPublishedUrl(null);
    try {
      const res = await api.getAutoPublishTargets();
      const targets = (res.data || []).filter((t: any) => t.is_enabled);
      setPublishTargets(targets);
    } catch {
      setNotification({
        type: "error",
        message: "❌ فشل تحميل المواقع الخارجية",
      });
    }
  };

  // نشر على موقع خارجي
  const handlePublishToExternal = async (targetId: number) => {
    if (!selectedPublishItem?.raw_data_id) return;
    setPublishingToTarget(targetId);
    setLastPublishedUrl(null);
    try {
      const res = await api.publishOneToExternal(selectedPublishItem.raw_data_id, targetId);
      const externalUrl = res?.data?.externalUrl;
      if (externalUrl) {
        setLastPublishedUrl(externalUrl);
        setNotification({
          type: "success",
          message: `✅ تم نشر الخبر بنجاح`,
        });
      } else {
        setNotification({
          type: "success",
          message: `✅ تم نشر الخبر على الموقع الخارجي`,
        });
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err?.message || `❌ فشل النشر على الموقع الخارجي`,
      });
    } finally {
      setPublishingToTarget(null);
    }
  };

  // أرشفة خبر
  const handleArchiveArticle = async (rawDataId: number) => {
    setArchivingId(rawDataId);
    try {
      await api.archiveArticle(rawDataId);
      setNotification({ type: "success", message: "✅ تم أرشفة الخبر بنجاح" });
      setItems(prev => prev.filter(item => item.raw_data_id !== rawDataId));
      setSelectedItem(null);
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err?.message || "❌ فشل أرشفة الخبر — تأكد أنه منشور على منصة واحدة على الأقل",
      });
    } finally {
      setArchivingId(null);
    }
  };

  useEffect(() => {
    let filtered = [...items];
    if (searchTitle.trim()) filtered = filtered.filter(item => item.title?.toLowerCase().includes(searchTitle.toLowerCase()));
    if (selectedCategory) filtered = filtered.filter(item => item.category_name === selectedCategory);
    if (selectedType) filtered = filtered.filter(item => {
      const itemType = item.flow_type === 'automated' ? "أوتوماتيكي" : "تحريري";
      return itemType === selectedType;
    });
    if (dateFrom) filtered = filtered.filter(item => new Date(item.published_at) >= new Date(dateFrom));
    if (dateTo) filtered = filtered.filter(item => new Date(item.published_at) <= new Date(dateTo));
    if (sortBy === "newest") {
      filtered.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
    } else {
      filtered.sort((a, b) => new Date(a.published_at).getTime() - new Date(b.published_at).getTime());
    }
    setFilteredItems(filtered);
    setCurrentPage(1);
  }, [items, searchTitle, selectedCategory, selectedType, dateFrom, dateTo, sortBy]);

  const categories = [...new Set(items.map(item => item.category_name))].filter(Boolean);
  const types = ["أوتوماتيكي", "تحريري"];

  if (loading) return <LoadingSpinner />;

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const hasFilters = !!(searchTitle || selectedCategory || selectedType || dateFrom || dateTo);

  return (
    <>
      {/* Notification */}
      <Notification notification={notification} onClose={() => setNotification(null)} position="center" />

      <div className="space-y-5">
        {/* Filters */}
        <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1e293b] flex items-center gap-2">
              <Search size={14} className="text-[#4A7C9E]" />
              البحث والفلترة
            </h3>
            {hasFilters && (
              <button
                onClick={() => { setSearchTitle(""); setSelectedCategory(""); setSelectedType(""); setDateFrom(""); setDateTo(""); }}
                className="text-xs text-[#FF9F4A] hover:text-[#FF8C2E] font-bold flex items-center gap-1"
              >
                <X size={12} /> مسح الفلاتر
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="col-span-2">
              <input
                type="text"
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
                placeholder="ابحث عن عنوان..."
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF9F4A] focus:ring-1 focus:ring-[#FF9F4A]/20 text-[#1e293b] placeholder:text-[#cbd5e1]"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF9F4A] focus:ring-1 focus:ring-[#FF9F4A]/20 text-[#1e293b]"
            >
              <option value="">كل التصنيفات</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF9F4A] focus:ring-1 focus:ring-[#FF9F4A]/20 text-[#1e293b]"
            >
              <option value="">كل الأنواع</option>
              {types.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF9F4A] focus:ring-1 focus:ring-[#FF9F4A]/20 text-[#1e293b]"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF9F4A] focus:ring-1 focus:ring-[#FF9F4A]/20 text-[#1e293b]"
            />
          </div>
        </div>

        {/* Results info */}
        <div className="flex items-center justify-between text-xs text-[#94a3b8]">
          <span>
            عدد النتائج: <span className="text-[#1e293b] font-bold">{filteredItems.length}</span>
            {hasFilters && <span> من <span className="text-[#1e293b] font-bold">{items.length}</span></span>}
          </span>
          {totalPages > 1 && (
            <span>الصفحة <span className="text-[#1e293b] font-bold">{currentPage}</span> من <span className="text-[#1e293b] font-bold">{totalPages}</span></span>
          )}
        </div>

        {/* Table */}
        {filteredItems.length === 0 ? (
          <EmptyState icon={CheckCircle} title="لا يوجد محتوى منشور" description="سيظهر هنا المحتوى بعد الموافقة عليه من قسم التحرير." />
        ) : (
          <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                    <th className="text-right py-3 px-5 text-[10px] font-semibold text-[#64748b] uppercase">#</th>
                    <th className="text-right py-3 px-5 text-[10px] font-semibold text-[#64748b] uppercase">العنوان</th>
                    <th className="text-right py-3 px-4 text-[10px] font-semibold text-[#64748b] uppercase">التصنيف</th>
                    <th className="text-right py-3 px-4 text-[10px] font-semibold text-[#64748b] uppercase">النوع</th>
                    <th className="text-center py-3 px-4 text-[10px] font-semibold text-[#64748b] uppercase">التاريخ</th>
                    <th className="text-center py-3 px-4 text-[10px] font-semibold text-[#64748b] uppercase">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {filteredItems
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((item: any, idx: number) => (
                      <tr key={item.id} className="hover:bg-[#f8fafc] transition-colors">
                        <td className="py-3 px-5 text-[#94a3b8] font-mono text-xs">
                          {(currentPage - 1) * itemsPerPage + idx + 1}
                        </td>
                        <td className="py-3 px-5 text-[#1e293b] font-medium max-w-xs truncate">
                          {item.title || 'بدون عنوان'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="bg-[#f0f4f8] text-[#3d6a8a] px-2 py-1 rounded-lg text-[10px] font-bold border border-[#e2e8f0]">
                            {item.category_name || '—'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 w-fit ${
                            item.flow_type === "automated"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}>
                            {item.flow_type === "automated" ? <><Zap size={10} /> أوتوماتيكي</> : <><Eye size={10} /> تحريري</>}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-[#64748b] text-xs font-mono">
                          {item.pub_date
                            ? new Date(item.pub_date).toLocaleDateString('ar-SA')
                            : item.published_at ? new Date(item.published_at).toLocaleDateString('ar-SA') : '—'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setSelectedItem(item)}
                            className="bg-[#3d6a8a]/10 hover:bg-[#3d6a8a]/20 text-[#3d6a8a] px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                          >
                            عرض
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 p-4 border-t border-[#e2e8f0]">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#e2e8f0] disabled:opacity-30 disabled:cursor-not-allowed text-[#64748b] rounded-lg text-xs font-bold transition-all"
                >
                  السابق
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const page = totalPages <= 7 ? i + 1 : currentPage <= 4 ? i + 1 : currentPage + i - 3;
                  if (page < 1 || page > totalPages) return null;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        currentPage === page
                          ? "bg-[#3d6a8a] text-white shadow-sm"
                          : "bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#e2e8f0] text-[#64748b]"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#e2e8f0] disabled:opacity-30 disabled:cursor-not-allowed text-[#64748b] rounded-lg text-xs font-bold transition-all"
                >
                  التالي
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-2xl border border-[#e2e8f0] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0] sticky top-0 bg-white rounded-t-2xl z-10">
              <h3 className="text-base font-bold flex items-center gap-2 text-[#1e293b]">
                <CheckCircle size={18} className="text-emerald-600" />
                تفاصيل الخبر المنشور
              </h3>
              <button onClick={() => { setSelectedItem(null); setShowPublishOptions(false); }} className="p-2 hover:bg-[#f1f5f9] rounded-xl transition-colors text-[#64748b] hover:text-[#1e293b]">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Image */}
              {selectedItem.image_url && (
                <div className="w-full h-56 rounded-xl overflow-hidden border border-[#e2e8f0] bg-[#f8fafc]">
                  <img
                    src={selectedItem.image_url}
                    alt="صورة الخبر"
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f1f5f9" width="400" height="300"/%3E%3C/svg%3E'; }}
                  />
                </div>
              )}

              {/* Meta */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'التصنيف', value: selectedItem.category_name || '—' },
                  { label: 'النوع', value: selectedItem.flow_type === "automated" ? 'أوتوماتيكي' : 'تحريري' },
                  { label: 'تاريخ النشر', value: selectedItem.pub_date ? new Date(selectedItem.pub_date).toLocaleDateString('ar-SA') : selectedItem.published_at ? new Date(selectedItem.published_at).toLocaleDateString('ar-SA') : '—' },
                  { label: 'الوحدة الإعلامية', value: selectedItem.media_unit_name || '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-[#f8fafc] rounded-xl border border-[#e2e8f0] p-3">
                    <p className="text-[10px] text-[#94a3b8] font-semibold mb-1">{label}</p>
                    <p className="text-sm font-bold text-[#1e293b] truncate">{value}</p>
                  </div>
                ))}
              </div>

              {/* Title */}
              <div>
                <p className="text-[10px] text-[#94a3b8] font-bold uppercase mb-2">العنوان</p>
                <p className="text-base font-bold text-[#1e293b] leading-relaxed">{selectedItem.title || 'بدون عنوان'}</p>
              </div>

              {/* Content */}
              <div>
                <p className="text-[10px] text-[#94a3b8] font-bold uppercase mb-2">المحتوى</p>
                <div className="bg-[#f8fafc] rounded-xl border border-[#e2e8f0] p-4 max-h-56 overflow-y-auto custom-scrollbar">
                  <p className="text-sm text-[#1e293b] leading-relaxed whitespace-pre-wrap">{selectedItem.content || 'بدون محتوى'}</p>
                </div>
              </div>

              {/* URL */}
              {selectedItem.url && (
                <div>
                  <p className="text-[10px] text-[#94a3b8] font-bold uppercase mb-2">الرابط الأصلي</p>
                  <a href={selectedItem.url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-[#3d6a8a] hover:text-[#2d5570] break-all transition-colors">
                    {selectedItem.url}
                  </a>
                </div>
              )}

              {/* AI Actions */}
              {onNavigateToAI && (
                <div>
                  <p className="text-[10px] text-[#94a3b8] font-bold uppercase mb-3">أدوات الذكاء الاصطناعي</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button
                      onClick={() => {
                        onNavigateToAI('editing', { title: selectedItem.title || '', content: selectedItem.content || '' });
                        setSelectedItem(null);
                      }}
                      className="flex items-center gap-2 px-3 py-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-bold text-[#4A7C9E] transition-all"
                    >
                      <PenTool size={14} />
                      <span>إعادة صياغة</span>
                    </button>
                    <button
                      onClick={() => {
                        onNavigateToAI('social', { title: selectedItem.title || '', content: selectedItem.content || '' });
                        setSelectedItem(null);
                      }}
                      className="flex items-center gap-2 px-3 py-2.5 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl text-xs font-bold text-[#FF9F4A] transition-all"
                    >
                      <Share2 size={14} />
                      <span>منشور اجتماعي</span>
                    </button>
                    <button
                      onClick={() => {
                        onNavigateToAI('chat', { title: selectedItem.title || '', content: selectedItem.content || '' });
                        setSelectedItem(null);
                      }}
                      className="flex items-center gap-2 px-3 py-2.5 bg-pink-50 hover:bg-pink-100 border border-pink-200 rounded-xl text-xs font-bold text-pink-600 transition-all"
                    >
                      <MessageSquare size={14} />
                      <span>مساعد AI</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Publish Options */}
              <div>
                <button
                  onClick={() => {
                    setShowPublishOptions(!showPublishOptions);
                    if (!showPublishOptions) {
                      handleOpenExternalPublish(selectedItem);
                    }
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/40"
                >
                  <Globe size={16} /> نشر
                </button>

                {showPublishOptions && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 space-y-4 border border-[#e2e8f0] rounded-xl p-4 bg-[#f8fafc]"
                  >
                    {/* ═══ رابط الخبر المنشور ═══ */}
                    {lastPublishedUrl && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
                        <p className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                          <CheckCircle size={14} /> تم النشر بنجاح
                        </p>
                        <div className="flex items-center gap-2">
                          <a
                            href={lastPublishedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-700 underline break-all flex-1"
                          >
                            {lastPublishedUrl}
                          </a>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(lastPublishedUrl);
                              setNotification({ type: 'success', message: '✅ تم نسخ الرابط' });
                            }}
                            className="shrink-0 px-2.5 py-1.5 bg-white border border-emerald-200 hover:bg-emerald-100 rounded-lg text-[10px] font-bold text-emerald-700 transition-all"
                          >
                            نسخ
                          </button>
                          <a
                            href={lastPublishedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 px-2.5 py-1.5 bg-white border border-blue-200 hover:bg-blue-100 rounded-lg text-[10px] font-bold text-blue-700 transition-all flex items-center gap-1"
                          >
                            <ExternalLink size={10} /> فتح
                          </a>
                        </div>
                      </div>
                    )}

                    {/* ═══ النشر على موقع خارجي ═══ */}
                    <div className="space-y-2">
                      <p className="text-[10px] text-[#94a3b8] font-bold uppercase flex items-center gap-1">
                        <ExternalLink size={12} /> نشر على موقع خارجي
                      </p>
                      {publishTargets.length > 0 ? (
                        publishTargets.map((target) => (
                          <button
                            key={target.id}
                            onClick={() => handlePublishToExternal(target.id)}
                            disabled={publishingToTarget !== null}
                            className="w-full p-3 rounded-xl border border-[#e2e8f0] hover:border-blue-300 hover:bg-blue-50/50 transition-all flex items-center justify-between group bg-white"
                          >
                            <div className="flex items-center gap-3">
                              <ExternalLink size={14} className="text-blue-500 group-hover:text-blue-600" />
                              <div className="text-right">
                                <p className="text-xs font-semibold text-[#1e293b]">{target.name}</p>
                                <p className="text-[10px] text-[#64748b]">{target.media_unit_name || target.mediaUnitName}</p>
                              </div>
                            </div>
                            {publishingToTarget === target.id ? (
                              <Loader2 size={14} className="text-blue-600 animate-spin" />
                            ) : (
                              <span className="text-[10px] text-blue-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">نشر</span>
                            )}
                          </button>
                        ))
                      ) : (
                        <p className="text-xs text-[#94a3b8] text-center py-2">لا توجد مواقع خارجية مفعّلة</p>
                      )}
                    </div>

                    {/* ═══ النشر على السوشال ميديا ═══ */}
                    <div className="space-y-2 border-t border-[#e2e8f0] pt-3">
                      <p className="text-[10px] text-[#94a3b8] font-bold uppercase flex items-center gap-1">
                        <Share2 size={12} /> نشر حقيقي على السوشال ميديا
                      </p>
                      <SocialPublishSection
                        articleId={selectedItem.raw_data_id}
                        onSuccess={(url) => {
                          setLastPublishedUrl(url);
                          setNotification({ type: "success", message: "✅ تم النشر بنجاح على السوشال ميديا" });
                        }}
                        onError={(msg) => {
                          setNotification({ type: "error", message: msg });
                        }}
                      />
                      {/* رابط لأداة AI لتجهيز المحتوى */}
                      {onNavigateToAI && (
                        <button
                          onClick={() => {
                            onNavigateToAI('social', {
                              title: selectedItem.title || '',
                              content: selectedItem.content || ''
                            });
                            setSelectedItem(null);
                            setShowPublishOptions(false);
                          }}
                          className="w-full p-2.5 rounded-xl border border-dashed border-[#e2e8f0] hover:border-orange-300 hover:bg-orange-50/30 transition-all flex items-center justify-center gap-2 text-[10px] font-bold text-[#94a3b8] hover:text-orange-600"
                        >
                          <PenTool size={12} /> تجهيز المحتوى بالذكاء الاصطناعي أولاً
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Archive Button */}
              <button
                onClick={() => handleArchiveArticle(selectedItem.raw_data_id)}
                disabled={archivingId === selectedItem.raw_data_id}
                className="w-full bg-[#4A7C9E] hover:bg-[#3d6a8a] disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
              >
                {archivingId === selectedItem.raw_data_id ? (
                  <><Loader2 size={14} className="animate-spin" /> جاري الأرشفة...</>
                ) : (
                  <><Archive size={14} /> نقل إلى الأرشيف</>
                )}
              </button>

              {/* Close */}
              <button
                onClick={() => { setSelectedItem(null); setShowPublishOptions(false); }}
                className="w-full bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#e2e8f0] text-[#64748b] py-2.5 rounded-xl font-bold text-sm transition-all"
              >
                إغلاق
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}

// ═══ Social Publish Section — نشر حقيقي على السوشال ميديا ═══
function SocialPublishSection({
  articleId,
  onSuccess,
  onError,
}: {
  articleId: number;
  onSuccess: (url: string) => void;
  onError: (msg: string) => void;
}) {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loadingConfigs, setLoadingConfigs] = useState(true);
  const [publishingTo, setPublishingTo] = useState<number | null>(null);

  useEffect(() => {
    setLoadingConfigs(true);
    api.getPlatformConfigs()
      .then((res) => {
        // فقط المنصات المفعّلة من نوع سوشال (ليس external_website)
        const socialConfigs = (res.data || res.configs || []).filter(
          (c: any) => c.is_enabled && c.platform !== 'external_website'
        );
        setConfigs(socialConfigs);
      })
      .catch(() => setConfigs([]))
      .finally(() => setLoadingConfigs(false));
  }, []);

  const handlePublish = async (configId: number) => {
    setPublishingTo(configId);
    try {
      const res = await api.publishToPlatform(articleId, configId);
      if (res.success) {
        const url = res.data?.external_url || '';
        onSuccess(url);
      } else {
        onError(`❌ ${res.message || 'فشل النشر'}`);
      }
    } catch (err: any) {
      onError(`❌ ${err?.message || 'فشل النشر على المنصة'}`);
    } finally {
      setPublishingTo(null);
    }
  };

  const PLATFORM_ICONS_MAP: Record<string, string> = {
    facebook: '📘',
    instagram: '📷',
    twitter: '🐦',
  };

  const PLATFORM_COLORS_MAP: Record<string, string> = {
    facebook: 'border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/50',
    instagram: 'border-pink-200 hover:border-pink-400 hover:bg-pink-50/50',
    twitter: 'border-sky-200 hover:border-sky-400 hover:bg-sky-50/50',
  };

  if (loadingConfigs) {
    return (
      <div className="flex items-center justify-center py-3">
        <Loader2 size={14} className="animate-spin text-[#94a3b8]" />
        <span className="text-xs text-[#94a3b8] mr-2">جاري تحميل المنصات...</span>
      </div>
    );
  }

  if (configs.length === 0) {
    return (
      <p className="text-xs text-[#94a3b8] text-center py-2 bg-white rounded-xl border border-[#e2e8f0]">
        لا توجد منصات سوشال ميديا مفعّلة — أضف إعدادات من قسم الإعدادات
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {configs.map((config) => (
        <button
          key={config.id}
          onClick={() => handlePublish(config.id)}
          disabled={publishingTo !== null}
          className={`w-full p-3 rounded-xl border transition-all flex items-center justify-between group bg-white disabled:opacity-50 disabled:cursor-not-allowed ${
            PLATFORM_COLORS_MAP[config.platform] || 'border-[#e2e8f0] hover:border-[#94a3b8] hover:bg-[#f8fafc]'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">{PLATFORM_ICONS_MAP[config.platform] || '🌐'}</span>
            <div className="text-right">
              <p className="text-xs font-semibold text-[#1e293b]">{config.name}</p>
              <p className="text-[10px] text-[#64748b]">
                {config.platform === 'facebook' && 'نشر مباشر على فيسبوك'}
                {config.platform === 'instagram' && 'نشر مباشر على إنستغرام'}
                {config.platform === 'twitter' && 'نشر مباشر على X (تويتر)'}
              </p>
            </div>
          </div>
          {publishingTo === config.id ? (
            <Loader2 size={14} className="text-indigo-600 animate-spin" />
          ) : (
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 opacity-0 group-hover:opacity-100 transition-opacity">
              نشر الآن
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
