import { useState, useEffect } from "react";
import { AlertTriangle, Search, ArrowRight, Trash2, Save, Trash } from "lucide-react";
import { motion } from "motion/react";
import { api } from "../../services/api";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { EmptyState } from "../shared/EmptyState";
import { Notification, NotificationData } from "../shared/Notification";

export function IncompleteView({ unitId }: { unitId: number | null }) {
  const [articles, setArticles] = useState<any[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingArticle, setEditingArticle] = useState<any>(null);
  const [editedContent, setEditedContent] = useState("");
  const [editedTitle, setEditedTitle] = useState("");
  const [editedImageUrl, setEditedImageUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<NotificationData | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; articleId: number | null }>({ show: false, articleId: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  
  // Filter states
  const [searchTitle, setSearchTitle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [selectedDate, setSelectedDate] = useState<string>("");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    api.getIncompleteArticles(unitId)
      .then((res) => {
        setArticles(res.data || []);
      })
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, [unitId]);

  // Apply filters
  useEffect(() => {
    let filtered = [...articles];

    // Search by title
    if (searchTitle.trim()) {
      filtered = filtered.filter(a => 
        a.title?.toLowerCase().includes(searchTitle.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(a => a.category_name === selectedCategory);
    }

    // Filter by date
    if (selectedDate) {
      filtered = filtered.filter(a => {
        const articleDate = new Date(a.fetched_at).toLocaleDateString('ar-SA');
        const filterDate = new Date(selectedDate).toLocaleDateString('ar-SA');
        return articleDate === filterDate;
      });
    }

    // Sort
    if (sortBy === "newest") {
      filtered.sort((a, b) => new Date(b.fetched_at).getTime() - new Date(a.fetched_at).getTime());
    } else {
      filtered.sort((a, b) => new Date(a.fetched_at).getTime() - new Date(b.fetched_at).getTime());
    }

    setFilteredArticles(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [articles, searchTitle, selectedCategory, sortBy, selectedDate]);

  const handleEdit = (article: any) => {
    setEditingArticle(article);
    setEditedContent(article.content || "");
    setEditedTitle(article.title || "");
    setEditedImageUrl(article.image_url || "");
  };

  const handleSaveInIncomplete = async () => {
    if (!editingArticle) return;
    
    setIsSaving(true);
    try {
      // تحديث الخبر بدون إرساله للستوديو
      await api.saveArticleInIncomplete(editingArticle.id, {
        content: editedContent || editingArticle.content,
        title: editedTitle || editingArticle.title,
        imageUrl: editedImageUrl || editingArticle.image_url,
      });
      
      // تحديث البيانات المحلية
      setArticles(prev => prev.map(a => 
        a.id === editingArticle.id 
          ? { ...a, content: editedContent, title: editedTitle, image_url: editedImageUrl }
          : a
      ));
      setEditingArticle(null);
      
      // إظهار رسالة نجاح
      setNotification({ type: 'success', message: 'تم حفظ التغييرات في الأخبار الغير مكتملة' });
    } catch (err) {
      setNotification({ type: 'error', message: 'حدث خطأ أثناء الحفظ' });
      console.error(err);
    }
    setIsSaving(false);
  };

  const handleSaveAndSend = async () => {
    if (!editingArticle) return;
    
    setIsSaving(true);
    try {
      const response = await api.updateArticleContent(editingArticle.id, {
        content: editedContent || editingArticle.content,
        title: editedTitle || editingArticle.title,
        imageUrl: editedImageUrl || editingArticle.image_url
      });
      
      // إزالة الخبر من القائمة
      setArticles(prev => prev.filter(a => a.id !== editingArticle.id));
      setEditingArticle(null);
      
      // إظهار رسالة نجاح حسب نوع الفلو
      const message = response.flowType === 'automated' 
        ? 'تم إكمال الخبر ونشره مباشرة ✅'
        : 'تم حفظ الخبر وإرساله لستوديو التحرير';
      setNotification({ type: 'success', message });
    } catch (err) {
      setNotification({ type: 'error', message: 'حدث خطأ أثناء الحفظ' });
      console.error(err);
    }
    setIsSaving(false);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.articleId) return;
    
    setIsDeleting(true);
    try {
      await api.deleteArticle(deleteConfirm.articleId);
      setArticles(prev => prev.filter(a => a.id !== deleteConfirm.articleId));
      setNotification({ type: 'success', message: 'تم حذف الخبر بنجاح' });
    } catch (err) {
      console.error('خطأ في الحذف:', err);
      setNotification({ type: 'error', message: 'حدث خطأ أثناء الحذف' });
    }
    setIsDeleting(false);
    setDeleteConfirm({ show: false, articleId: null });
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      await api.deleteIncompleteArticles();
      setArticles([]);
      setNotification({ type: 'success', message: 'تم حذف جميع الأخبار الناقصة بنجاح' });
    } catch (err) {
      console.error('خطأ في الحذف الجماعي:', err);
      setNotification({ type: 'error', message: 'حدث خطأ أثناء الحذف الجماعي' });
    }
    setIsBulkDeleting(false);
    setShowBulkDeleteConfirm(false);
  };

  if (loading) return <LoadingSpinner />;

  // Bulk Delete Confirmation Modal
  if (showBulkDeleteConfirm) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#0b1224] rounded-3xl border border-white/10 shadow-2xl max-w-sm w-full p-8 space-y-6"
        >
          <div className="flex items-center justify-center w-12 h-12 bg-rose-500/10 rounded-full mx-auto">
            <Trash size={24} className="text-rose-400" />
          </div>
          
          <div className="text-center space-y-2">
            <h3 className="text-lg font-bold text-white">حذف جميع الأخبار الناقصة</h3>
            <p className="text-sm text-gray-400">هل أنت متأكد من حذف جميع الأخبار الناقصة؟ لا يمكن التراجع عن هذا الإجراء.</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowBulkDeleteConfirm(false)}
              disabled={isBulkDeleting}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isBulkDeleting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><Trash size={16} /> حذف الكل</>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Delete Confirmation Modal
  if (deleteConfirm.show) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#0b1224] rounded-3xl border border-white/10 shadow-2xl max-w-sm w-full p-8 space-y-6"
        >
          <div className="flex items-center justify-center w-12 h-12 bg-rose-500/10 rounded-full mx-auto">
            <Trash2 size={24} className="text-rose-400" />
          </div>
          
          <div className="text-center space-y-2">
            <h3 className="text-lg font-bold text-white">حذف الخبر</h3>
            <p className="text-sm text-gray-400">هل أنت متأكد من حذف هذا الخبر؟ لا يمكن التراجع عن هذا الإجراء.</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setDeleteConfirm({ show: false, articleId: null })}
              disabled={isDeleting}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              onClick={confirmDelete}
              disabled={isDeleting}
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><Trash2 size={16} /> حذف</>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // وضع التحرير
  if (editingArticle) {
    return (
      <div className="space-y-6">
        {/* Notification */}
        <Notification notification={notification} onClose={() => setNotification(null)} position="center" />

        <button 
          onClick={() => setEditingArticle(null)}
          className="text-gray-400 hover:text-white text-sm flex items-center gap-2"
        >
          <ArrowRight size={16} /> العودة للقائمة
        </button>

        <div className="bg-[#0b1224] rounded-3xl p-8 border border-white/5 shadow-2xl space-y-6">
          <h3 className="text-lg font-bold text-white">تكملة الخبر</h3>
          
          {/* رابط الخبر */}
          {editingArticle?.url && (
            <div className="space-y-2">
              <label className="text-xs text-gray-400 font-bold uppercase">رابط الخبر الأصلي</label>
              <a 
                href={editingArticle.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block w-full bg-[#020617]/50 border border-blue-500/30 hover:border-blue-500/50 rounded-2xl px-4 py-3 text-sm text-blue-400 hover:text-blue-300 transition-all truncate"
              >
                {editingArticle.url}
              </a>
            </div>
          )}
          
          {/* الصورة */}
          {editedImageUrl && (
            <div className="space-y-2">
              <label className="text-xs text-gray-400 font-bold uppercase">صورة الخبر</label>
              <div className="relative w-full h-48 bg-black/50 rounded-2xl overflow-hidden border border-white/10">
                <img 
                  src={editedImageUrl} 
                  alt="صورة الخبر"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23333" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="20" fill="%23999" text-anchor="middle" dy=".3em"%3Eلا يمكن تحميل الصورة%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>
              <p className="text-[10px] text-gray-500 font-mono truncate">{editedImageUrl}</p>
            </div>
          )}
          
          {/* العنوان */}
          <div className="space-y-2">
            <label className="text-xs text-gray-400 font-bold uppercase">العنوان</label>
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="w-full bg-[#020617]/50 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600/50 text-white placeholder:text-gray-600"
              placeholder="عنوان الخبر"
            />
          </div>

          {/* المحتوى */}
          <div className="space-y-2">
            <label className="text-xs text-gray-400 font-bold uppercase">المحتوى</label>
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full h-64 bg-[#020617]/50 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-blue-600/50 resize-none text-white placeholder:text-gray-600"
              placeholder="محتوى الخبر..."
            />
            <p className="text-[10px] text-gray-500">{editedContent.length} حرف</p>
          </div>

          {/* الأزرار */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSaveInIncomplete}
              disabled={isSaving}
              className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><Save size={16} /> حفظ التغيرات</>
              )}
            </button>
            <button
              onClick={handleSaveAndSend}
              disabled={isSaving}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><Save size={16} /> حفظ وإرسال</>
              )}
            </button>
            <button
              onClick={() => setEditingArticle(null)}
              className="bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all"
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <EmptyState icon={AlertTriangle} title="لا توجد أخبار غير مكتملة حالياً" description="سيظهر هنا أي محتوى يحتاج إلى تكملة (محتوى قصير جداً أو بدون عنوان)." />
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification */}
      <Notification notification={notification} onClose={() => setNotification(null)} />

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
              {[...new Set(articles.map(a => a.category_name))].map(cat => (
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
          عدد النتائج: <span className="text-white font-bold">{filteredArticles.length}</span> من <span className="text-white font-bold">{articles.length}</span>
        </div>
        {filteredArticles.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBulkDeleteConfirm(true)}
              className="flex items-center gap-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            >
              <Trash size={14} /> حذف الكل
            </button>
            <div className="text-sm text-gray-400">
              الصفحة <span className="text-white font-bold">{currentPage}</span> من <span className="text-white font-bold">{Math.ceil(filteredArticles.length / itemsPerPage)}</span>
            </div>
          </div>
        )}
      </div>

      {filteredArticles.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="لا توجد أخبار غير مكتملة" description="لم يتم العثور على أخبار تطابق معايير البحث." />
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
                    <th className="text-center py-4 px-6 text-gray-400 font-semibold">الطول</th>
                    <th className="text-center py-4 px-6 text-gray-400 font-semibold">التاريخ</th>
                    <th className="text-center py-4 px-6 text-gray-400 font-semibold">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredArticles
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((article: any, idx: number) => (
                      <tr key={article.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-6 text-gray-400 font-mono text-xs">
                          {(currentPage - 1) * itemsPerPage + idx + 1}
                        </td>
                        <td className="py-4 px-6 text-gray-200 max-w-xs truncate">
                          {article.title || 'بدون عنوان'}
                        </td>
                        <td className="py-4 px-6 text-gray-400">
                          <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded text-xs font-bold">
                            {article.category_name || '—'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-gray-400 text-xs">
                          {article.source_name || '—'}
                        </td>
                        <td className="py-4 px-6 text-center text-gray-400 text-xs">
                          <span className="bg-amber-500/10 text-amber-400 px-2 py-1 rounded font-bold">
                            {article.content?.length || 0}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center text-gray-400 text-xs font-mono">
                          {new Date(article.fetched_at).toLocaleDateString('ar-SA')}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleEdit(article)}
                              className="bg-amber-600/10 hover:bg-amber-600/20 text-amber-400 px-3 py-1.5 rounded text-xs font-bold transition-all"
                              title="تكملة الخبر"
                            >
                              تكملة
                            </button>
                            <button
                              onClick={() => setDeleteConfirm({ show: true, articleId: article.id })}
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
          {Math.ceil(filteredArticles.length / itemsPerPage) > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-bold text-sm transition-all"
              >
                السابق
              </button>

              <div className="flex gap-1">
                {Array.from({ length: Math.ceil(filteredArticles.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
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

              <button
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredArticles.length / itemsPerPage), prev + 1))}
                disabled={currentPage === Math.ceil(filteredArticles.length / itemsPerPage)}
                className="bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-bold text-sm transition-all"
              >
                التالي
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
