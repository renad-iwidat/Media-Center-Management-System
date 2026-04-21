import { useState, useEffect } from "react";
import { FileEdit, AlertTriangle, Search, ArrowRight, Trash2, CheckCircle2, XCircle, Sparkles, Eye, X, Trash } from "lucide-react";
import { motion } from "motion/react";
import { api } from "../services/api";
import { LoadingSpinner } from "./LoadingSpinner";
import { EmptyState } from "./EmptyState";
import { Notification, NotificationData } from "./Notification";

export function QueueView({ unitId }: { unitId: number | null }) {
  const [queue, setQueue] = useState<any[]>([]);
  const [filteredQueue, setFilteredQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editedContent, setEditedContent] = useState("");
  const [editedTitle, setEditedTitle] = useState("");
  const [editedImageUrl, setEditedImageUrl] = useState("");
  const [policies, setPolicies] = useState<any[]>([]);
  const [inspectionPolicies, setInspectionPolicies] = useState<any[]>([]);
  const [selectedPolicies, setSelectedPolicies] = useState<number[]>([]);
  const [selectedInspectionPolicy, setSelectedInspectionPolicy] = useState<number | null>(null);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [inspectionResult, setInspectionResult] = useState<any>(null);
  const [policyResults, setPolicyResults] = useState<any[]>([]); // نتائج سياسات التعديل
  const [notification, setNotification] = useState<NotificationData | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

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
      const allPolicies = p.policies || [];
      setPolicies(allPolicies.filter((pol: any) => pol.isModifying));
      setInspectionPolicies(allPolicies.filter((pol: any) => !pol.isModifying));
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
    // استخدم modified_text إذا كان موجود، وإلا استخدم content
    setEditedContent(item.modified_text || item.content || "");
    setEditedTitle(item.title || "");
    setEditedImageUrl(item.image_url || "");
    setSelectedPolicies([]);
    setSelectedInspectionPolicy(null);
    setInspectionResult(null);
    setPolicyResults([]);
  };

  const togglePolicy = (id: number) => {
    setSelectedPolicies(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const applySequentially = async () => {
    if (selectedPolicies.length === 0 || !editingItem) return;
    setIsProcessingAI(true);
    setPolicyResults([]);
    try {
      const res = await fetch("/api/news/editorial-policies/sequential", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: editedContent, queueId: editingItem.id, policyIds: selectedPolicies }),
      }).then(r => r.json());
      
      if (res.finalText) {
        setEditedContent(res.finalText);
      }
      // حفظ نتائج كل خطوة
      if (res.steps) {
        // Parse result string to object if needed
        const parsedSteps = res.steps.map((step: any) => {
          let result = step.result;
          if (typeof result === 'string') {
            try {
              result = JSON.parse(result);
            } catch {
              result = {};
            }
          }
          return { ...step, result };
        });
        console.log('📋 Steps received:', JSON.stringify(parsedSteps, null, 2));
        setPolicyResults(parsedSteps);
      }
    } catch (err) {
      console.error("Sequential apply error:", err);
    }
    setIsProcessingAI(false);
    setSelectedPolicies([]);
  };

  const applyInspection = async () => {
    if (!selectedInspectionPolicy || !editingItem) return;
    setIsProcessingAI(true);
    setInspectionResult(null);
    try {
      const res = await api.applyPolicy({
        text: editedContent,
        policyId: selectedInspectionPolicy,
      });
      setInspectionResult(res.inspection || res.result || {});
    } catch (err) {
      console.error("Inspection apply error:", err);
      setInspectionResult({ error: "حدث خطأ أثناء الفحص" });
    }
    setIsProcessingAI(false);
  };

  const handleApprove = async (id: number) => {
    try {
      await api.approveQueueItem(id, {
        finalContent: editedContent,
        finalTitle: editedTitle,
        finalImageUrl: editedImageUrl,
      });
      setQueue(prev => prev.filter(item => item.id !== id));
      setEditingItem(null);
      setNotification({
        type: "success",
        message: `✅ تم نشر الخبر بنجاح`,
      });
    } catch (err) {
      console.error("Approve error:", err);
      setNotification({
        type: "error",
        message: `❌ حدث خطأ أثناء النشر`,
      });
    }
  };

  const handleReject = async (id: number) => {
    try {
      await api.rejectQueueItem(id);
      setQueue(prev => prev.filter(item => item.id !== id));
      setEditingItem(null);
      setNotification({
        type: "success",
        message: `✅ تم رفض الخبر`,
      });
    } catch (err) {
      console.error("Reject error:", err);
      setNotification({
        type: "error",
        message: `❌ حدث خطأ أثناء الرفض`,
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الخبر؟')) return;
    try {
      await api.deleteArticle(id);
      setQueue(prev => prev.filter(item => item.id !== id));
      setEditingItem(null);
      setNotification({
        type: "success",
        message: `✅ تم حذف الخبر بنجاح`,
      });
    } catch (err) {
      setNotification({
        type: "error",
        message: `❌ حدث خطأ أثناء الحذف`,
      });
      console.error(err);
    }
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      await api.deleteAllArticles();
      setQueue([]);
      setNotification({
        type: "success",
        message: `✅ تم حذف جميع الأخبار بنجاح`,
      });
    } catch (err) {
      setNotification({
        type: "error",
        message: `❌ حدث خطأ أثناء الحذف الجماعي`,
      });
      console.error(err);
    }
    setIsBulkDeleting(false);
    setShowBulkDeleteConfirm(false);
  };

  if (loading) return <LoadingSpinner />;

  // Editor mode
  if (editingItem) {
    return (
      <>
        <Notification notification={notification} onClose={() => setNotification(null)} position="center" />
        <div className="space-y-4">
          <button onClick={() => setEditingItem(null)} className="text-gray-400 hover:text-white text-sm flex items-center gap-2">
            <ArrowRight size={16} /> العودة للطابور
          </button>
          <div className="flex gap-2">
            <button onClick={() => handleApprove(editingItem.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2">
              <CheckCircle2 size={15} /> موافقة ونشر
            </button>
            <button onClick={() => handleReject(editingItem.id)} className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2">
              <XCircle size={15} /> رفض
            </button>
            <button onClick={() => handleDelete(editingItem.id)} className="bg-red-600/10 hover:bg-red-600/20 text-red-400 px-3 py-2 rounded-xl">
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Meta: صورة + معلومات + عنوان */}
        <div className="bg-[#0b1224] rounded-2xl border border-white/5 p-5">
          <div className="flex gap-5 items-start">
            {/* صورة الخبر */}
            {editedImageUrl && (
              <div className="w-48 h-32 shrink-0 rounded-xl overflow-hidden border border-white/10 bg-black/50">
                <img src={editedImageUrl} alt="صورة الخبر" className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 130"%3E%3Crect fill="%23222" width="200" height="130"/%3E%3Ctext x="50%25" y="50%25" font-size="14" fill="%23555" text-anchor="middle" dy=".3em"%3Eلا توجد صورة%3C/text%3E%3C/svg%3E'; }} />
              </div>
            )}
            {/* المعلومات */}
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                <span className="bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-lg font-semibold">{editingItem.category_name || '—'}</span>
                <span>{editingItem.media_unit_name || '—'}</span>
              </div>
              <input type="text" value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full bg-[#020617]/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-600/50 placeholder:text-gray-600"
                placeholder="عنوان الخبر" />
              {editingItem?.url && (
                <a href={editingItem.url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 truncate block">
                  {editingItem.url}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* شريط السياسات */}
        <div className="bg-[#0b1224] rounded-2xl border border-white/5 p-4 space-y-3">
          {/* سطر سياسات التعديل */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-gray-400 flex items-center gap-1.5 shrink-0">
              <FileEdit size={13} className="text-blue-400" /> تعديل:
            </span>
            {policies.map((p: any) => (
              <label key={p.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-all text-xs
                ${selectedPolicies.includes(p.id) ? "bg-blue-600/15 border-blue-500/50 text-blue-300" : "bg-white/[0.02] border-white/5 text-gray-400 hover:border-white/15"}`}>
                <input type="checkbox" checked={selectedPolicies.includes(p.id)} onChange={() => togglePolicy(p.id)} className="accent-blue-500 w-3 h-3" />
                {p.name}
              </label>
            ))}
            <button onClick={applySequentially} disabled={isProcessingAI || selectedPolicies.length === 0}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0">
              {isProcessingAI && selectedPolicies.length > 0
                ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><Sparkles size={13} /> تطبيق</>}
            </button>
          </div>

          {/* سطر سياسات الفحص */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-gray-400 flex items-center gap-1.5 shrink-0">
              <Eye size={13} className="text-amber-400" /> فحص:
            </span>
            {inspectionPolicies.map((p: any) => (
              <button key={p.id} onClick={() => setSelectedInspectionPolicy(selectedInspectionPolicy === p.id ? null : p.id)}
                className={`px-3 py-1.5 rounded-lg border text-xs transition-all
                  ${selectedInspectionPolicy === p.id ? "bg-amber-600/15 border-amber-500/50 text-amber-300" : "bg-white/[0.02] border-white/5 text-gray-400 hover:border-white/15"}`}>
                {p.name}
              </button>
            ))}
            <button onClick={applyInspection} disabled={isProcessingAI || !selectedInspectionPolicy}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0">
              {isProcessingAI && selectedInspectionPolicy
                ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><Eye size={13} /> فحص</>}
            </button>
          </div>
        </div>

        {/* Main: النص المعدّل | النتائج */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          {/* النص المعدّل */}
          <div className="bg-[#0b1224] rounded-2xl border border-white/5 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-300">النص المعدّل</span>
              <span className="text-xs text-gray-500 font-mono">{editedContent.length} حرف</span>
            </div>
            <textarea value={editedContent} onChange={(e) => setEditedContent(e.target.value)}
              className="w-full h-[500px] bg-transparent p-4 text-sm text-white focus:outline-none resize-none leading-relaxed placeholder:text-gray-600"
              placeholder="محتوى الخبر..." />
          </div>

          {/* النتائج */}
          <div className="bg-[#0b1224] rounded-2xl border border-white/5 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5">
              <span className="text-sm font-semibold text-gray-300">نتائج السياسات</span>
            </div>
            <div className="p-4 h-[500px] overflow-y-auto space-y-4">
              {policyResults.length === 0 && !inspectionResult && (
                <div className="flex items-center justify-center h-full text-gray-600 text-sm">
                  اختر سياسة وطبّقها لعرض النتائج
                </div>
              )}

              {policyResults.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-blue-400">📝 نتائج التعديل</span>
                    <button onClick={() => setPolicyResults([])} className="text-gray-500 hover:text-white"><X size={14} /></button>
                  </div>
                  {policyResults.map((step: any, i: number) => (
                    <div key={i} className="bg-white/[0.02] rounded-xl border border-white/5 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white">{step.policyName}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${step.hasChanges ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-400'}`}>
                          {step.hasChanges ? '✓ تم التعديل' : '— بدون تغيير'}
                        </span>
                      </div>
                      {step.result?.total_changes !== undefined && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-gray-500">التغييرات:</span>
                          <span className="text-white font-semibold">{step.result.total_changes}</span>
                        </div>
                      )}
                      {step.result?.notes && (
                        <div className="text-xs text-gray-300 bg-[#020617]/50 rounded px-2 py-1 border border-white/5 leading-relaxed">
                          {step.result.notes}
                        </div>
                      )}
                      {step.result?.changes?.length > 0 && (
                        <div className="space-y-1">
                          {step.result.changes.slice(0, 2).map((change: string, ci: number) => (
                            <div key={ci} className="text-xs text-gray-300 bg-[#020617]/50 rounded px-2 py-1 border border-white/5 line-clamp-2">{change}</div>
                          ))}
                          {step.result.changes.length > 2 && (
                            <div className="text-xs text-gray-500 px-2">+{step.result.changes.length - 2} تغييرات أخرى</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {inspectionResult && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-amber-400">🔍 نتيجة الفحص</span>
                    <button onClick={() => setInspectionResult(null)} className="text-gray-500 hover:text-white"><X size={14} /></button>
                  </div>
                  <div className="bg-white/[0.02] rounded-xl border border-white/5 p-3 space-y-2">
                    {inspectionResult.error ? (
                      <p className="text-rose-400 text-xs">{inspectionResult.error}</p>
                    ) : (
                      <>
                        {inspectionResult.status && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">الحالة:</span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${['pass','clean','ok'].includes(inspectionResult.status) ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                              {['pass','clean','ok'].includes(inspectionResult.status) ? '✓ ' : '✗ '}{inspectionResult.status}
                            </span>
                          </div>
                        )}
                        {inspectionResult.summary && (
                          <div>
                            <p className="text-xs text-gray-300 leading-relaxed">{inspectionResult.summary}</p>
                          </div>
                        )}
                        {inspectionResult.issues?.length > 0 && (
                          <div>
                            <span className="text-xs text-gray-400 font-semibold">المشاكل ({inspectionResult.issues.length}):</span>
                            <div className="space-y-1 mt-1">
                              {inspectionResult.issues.slice(0, 3).map((issue: any, i: number) => (
                                <div key={i} className="bg-[#020617]/50 rounded px-2 py-1 text-xs text-gray-300 border border-white/5 line-clamp-2">
                                  {typeof issue === 'string' ? issue : JSON.stringify(issue)}
                                </div>
                              ))}
                              {inspectionResult.issues.length > 3 && (
                                <div className="text-xs text-gray-500 px-2">+{inspectionResult.issues.length - 3} مشاكل أخرى</div>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Notification notification={notification} onClose={() => setNotification(null)} position="center" />
      <div className="space-y-6">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h3 className="text-xl font-bold mb-1">ستوديو التحرير</h3>
          <p className="text-gray-500 text-sm">الأخبار المعلقة بانتظار مراجعة المحرر.</p>
        </div>
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  className="flex items-center gap-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                >
                  <Trash size={14} /> حذف الكل
                </button>
                <div className="text-sm text-gray-400">
                  الصفحة <span className="text-white font-bold">{currentPage}</span> من <span className="text-white font-bold">{Math.ceil(filteredQueue.length / itemsPerPage)}</span>
                </div>
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
                              {item.pub_date
                                ? new Date(item.pub_date).toLocaleDateString('ar-SA')
                                : new Date(item.created_at).toLocaleDateString('ar-SA')}
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
    </>
  );
}
