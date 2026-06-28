import { useState, useEffect, useCallback } from "react";
import { CheckCircle, Search, Zap, Eye, X, PenTool, Share2, MessageSquare, Globe, ExternalLink, Loader2, Archive } from "lucide-react";
import { motion } from "motion/react";
import { api } from "../../services/api";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { EmptyState } from "../shared/EmptyState";
import { Notification, NotificationData } from "../shared/Notification";
import { SocialPostCreator } from "./SocialPostCreator";

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
  const [showSocialPostCreator, setShowSocialPostCreator] = useState(false);

  // dialog إعدادات النشر (تصنيف، auto_publish، pin)
  const [publishConfigTarget, setPublishConfigTarget] = useState<any | null>(null); // الهدف المختار
  const [externalCategories, setExternalCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [publishConfig, setPublishConfig] = useState<{
    category_id: number | undefined;
    auto_publish: boolean;
    pin: number;
  }>({ category_id: undefined, auto_publish: true, pin: 0 });

  // النص القابل للتحرير قبل النشر الفعلي على الموقع الخارجي
  const [editableTitle, setEditableTitle] = useState("");
  const [editableContent, setEditableContent] = useState("");

  const loadData = useCallback(() => {
    setLoading(true);
    // جلب الأخبار المرشحة للنشر (status = approved في editorial_queue)
    api.getReadyToPublish(unitId)
      .then((res) => {
        const allItems = res.data || [];
        // الأخبار هنا مصفاة من الـ Backend (approved — تحريرية وأوتوماتيكية)
        setItems(allItems);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [unitId]);

  useEffect(() => { loadData(); }, [loadData]);

  // فتح نافذة النشر الخارجي
  const handleOpenExternalPublish = async (item: any) => {
    setSelectedPublishItem(item);
    setLastPublishedUrl(null);
    setPublishConfigTarget(null);
    setExternalCategories([]);
    setPublishConfig({ category_id: undefined, auto_publish: true, pin: 0 });
    // تهيئة النص القابل للتحرير من نص الخبر الحالي
    setEditableTitle(item.title || "");
    setEditableContent(item.content || "");
    try {
      const res = await api.getAutoPublishTargets(unitId || undefined);
      // جلب أسماء المواقع المنشور عليها فعلاً من published_platforms
      const publishedTargetNames: string[] = (item.published_platforms || [])
        .filter((p: any) => p.platform === 'external_website')
        .map((p: any) => p.name);

      // إظهار فقط المواقع التي manual_enabled = true وغير منشور عليها بعد
      const targets = (res.data || []).filter((t: any) =>
        (t.is_enabled || t.manual_enabled) &&
        !publishedTargetNames.includes(t.name)
      );
      setPublishTargets(targets);
    } catch {
      setNotification({ type: "error", message: "❌ فشل تحميل المواقع الخارجية" });
    }
  };

  // عند اختيار موقع — جلب تصنيفاته
  const handleSelectTarget = async (target: any) => {
    setPublishConfigTarget(target);

    // حساب التصنيف التلقائي من الـ mapping إذا موجود
    let autoMappedCategoryId: number | undefined = undefined;
    if (target.category_mappings && selectedPublishItem?.category_id) {
      const mapped = target.category_mappings[String(selectedPublishItem.category_id)];
      if (mapped) autoMappedCategoryId = mapped;
    }

    // إعادة تعيين الإعدادات بالقيم الافتراضية
    setPublishConfig({
      category_id: autoMappedCategoryId || target.default_category_id || undefined,
      auto_publish: target.default_auto_publish ?? true,
      pin: target.default_pin ?? 0,
    });

    if (target.categories_api_url) {
      setLoadingCategories(true);
      try {
        const res = await api.getExternalTargetCategories(target.id);
        setExternalCategories(res.data || []);
      } catch {
        setExternalCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    } else {
      setExternalCategories([]);
    }
  };

  // النشر الفعلي بعد تأكيد الإعدادات
  const handleConfirmPublish = async () => {
    if (!selectedPublishItem?.raw_data_id || !publishConfigTarget) return;
    setPublishingToTarget(publishConfigTarget.id);
    setLastPublishedUrl(null);
    try {
      const res = await api.publishOneToExternal(
        selectedPublishItem.raw_data_id,
        publishConfigTarget.id,
        {
          category_id: publishConfig.category_id,
          auto_publish: publishConfig.auto_publish,
          pin: publishConfig.pin,
          title: editableTitle,
          content: editableContent,
        }
      );
      const externalUrl = res?.data?.externalUrl;
      setPublishConfigTarget(null); // إغلاق dialog الإعدادات
      if (externalUrl) {
        setLastPublishedUrl(externalUrl);
      }
      setNotification({ type: "success", message: "✅ تم نشر الخبر بنجاح على الموقع الخارجي" });
    } catch (err: any) {
      setNotification({ type: "error", message: err?.message || "❌ فشل النشر على الموقع الخارجي" });
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
    if (dateFrom) filtered = filtered.filter(item => {
      const itemDate = item.published_at || item.pub_date;
      return itemDate && new Date(itemDate) >= new Date(dateFrom);
    });
    if (dateTo) filtered = filtered.filter(item => {
      const itemDate = item.published_at || item.pub_date;
      return itemDate && new Date(itemDate) <= new Date(dateTo + 'T23:59:59');
    });
    // الترتيب حسب التاريخ - الأحدث أولاً أو الأقدم أولاً
    if (sortBy === "newest") {
      filtered.sort((a, b) => {
        const dateA = new Date(a.published_at || a.pub_date || 0).getTime();
        const dateB = new Date(b.published_at || b.pub_date || 0).getTime();
        return dateB - dateA;
      });
    } else {
      filtered.sort((a, b) => {
        const dateA = new Date(a.published_at || a.pub_date || 0).getTime();
        const dateB = new Date(b.published_at || b.pub_date || 0).getTime();
        return dateA - dateB;
      });
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

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
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
              title="من تاريخ"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF9F4A] focus:ring-1 focus:ring-[#FF9F4A]/20 text-[#1e293b]"
              title="إلى تاريخ"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "newest" | "oldest")}
              className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF9F4A] focus:ring-1 focus:ring-[#FF9F4A]/20 text-[#1e293b]"
            >
              <option value="newest">الأحدث أولاً</option>
              <option value="oldest">الأقدم أولاً</option>
            </select>
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
                    <th className="text-center py-3 px-4 text-[10px] font-semibold text-[#64748b] uppercase">منشور على</th>
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
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 justify-center flex-wrap">
                            {item.is_published_external && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                                <Globe size={9} /> موقع
                              </span>
                            )}
                            {item.is_published_social && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-100 text-orange-700 border border-orange-200">
                                <Share2 size={9} /> سوشال
                              </span>
                            )}
                            {!item.is_published_external && !item.is_published_social && (
                              <span className="text-[9px] text-[#94a3b8]">—</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center text-[#64748b] text-xs font-mono">
                          {item.pub_date
                            ? new Date(item.pub_date).toLocaleString('ar-EG', { timeZone: 'Asia/Hebron', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
                            : item.published_at ? new Date(item.published_at).toLocaleString('ar-EG', { timeZone: 'Asia/Hebron', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
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
                  { label: 'تاريخ النشر', value: selectedItem.pub_date ? new Date(selectedItem.pub_date).toLocaleString('ar-EG', { timeZone: 'Asia/Hebron', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : selectedItem.published_at ? new Date(selectedItem.published_at).toLocaleString('ar-EG', { timeZone: 'Asia/Hebron', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—' },
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
              {(selectedItem.original_url || selectedItem.url) && (
                <div>
                  <p className="text-[10px] text-[#94a3b8] font-bold uppercase mb-2">الرابط الأصلي</p>
                  <a href={selectedItem.original_url || selectedItem.url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-[#3d6a8a] hover:text-[#2d5570] break-all transition-colors">
                    {selectedItem.original_url || selectedItem.url}
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

              {/* Publish Options — حسب نوع الخبر */}
              <div className="space-y-3">
                <p className="text-[10px] text-[#94a3b8] font-bold uppercase">حالة النشر</p>

                {/* عرض المنصات اللي منشور عليها */}
                {(selectedItem.is_published_external || selectedItem.is_published_social || (selectedItem.published_platforms && selectedItem.published_platforms.length > 0)) && (
                  <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4 space-y-3">
                    <p className="text-xs font-bold text-[#1e293b] flex items-center gap-1.5">
                      <CheckCircle size={14} className="text-emerald-600" /> منشور على:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedItem.published_platforms && selectedItem.published_platforms.map((p: any, idx: number) => (
                        <span key={idx} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold ${
                          p.platform === 'external_website'
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : p.platform === 'facebook'
                            ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                            : p.platform === 'instagram'
                            ? 'bg-pink-100 text-pink-700 border border-pink-200'
                            : p.platform === 'twitter'
                            ? 'bg-sky-100 text-sky-700 border border-sky-200'
                            : 'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}>
                          {p.platform === 'external_website' && <Globe size={12} />}
                          {p.platform === 'facebook' && <Share2 size={12} />}
                          {p.platform === 'instagram' && <Share2 size={12} />}
                          {p.platform === 'twitter' && <Share2 size={12} />}
                          {p.name || p.platform}
                        </span>
                      ))}
                      {/* fallback إذا ما في تفاصيل بس في flags */}
                      {(!selectedItem.published_platforms || selectedItem.published_platforms.length === 0) && selectedItem.is_published_external && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                          <Globe size={12} /> موقع خارجي
                        </span>
                      )}
                      {(!selectedItem.published_platforms || selectedItem.published_platforms.length === 0) && selectedItem.is_published_social && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-orange-100 text-orange-700 border border-orange-200">
                          <Share2 size={12} /> سوشال ميديا
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* إذا مش منشور على أي منصة */}
                {!selectedItem.is_published_external && !selectedItem.is_published_social && (!selectedItem.published_platforms || selectedItem.published_platforms.length === 0) && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
                    <Eye size={14} className="text-amber-600 shrink-0" />
                    <p className="text-xs text-amber-700 font-medium">لم يُنشر بعد على أي منصة خارجية</p>
                  </div>
                )}

                {/* رابط الخبر المنشور */}
                {lastPublishedUrl && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle size={14} /> تم النشر بنجاح
                    </p>
                    <div className="flex items-center gap-2">
                      <a href={lastPublishedUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-700 underline break-all flex-1">
                        {lastPublishedUrl}
                      </a>
                      <button
                        onClick={() => { navigator.clipboard.writeText(lastPublishedUrl); setNotification({ type: 'success', message: '✅ تم نسخ الرابط' }); }}
                        className="shrink-0 px-2.5 py-1.5 bg-white border border-emerald-200 hover:bg-emerald-100 rounded-lg text-[10px] font-bold text-emerald-700 transition-all"
                      >نسخ</button>
                      <a href={lastPublishedUrl} target="_blank" rel="noopener noreferrer"
                        className="shrink-0 px-2.5 py-1.5 bg-white border border-blue-200 hover:bg-blue-100 rounded-lg text-[10px] font-bold text-blue-700 transition-all flex items-center gap-1">
                        <ExternalLink size={10} /> فتح
                      </a>
                    </div>
                  </div>
                )}

                {/* خيارات النشر المتاحة */}
                <p className="text-[10px] text-[#94a3b8] font-bold uppercase pt-2">إجراءات النشر المتاحة</p>

                {/* الخيارات حسب حالة النشر الفعلية */}
                {(() => {
                  const publishedTargetNames: string[] = (selectedItem.published_platforms || [])
                    .filter((p: any) => p.platform === 'external_website')
                    .map((p: any) => p.name);
                  // هل في موقع خارجي مفعّل لم يُنشر عليه بعد؟ — نحدده لاحقاً عند فتح القائمة
                  const canPublishExternal = true; // دائماً اظهر الزر، الفلتر يصير عند الفتح
                  return (
                <div className={`grid grid-cols-1 ${canPublishExternal && !selectedItem.is_published_social ? "sm:grid-cols-2" : ""} gap-3`}>
                  {/* نشر موقع خارجي — يظهر دائماً (الفلتر يصير عند اختيار الموقع) */}
                  {canPublishExternal && (
                    <button
                      onClick={() => { setShowPublishOptions(true); setShowSocialPostCreator(false); handleOpenExternalPublish(selectedItem); }}
                      className={`p-4 rounded-xl border-2 transition-all text-right ${
                        showPublishOptions && !showSocialPostCreator
                          ? "border-blue-400 bg-blue-50"
                          : "border-[#e2e8f0] bg-white hover:border-blue-300 hover:bg-blue-50/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                          <Globe size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#1e293b]">نشر موقع خارجي</p>
                          <p className="text-[10px] text-[#94a3b8]">
                            {publishedTargetNames.length > 0
                              ? `منشور على: ${publishedTargetNames.join('، ')} — نشر على موقع آخر`
                              : 'نشر الخبر على المواقع المرتبطة'}
                          </p>
                        </div>
                      </div>
                    </button>
                  )}

                  {/* إنشاء منشور على السوشال ميديا */}
                  {!selectedItem.is_published_social && (
                    <button
                      onClick={() => { setShowSocialPostCreator(true); setShowPublishOptions(false); }}
                      className={`p-4 rounded-xl border-2 transition-all text-right ${
                        showSocialPostCreator
                          ? "border-[#FF9F4A] bg-orange-50"
                          : "border-[#e2e8f0] bg-white hover:border-[#FF9F4A] hover:bg-orange-50/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                          <Share2 size={20} className="text-[#FF9F4A]" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#1e293b]">إنشاء منشور على السوشال ميديا</p>
                          <p className="text-[10px] text-[#94a3b8]">تحويل الخبر لمنشور ونشره على المنصات</p>
                        </div>
                      </div>
                    </button>
                  )}
                </div>
                  );
                })()}

                {/* ═══ محتوى الخيار 1: نشر موقع خارجي ═══ */}
                {showPublishOptions && !showSocialPostCreator && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-3 border border-[#e2e8f0] rounded-xl p-4 bg-[#f8fafc]"
                  >
                    {/* ── الخطوة 1: اختيار الموقع ── */}
                    {!publishConfigTarget && (
                      <>
                        <p className="text-[10px] text-[#94a3b8] font-bold uppercase flex items-center gap-1">
                          <ExternalLink size={12} /> اختر الموقع الخارجي
                        </p>
                        {publishTargets.length > 0 ? (
                          publishTargets.map((target) => (
                            <button
                              key={target.id}
                              onClick={() => handleSelectTarget(target)}
                              className="w-full p-3 rounded-xl border border-[#e2e8f0] hover:border-blue-300 hover:bg-blue-50/50 transition-all flex items-center justify-between group bg-white"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                                  <Globe size={14} className="text-blue-500" />
                                </div>
                                <div className="text-right">
                                  <p className="text-xs font-semibold text-[#1e293b]">{target.name}</p>
                                  <p className="text-[10px] text-[#64748b]">{target.media_unit_name || target.mediaUnitName}</p>
                                </div>
                              </div>
                              <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded-lg">اختيار</span>
                            </button>
                          ))
                        ) : (
                          <p className="text-xs text-[#94a3b8] text-center py-2">لا توجد مواقع خارجية متاحة (إما منشور على الكل أو لا يوجد مواقع مفعّلة)</p>
                        )}
                      </>
                    )}

                    {/* ── الخطوة 2: إعدادات النشر ── */}
                    {publishConfigTarget && (
                      <div className="space-y-4">
                        {/* Header الموقع المختار */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Globe size={13} className="text-blue-600" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-[#1e293b]">{publishConfigTarget.name}</p>
                              <p className="text-[9px] text-[#94a3b8]">إعدادات النشر</p>
                            </div>
                          </div>
                          <button
                            onClick={() => { setPublishConfigTarget(null); setExternalCategories([]); }}
                            className="text-[10px] text-[#94a3b8] hover:text-[#1e293b] flex items-center gap-1"
                          >
                            <X size={11} /> تغيير
                          </button>
                        </div>

                        {/* الرابط الأصلي للخبر — ليطّلع عليه المحرر قبل النشر */}
                        {(selectedPublishItem?.original_url || selectedPublishItem?.url) && (
                          <div className="bg-white border border-[#e2e8f0] rounded-xl p-3">
                            <p className="text-[10px] text-[#94a3b8] font-bold uppercase mb-1.5 flex items-center gap-1">
                              <ExternalLink size={11} /> الرابط الأصلي للخبر
                            </p>
                            <a
                              href={selectedPublishItem.original_url || selectedPublishItem.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-[#3d6a8a] hover:text-[#2d5570] underline break-all transition-colors"
                            >
                              {selectedPublishItem.original_url || selectedPublishItem.url}
                            </a>
                          </div>
                        )}

                        {/* تحرير العنوان قبل النشر */}
                        <div>
                          <label className="text-[10px] text-[#64748b] font-bold uppercase block mb-1.5 flex items-center gap-1">
                            <PenTool size={11} /> العنوان (قابل للتعديل)
                          </label>
                          <input
                            type="text"
                            value={editableTitle}
                            onChange={(e) => setEditableTitle(e.target.value)}
                            className="w-full bg-white border border-[#e2e8f0] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-400 text-[#1e293b]"
                            placeholder="عنوان الخبر..."
                          />
                        </div>

                        {/* تحرير المحتوى قبل النشر */}
                        <div>
                          <label className="text-[10px] text-[#64748b] font-bold uppercase block mb-1.5 flex items-center gap-1">
                            <PenTool size={11} /> المحتوى (قابل للتعديل)
                          </label>
                          <textarea
                            value={editableContent}
                            onChange={(e) => setEditableContent(e.target.value)}
                            rows={8}
                            className="w-full bg-white border border-[#e2e8f0] rounded-xl px-3 py-2 text-xs leading-relaxed focus:outline-none focus:border-blue-400 text-[#1e293b] resize-y custom-scrollbar whitespace-pre-wrap"
                            placeholder="محتوى الخبر..."
                          />
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-[9px] text-[#94a3b8]">
                              سيُنشر هذا النص المعدّل على {publishConfigTarget.name}
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setEditableTitle(selectedPublishItem?.title || "");
                                setEditableContent(selectedPublishItem?.content || "");
                              }}
                              className="text-[9px] text-[#94a3b8] hover:text-[#1e293b] underline"
                            >
                              استعادة النص الأصلي
                            </button>
                          </div>
                        </div>

                        {/* التصنيف */}
                        <div>
                          <label className="text-[10px] text-[#64748b] font-bold uppercase block mb-1.5">
                            التصنيف على الموقع الخارجي
                          </label>
                          {loadingCategories ? (
                            <div className="flex items-center gap-2 py-2 text-[11px] text-[#94a3b8]">
                              <Loader2 size={12} className="animate-spin" /> جاري تحميل التصنيفات...
                            </div>
                          ) : externalCategories.length > 0 ? (
                            <select
                              value={publishConfig.category_id ?? ''}
                              onChange={(e) => setPublishConfig(prev => ({
                                ...prev,
                                category_id: e.target.value ? Number(e.target.value) : undefined
                              }))}
                              className="w-full bg-white border border-[#e2e8f0] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-400 text-[#1e293b]"
                            >
                              <option value="">— اختر تصنيفاً —</option>
                              {externalCategories
                                .filter((c: any) => c.parent_id === null || c.parent_id === undefined)
                                .map((cat: any) => (
                                  <optgroup key={cat.id} label={cat.title}>
                                    <option value={cat.id}>{cat.title}</option>
                                    {externalCategories
                                      .filter((c: any) => c.parent_id === cat.id)
                                      .map((child: any) => (
                                        <option key={child.id} value={child.id}>
                                          &nbsp;&nbsp;↳ {child.title}
                                        </option>
                                      ))}
                                  </optgroup>
                                ))}
                            </select>
                          ) : (
                            <div className="space-y-1.5">
                              {publishConfigTarget.category_mappings && selectedPublishItem?.category_id && publishConfigTarget.category_mappings[String(selectedPublishItem.category_id)] ? (
                                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                                  <span className="text-[11px] text-emerald-700 font-bold">✓ تصنيف محسوب تلقائياً:</span>
                                  <span className="text-[11px] text-emerald-800 font-mono">{publishConfigTarget.category_mappings[String(selectedPublishItem.category_id)]}</span>
                                  <button
                                    onClick={() => setPublishConfig(prev => ({ ...prev, category_id: undefined }))}
                                    className="text-[9px] text-emerald-600 hover:text-emerald-800 underline mr-auto"
                                  >
                                    تغيير يدوي
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min={1}
                                    value={publishConfig.category_id ?? ''}
                                    onChange={(e) => setPublishConfig(prev => ({
                                      ...prev,
                                      category_id: e.target.value ? Number(e.target.value) : undefined
                                    }))}
                                    placeholder={`افتراضي: ${publishConfigTarget.default_category_id}`}
                                    className="flex-1 bg-white border border-[#e2e8f0] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-400 text-[#1e293b]"
                                  />
                                  <span className="text-[10px] text-[#94a3b8]">ID التصنيف</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* auto_publish و pin — فقط للمواقع التي تدعمها (مثل النجاح) */}
                        {(publishConfigTarget.auth_type === 'token' || publishConfigTarget.api_url?.includes('nn.najah.edu')) && (
                          <div className="space-y-3">
                            {/* حالة النشر — بارزة */}
                            <div>
                              <label className="text-[10px] text-[#64748b] font-bold uppercase block mb-2">
                                طريقة النشر على {publishConfigTarget.name}
                              </label>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={() => setPublishConfig(prev => ({ ...prev, auto_publish: true }))}
                                  className={`p-3 rounded-xl border-2 transition-all text-right ${
                                    publishConfig.auto_publish
                                      ? 'bg-emerald-50 border-emerald-400'
                                      : 'bg-white border-[#e2e8f0] hover:border-emerald-200'
                                  }`}
                                >
                                  <p className={`text-sm font-bold ${publishConfig.auto_publish ? 'text-emerald-700' : 'text-[#64748b]'}`}>✅ نشر فوري</p>
                                  <p className="text-[10px] text-[#94a3b8] mt-0.5">يظهر للزوار فوراً</p>
                                </button>
                                <button
                                  onClick={() => setPublishConfig(prev => ({ ...prev, auto_publish: false }))}
                                  className={`p-3 rounded-xl border-2 transition-all text-right ${
                                    !publishConfig.auto_publish
                                      ? 'bg-amber-50 border-amber-400'
                                      : 'bg-white border-[#e2e8f0] hover:border-amber-200'
                                  }`}
                                >
                                  <p className={`text-sm font-bold ${!publishConfig.auto_publish ? 'text-amber-700' : 'text-[#64748b]'}`}>📝 مسودة</p>
                                  <p className="text-[10px] text-[#94a3b8] mt-0.5">يُحفظ draft — تنشره لاحقاً</p>
                                </button>
                              </div>
                            </div>

                            {/* pin */}
                            <div>
                              <label className="text-[10px] text-[#64748b] font-bold uppercase block mb-1.5">
                                تثبيت في الرئيسية
                              </label>
                              <div className="flex gap-1">
                                {[0, 1, 2, 3, 4, 5].map(v => (
                                  <button
                                    key={v}
                                    onClick={() => setPublishConfig(prev => ({ ...prev, pin: v }))}
                                    title={v === 0 ? 'غير مثبت' : `موضع ${v}${v === 5 ? ' (أول خبر)' : ''}`}
                                    className={`flex-1 py-2 rounded-lg text-[11px] font-bold border transition-all ${
                                      publishConfig.pin === v
                                        ? v === 0 ? 'bg-slate-200 border-slate-400 text-slate-700' : 'bg-blue-100 border-blue-400 text-blue-700'
                                        : 'bg-white border-[#e2e8f0] text-[#64748b] hover:border-blue-200'
                                    }`}
                                  >
                                    {v}
                                  </button>
                                ))}
                              </div>
                              <p className="text-[9px] text-[#94a3b8] mt-1">
                                {publishConfig.pin === 0 ? 'غير مثبت' : `مثبت بموضع ${publishConfig.pin}${publishConfig.pin === 5 ? ' (أول خبر — صورة كبيرة)' : ''}`}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* ملخص الإعدادات */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-1">
                          <p className="text-[10px] font-bold text-blue-700 mb-1.5">ملخص النشر:</p>
                          <div className="flex flex-wrap gap-2">
                            <span className="text-[10px] bg-white border border-blue-200 rounded-lg px-2 py-1 text-blue-700">
                              📁 تصنيف: {publishConfig.category_id ?? publishConfigTarget.default_category_id}
                            </span>
                            {(publishConfigTarget.auth_type === 'token' || publishConfigTarget.api_url?.includes('nn.najah.edu')) && (
                              <>
                                <span className={`text-[10px] rounded-lg px-2 py-1 border ${publishConfig.auto_publish ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                                  {publishConfig.auto_publish ? '✅ نشر فوري' : '📝 مسودة'}
                                </span>
                                <span className="text-[10px] bg-white border border-blue-200 rounded-lg px-2 py-1 text-blue-700">
                                  📌 pin: {publishConfig.pin === 0 ? 'بدون تثبيت' : `موضع ${publishConfig.pin}`}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* زر النشر */}
                        <button
                          onClick={handleConfirmPublish}
                          disabled={publishingToTarget !== null}
                          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                        >
                          {publishingToTarget === publishConfigTarget.id ? (
                            <><Loader2 size={14} className="animate-spin" /> جاري النشر...</>
                          ) : (
                            <><Globe size={14} /> نشر على {publishConfigTarget.name}</>
                          )}
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Social Post Creator Modal */}
              {showSocialPostCreator && selectedItem && (
                <SocialPostCreator
                  article={{
                    raw_data_id: selectedItem.raw_data_id,
                    title: selectedItem.title || "",
                    content: selectedItem.content || "",
                    image_url: selectedItem.image_url || null,
                  }}
                  unitId={unitId}
                  onClose={() => setShowSocialPostCreator(false)}
                  onSuccess={(url) => {
                    setLastPublishedUrl(url);
                    setShowSocialPostCreator(false);
                    setNotification({ type: "success", message: "✅ تم النشر بنجاح على السوشال ميديا" });
                  }}
                />
              )}

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
