import { useState, useEffect } from "react";
import { FileEdit, AlertTriangle, Search, ArrowRight, Trash2, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { api } from "../services/api";
import { LoadingSpinner } from "./LoadingSpinner";
import { EmptyState } from "./EmptyState";

export function QueueView({ unitId }: { unitId: number | null }) {
  const [queue, setQueue] = useState<any[]>([]);
  const [filteredQueue, setFilteredQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editedContent, setEditedContent] = useState("");
  const [policies, setPolicies] = useState<any[]>([]);
  const [selectedPolicies, setSelectedPolicies] = useState<number[]>([]);
  const [isProcessingAI, setIsProcessingAI] = useState(false);

  // Filter states
  const [searchTitle, setSearchTitle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getPendingQueue(unitId).catch(() => ({ data: [] })),
      api.getPolicies().catch(() => ({ policies: [] })),
    ]).then(([q, p]) => {
      setQueue(q.data || []);
      setPolicies((p.policies || []).filter((pol: any) => pol.isModifying));
      setLoading(false);
    });
  }, [unitId]);

  // Apply filters
  useEffect(() => {
    let filtered = [...queue];

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

    // Filter by date
    if (selectedDate) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.created_at).toLocaleDateString('ar-SA');
        const filterDate = new Date(selectedDate).toLocaleDateString('ar-SA');
        return itemDate === filterDate;
      });
    }

    // Sort
    if (sortBy === "newest") {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }

    setFilteredQueue(filtered);
    setCurrentPage(1);
  }, [queue, searchTitle, selectedCategory, selectedDate, sortBy]);

  const handleOpenEditor = (item: any) => {
    setEditingItem(item);
    setEditedContent(item.content || "");
    setSelectedPolicies([]);
  };

  const togglePolicy = (id: number) => {
    setSelectedPolicies(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const applySequentially = async () => {
    if (selectedPolicies.length === 0 || !editingItem) return;
    setIsProcessingAI(true);
    try {
      // الباكند يقبل policyIds (array of numbers)
      const res = await fetch("/api/news/editorial-policies/sequential", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: editedContent, queueId: editingItem.id, policyIds: selectedPolicies }),
      }).then(r => r.json());
      
      if (res.finalText) {
        setEditedContent(res.finalText);
      }
    } catch (err) {
      console.error("Sequential apply error:", err);
    }
    setIsProcessingAI(false);
    setSelectedPolicies([]);
  };

  const handleApprove = async (id: number) => {
    try {
      await api.approveQueueItem(id);
      setQueue(prev => prev.filter(item => item.id !== id));
      setEditingItem(null);
    } catch (err) {
      console.error("Approve error:", err);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await api.rejectQueueItem(id);
      setQueue(prev => prev.filter(item => item.id !== id));
      setEditingItem(null);
    } catch (err) {
      console.error("Reject error:", err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الخبر؟')) return;
    try {
      await api.deleteArticle(id);
      setQueue(prev => prev.filter(item => item.id !== id));
      setEditingItem(null);
      alert('تم حذف الخبر بنجاح');
    } catch (err) {
      alert('حدث خطأ أثناء الحذف');
      console.error(err);
    }
  };

  if (loading) return <LoadingSpinner />;

  // Editor mode
  if (editingItem) {
    return (
      <div className="space-y-6">
        <button onClick={() => setEditingItem(null)} className="text-gray-400 hover:text-white text-sm flex items-center gap-2">
          <ArrowRight size={16} /> العودة للطابور
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#0b1224] rounded-3xl p-8 border border-white/5 shadow-2xl space-y-4">
            <h3 className="font-bold text-white text-lg">{editingItem.title || 'بدون عنوان'}</h3>
            <div className="flex gap-2 text-[10px] text-gray-500">
              <span>{editingItem.category_name || '—'}</span>
              <span>•</span>
              <span>{editingItem.media_unit_name || '—'}</span>
            </div>
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full h-64 bg-[#020617]/50 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-blue-600/50 resize-none text-white"
            />
            <div className="flex gap-3">
              <button onClick={() => handleApprove(editingItem.id)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2">
                <CheckCircle2 size={16} /> موافقة ونشر
              </button>
              <button onClick={() => handleReject(editingItem.id)} className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2">
                <XCircle size={16} /> رفض
              </button>
              <button onClick={() => handleDelete(editingItem.id)} className="bg-red-600/20 hover:bg-red-600/30 text-red-400 px-4 py-3 rounded-2xl font-bold text-sm flex items-center gap-2">
                <Trash2 size={16} /> حذف
              </button>
            </div>
          </div>

          <div className="bg-[#0b1224] rounded-3xl p-6 border border-white/5 shadow-2xl space-y-4">
            <h4 className="font-bold text-white text-sm">تطبيق سياسات تحريرية</h4>
            <div className="space-y-2">
              {policies.map((p: any) => (
                <label key={p.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                  ${selectedPolicies.includes(p.id) ? "bg-blue-600/10 border-blue-600/50" : "bg-white/[0.02] border-white/5 hover:border-white/10"}`}>
                  <input type="checkbox" checked={selectedPolicies.includes(p.id)} onChange={() => togglePolicy(p.id)} className="accent-blue-500" />
                  <div>
                    <span className="text-xs font-bold text-white">{p.name}</span>
                    <p className="text-[10px] text-gray-500">{p.description || ''}</p>
                  </div>
                </label>
              ))}
            </div>
            <button
              onClick={applySequentially}
              disabled={isProcessingAI || selectedPolicies.length === 0}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessingAI ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Sparkles size={16} /> تطبيق متسلسل</>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h3 className="text-xl font-bold mb-1">ستوديو التحرير</h3>
          <p className="text-gray-500 text-sm">الأخبار المعلقة بانتظار مراجعة المحرر.</p>
        </div>
        <button onClick={() => api.processNewArticles().then(() => window.location.reload())} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all active:scale-95">
          معالجة أخبار جديدة
        </button>
      </div>

      {queue.length === 0 ? (
        <EmptyState icon={FileEdit} title="لا توجد أخبار في الطابور" description="سيظهر هنا الأخبار التي تحتاج مراجعة تحريرية." />
      ) : (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-[#0b1224] rounded-3xl p-6 border border-white/5 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Search size={16} className="text-blue-400" />
              البحث والفلترة
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  {[...new Set(queue.map(item => item.category_name))].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Filter by date */}
              <div className="space-y-2">
                <label className="text-xs text-gray-400 font-bold uppercase">التاريخ</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
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
            {(searchTitle || selectedCategory || selectedDate || sortBy !== "newest") && (
              <button
                onClick={() => {
                  setSearchTitle("");
                  setSelectedCategory("");
                  setSelectedDate("");
                  setSortBy("newest");
                }}
                className="text-xs text-blue-400 hover:text-blue-300 font-bold"
              >
                مسح الفلاتر
              </button>
            )}
          </div>

          {/* Results count and pagination info */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              عدد النتائج: <span className="text-white font-bold">{filteredQueue.length}</span> من <span className="text-white font-bold">{queue.length}</span>
            </div>
            {filteredQueue.length > 0 && (
              <div className="text-sm text-gray-400">
                الصفحة <span className="text-white font-bold">{currentPage}</span> من <span className="text-white font-bold">{Math.ceil(filteredQueue.length / itemsPerPage)}</span>
              </div>
            )}
          </div>

          {filteredQueue.length === 0 ? (
            <EmptyState icon={AlertTriangle} title="لا توجد أخبار" description="لم يتم العثور على أخبار تطابق معايير البحث." />
          ) : (
            <div className="space-y-4">
              {/* Table */}
              <div className="bg-[#0b1224] rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.02]">
                        <th className="text-right py-4 px-6 text-gray-400 font-semibold">#</th>
                        <th className="text-right py-4 px-6 text-gray-400 font-semibold">العنوان</th>
                        <th className="text-right py-4 px-6 text-gray-400 font-semibold">التصنيف</th>
                        <th className="text-right py-4 px-6 text-gray-400 font-semibold">المصدر</th>
                        <th className="text-right py-4 px-6 text-gray-400 font-semibold">الحالة</th>
                        <th className="text-center py-4 px-6 text-gray-400 font-semibold">التاريخ</th>
                        <th className="text-center py-4 px-6 text-gray-400 font-semibold">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredQueue
                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                        .map((item: any, idx: number) => (
                          <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                            <td className="py-4 px-6 text-gray-400 font-mono text-xs">
                              {(currentPage - 1) * itemsPerPage + idx + 1}
                            </td>
                            <td className="py-4 px-6 text-gray-200 max-w-xs truncate">
                              {item.title || 'بدون عنوان'}
                            </td>
                            <td className="py-4 px-6 text-gray-400">
                              <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded text-xs font-bold">
                                {item.category_name || '—'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-gray-400 text-xs">
                              {item.source_name || '—'}
                            </td>
                            <td className="py-4 px-6 text-gray-400">
                              <span className="bg-amber-500/10 text-amber-400 px-2 py-1 rounded text-xs font-bold">
                                {item.status || 'pending'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-center text-gray-400 text-xs font-mono">
                              {new Date(item.created_at).toLocaleDateString('ar-SA')}
                            </td>
                            <td className="py-4 px-6 text-center">
                              <div className="flex gap-2 justify-center">
                                <button
                                  onClick={() => handleOpenEditor(item)}
                                  className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 px-3 py-1.5 rounded text-xs font-bold transition-all"
                                  title="فتح المحرر"
                                >
                                  تحرير
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 px-3 py-1.5 rounded text-xs font-bold transition-all"
                                  title="حذف الخبر"
                                >
                                  حذف
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination Controls */}
              {Math.ceil(filteredQueue.length / itemsPerPage) > 1 && (() => {
                const totalPages = Math.ceil(filteredQueue.length / itemsPerPage);
                const pagesPerGroup = 10;
                const currentGroup = Math.floor((currentPage - 1) / pagesPerGroup);
                const startPage = currentGroup * pagesPerGroup + 1;
                const endPage = Math.min(startPage + pagesPerGroup - 1, totalPages);
                const visiblePages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

                return (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-bold text-sm transition-all"
                    >
                      السابق
                    </button>

                    <div className="flex gap-1">
                      {visiblePages.map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    {endPage < totalPages && (
                      <button
                        onClick={() => setCurrentPage(endPage + 1)}
                        className="bg-white/5 hover:bg-white/10 text-white px-3 py-2 rounded-lg font-bold text-sm transition-all"
                      >
                        ...
                      </button>
                    )}

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-bold text-sm transition-all"
                    >
                      التالي
                    </button>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
