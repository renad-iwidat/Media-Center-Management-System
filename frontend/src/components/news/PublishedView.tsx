import { useState, useEffect, useCallback } from "react";
import { CheckCircle, Search, Zap, Eye, X } from "lucide-react";
import { motion } from "motion/react";
import { api } from "../../services/api";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { EmptyState } from "../shared/EmptyState";

export function PublishedView({ unitId }: { unitId: number | null }) {
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

  const loadData = useCallback(() => {
    setLoading(true);
    api.getPublished(unitId)
      .then((res) => setItems(res.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [unitId]);

  useEffect(() => { loadData(); }, [loadData]);

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
          <EmptyState icon={CheckCircle} title="لا يوجد محتوى منشور" description="سيظهر هنا المحتوى بعد الموافقة عليه من ستوديو التحرير." />
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
              <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-[#f1f5f9] rounded-xl transition-colors text-[#64748b] hover:text-[#1e293b]">
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
    </>
  );
}
