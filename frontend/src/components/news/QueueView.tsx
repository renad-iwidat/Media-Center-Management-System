import { useState, useEffect } from "react";
import { FileEdit, AlertTriangle, Search, ArrowRight, Trash2, CheckCircle2, XCircle, Sparkles, Eye, X, Trash, Copy } from "lucide-react";
import { motion } from "motion/react";
import { api } from "../../services/api";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { EmptyState } from "../shared/EmptyState";
import { Notification, NotificationData } from "../shared/Notification";

export function QueueView({ unitId }: { unitId: number | null }) {
  const [queue, setQueue] = useState<any[]>([]);
  const [filteredQueue, setFilteredQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editedContent, setEditedContent] = useState("");
  const [editedTitle, setEditedTitle] = useState("");
  const [editedImageUrl, setEditedImageUrl] = useState("");
  const [editedCategoryId, setEditedCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
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

  // دالة لتحميل البيانات
  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.getPendingQueue(unitId).catch(() => ({ data: [] })),
      api.getPolicies().catch(() => ({ policies: [] })),
      api.getCategories().catch(() => ({ data: [] })),
    ]).then(([q, p, c]) => {
      setQueue(q.data || []);
      const allPolicies = p.policies || [];
      setPolicies(allPolicies.filter((pol: any) => pol.isModifying));
      setInspectionPolicies(allPolicies.filter((pol: any) => !pol.isModifying));
      setCategories(c.data || []);
      setLoading(false);
    });
  };

  // تحميل البيانات عند التحميل الأول أو تغيير unitId
  useEffect(() => {
    loadData();
  }, [unitId]);

  // الاستماع لحدث الريفريش التلقائي
  useEffect(() => {
    const handleDataRefresh = () => {
      console.log('🔄 [QueueView] تحديث البيانات بناءً على حدث الريفريش');
      loadData();
    };

    window.addEventListener('dataRefresh', handleDataRefresh);
    return () => window.removeEventListener('dataRefresh', handleDataRefresh);
  }, []);

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
    setEditedCategoryId(item.category_id || null);
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
      const res = await api.applyPoliciesSequential({
        text: editedContent,
        policyIds: selectedPolicies,
      });
      
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
      // تحديث التصنيف إذا تغيّر
      if (editedCategoryId && editedCategoryId !== editingItem.category_id) {
        await api.updateArticleCategory(editingItem.raw_data_id, editedCategoryId);
      }

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
    // منع السكرول عند فتح التحرير
    useEffect(() => {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }, []);

    return (
      <>
        <Notification notification={notification} onClose={() => setNotification(null)} position="center" />
        <div className="space-y-6 pb-6">
          <div className="flex items-center justify-between">
            <button onClick={() => setEditingItem(null)} className="text-gray-600 hover:text-gray-900 text-sm flex items-center gap-2 transition-colors">
              <ArrowRight size={16} /> العودة للطابور
            </button>
          </div>
          
          <div className="flex gap-3 flex-wrap">
            <button onClick={() => handleApprove(editingItem.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/40">
              <CheckCircle2 size={18} /> موافقة ونشر
            </button>
            <button onClick={() => handleReject(editingItem.id)} className="bg-rose-100 hover:bg-rose-200 text-rose-700 px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all">
              <XCircle size={18} /> رفض
            </button>
            <button onClick={() => handleDelete(editingItem.id)} className="bg-red-100 hover:bg-red-200 text-red-700 px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all">
              <Trash2 size={18} /> حذف
            </button>
          </div>
        </div>

        {/* Meta: صورة + معلومات + عنوان */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex gap-5 items-start">
            {/* صورة الخبر */}
            <div className="space-y-2">
              <label className="text-xs text-gray-700 font-bold uppercase">صورة الخبر</label>
              {editedImageUrl && (
                <div className="w-full h-80 shrink-0 rounded-2xl overflow-hidden border border-gray-300 bg-gray-100">
                  <img src={editedImageUrl} alt="صورة الخبر" className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23e5e7eb" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="20" fill="%239ca3af" text-anchor="middle" dy=".3em"%3Eلا يمكن تحميل الصورة%3C/text%3E%3C/svg%3E'; }} />
                </div>
              )}
              {!editedImageUrl && (
                <div className="w-full h-80 shrink-0 rounded-2xl overflow-hidden border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
                  <p className="text-sm text-gray-500">لا توجد صورة</p>
                </div>
              )}
              <input 
                type="text" 
                value={editedImageUrl} 
                onChange={(e) => setEditedImageUrl(e.target.value)}
                placeholder="أدخل رابط الصورة (URL)"
                className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 placeholder:text-gray-400 font-mono"
              />
              {editedImageUrl && (
                <p className="text-[10px] text-gray-600 font-mono truncate">{editedImageUrl}</p>
              )}
            </div>
            {/* المعلومات */}
            <div className="flex-1 min-w-0 space-y-3">
              <div className="space-y-2">
                <label className="text-xs text-gray-700 font-bold uppercase">التصنيف</label>
                <select
                  value={editedCategoryId || ""}
                  onChange={(e) => setEditedCategoryId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 text-gray-900"
                >
                  <option value="">-- اختر التصنيف --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {editedCategoryId && (
                  <p className="text-[10px] text-emerald-700">✓ تم اختيار: {categories.find(c => c.id === editedCategoryId)?.name}</p>
                )}
                {!editedCategoryId && editingItem.category_name && (
                  <p className="text-[10px] text-blue-700">التصنيف الحالي: {editingItem.category_name}</p>
                )}
              </div>
              <input type="text" value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 placeholder:text-gray-500"
                placeholder="عنوان الخبر" />
              {editingItem?.url && (
                <a href={editingItem.url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-700 truncate block">
                  {editingItem.url}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* شريط السياسات */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
          {/* سطر سياسات التعديل */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5 shrink-0">
              <FileEdit size={13} className="text-blue-600" /> تعديل:
            </span>
            {policies.map((p: any) => (
              <label key={p.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-all text-xs
                ${selectedPolicies.includes(p.id) ? "bg-blue-100 border-blue-300 text-blue-700" : "bg-white border-gray-300 text-gray-700 hover:border-gray-400"}`}>
                <input type="checkbox" checked={selectedPolicies.includes(p.id)} onChange={() => togglePolicy(p.id)} className="accent-blue-600 w-3 h-3" />
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
            <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5 shrink-0">
              <Eye size={13} className="text-orange-600" /> فحص:
            </span>
            {inspectionPolicies.map((p: any) => (
              <button key={p.id} onClick={() => setSelectedInspectionPolicy(selectedInspectionPolicy === p.id ? null : p.id)}
                className={`px-3 py-1.5 rounded-lg border text-xs transition-all
                  ${selectedInspectionPolicy === p.id ? "bg-orange-100 border-orange-300 text-orange-700" : "bg-white border-gray-300 text-gray-700 hover:border-gray-400"}`}>
                {p.name}
              </button>
            ))}
            <button onClick={applyInspection} disabled={isProcessingAI || !selectedInspectionPolicy}
              className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold text-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0">
              {isProcessingAI && selectedInspectionPolicy
                ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><Eye size={13} /> فحص</>}
            </button>
          </div>
        </div>

        {/* Main: النص المعدّل | النتائج */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          {/* النص المعدّل */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">النص المعدّل</span>
              <span className="text-xs text-gray-600 font-mono">{editedContent.length} حرف</span>
            </div>
            <textarea value={editedContent} onChange={(e) => setEditedContent(e.target.value)}
              className="w-full h-[500px] bg-white p-4 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 resize-none leading-relaxed placeholder:text-gray-500"
              placeholder="محتوى الخبر..." />
          </div>

          {/* النتائج */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <span className="text-sm font-semibold text-gray-900">نتائج السياسات</span>
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
                    <span className="text-sm font-semibold text-blue-700">📝 نتائج التعديل</span>
                    <button onClick={() => setPolicyResults([])} className="text-gray-600 hover:text-gray-900"><X size={14} /></button>
                  </div>
                  {policyResults.map((step: any, i: number) => (
                    <div key={i} className="bg-gray-50 rounded-xl border border-gray-300 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-900">{step.policyName}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${step.hasChanges ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                          {step.hasChanges ? '✓ تم التعديل' : '✓ لا يحتاج تعديل'}
                        </span>
                      </div>
                      {step.result?.total_changes !== undefined && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-gray-600">عدد التغييرات:</span>
                          <span className="text-gray-900 font-semibold">{step.result.total_changes}</span>
                        </div>
                      )}
                      {step.result?.notes && (
                        <div className="bg-blue-50 border border-blue-300 rounded-lg px-3 py-2">
                          <div className="flex items-start gap-2">
                            <span className="text-blue-700 text-xs shrink-0 mt-0.5">ℹ️</span>
                            <p className="text-xs text-gray-700 leading-relaxed">{step.result.notes}</p>
                          </div>
                        </div>
                      )}
                      {step.result?.changes?.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[10px] text-gray-600 font-bold">التغييرات المطبقة:</p>
                          {step.result.changes.slice(0, 3).map((change: string, ci: number) => (
                            <div key={ci} className="text-xs text-gray-700 bg-emerald-50 border border-emerald-300 rounded-lg px-2 py-1.5 line-clamp-2 flex items-start gap-2">
                              <span className="text-emerald-700 shrink-0">•</span>
                              <span>{change}</span>
                            </div>
                          ))}
                          {step.result.changes.length > 3 && (
                            <div className="text-xs text-gray-600 px-2">+{step.result.changes.length - 3} تغييرات أخرى</div>
                          )}
                        </div>
                      )}
                      {step.hasChanges && step.result?.modified_text && (
                        <div className="space-y-1 pt-2 border-t border-gray-300">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] text-gray-600 font-bold">النص المعدل:</p>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(step.result.modified_text);
                                setNotification({ type: 'success', message: '✅ تم نسخ النص المعدل' });
                              }}
                              className="text-[10px] text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                              <Copy size={10} />
                              نسخ
                            </button>
                          </div>
                          <div className="bg-emerald-50 border border-emerald-300 rounded-lg px-3 py-2 max-h-32 overflow-y-auto custom-scrollbar">
                            <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{step.result.modified_text}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {inspectionResult && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-orange-700">🔍 نتيجة الفحص</span>
                    <button onClick={() => setInspectionResult(null)} className="text-gray-600 hover:text-gray-900"><X size={14} /></button>
                  </div>
                  <div className="bg-gray-50 rounded-xl border border-gray-300 p-3 space-y-2">
                    {inspectionResult.error ? (
                      <p className="text-rose-700 text-xs">{inspectionResult.error}</p>
                    ) : (
                      <>
                        {inspectionResult.status && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600">الحالة:</span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${['pass','clean','ok'].includes(inspectionResult.status) ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                              {['pass','clean','ok'].includes(inspectionResult.status) ? '✓ ' : '✗ '}{inspectionResult.status}
                            </span>
                          </div>
                        )}
                        {inspectionResult.summary && (
                          <div>
                            <p className="text-xs text-gray-700 leading-relaxed">{inspectionResult.summary}</p>
                          </div>
                        )}
                        {inspectionResult.issues?.length > 0 && (
                          <div>
                            <span className="text-xs text-gray-600 font-semibold">المشاكل ({inspectionResult.issues.length}):</span>
                            <div className="space-y-1 mt-1">
                              {inspectionResult.issues.slice(0, 3).map((issue: any, i: number) => (
                                <div key={i} className="bg-gray-100 rounded px-2 py-1 text-xs text-gray-700 border border-gray-300 line-clamp-2">
                                  {typeof issue === 'string' ? issue : JSON.stringify(issue)}
                                </div>
                              ))}
                              {inspectionResult.issues.length > 3 && (
                                <div className="text-xs text-gray-600 px-2">+{inspectionResult.issues.length - 3} مشاكل أخرى</div>
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
          <p className="text-gray-600 text-sm">الأخبار المعلقة بانتظار مراجعة المحرر.</p>
        </div>
      </div>

      {queue.length === 0 ? (
        <EmptyState icon={FileEdit} title="لا توجد أخبار في الطابور" description="سيظهر هنا الأخبار التي تحتاج مراجعة تحريرية." />
      ) : (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Search size={16} className="text-blue-600" />
              البحث والفلترة
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search by title */}
              <div className="space-y-2">
                <label className="text-xs text-gray-700 font-bold uppercase">البحث عن عنوان</label>
                <input
                  type="text"
                  value={searchTitle}
                  onChange={(e) => setSearchTitle(e.target.value)}
                  placeholder="ابحث عن عنوان..."
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 text-gray-900 placeholder:text-gray-500"
                />
              </div>

              {/* Filter by category */}
              <div className="space-y-2">
                <label className="text-xs text-gray-700 font-bold uppercase">التصنيف</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 text-gray-900"
                >
                  <option value="">كل التصنيفات</option>
                  {[...new Set(queue.map(item => item.category_name))].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Filter by date */}
              <div className="space-y-2">
                <label className="text-xs text-gray-700 font-bold uppercase">التاريخ</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 text-gray-900"
                />
              </div>

              {/* Sort */}
              <div className="space-y-2">
                <label className="text-xs text-gray-700 font-bold uppercase">الترتيب</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "newest" | "oldest")}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 text-gray-900"
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
                className="text-xs text-blue-600 hover:text-blue-700 font-bold"
              >
                مسح الفلاتر
              </button>
            )}
          </div>

          {/* Results count and pagination info */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              عدد النتائج: <span className="text-gray-900 font-bold">{filteredQueue.length}</span> من <span className="text-gray-900 font-bold">{queue.length}</span>
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
                  الصفحة <span className="text-gray-900 font-bold">{currentPage}</span> من <span className="text-gray-900 font-bold">{Math.ceil(filteredQueue.length / itemsPerPage)}</span>
                </div>
              </div>
            )}
          </div>

          {filteredQueue.length === 0 ? (
            <EmptyState icon={AlertTriangle} title="لا توجد أخبار" description="لم يتم العثور على أخبار تطابق معايير البحث." />
          ) : (
            <div className="space-y-4">
              {/* Table */}
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-right py-4 px-6 text-gray-700 font-semibold">#</th>
                        <th className="text-right py-4 px-6 text-gray-700 font-semibold">العنوان</th>
                        <th className="text-right py-4 px-6 text-gray-700 font-semibold">التصنيف</th>
                        <th className="text-right py-4 px-6 text-gray-700 font-semibold">المصدر</th>
                        <th className="text-right py-4 px-6 text-gray-700 font-semibold">الحالة</th>
                        <th className="text-center py-4 px-6 text-gray-700 font-semibold">التاريخ</th>
                        <th className="text-center py-4 px-6 text-gray-700 font-semibold">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredQueue
                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                        .map((item: any, idx: number) => (
                          <tr key={item.id} className="border-b border-gray-200 hover:bg-blue-50 transition-colors">
                            <td className="py-4 px-6 text-gray-600 font-mono text-xs">
                              {(currentPage - 1) * itemsPerPage + idx + 1}
                            </td>
                            <td className="py-4 px-6 text-gray-900 max-w-xs truncate">
                              {item.title || 'بدون عنوان'}
                            </td>
                            <td className="py-4 px-6 text-gray-700">
                              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">
                                {item.category_name || '—'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-gray-600 text-xs">
                              {item.source_name || '—'}
                            </td>
                            <td className="py-4 px-6 text-gray-700">
                              <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-bold">
                                {item.status || 'pending'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-center text-gray-600 text-xs font-mono">
                              {item.pub_date
                                ? new Date(item.pub_date).toLocaleDateString('ar-SA')
                                : new Date(item.created_at).toLocaleDateString('ar-SA')}
                            </td>
                            <td className="py-4 px-6 text-center">
                              <div className="flex gap-2 justify-center">
                                <button
                                  onClick={() => handleOpenEditor(item)}
                                  className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded text-xs font-bold transition-all"
                                  title="فتح المحرر"
                                >
                                  تحرير
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="bg-rose-100 hover:bg-rose-200 text-rose-700 px-3 py-1.5 rounded text-xs font-bold transition-all"
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
                      className="bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 px-4 py-2 rounded-lg font-bold text-sm transition-all"
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
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    {endPage < totalPages && (
                      <button
                        onClick={() => setCurrentPage(endPage + 1)}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg font-bold text-sm transition-all"
                      >
                        ...
                      </button>
                    )}

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 px-4 py-2 rounded-lg font-bold text-sm transition-all"
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
