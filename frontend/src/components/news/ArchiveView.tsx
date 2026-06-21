import { useState, useEffect, useCallback } from "react";
import { Archive, Search, X, ExternalLink, Globe, Share2, Eye, CheckCircle, Clock, AlertTriangle, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { api } from "../../services/api";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { EmptyState } from "../shared/EmptyState";
import { Notification, NotificationData } from "../shared/Notification";

interface ArchiveViewProps {
  unitId: number | null;
}

interface PlatformInfo {
  platform: string;
  status: string;
  external_url: string | null;
  published_at: string | null;
  platform_name?: string | null;
}

interface ArchiveItem {
  id: number;
  title: string;
  content: string;
  image_url: string | null;
  tags: string[];
  publish_status: string;
  category_name: string | null;
  fetched_at: string;
  archived_at: string | null;
  platforms: PlatformInfo[] | null;
}

const PLATFORM_LABELS: Record<string, string> = {
  external_website: "موقع خارجي",
  facebook: "فيسبوك",
  instagram: "إنستغرام",
  twitter: "X (تويتر)",
};

const PLATFORM_ICONS: Record<string, typeof Globe> = {
  external_website: Globe,
  facebook: Share2,
  instagram: Share2,
  twitter: Share2,
};

const PLATFORM_COLORS: Record<string, string> = {
  external_website: "bg-blue-100 text-blue-700 border-blue-200",
  facebook: "bg-indigo-100 text-indigo-700 border-indigo-200",
  instagram: "bg-pink-100 text-pink-700 border-pink-200",
  twitter: "bg-sky-100 text-sky-700 border-sky-200",
};

function getPlatformLabel(platform: string): string {
  return PLATFORM_LABELS[platform] || platform;
}

function getPlatformColor(platform: string): string {
  return PLATFORM_COLORS[platform] || "bg-gray-100 text-gray-700 border-gray-200";
}

export function ArchiveView({ unitId }: ArchiveViewProps) {
  const [items, setItems] = useState<ArchiveItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ArchiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ArchiveItem | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const [searchTitle, setSearchTitle] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");

  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const itemsPerPage = 20;

  const [notification, setNotification] = useState<NotificationData | null>(null);

  const loadData = useCallback(() => {
    setLoading(true);
    const offset = (currentPage - 1) * itemsPerPage;
    api.getArchive({
      platform: selectedPlatform || undefined,
      media_unit_id: unitId || undefined,
      limit: itemsPerPage,
      offset,
    })
      .then((res) => {
        setItems(res.data || []);
        setTotal(res.total || 0);
      })
      .catch(() => {
        setItems([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [currentPage, selectedPlatform, unitId]);

  useEffect(() => { loadData(); }, [loadData]);

  // Client-side filtering for search and date
  useEffect(() => {
    let filtered = [...items];
    if (searchTitle.trim()) {
      filtered = filtered.filter(item =>
        item.title?.toLowerCase().includes(searchTitle.toLowerCase())
      );
    }
    if (selectedCategory) {
      filtered = filtered.filter(item => item.category_name === selectedCategory);
    }
    if (dateFrom) {
      filtered = filtered.filter(item => {
        const itemDate = item.archived_at || item.fetched_at;
        return new Date(itemDate) >= new Date(dateFrom);
      });
    }
    if (dateTo) {
      filtered = filtered.filter(item => {
        const itemDate = item.archived_at || item.fetched_at;
        return new Date(itemDate) <= new Date(dateTo + 'T23:59:59');
      });
    }
    if (sortBy === "newest") {
      filtered.sort((a, b) => {
        const dateA = new Date(a.archived_at || a.fetched_at).getTime();
        const dateB = new Date(b.archived_at || b.fetched_at).getTime();
        return dateB - dateA;
      });
    } else {
      filtered.sort((a, b) => {
        const dateA = new Date(a.archived_at || a.fetched_at).getTime();
        const dateB = new Date(b.archived_at || b.fetched_at).getTime();
        return dateA - dateB;
      });
    }
    setFilteredItems(filtered);
  }, [items, searchTitle, selectedCategory, dateFrom, dateTo, sortBy]);

  const toggleExpand = (id: number) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalPages = Math.ceil(total / itemsPerPage);
  const hasFilters = !!(searchTitle || selectedPlatform || selectedCategory || dateFrom || dateTo);

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Notification notification={notification} onClose={() => setNotification(null)} position="center" />

      <div className="space-y-5">
        {/* Stats */}
        <div className="flex items-center justify-end">
          <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-2">
            <p className="text-xs text-[#64748b]">الإجمالي: <span className="font-bold text-[#1e293b]">{total}</span> خبر</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1e293b] flex items-center gap-2">
              <Search size={14} className="text-[#4A7C9E]" />
              البحث والفلترة
            </h3>
            {hasFilters && (
              <button
                onClick={() => { setSearchTitle(""); setSelectedPlatform(""); setSelectedCategory(""); setDateFrom(""); setDateTo(""); setCurrentPage(1); }}
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
              onChange={(e) => { setSelectedCategory(e.target.value); }}
              className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF9F4A] focus:ring-1 focus:ring-[#FF9F4A]/20 text-[#1e293b]"
            >
              <option value="">كل التصنيفات</option>
              {[...new Set(items.map(item => item.category_name))].filter(Boolean).map(cat => (
                <option key={cat} value={cat!}>{cat}</option>
              ))}
            </select>
            <select
              value={selectedPlatform}
              onChange={(e) => { setSelectedPlatform(e.target.value); setCurrentPage(1); }}
              className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF9F4A] focus:ring-1 focus:ring-[#FF9F4A]/20 text-[#1e293b]"
            >
              <option value="">كل المنصات</option>
              <option value="external_website">موقع خارجي</option>
              <option value="facebook">فيسبوك</option>
              <option value="instagram">إنستغرام</option>
              <option value="twitter">X (تويتر)</option>
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
            {total > itemsPerPage && (
              <span> من <span className="text-[#1e293b] font-bold">{total}</span></span>
            )}
          </span>
          {totalPages > 1 && (
            <span>الصفحة <span className="text-[#1e293b] font-bold">{currentPage}</span> من <span className="text-[#1e293b] font-bold">{totalPages}</span></span>
          )}
        </div>

        {/* Content */}
        {filteredItems.length === 0 ? (
          <EmptyState
            icon={Archive}
            title="لا يوجد محتوى مؤرشف"
            description="سيظهر هنا المحتوى بعد أرشفته من قسم النشر."
          />
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <ArchiveCard
                key={item.id}
                item={item}
                isExpanded={expandedItems.has(item.id)}
                onToggleExpand={() => toggleExpand(item.id)}
                onViewDetails={() => setSelectedItem(item)}
                onCopyUrl={(url) => {
                  navigator.clipboard.writeText(url);
                  setNotification({ type: "success", message: "✅ تم نسخ الرابط" });
                }}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 bg-white hover:bg-[#f1f5f9] border border-[#e2e8f0] disabled:opacity-30 disabled:cursor-not-allowed text-[#64748b] rounded-lg text-xs font-bold transition-all"
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
                      : "bg-white hover:bg-[#f1f5f9] border border-[#e2e8f0] text-[#64748b]"
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 bg-white hover:bg-[#f1f5f9] border border-[#e2e8f0] disabled:opacity-30 disabled:cursor-not-allowed text-[#64748b] rounded-lg text-xs font-bold transition-all"
            >
              التالي
            </button>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl border border-[#e2e8f0] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0] sticky top-0 bg-white rounded-t-2xl z-10">
                <h3 className="text-base font-bold flex items-center gap-2 text-[#1e293b]">
                  <Archive size={18} className="text-[#4A7C9E]" />
                  تفاصيل الخبر المؤرشف
                </h3>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-2 hover:bg-[#f1f5f9] rounded-xl transition-colors text-[#64748b] hover:text-[#1e293b]"
                >
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
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                )}

                {/* Meta */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="bg-[#f8fafc] rounded-xl border border-[#e2e8f0] p-3">
                    <p className="text-[10px] text-[#94a3b8] font-semibold mb-1">التصنيف</p>
                    <p className="text-sm font-bold text-[#1e293b]">{selectedItem.category_name || '—'}</p>
                  </div>
                  <div className="bg-[#f8fafc] rounded-xl border border-[#e2e8f0] p-3">
                    <p className="text-[10px] text-[#94a3b8] font-semibold mb-1">الحالة</p>
                    <p className="text-sm font-bold text-emerald-600">مؤرشف ✓</p>
                  </div>
                  <div className="bg-[#f8fafc] rounded-xl border border-[#e2e8f0] p-3">
                    <p className="text-[10px] text-[#94a3b8] font-semibold mb-1">تاريخ الأرشفة</p>
                    <p className="text-sm font-bold text-[#1e293b]">
                      {new Date(selectedItem.archived_at || selectedItem.fetched_at).toLocaleString('ar-EG', { timeZone: 'Asia/Hebron', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <p className="text-[10px] text-[#94a3b8] font-bold uppercase mb-2">العنوان</p>
                  <p className="text-base font-bold text-[#1e293b] leading-relaxed">
                    {selectedItem.title || 'بدون عنوان'}
                  </p>
                </div>

                {/* Content */}
                <div>
                  <p className="text-[10px] text-[#94a3b8] font-bold uppercase mb-2">المحتوى</p>
                  <div className="bg-[#f8fafc] rounded-xl border border-[#e2e8f0] p-4 max-h-56 overflow-y-auto">
                    <p className="text-sm text-[#1e293b] leading-relaxed whitespace-pre-wrap">
                      {selectedItem.content || 'بدون محتوى'}
                    </p>
                  </div>
                </div>

                {/* Publishing Platforms & Links */}
                <div>
                  <p className="text-[10px] text-[#94a3b8] font-bold uppercase mb-3">منصات النشر والروابط</p>
                  {selectedItem.platforms && selectedItem.platforms.length > 0 ? (
                    <div className="space-y-2">
                      {selectedItem.platforms.map((p, idx) => (
                        <PlatformLinkCard key={idx} platform={p} onCopyUrl={(url) => {
                          navigator.clipboard.writeText(url);
                          setNotification({ type: "success", message: "✅ تم نسخ الرابط" });
                        }} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#94a3b8] text-center py-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                      لا توجد بيانات نشر مسجلة
                    </p>
                  )}
                </div>

                {/* Close */}
                <button
                  onClick={() => setSelectedItem(null)}
                  className="w-full bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#e2e8f0] text-[#64748b] py-2.5 rounded-xl font-bold text-sm transition-all"
                >
                  إغلاق
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

// ═══ Archive Card Component ═══
function ArchiveCard({
  item,
  isExpanded,
  onToggleExpand,
  onViewDetails,
  onCopyUrl,
}: {
  item: ArchiveItem;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onViewDetails: () => void;
  onCopyUrl: (url: string) => void;
}) {
  const platforms = item.platforms || [];
  const publishedPlatforms = platforms.filter(p => p.status === 'success');
  const hasLinks = publishedPlatforms.some(p => p.external_url);

  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Main Row */}
      <div className="p-4 flex items-start gap-4">
        {/* Image Thumbnail */}
        {item.image_url && (
          <div className="w-16 h-16 rounded-xl overflow-hidden border border-[#e2e8f0] shrink-0 bg-[#f8fafc]">
            <img
              src={item.image_url}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-[#1e293b] truncate">
                {item.title || 'بدون عنوان'}
              </h4>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {item.category_name && (
                  <span className="bg-[#f0f4f8] text-[#3d6a8a] px-2 py-0.5 rounded-lg text-[10px] font-bold border border-[#e2e8f0]">
                    {item.category_name}
                  </span>
                )}
                <span className="text-[10px] text-[#94a3b8] font-mono">
                  {new Date(item.archived_at || item.fetched_at).toLocaleString('ar-EG', { timeZone: 'Asia/Hebron', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onViewDetails}
                className="bg-[#3d6a8a]/10 hover:bg-[#3d6a8a]/20 text-[#3d6a8a] px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1"
              >
                <Eye size={12} /> عرض
              </button>
              {publishedPlatforms.length > 0 && (
                <button
                  onClick={onToggleExpand}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 border border-emerald-200"
                >
                  {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  {publishedPlatforms.length} منصة
                </button>
              )}
            </div>
          </div>

          {/* Platform Badges (always visible) */}
          {publishedPlatforms.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {publishedPlatforms.map((p, idx) => (
                <span
                  key={idx}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${getPlatformColor(p.platform)}`}
                >
                  {getPlatformLabel(p.platform)}
                  {p.status === 'success' && ' ✓'}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Expanded Platform Links */}
      <AnimatePresence>
        {isExpanded && publishedPlatforms.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-[#e2e8f0] bg-[#f8fafc] overflow-hidden"
          >
            <div className="p-4 space-y-2">
              {publishedPlatforms.map((p, idx) => (
                <PlatformLinkCard key={idx} platform={p} onCopyUrl={onCopyUrl} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══ Platform Link Card ═══
function PlatformLinkCard({
  platform,
  onCopyUrl,
}: {
  platform: PlatformInfo;
  onCopyUrl: (url: string) => void;
}) {
  const IconComponent = PLATFORM_ICONS[platform.platform] || Globe;
  const statusSuccess = platform.status === 'success';

  return (
    <div className={`flex items-center justify-between p-3 rounded-xl border ${
      statusSuccess ? 'bg-white border-emerald-200' : 'bg-white border-[#e2e8f0]'
    }`}>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
          statusSuccess ? 'bg-emerald-100' : 'bg-gray-100'
        }`}>
          <IconComponent size={14} className={statusSuccess ? 'text-emerald-600' : 'text-gray-500'} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#1e293b]">
              {platform.platform_name || getPlatformLabel(platform.platform)}
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              statusSuccess
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              {statusSuccess ? 'منشور ✓' : 'فشل'}
            </span>
          </div>
          {platform.published_at && (
            <p className="text-[10px] text-[#94a3b8] mt-0.5">
              {new Date(platform.published_at).toLocaleString('ar-SA', {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })}
            </p>
          )}
          {platform.external_url && (
            <p className="text-[10px] text-blue-500 truncate mt-0.5 max-w-xs">
              {platform.external_url}
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {platform.external_url && (
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onCopyUrl(platform.external_url!)}
            className="px-2.5 py-1.5 bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#e2e8f0] rounded-lg text-[10px] font-bold text-[#64748b] hover:text-[#1e293b] transition-all"
            title="نسخ الرابط"
          >
            نسخ
          </button>
          <a
            href={platform.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-[10px] font-bold text-blue-700 transition-all flex items-center gap-1"
            title="فتح الرابط"
          >
            <ExternalLink size={10} /> فتح
          </a>
        </div>
      )}
    </div>
  );
}
