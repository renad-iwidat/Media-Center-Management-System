import { useState, useEffect } from "react";
import { Settings, FileEdit, Search, Sparkles, Trash2, Plus, X } from "lucide-react";
import { motion } from "motion/react";
import { api } from "../services/api";
import { LoadingSpinner } from "./LoadingSpinner";

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
    injectedVarsRaw: "",
    isModifying: true,
  });
  const [createError, setCreateError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    setLoading(true);
    const url = unitId ? `/news/editorial-policies?media_unit_id=${unitId}` : undefined;
    api.getPolicies()
      .then((res) => setPolicies(res.policies || []))
      .catch(() => setPolicies([]))
      .finally(() => setLoading(false));
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
    } catch (err: any) {
      setCreateError(err?.message || "حدث خطأ أثناء الإنشاء");
    }
    setIsCreating(false);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0b1224] rounded-3xl p-8 border border-white/5 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2 text-white">
              <Settings size={20} className="text-blue-400" />
              السياسات النشطة
            </h3>
            <button
              onClick={() => { setShowCreateForm(v => !v); setCreateError(""); }}
              className="flex items-center gap-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-blue-600/20"
            >
              <Plus size={14} /> إضافة سياسة
            </button>
          </div>
          <div className="space-y-4">
            {policies.length === 0 && <p className="text-gray-500 text-sm">لا توجد سياسات مفعّلة</p>}
            {policies.map((p: any) => (
              <div 
                key={p.id} 
                onClick={() => setSelectedPolicyId(p.id)}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group
                  ${selectedPolicyId === p.id ? "bg-blue-600/10 border-blue-600/50" : "bg-white/[0.02] border-white/5 hover:border-blue-500/30"}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-blue-600/10 transition-colors">
                    {p.isModifying ? <FileEdit size={18} className="text-blue-400" /> : <Search size={18} className="text-amber-400" />}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{p.name}</div>
                    <div className="text-[10px] text-gray-500">{p.description || (p.isModifying ? 'سياسة تعديل' : 'سياسة فحص')}</div>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 bg-white/10 rounded-md text-gray-300">
                  {p.isModifying ? "تعديل" : "فحص"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0b1224] rounded-3xl p-8 border border-white/5 shadow-2xl space-y-6">
          <h3 className="text-lg font-bold flex items-center gap-2 text-white">
            <Sparkles size={20} className="text-blue-400" />
            مختبر تجربة السياسات
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-gray-500 font-bold">النص للتجربة</label>
              <textarea 
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="الصق النص هنا لاختبار السياسات..."
                className="w-full h-32 bg-[#020617]/50 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-blue-600/50 resize-none font-sans text-white placeholder:text-gray-600"
              />
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={handleApply}
                disabled={isProcessing || !selectedPolicyId || !testText}
                className={`flex-1 py-3 rounded-2xl font-bold text-sm shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2
                  ${isProcessing ? "bg-white/5 text-gray-500" : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20"}
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
                className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl transition-all border border-white/5"
              >
                <Trash2 size={18} />
              </button>
            </div>

            {modifiedText && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                <label className="text-xs text-emerald-400 font-bold">النتيجة</label>
                <div className="w-full min-h-[8rem] bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 text-sm whitespace-pre-wrap overflow-y-auto custom-scrollbar">
                  {modifiedText}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Modal إنشاء سياسة جديدة */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0b1224] rounded-3xl p-8 border border-blue-600/20 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                <Plus size={20} className="text-blue-400" />
                إضافة سياسة تحريرية جديدة
              </h3>
              <button onClick={() => { setShowCreateForm(false); setCreateError(""); }} className="text-gray-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-gray-400 font-bold">الاسم <span className="text-rose-400">*</span></label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="مثال: تنظيف النص"
                  className="w-full bg-[#020617]/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-600/50 text-white placeholder:text-gray-600"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-gray-400 font-bold">الوصف</label>
                <input
                  type="text"
                  value={createForm.description}
                  onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="وصف مختصر للسياسة"
                  className="w-full bg-[#020617]/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-600/50 text-white placeholder:text-gray-600"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-400 font-bold">نوع السياسة <span className="text-rose-400">*</span></label>
              <div className="flex gap-3">
                <button
                  onClick={() => setCreateForm(f => ({ ...f, isModifying: true }))}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-bold transition-all
                    ${createForm.isModifying ? "bg-blue-600/20 border-blue-600/50 text-blue-400" : "bg-white/[0.02] border-white/10 text-gray-400 hover:border-white/20"}`}
                >
                  <FileEdit size={16} /> سياسة تعديل
                </button>
                <button
                  onClick={() => setCreateForm(f => ({ ...f, isModifying: false }))}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-bold transition-all
                    ${!createForm.isModifying ? "bg-amber-600/20 border-amber-600/50 text-amber-400" : "bg-white/[0.02] border-white/10 text-gray-400 hover:border-white/20"}`}
                >
                  <Search size={16} /> سياسة فحص
                </button>
              </div>
              <p className="text-[10px] text-gray-500">
                {createForm.isModifying ? "تعدّل النص وترجع النص المعدّل" : "تفحص النص وترجع تقرير بالمخالفات"}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-400 font-bold">تعليمات المحرر <span className="text-rose-400">*</span></label>
              <textarea
                value={createForm.editorInstructions}
                onChange={e => setCreateForm(f => ({ ...f, editorInstructions: e.target.value }))}
                placeholder="اكتب التعليمات التفصيلية للـ AI..."
                rows={5}
                className="w-full bg-[#020617]/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600/50 resize-none text-white placeholder:text-gray-600"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-400 font-bold">المتغيرات المحقونة <span className="text-gray-600">(اختياري — JSON)</span></label>
              <textarea
                value={createForm.injectedVarsRaw}
                onChange={e => setCreateForm(f => ({ ...f, injectedVarsRaw: e.target.value }))}
                placeholder={'{"banned_words": ["كلمة1"], "replace_map": {"قديم": "جديد"}}'}
                rows={3}
                className="w-full bg-[#020617]/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600/50 resize-none text-white placeholder:text-gray-600 font-mono"
              />
            </div>

            {createError && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 text-sm text-rose-400">
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
                className="bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all"
              >
                إلغاء
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
