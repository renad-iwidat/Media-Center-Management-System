import { useState, useEffect } from "react";
import { CheckCircle, Search, Calendar, Tag, Zap, Eye, X } from "lucide-react";
import { motion } from "motion/react";
import { api } from "../services/api";
import { LoadingSpinner } from "./LoadingSpinner";
import { EmptyState } from "./EmptyState";

export function PublishedView({ unitId }: { unitId: number | null }) {
  const [items, setItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Filter states
  const [searchTitle, setSearchTitle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    setLoading(true);
    api.getPublished(unitId)
      .then((res) => setItems(res.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [unitId]);

  // Apply filters
  useEffect(() => {
    let filtered = [...items];

    // Search by title
    if (searchTitle.trim()) {
      filtered = filtered.filter(item =>
        item.title?.toLowerCase().includes(searchTitle.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(item => item.category_name === selectedCategory);
    }

    // Filter by type (automatic/manual)
    if (selectedType) {
      filtered = filtered.filter(item => {
        const itemType = item.publish_type || (item.policy_id ? "تحريري" : "أوتوماتيكي");
        return itemType === selectedType;
      });
    }

    // Filter by date range
    if (dateFrom) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.published_at);
        return itemDate >= new Date(dateFrom);
      });
    }
    if (dateTo) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.published_at);
        return itemDate <= new Date(dateTo);
      });
    }

    // Sort
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

  return (
    <>
      <div className="space-y-6">
        {/* Filters */}
        <div className="bg-[#0b1224] rounded-3xl p-6 border border-white/5 shadow-2xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Search size={16} className="text-blue-400" />
            البحث والفلترة
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search by title */}
            <div className="space-y-2">
              <label className="text-xs text-gray-400 font-bold uppercase">البحث عن عنوان</label>
              <input
                type="text"
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
                placeholder="ابحث عن عنوان..."
                className="w-full bg-[#020617]/50 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-600/50 text-white placeholder:text-gray-600"
              />
            </div>

            {/* Filter by category */}
            <div className="space-y-2">
              <label className="text-xs text-gray-400 font-bold uppercase">التصنيف</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-[#020617]/50 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-600/50 text-white"
              >
                <option value="">كل التصنيفات</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Filter by type */}
            <div className="space-y-2">
              <label className="text-xs text-gray-400 font-bold uppercase">النوع</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full bg-[#020617]/50 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-600/50 text-white"
              >
                <option value="">كل الأنواع</option>
                {types.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Date from */}
            <div className="space-y-2">
              <label className="text-xs text-gray-400 font-bold uppercase">من التاريخ</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full bg-[#020617]/50 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-600/50 text-white"
              />
            </div>

            {/* Date to */}
            <div className="space-y-2">
              <label className="text-xs text-gray-400 font-bold uppercase">إلى التاريخ</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full bg-[#020617]/50 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-600/50 text-white"
              />
            </div>

            {/* Sort */}
            <div className="space-y-2">
              <label className="text-xs text-gray-400 font-bold uppercase">الترتيب</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "newest" | "oldest")}
                className="w-full bg-[#020617]/50 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-600/50 text-white"
              >
                <option value="newest">الأحدث أولاً</option>
                <option value="oldest">الأقدم أولاً</option>
              </select>
            </div>
          </div>

          {/* Clear filters */}
          {(searchTitle || selectedCategory || selectedType || dateFrom || dateTo) && (
            <button
              onClick={() => {
                setSearchTitle("");
                setSelectedCategory("");
                setSelectedType("");
                setDateFrom("");
                setDateTo("");
              }}
              className="text-xs text-blue-400 hover:text-blue-300 font-bold"
            >
              مسح الفلاتر
            </button>
          )}
        </div>

        {/* Results info */}
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div>
            عدد النتائج: <span className="text-white font-bold">{filteredItems.length}</span> من <span className="text-white font-bold">{items.length}</span>
          </div>
          {filteredItems.length > 0 && (
            <div>
              الصفحة <span className="text-white font-bold">{currentPage}</span> من <span className="text-white font-bold">{Math.ceil(filteredItems.length / itemsPerPage)}</span>
            </div>
          )}
        </div>

        {/* Table */}
        {filteredItems.length === 0 ? (
          <EmptyState icon={CheckCircle} title="لا يوجد محتوى منشور" description="سيظهر هنا المحتوى بعد الموافقة عليه من ستوديو التحرير." />
        ) : (
          <div className="bg-[#0b1224] rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    <th className="text-right py-4 px-6 text-gray-400 font-semibold">#</th>
                    <th className="text-right py-4 px-6 text-gray-400 font-semibold">العنوان</th>
                    <th className="text-right py-4 px-6 text-gray-400 font-semibold">التصنيف</th>
                    <th className="text-right py-4 px-6 text-gray-400 font-semibold">النوع</th>
                    <th className="text-center py-4 px-6 text-gray-400 font-semibold">التاريخ</th>
                    <th className="text-center py-4 px-6 text-gray-400 font-semibold">الإجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((item: any, idx: number) => (
                      <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-6 text-gray-400 font-mono text-xs">
                          {(currentPage - 1) * itemsPerPage + idx + 1}
                        </td>
                        <td className="py-4 px-6 text-gray-200 max-w-xs truncate">
                          {item.title || 'بدون عنوان'}
                        </td>
                        <td className="py-4 px-6">
                          <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded text-xs font-bold">
                            {item.category_name || '—'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit ${
                            (item.publish_type || (item.policy_id ? "تحريري" : "أوتوماتيكي")) === "أوتوماتيكي"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-amber-500/10 text-amber-400"
                          }`}>
                            {(item.publish_type || (item.policy_id ? "تحريري" : "أوتوماتيكي")) === "أوتوماتيكي" ? (
                              <><Zap size={12} /> أوتوماتيكي</>
                            ) : (
                              <><Eye size={12} /> تحريري</>
                            )}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center text-gray-400 text-xs font-mono">
                          {item.published_at ? new Date(item.published_at).toLocaleDateString('ar-SA') : '—'}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => setSelectedItem(item)}
                            className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 px-3 py-1.5 rounded text-xs font-bold transition-all"
                          >
                            عرض التفاصيل
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {Math.ceil(filteredItems.length / itemsPerPage) > 1 && (
              <div className="flex items-center justify-center gap-2 p-4 border-t border-white/5">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded text-xs font-bold transition-all"
                >
                  السابق
                </button>
                {Array.from({ length: Math.ceil(filteredItems.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                      currentPage === page
                        ? "bg-blue-600 text-white"
                        : "bg-white/5 hover:bg-white/10 text-white"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredItems.length / itemsPerPage), p + 1))}
                  disabled={currentPage === Math.ceil(filteredItems.length / itemsPerPage)}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded text-xs font-bold transition-all"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0b1224] rounded-3xl p-8 border border-blue-600/20 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                <CheckCircle size={20} className="text-blue-400" />
                تفاصيل الخبر المنشور
              </h3>
              <button onClick={() => setSelectedItem(null)} className="text-gray-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Image */}
            {selectedItem.image_url && (
              <div className="w-full h-64 rounded-2xl overflow-hidden border border-white/10 bg-black/50">
                <img src={selectedItem.image_url} alt="صورة الخبر" className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23222" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="20" fill="%23555" text-anchor="middle" dy=".3em"%3Eلا توجد صورة%3C/text%3E%3C/svg%3E'; }} />
              </div>
            )}

            {/* Meta info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/[0.02] rounded-xl border border-white/10 p-4">
                <p className="text-xs text-gray-500 mb-1">التصنيف</p>
                <p className="text-sm font-bold text-white">{selectedItem.category_name || '—'}</p>
              </div>
              <div className="bg-white/[0.02] rounded-xl border border-white/10 p-4">
                <p className="text-xs text-gray-500 mb-1">النوع</p>
                <p className="text-sm font-bold text-white flex items-center gap-1">
                  {(selectedItem.publish_type || (selectedItem.policy_id ? "تحريري" : "أوتوماتيكي")) === "أوتوماتيكي" ? (
                    <><Zap size={14} className="text-emerald-400" /> أوتوماتيكي</>
                  ) : (
                    <><Eye size={14} className="text-amber-400" /> تحريري</>
                  )}
                </p>
              </div>
              <div className="bg-white/[0.02] rounded-xl border border-white/10 p-4">
                <p className="text-xs text-gray-500 mb-1">تاريخ النشر</p>
                <p className="text-sm font-bold text-white">{selectedItem.published_at ? new Date(selectedItem.published_at).toLocaleDateString('ar-SA') : '—'}</p>
              </div>
              <div className="bg-white/[0.02] rounded-xl border border-white/10 p-4">
                <p className="text-xs text-gray-500 mb-1">الوسيط</p>
                <p className="text-sm font-bold text-white">{selectedItem.media_unit_name || '—'}</p>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <label className="text-xs text-gray-400 font-bold">العنوان</label>
              <p className="text-lg font-bold text-white leading-relaxed">{selectedItem.title || 'بدون عنوان'}</p>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <label className="text-xs text-gray-400 font-bold">المحتوى</label>
              <div className="bg-white/[0.02] rounded-xl border border-white/10 p-4 max-h-64 overflow-y-auto">
                <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{selectedItem.content || 'بدون محتوى'}</p>
              </div>
            </div>

            {/* URL */}
            {selectedItem.url && (
              <div className="space-y-2">
                <label className="text-xs text-gray-400 font-bold">الرابط الأصلي</label>
                <a href={selectedItem.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 break-all">
                  {selectedItem.url}
                </a>
              </div>
            )}

            {/* Close button */}
            <button
              onClick={() => setSelectedItem(null)}
              className="w-full bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-bold text-sm transition-all"
            >
              إغلاق
            </button>
          </motion.div>
        </div>
      )}
    </>
  );
}
