import { useState, useEffect } from "react";
import { Settings, FileEdit, Search, Sparkles, Trash2, Plus, X } from "lucide-react";
import { motion } from "motion/react";
import { api } from "../../services/api";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { Notification, NotificationData } from "../shared/Notification";

export function PoliciesView({ unitId }: { unitId: number | null }) {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [testText, setTestText] = useState("");
  const [modifiedText, setModifiedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPolicyId, setSelectedPolicyId] = useState<number | null>(null);

  // إنشاء سياسة جديدة
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    editorInstructions: "",
    injectedVarsRaw: `{
  "banned_words": ["كلمة سيئة", "كلمة محظورة"],
  "replacement_map": {"قديم": "جديد", "خطأ": "صحيح"},
  "required_phrases": ["يجب أن يتضمن", "ضروري"]
}`,
    isModifying: true,
  });
  const [createError, setCreateError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [notification, setNotification] = useState<NotificationData | null>(null);

  // تعديل سياسة
  const [editingPolicyId, setEditingPolicyId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    editorInstructions: "",
    injectedVarsRaw: "",
    isModifying: true,
  });
  const [editError, setEditError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);

  // حذف سياسة
  const [deletingPolicyId, setDeletingPolicyId] = useState<number | null>(null);
  const [deletingPolicyName, setDeletingPolicyName] = useState("");

  useEffect(() => {
    const loadData = () => {
      setLoading(true);
      const url = unitId ? `/news/editorial-policies?media_unit_id=${unitId}` : undefined;
      api.getPolicies()
        .then((res) => setPolicies(res.policies || []))
        .catch(() => setPolicies([]))
        .finally(() => setLoading(false));
    };

    loadData();

    // الاستماع لحدث الريفريش التلقائي
    const handleDataRefresh = () => {
      console.log('🔄 [PoliciesView] تحديث البيانات بناءً على حدث الريفريش');
      loadData();
    };

    window.addEventListener('dataRefresh', handleDataRefresh);
    return () => window.removeEventListener('dataRefresh', handleDataRefresh);
  }, [unitId]);

  const handleApply = async () => {
    if (!testText || !selectedPolicyId) return;
    const policy = policies.find((p: any) => p.id === selectedPolicyId);
    if (!policy) return;

    setIsProcessing(true);
    try {
      const result = await api.applyPolicy({ text: testText, policyName: policy.name });
      setModifiedText(result.modifiedText || JSON.stringify(result.inspection || result.result, null, 2));
    } catch (err) {
      setModifiedText("حدث خطأ أثناء تطبيق السياسة");
    }
    setIsProcessing(false);
  };

  const handleCreate = async () => {
    setCreateError("");
    if (!createForm.name.trim()) { setCreateError("الاسم مطلوب"); return; }
    if (!createForm.editorInstructions.trim()) { setCreateError("تعليمات المحرر مطلوبة"); return; }

    let injectedVars = undefined;
    if (createForm.injectedVarsRaw.trim()) {
      try {
        injectedVars = JSON.parse(createForm.injectedVarsRaw);
        if (typeof injectedVars !== "object" || Array.isArray(injectedVars)) throw new Error();
      } catch {
        setCreateError("المتغيرات المحقونة يجب أن تكون JSON object صحيح");
        return;
      }
    }

    setIsCreating(true);
    try {
      await api.createPolicy({
        name: createForm.name.trim(),
        description: createForm.description.trim() || undefined,
        editorInstructions: createForm.editorInstructions.trim(),
        injectedVars,
        isModifying: createForm.isModifying,
        mediaUnitId: unitId || undefined,
      });
      // إعادة تحميل السياسات
      const res = await api.getPolicies();
      setPolicies(res.policies || []);
      setShowCreateForm(false);
      setCreateForm({ name: "", description: "", editorInstructions: "", injectedVarsRaw: "", isModifying: true });
      setNotification({
        type: "success",
        message: `✅ تم إنشاء السياسة "${createForm.name}" بنجاح`,
      });
    } catch (err: any) {
      setCreateError(err?.message || "حدث خطأ أثناء الإنشاء");
      setNotification({
        type: "error",
        message: `❌ حدث خطأ أثناء إنشاء السياسة`,
      });
    }
    setIsCreating(false);
  };

  const handleEdit = async (policy: any) => {
    setIsLoadingEdit(true);
    try {
      // جلب تفاصيل السياسة من الـ backend
      const details = await api.getPolicyDetails(policy.name);
      const policyData = details.policy;
      
      setEditingPolicyId(policy.id);
      setEditForm({
        name: policyData.name,
        description: policyData.description || "",
        editorInstructions: policyData.editor_instructions || "",
        injectedVarsRaw: policyData.injected_vars ? JSON.stringify(policyData.injected_vars) : "",
        isModifying: policyData.is_modifying,
      });
      setEditError("");
    } catch (err) {
      console.error("خطأ في جلب تفاصيل السياسة:", err);
      setEditError("حدث خطأ في جلب بيانات السياسة");
    } finally {
      setIsLoadingEdit(false);
    }
  };

  const handleUpdatePolicy = async () => {
    setEditError("");
    if (!editForm.name.trim()) { setEditError("الاسم مطلوب"); return; }
    if (!editForm.editorInstructions.trim()) { setEditError("تعليمات المحرر مطلوبة"); return; }

    let injectedVars = undefined;
    if (editForm.injectedVarsRaw.trim()) {
      try {
        injectedVars = JSON.parse(editForm.injectedVarsRaw);
        if (typeof injectedVars !== "object" || Array.isArray(injectedVars)) throw new Error();
      } catch {
        setEditError("المتغيرات المحقونة يجب أن تكون JSON object صحيح");
        return;
      }
    }

    setIsEditing(true);
    try {
      const policy = policies.find(p => p.id === editingPolicyId);
      await api.updatePolicy(policy.name, {
        description: editForm.description.trim() || undefined,
        editorInstructions: editForm.editorInstructions.trim(),
        injectedVars,
      });
      const res = await api.getPolicies();
      setPolicies(res.policies || []);
      setEditingPolicyId(null);
      setNotification({
        type: "success",
        message: `✅ تم تحديث السياسة "${editForm.name}" بنجاح`,
      });
    } catch (err: any) {
      setEditError(err?.message || "حدث خطأ أثناء التحديث");
      setNotification({
        type: "error",
        message: `❌ حدث خطأ أثناء تحديث السياسة`,
      });
    }
    setIsEditing(false);
  };

  const handleDeletePolicy = async (policyId: number, policyName: string) => {
    setDeletingPolicyId(policyId);
    setDeletingPolicyName(policyName);
  };

  const confirmDelete = async () => {
    if (!deletingPolicyId) return;
    
    try {
      await api.deletePolicy(deletingPolicyName);
      setNotification({
        type: "success",
        message: `✅ تم حذف السياسة "${deletingPolicyName}" بنجاح`,
      });
      setPolicies(prev => prev.filter(p => p.id !== deletingPolicyId));
      setDeletingPolicyId(null);
      setDeletingPolicyName("");
    } catch (err) {
      setNotification({
        type: "error",
        message: `❌ حدث خطأ أثناء حذف السياسة`,
      });
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Notification notification={notification} onClose={() => setNotification(null)} position="center" />
      <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-8 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <motion.h3 
              className="text-lg font-bold flex items-center gap-2 text-gray-900"
              whileHover={{ scale: 1.05 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Settings size={20} className="text-blue-600" />
              </motion.div>
              السياسات النشطة
            </motion.h3>
            <button
              onClick={() => { setShowCreateForm(v => !v); setCreateError(""); }}
              className="flex items-center gap-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-orange-300 hover:border-orange-400 hover:shadow-lg hover:shadow-orange-200"
            >
              <Plus size={14} /> إضافة سياسة
            </button>
          </div>
          <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
            {policies.length === 0 && <p className="text-gray-500 text-sm">لا توجد سياسات مفعّلة</p>}
            {policies.map((p: any) => (
              <motion.div 
                key={p.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedPolicyId(p.id)}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group
                  ${selectedPolicyId === p.id ? "bg-blue-50 border-blue-300 shadow-md shadow-blue-100" : "bg-white border-gray-200 hover:border-blue-300"}`}
              >
                <div className="flex items-center gap-4">
                  <motion.div 
                    className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all ${
                      p.isModifying 
                        ? 'bg-blue-100 border border-blue-300' 
                        : 'bg-orange-100 border border-orange-300'
                    }`}
                    whileHover={{ rotate: 10 }}
                  >
                    {p.isModifying ? <FileEdit size={18} className="text-blue-600" /> : <Search size={18} className="text-orange-600" />}
                  </motion.div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">{p.name}</div>
                    <div className="text-[10px] text-gray-600">{p.description || (p.isModifying ? 'سياسة تعديل' : 'سياسة فحص')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <motion.span 
                    className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-md border transition-all ${
                      p.isModifying 
                        ? 'bg-blue-100 text-blue-700 border-blue-300' 
                        : 'bg-orange-100 text-orange-700 border-orange-300'
                    }`}
                    whileHover={{ scale: 1.05 }}
                  >
                    {p.isModifying ? "تعديل" : "فحص"}
                  </motion.span>
                  <motion.button
                    onClick={() => handleEdit(p)}
                    className="text-gray-600 hover:text-blue-600 transition-colors p-1"
                    title="تعديل"
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FileEdit size={14} />
                  </motion.button>
                  <motion.button
                    onClick={() => handleDeletePolicy(p.id, p.name)}
                    className="text-gray-600 hover:text-rose-600 transition-colors p-1"
                    title="حذف"
                    whileHover={{ scale: 1.2, rotate: -10 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Trash2 size={14} />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-8 border border-gray-200 shadow-sm space-y-6">
          <motion.h3 
            className="text-lg font-bold flex items-center gap-2 text-gray-900"
            whileHover={{ scale: 1.05 }}
          >
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles size={20} className="text-blue-600" />
            </motion.div>
            مختبر تجربة السياسات
          </motion.h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-gray-600 font-bold">النص للتجربة</label>
              <textarea 
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="الصق النص هنا لاختبار السياسات..."
                className="w-full h-32 bg-white border border-gray-300 rounded-2xl p-4 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 resize-none font-sans text-gray-900 placeholder:text-gray-500"
              />
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={handleApply}
                disabled={isProcessing || !selectedPolicyId || !testText}
                className={`flex-1 py-3 rounded-2xl font-bold text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2
                  ${isProcessing ? "bg-gray-200 text-gray-600" : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200"}
                  disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isProcessing ? (
                  <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><Sparkles size={16} /> تطبيق السياسة المختارة</>
                )}
              </button>
              <button 
                onClick={() => { setTestText(""); setModifiedText(""); }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl transition-all border border-gray-300"
              >
                <Trash2 size={18} />
              </button>
            </div>

            {modifiedText && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                <label className="text-xs text-emerald-700 font-bold">النتيجة</label>
                <div className="w-full min-h-[8rem] bg-emerald-50 border border-emerald-300 rounded-2xl p-4 text-sm whitespace-pre-wrap overflow-y-auto custom-scrollbar text-gray-900">
                  {modifiedText}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Modal إنشاء سياسة جديدة */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 border border-gray-200 shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2 text-gray-900">
                <Plus size={20} className="text-blue-600" />
                إضافة سياسة تحريرية جديدة
              </h3>
              <button onClick={() => { setShowCreateForm(false); setCreateError(""); }} className="text-gray-500 hover:text-gray-700 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-gray-700 font-bold">الاسم <span className="text-rose-600">*</span></label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="مثال: تنظيف النص"
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 text-gray-900 placeholder:text-gray-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-gray-700 font-bold">الوصف</label>
                <input
                  type="text"
                  value={createForm.description}
                  onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="وصف مختصر للسياسة"
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 text-gray-900 placeholder:text-gray-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-700 font-bold">نوع السياسة <span className="text-rose-600">*</span></label>
              <div className="flex gap-3">
                <button
                  onClick={() => setCreateForm(f => ({ ...f, isModifying: true }))}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-bold transition-all
                    ${createForm.isModifying ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-white border-gray-300 text-gray-700 hover:border-gray-400"}`}
                >
                  <FileEdit size={16} /> سياسة تعديل
                </button>
                <button
                  onClick={() => setCreateForm(f => ({ ...f, isModifying: false }))}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-bold transition-all
                    ${!createForm.isModifying ? "bg-orange-50 border-orange-300 text-orange-700" : "bg-white border-gray-300 text-gray-700 hover:border-gray-400"}`}
                >
                  <Search size={16} /> سياسة فحص
                </button>
              </div>
              <p className="text-[10px] text-gray-600">
                {createForm.isModifying ? "تعدّل النص وترجع النص المعدّل" : "تفحص النص وترجع تقرير بالمخالفات"}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-700 font-bold">تعليمات المحرر <span className="text-rose-600">*</span></label>
              <textarea
                value={createForm.editorInstructions}
                onChange={e => setCreateForm(f => ({ ...f, editorInstructions: e.target.value }))}
                placeholder="اكتب التعليمات التفصيلية للـ AI..."
                rows={5}
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 resize-none text-gray-900 placeholder:text-gray-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-700 font-bold">المتغيرات المحقونة <span className="text-gray-500">(اختياري — JSON)</span></label>
              <textarea
                value={createForm.injectedVarsRaw}
                onChange={e => setCreateForm(f => ({ ...f, injectedVarsRaw: e.target.value }))}
                placeholder=""
                rows={5}
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 resize-none text-gray-900 placeholder:text-gray-500 font-mono"
              />
              <p className="text-[10px] text-gray-600 leading-relaxed">
                مثال: عدّل القيم حسب احتياجاتك — banned_words (كلمات ممنوعة)، replacement_map (استبدال)، required_phrases (عبارات مطلوبة)
              </p>
            </div>

            {createError && (
              <div className="bg-rose-50 border border-rose-300 rounded-xl px-4 py-3 text-sm text-rose-700">
                {createError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleCreate}
                disabled={isCreating}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
              >
                {isCreating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Plus size={16} /> إنشاء السياسة</>}
              </button>
              <button
                onClick={() => { setShowCreateForm(false); setCreateError(""); }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold text-sm transition-all"
              >
                إلغاء
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal تعديل سياسة */}
      {editingPolicyId !== null && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 border border-gray-200 shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2 text-gray-900">
                <FileEdit size={20} className="text-blue-600" />
                تعديل السياسة
              </h3>
              <button onClick={() => setEditingPolicyId(null)} className="text-gray-500 hover:text-gray-700 transition-colors">
                <X size={20} />
              </button>
            </div>

            {isLoadingEdit ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-3 border-blue-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-gray-700 font-bold">الاسم <span className="text-rose-600">*</span></label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="مثال: تنظيف النص"
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 text-gray-900 placeholder:text-gray-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-gray-700 font-bold">الوصف</label>
                    <input
                      type="text"
                      value={editForm.description}
                      onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="وصف مختصر للسياسة"
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 text-gray-900 placeholder:text-gray-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-gray-700 font-bold">تعليمات المحرر <span className="text-rose-600">*</span></label>
                  <textarea
                    value={editForm.editorInstructions}
                    onChange={e => setEditForm(f => ({ ...f, editorInstructions: e.target.value }))}
                    placeholder="اكتب التعليمات التفصيلية للـ AI..."
                    rows={5}
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 resize-none text-gray-900 placeholder:text-gray-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-gray-700 font-bold">المتغيرات المحقونة <span className="text-gray-500">(اختياري — JSON)</span></label>
                  <textarea
                    value={editForm.injectedVarsRaw}
                    onChange={e => setEditForm(f => ({ ...f, injectedVarsRaw: e.target.value }))}
                    placeholder=""
                    rows={5}
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 resize-none text-gray-900 placeholder:text-gray-500 font-mono"
                  />
                  <p className="text-[10px] text-gray-600 leading-relaxed">
                    مثال: عدّل القيم حسب احتياجاتك — banned_words (كلمات ممنوعة)، replacement_map (استبدال)، required_phrases (عبارات مطلوبة)
                  </p>
                </div>

                {editError && (
                  <div className="bg-rose-50 border border-rose-300 rounded-xl px-4 py-3 text-sm text-rose-700">
                    {editError}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleUpdatePolicy}
                    disabled={isEditing}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                  >
                    {isEditing ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><FileEdit size={16} /> تحديث السياسة</>}
                  </button>
                  <button
                    onClick={() => setEditingPolicyId(null)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold text-sm transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}

      {/* Modal تأكيد الحذف */}
      {deletingPolicyId !== null && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 border border-gray-200 shadow-xl w-full max-w-md space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2 text-gray-900">
                <Trash2 size={20} className="text-rose-600" />
                تأكيد الحذف
              </h3>
              <button onClick={() => setDeletingPolicyId(null)} className="text-gray-500 hover:text-gray-700 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-gray-700">هل أنت متأكد من حذف السياسة:</p>
              <p className="text-lg font-bold text-gray-900 bg-gray-50 border border-gray-300 rounded-xl px-4 py-3">
                {deletingPolicyName}
              </p>
              <p className="text-sm text-gray-600">هذا الإجراء لا يمكن التراجع عنه.</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={confirmDelete}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
              >
                <Trash2 size={16} /> حذف
              </button>
              <button
                onClick={() => setDeletingPolicyId(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold text-sm transition-all"
              >
                إلغاء
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
    </>
  );
}
