/**
 * SystemSettingsPage
 * صفحة إعدادات النظام — نسخة كاملة بدل الـ popup
 */

import { useState, useEffect } from "react";
import { Settings2, Clock, Hash, Power, Loader2, CheckCircle2, AlertCircle, Globe, ExternalLink, Zap, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { api } from "../../services/api";

interface Props {
  onSystemStatusChange?: (enabled: boolean) => void;
}

type SaveStatus = "idle" | "saving" | "success" | "error";

export function SystemSettingsPage({ onSystemStatusChange }: Props) {
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  // القيم الحالية
  const [schedulerEnabled, setSchedulerEnabled]   = useState(true);
  const [classifierEnabled, setClassifierEnabled] = useState(true);
  const [flowEnabled, setFlowEnabled]             = useState(true);
  const [intervalMinutes, setIntervalMinutes]     = useState(15);
  const [articlesPerSource, setArticlesPerSource] = useState(20);

  // النشر على المواقع
  const [autoPublishEnabled, setAutoPublishEnabled] = useState(false);
  const [autoPublishTargets, setAutoPublishTargets] = useState<any[]>([]);

  // القيم المؤقتة للتعديل
  const [intervalInput, setIntervalInput]   = useState("15");
  const [articlesInput, setArticlesInput]   = useState("20");

  const allEnabled = schedulerEnabled && classifierEnabled && flowEnabled;

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.getSystemToggles().catch(() => ({ data: {} })),
      api.getAutoPublishStatus().catch(() => ({ data: { masterEnabled: false, targets: [] } })),
    ])
      .then(([togglesRes, autoRes]) => {
        const d = togglesRes.data || {};
        setSchedulerEnabled(!!d.scheduler_enabled);
        setClassifierEnabled(!!d.classifier_enabled);
        setFlowEnabled(!!d.flow_enabled);
        setIntervalMinutes(d.scheduler_interval_minutes ?? 15);
        setArticlesPerSource(d.articles_per_source ?? 20);
        setIntervalInput(String(d.scheduler_interval_minutes ?? 15));
        setArticlesInput(String(d.articles_per_source ?? 20));

        const autoData = autoRes.data || {};
        setAutoPublishEnabled(!!autoData.masterEnabled);
        setAutoPublishTargets(autoData.targets || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  // ── handlers ──────────────────────────────────────────────

  const handleToggleAll = async () => {
    const next = !allEnabled;
    setSaveStatus("saving");
    try {
      await api.setAutomationEnabled(next);
      setSchedulerEnabled(next);
      setClassifierEnabled(next);
      setFlowEnabled(next);
      onSystemStatusChange?.(next);
      setSaveStatus("success");
    } catch { setSaveStatus("error"); }
    finally { setTimeout(() => setSaveStatus("idle"), 2000); }
  };

  const handleToggleAutoPublish = async () => {
    const next = !autoPublishEnabled;
    setSaveStatus("saving");
    try {
      await api.toggleAutoPublishMaster(next);
      setAutoPublishEnabled(next);
      setSaveStatus("success");
    } catch { setSaveStatus("error"); }
    finally { setTimeout(() => setSaveStatus("idle"), 2000); }
  };

  const handleToggleManual = async (targetId: number, currentEnabled: boolean) => {
    setSaveStatus("saving");
    try {
      await api.toggleManualPublishTarget(targetId, !currentEnabled);
      setAutoPublishTargets(prev =>
        prev.map(t => t.id === targetId ? { ...t, manualEnabled: !currentEnabled } : t)
      );
      setSaveStatus("success");
    } catch { setSaveStatus("error"); }
    finally { setTimeout(() => setSaveStatus("idle"), 2000); }
  };

  const handleToggleAuto = async (targetId: number, currentEnabled: boolean) => {
    setSaveStatus("saving");
    try {
      await api.toggleAutoPublishOnlyTarget(targetId, !currentEnabled);
      setAutoPublishTargets(prev =>
        prev.map(t => t.id === targetId ? { ...t, autoEnabled: !currentEnabled } : t)
      );
      setSaveStatus("success");
    } catch { setSaveStatus("error"); }
    finally { setTimeout(() => setSaveStatus("idle"), 2000); }
  };

  const handleSaveNumbers = async () => {
    const mins = parseInt(intervalInput, 10);
    const arts = parseInt(articlesInput, 10);
    if (isNaN(mins) || mins < 1 || isNaN(arts) || arts < 1) {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 2000);
      return;
    }
    setSaveStatus("saving");
    try {
      await api.updateSetting("scheduler_interval_minutes", String(mins));
      await api.updateSetting("articles_per_source", String(arts));
      setIntervalMinutes(mins);
      setArticlesPerSource(arts);
      setSaveStatus("success");
    } catch { setSaveStatus("error"); }
    finally { setTimeout(() => setSaveStatus("idle"), 2000); }
  };

  const hasNumberChanges =
    intervalInput !== String(intervalMinutes) ||
    articlesInput !== String(articlesPerSource);

  // ── Loading ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={32} className="text-[#4A7C9E] animate-spin" />
      </div>
    );
  }

  // ── Page ───────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-[#3d6a8a] to-[#2d5570] rounded-2xl flex items-center justify-center shadow-lg shadow-[#3d6a8a]/20">
            <Settings2 size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1e293b]">إعدادات النظام</h2>
            <p className="text-xs text-[#64748b] mt-0.5">تحكم كامل بالنظام الآلي ومواقع النشر</p>
          </div>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#e2e8f0] bg-white hover:bg-[#f8fafc] text-[#64748b] text-xs font-medium transition-all"
        >
          <RefreshCw size={13} />
          تحديث
        </button>
      </div>

      {/* ─── Status Bar ─── */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm font-semibold ${
        saveStatus === "saving" ? "bg-blue-50 border-blue-200 text-blue-700" :
        saveStatus === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
        saveStatus === "error"   ? "bg-rose-50 border-rose-200 text-rose-700" :
        "bg-[#f8fafc] border-[#e2e8f0] text-[#64748b]"
      }`}>
        {saveStatus === "saving"  && <><Loader2 size={15} className="animate-spin" /> جاري الحفظ...</>}
        {saveStatus === "success" && <><CheckCircle2 size={15} /> تم الحفظ بنجاح</>}
        {saveStatus === "error"   && <><AlertCircle size={15} /> حدث خطأ — حاول مجدداً</>}
        {saveStatus === "idle"    && <><div className={`w-2 h-2 rounded-full ${allEnabled ? "bg-emerald-500 animate-pulse" : "bg-[#cbd5e1]"}`} /> {allEnabled ? "النظام نشط" : "النظام متوقف"}</>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ═══════════════════════════════════════
            العمود الأيمن — تشغيل النظام
        ═══════════════════════════════════════ */}
        <div className="space-y-4">

          {/* ─── بطاقة تشغيل النظام ─── */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-sm space-y-4">
            <p className="text-[11px] uppercase tracking-widest text-[#64748b] font-bold">تشغيل النظام الآلي</p>

            <button
              onClick={handleToggleAll}
              disabled={saveStatus === "saving"}
              className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between
                ${saveStatus === "saving" ? "opacity-60 cursor-not-allowed" : ""}
                ${allEnabled
                  ? "bg-emerald-50 border-emerald-300 hover:border-emerald-400"
                  : "bg-[#f8fafc] border-[#e2e8f0] hover:border-[#cbd5e1]"
                }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${allEnabled ? "bg-emerald-100" : "bg-[#f1f5f9]"}`}>
                  <Power size={20} className={allEnabled ? "text-emerald-600" : "text-[#64748b]"} />
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#1e293b]">{allEnabled ? "النظام شغّال" : "النظام متوقف"}</p>
                  <p className="text-[11px] text-[#64748b] mt-0.5">السحب · التصنيف · التوجيه</p>
                </div>
              </div>
              <div className={`w-12 h-6 rounded-full relative transition-colors shrink-0 ${allEnabled ? "bg-emerald-600" : "bg-[#cbd5e1]"}`}>
                <motion.div
                  animate={{ x: allEnabled ? 24 : 2 }}
                  transition={{ type: "spring", damping: 20, stiffness: 300 }}
                  className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm"
                />
              </div>
            </button>

            {/* الثلاثة مكونات */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "السحب",    value: schedulerEnabled },
                { label: "التصنيف", value: classifierEnabled },
                { label: "التوجيه", value: flowEnabled },
              ].map((item) => (
                <div key={item.label} className={`rounded-xl p-3 border text-center ${item.value ? "bg-emerald-50 border-emerald-200" : "bg-[#f8fafc] border-[#e2e8f0]"}`}>
                  <div className={`w-2 h-2 rounded-full mx-auto mb-1.5 ${item.value ? "bg-emerald-500" : "bg-[#cbd5e1]"}`} />
                  <p className={`text-[11px] font-semibold ${item.value ? "text-emerald-700" : "text-[#94a3b8]"}`}>{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ─── بطاقة إعدادات السحب ─── */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-sm space-y-4">
            <p className="text-[11px] uppercase tracking-widest text-[#64748b] font-bold">إعدادات السحب</p>

            <div className="space-y-3">
              {/* الفترة الزمنية */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-semibold text-[#475569]">
                  <Clock size={13} className="text-[#4A7C9E]" />
                  الفترة بين كل سحب (دقائق)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number" min={1} max={1440}
                    value={intervalInput}
                    onChange={(e) => setIntervalInput(e.target.value)}
                    className="flex-1 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm text-[#1e293b] focus:outline-none focus:border-[#4A7C9E] focus:ring-1 focus:ring-[#4A7C9E]/20 transition-colors text-center font-mono"
                  />
                  <span className="text-xs text-[#64748b] shrink-0 w-16">
                    {parseInt(intervalInput) >= 60
                      ? `${Math.floor(parseInt(intervalInput)/60)}س ${parseInt(intervalInput)%60}د`
                      : "دقيقة"}
                  </span>
                </div>
              </div>

              {/* عدد الأخبار */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-semibold text-[#475569]">
                  <Hash size={13} className="text-orange-500" />
                  عدد الأخبار لكل مصدر
                </label>
                <input
                  type="number" min={1} max={100}
                  value={articlesInput}
                  onChange={(e) => setArticlesInput(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm text-[#1e293b] focus:outline-none focus:border-[#4A7C9E] focus:ring-1 focus:ring-[#4A7C9E]/20 transition-colors text-center font-mono"
                />
              </div>
            </div>

            <button
              onClick={handleSaveNumbers}
              disabled={!hasNumberChanges || saveStatus === "saving"}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2
                ${!hasNumberChanges || saveStatus === "saving"
                  ? "bg-[#f1f5f9] text-[#94a3b8] cursor-not-allowed"
                  : "bg-[#4A7C9E] hover:bg-[#3d6a8a] text-white shadow-sm"
                }`}
            >
              {saveStatus === "saving"  && <Loader2 size={14} className="animate-spin" />}
              {saveStatus === "success" && <CheckCircle2 size={14} />}
              {saveStatus === "error"   && <AlertCircle size={14} />}
              {saveStatus === "idle"    && "حفظ الإعدادات"}
              {saveStatus === "saving"  && "جاري الحفظ..."}
              {saveStatus === "success" && "تم الحفظ"}
              {saveStatus === "error"   && "خطأ في الحفظ"}
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════
            العمود الأيسر — مواقع النشر
        ═══════════════════════════════════════ */}
        <div className="space-y-4">

          {/* ─── بطاقة مواقع النشر ─── */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-widest text-[#64748b] font-bold">مواقع النشر الخارجية</p>
              {/* Master switch */}
              <button
                onClick={handleToggleAutoPublish}
                disabled={saveStatus === "saving"}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all
                  ${saveStatus === "saving" ? "opacity-50 cursor-not-allowed" : ""}
                  ${autoPublishEnabled
                    ? "bg-blue-50 border-blue-300 text-blue-700 hover:border-blue-400"
                    : "bg-[#f8fafc] border-[#e2e8f0] text-[#64748b] hover:border-[#cbd5e1]"
                  }`}
              >
                <Zap size={12} className={autoPublishEnabled ? "text-blue-600" : "text-[#94a3b8]"} />
                {autoPublishEnabled ? "النشر التلقائي: مفعّل" : "النشر التلقائي: متوقف"}
                <div className={`w-8 h-4 rounded-full relative shrink-0 ${autoPublishEnabled ? "bg-blue-500" : "bg-[#cbd5e1]"}`}>
                  <motion.div
                    animate={{ x: autoPublishEnabled ? 16 : 1 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    className="absolute top-[3px] left-0 w-2.5 h-2.5 bg-white rounded-full shadow-sm"
                  />
                </div>
              </button>
            </div>

            <p className="text-[11px] text-[#94a3b8]">
              لكل موقع زران مستقلان — وقف الاثنين = لا يُنشر على الموقع نهائياً
            </p>

            {/* قائمة المواقع */}
            {autoPublishTargets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-[#94a3b8]">
                <Globe size={32} className="mb-3 opacity-40" />
                <p className="text-sm font-medium">لا توجد مواقع نشر مُضافة بعد</p>
              </div>
            ) : (
              <div className="space-y-3">
                {autoPublishTargets.map((target) => {
                  const manualOn: boolean = target.manualEnabled ?? target.manual_enabled ?? target.isEnabled ?? false;
                  const autoOn: boolean   = target.autoEnabled   ?? target.auto_enabled   ?? target.isEnabled ?? false;
                  const anyOn = manualOn || autoOn;

                  return (
                    <div
                      key={target.id}
                      className={`rounded-2xl border p-4 transition-all ${
                        anyOn
                          ? "bg-gradient-to-br from-blue-50/60 to-white border-blue-200"
                          : "bg-[#f8fafc] border-[#e2e8f0]"
                      }`}
                    >
                      {/* اسم الموقع + إحصائيات */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${anyOn ? "bg-blue-100" : "bg-[#f1f5f9]"}`}>
                            <ExternalLink size={15} className={anyOn ? "text-blue-600" : "text-[#94a3b8]"} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#1e293b]">{target.name}</p>
                            <p className="text-[10px] text-[#64748b]">{target.mediaUnitName}</p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-bold text-[#1e293b]">{target.totalPublished || 0}</p>
                          <p className="text-[10px] text-[#94a3b8]">منشور</p>
                          {(target.publishedToday > 0) && (
                            <p className="text-[10px] text-emerald-600 font-semibold">{target.publishedToday} اليوم</p>
                          )}
                        </div>
                      </div>

                      {/* الزران */}
                      <div className="grid grid-cols-2 gap-2">
                        {/* ✋ يدوي */}
                        <button
                          onClick={() => handleToggleManual(target.id, manualOn)}
                          disabled={saveStatus === "saving"}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-bold transition-all
                            ${saveStatus === "saving" ? "opacity-50 cursor-not-allowed" : ""}
                            ${manualOn
                              ? "bg-amber-50 border-amber-300 text-amber-700 hover:border-amber-400"
                              : "bg-white border-[#e2e8f0] text-[#94a3b8] hover:border-amber-200 hover:text-amber-600"
                            }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <span className="text-sm">✋</span>
                            يدوي
                          </span>
                          <div className={`w-8 h-4 rounded-full relative shrink-0 ${manualOn ? "bg-amber-500" : "bg-[#cbd5e1]"}`}>
                            <motion.div
                              animate={{ x: manualOn ? 16 : 1 }}
                              transition={{ type: "spring", damping: 20, stiffness: 300 }}
                              className="absolute top-[3px] left-0 w-2.5 h-2.5 bg-white rounded-full shadow-sm"
                            />
                          </div>
                        </button>

                        {/* ⚡ تلقائي */}
                        <button
                          onClick={() => handleToggleAuto(target.id, autoOn)}
                          disabled={saveStatus === "saving"}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-bold transition-all
                            ${saveStatus === "saving" ? "opacity-50 cursor-not-allowed" : ""}
                            ${autoOn
                              ? "bg-blue-50 border-blue-300 text-blue-700 hover:border-blue-400"
                              : "bg-white border-[#e2e8f0] text-[#94a3b8] hover:border-blue-200 hover:text-blue-600"
                            }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <span className="text-sm">⚡</span>
                            تلقائي
                          </span>
                          <div className={`w-8 h-4 rounded-full relative shrink-0 ${autoOn ? "bg-blue-500" : "bg-[#cbd5e1]"}`}>
                            <motion.div
                              animate={{ x: autoOn ? 16 : 1 }}
                              transition={{ type: "spring", damping: 20, stiffness: 300 }}
                              className="absolute top-[3px] left-0 w-2.5 h-2.5 bg-white rounded-full shadow-sm"
                            />
                          </div>
                        </button>
                      </div>

                      {/* ملخص الحالة */}
                      <p className={`text-[10px] mt-2 font-medium ${
                        !manualOn && !autoOn ? "text-rose-400" :
                        manualOn && autoOn   ? "text-emerald-600" :
                        "text-[#64748b]"
                      }`}>
                        {!manualOn && !autoOn && "⛔ لا يُنشر على هذا الموقع"}
                        {manualOn && autoOn   && "✅ يدوي + تلقائي مفعّلان"}
                        {manualOn && !autoOn  && "✋ يدوي فقط — المحرر ينشر يدوياً"}
                        {!manualOn && autoOn  && "⚡ تلقائي فقط — السكيدولر ينشر"}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
