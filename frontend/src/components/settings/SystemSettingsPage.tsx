/**
 * SystemSettingsPage
 * صفحة إعدادات النظام الكاملة
 */

import { useState, useEffect } from "react";
import {
  Clock, Hash, Power, Loader2, CheckCircle2, AlertCircle,
  Globe, ExternalLink, Zap, RefreshCw, Settings2, History, User,
} from "lucide-react";
import { motion } from "motion/react";
import { api } from "../../services/api";

interface Props {
  onSystemStatusChange?: (enabled: boolean) => void;
}

type SaveStatus = "idle" | "saving" | "success" | "error";

export function SystemSettingsPage({ onSystemStatusChange }: Props) {
  const [loading, setLoading]   = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const [schedulerEnabled, setSchedulerEnabled]   = useState(false);
  const [classifierEnabled, setClassifierEnabled] = useState(false);
  const [flowEnabled, setFlowEnabled]             = useState(false);
  const [intervalMinutes, setIntervalMinutes]     = useState(15);
  const [articlesPerSource, setArticlesPerSource] = useState(20);
  const [intervalInput, setIntervalInput]         = useState("15");
  const [articlesInput, setArticlesInput]         = useState("20");

  const [autoPublishEnabled, setAutoPublishEnabled] = useState(false);
  const [autoPublishTargets, setAutoPublishTargets] = useState<any[]>([]);

  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const allEnabled = schedulerEnabled && classifierEnabled && flowEnabled;

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.getSystemToggles().catch(() => ({ data: {} })),
      api.getAutoPublishStatus().catch(() => ({ data: { masterEnabled: false, targets: [] } })),
    ]).then(([togglesRes, autoRes]) => {
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
      
      // إزالة التكرار: تصفية المواقع المكررة باستخدام الـ ID الفريد
      const uniqueTargets = [];
      const seenIds = new Set();
      for (const target of (autoData.targets || [])) {
        if (!seenIds.has(target.id)) {
          uniqueTargets.push(target);
          seenIds.add(target.id);
        }
      }
      setAutoPublishTargets(uniqueTargets);
    }).finally(() => setLoading(false));

    // جلب سجل التغييرات
    loadAuditLog();
  };

  const loadAuditLog = () => {
    setAuditLoading(true);
    api.getSettingsAuditLog({ limit: 20 })
      .then((res: any) => {
        setAuditLog(res.data || []);
      })
      .catch(() => setAuditLog([]))
      .finally(() => setAuditLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const withSave = async (fn: () => Promise<void>) => {
    setSaveStatus("saving");
    try { await fn(); setSaveStatus("success"); }
    catch { setSaveStatus("error"); }
    finally { setTimeout(() => setSaveStatus("idle"), 2000); }
  };

  const handleToggleAll = () => withSave(async () => {
    const next = !allEnabled;
    await api.setAutomationEnabled(next);
    setSchedulerEnabled(next); setClassifierEnabled(next); setFlowEnabled(next);
    onSystemStatusChange?.(next);
  });

  const handleToggleAutoPublish = () => withSave(async () => {
    const next = !autoPublishEnabled;
    await api.toggleAutoPublishMaster(next);
    setAutoPublishEnabled(next);
  });

  const handleToggleManual = (targetId: number, current: boolean) => withSave(async () => {
    await api.toggleManualPublishTarget(targetId, !current);
    setAutoPublishTargets(prev => prev.map(t => t.id === targetId ? { ...t, manualEnabled: !current } : t));
  });

  const handleToggleAuto = (targetId: number, current: boolean) => withSave(async () => {
    await api.toggleAutoPublishOnlyTarget(targetId, !current);
    setAutoPublishTargets(prev => prev.map(t => t.id === targetId ? { ...t, autoEnabled: !current } : t));
  });

  const handleUpdateTargetPublishMode = (targetId: number, autoPublish: boolean) => withSave(async () => {
    await api.updateAutoPublishTarget(targetId, { default_auto_publish: autoPublish });
    setAutoPublishTargets(prev => prev.map(t => t.id === targetId ? { ...t, defaultAutoPublish: autoPublish } : t));
  });

  const handleUpdateTargetPin = (targetId: number, pin: number) => withSave(async () => {
    await api.updateAutoPublishTarget(targetId, { default_pin: pin });
    setAutoPublishTargets(prev => prev.map(t => t.id === targetId ? { ...t, defaultPin: pin } : t));
  });

  const handleUpdateDailyAutoLimit = (targetId: number, limit: number | null) => withSave(async () => {
    await api.updateAutoPublishTarget(targetId, { daily_auto_limit: limit });
    setAutoPublishTargets(prev => prev.map(t => t.id === targetId ? { ...t, dailyAutoLimit: limit } : t));
  });

  const handleSaveNumbers = () => withSave(async () => {
    const mins = parseInt(intervalInput, 10);
    const arts = parseInt(articlesInput, 10);
    if (isNaN(mins) || mins < 1 || isNaN(arts) || arts < 1) throw new Error("invalid");
    await api.updateSetting("scheduler_interval_minutes", String(mins));
    await api.updateSetting("articles_per_source", String(arts));
    setIntervalMinutes(mins); setArticlesPerSource(arts);
  });

  const hasNumberChanges =
    intervalInput !== String(intervalMinutes) ||
    articlesInput !== String(articlesPerSource);

  // ── Toggle component ─────────────────────────────────────
  const Toggle = ({ on, onChange, disabled }: { on: boolean; onChange: () => void; disabled?: boolean }) => (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${on ? "bg-emerald-500" : "bg-[#cbd5e1]"} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <motion.div
        animate={{ x: on ? 23 : 2 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm"
      />
    </button>
  );

  // ── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="text-[#4A7C9E] animate-spin" />
          <p className="text-sm text-[#64748b]">جاري تحميل الإعدادات...</p>
        </div>
      </div>
    );
  }

  // ── Page ─────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ─── Page Header ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#3d6a8a] to-[#2d5570] rounded-2xl flex items-center justify-center shadow-lg shadow-[#3d6a8a]/20 shrink-0">
            <Settings2 size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1e293b]">إعدادات النظام</h2>
            <p className="text-xs text-[#64748b] mt-0.5">تحكم بتشغيل النظام الآلي ومواقع النشر الخارجية</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saveStatus !== "idle" && (
            <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg ${
              saveStatus === "saving" ? "bg-blue-50 text-blue-600" :
              saveStatus === "success" ? "bg-emerald-50 text-emerald-600" :
              "bg-rose-50 text-rose-600"
            }`}>
              {saveStatus === "saving"  && <Loader2 size={12} className="animate-spin" />}
              {saveStatus === "success" && <CheckCircle2 size={12} />}
              {saveStatus === "error"   && <AlertCircle size={12} />}
              {saveStatus === "saving" ? "جاري الحفظ..." : saveStatus === "success" ? "تم الحفظ" : "خطأ"}
            </span>
          )}
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#e2e8f0] bg-white hover:bg-[#f8fafc] text-[#64748b] hover:text-[#1e293b] text-xs font-medium transition-all"
          >
            <RefreshCw size={13} />
            تحديث
          </button>
        </div>
      </div>

      {/* ─── Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ═══ العمود الأيمن ═══ */}
        <div className="space-y-5">

          {/* بطاقة: تشغيل النظام */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#f1f5f9]">
              <p className="text-xs font-bold text-[#64748b] uppercase tracking-widest">تشغيل النظام الآلي</p>
            </div>
            <div className="p-5 space-y-4">

              {/* الزر الرئيسي */}
              <button
                onClick={handleToggleAll}
                disabled={saveStatus === "saving"}
                className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between group
                  ${allEnabled
                    ? "bg-emerald-50 border-emerald-200 hover:border-emerald-300"
                    : "bg-[#f8fafc] border-[#e2e8f0] hover:border-[#cbd5e1]"
                  } ${saveStatus === "saving" ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${allEnabled ? "bg-emerald-100" : "bg-[#f1f5f9]"}`}>
                    <Power size={18} className={allEnabled ? "text-emerald-600" : "text-[#94a3b8]"} />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#1e293b]">{allEnabled ? "النظام شغّال" : "النظام متوقف"}</p>
                    <p className="text-[11px] text-[#64748b] mt-0.5">السحب · التصنيف · التوجيه</p>
                  </div>
                </div>
                <Toggle on={allEnabled} onChange={handleToggleAll} disabled={saveStatus === "saving"} />
              </button>

              {/* المكونات الثلاثة */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "السحب",    on: schedulerEnabled },
                  { label: "التصنيف", on: classifierEnabled },
                  { label: "التوجيه", on: flowEnabled },
                ].map((item) => (
                  <div key={item.label} className={`rounded-xl p-3 border text-center transition-colors ${item.on ? "bg-emerald-50 border-emerald-200" : "bg-[#f8fafc] border-[#e2e8f0]"}`}>
                    <div className={`w-2 h-2 rounded-full mx-auto mb-1.5 ${item.on ? "bg-emerald-500 animate-pulse" : "bg-[#cbd5e1]"}`} />
                    <p className={`text-[11px] font-semibold ${item.on ? "text-emerald-700" : "text-[#94a3b8]"}`}>{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* بطاقة: إعدادات السحب */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#f1f5f9]">
              <p className="text-xs font-bold text-[#64748b] uppercase tracking-widest">إعدادات السحب</p>
            </div>
            <div className="p-5 space-y-4">

              {/* الفترة الزمنية */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-[#475569]">
                  <Clock size={13} className="text-[#4A7C9E]" />
                  الفترة بين كل سحب (دقائق)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number" min={1} max={1440}
                    value={intervalInput}
                    onChange={(e) => setIntervalInput(e.target.value)}
                    className="flex-1 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm text-[#1e293b] focus:outline-none focus:border-[#4A7C9E] focus:ring-2 focus:ring-[#4A7C9E]/10 transition-colors text-center font-mono"
                  />
                  <span className="text-xs text-[#94a3b8] shrink-0 min-w-[48px]">
                    {parseInt(intervalInput) >= 60
                      ? `${Math.floor(parseInt(intervalInput)/60)}س ${parseInt(intervalInput)%60}د`
                      : "دقيقة"}
                  </span>
                </div>
              </div>

              {/* عدد الأخبار */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-[#475569]">
                  <Hash size={13} className="text-orange-500" />
                  عدد الأخبار لكل مصدر
                </label>
                <input
                  type="number" min={1} max={100}
                  value={articlesInput}
                  onChange={(e) => setArticlesInput(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm text-[#1e293b] focus:outline-none focus:border-[#4A7C9E] focus:ring-2 focus:ring-[#4A7C9E]/10 transition-colors text-center font-mono"
                />
              </div>

              <button
                onClick={handleSaveNumbers}
                disabled={!hasNumberChanges || saveStatus === "saving"}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  !hasNumberChanges || saveStatus === "saving"
                    ? "bg-[#f1f5f9] text-[#94a3b8] cursor-not-allowed"
                    : "bg-[#4A7C9E] hover:bg-[#3d6a8a] text-white shadow-sm shadow-[#4A7C9E]/20"
                }`}
              >
                {saveStatus === "saving"  && <Loader2 size={14} className="animate-spin" />}
                {saveStatus === "success" && <CheckCircle2 size={14} />}
                {saveStatus === "error"   && <AlertCircle size={14} />}
                {saveStatus === "idle" ? "حفظ الإعدادات" :
                 saveStatus === "saving" ? "جاري الحفظ..." :
                 saveStatus === "success" ? "تم الحفظ" : "خطأ في الحفظ"}
              </button>
            </div>
          </div>
        </div>

        {/* ═══ العمود الأيسر ═══ */}
        <div className="space-y-5">

          {/* بطاقة: مواقع النشر */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#f1f5f9] flex items-center justify-between">
              <p className="text-xs font-bold text-[#64748b] uppercase tracking-widest">مواقع النشر الخارجية</p>
              {/* Master Switch */}
              <button
                onClick={handleToggleAutoPublish}
                disabled={saveStatus === "saving"}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                  saveStatus === "saving" ? "opacity-50 cursor-not-allowed" : ""
                } ${autoPublishEnabled
                  ? "bg-blue-50 border-blue-200 text-blue-700 hover:border-blue-300"
                  : "bg-[#f8fafc] border-[#e2e8f0] text-[#64748b] hover:border-[#cbd5e1]"
                }`}
              >
                <Zap size={12} className={autoPublishEnabled ? "text-blue-500" : "text-[#94a3b8]"} />
                النشر التلقائي
                <div className={`w-8 h-4 rounded-full relative shrink-0 ${autoPublishEnabled ? "bg-blue-500" : "bg-[#cbd5e1]"}`}>
                  <motion.div
                    animate={{ x: autoPublishEnabled ? 16 : 1 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    className="absolute top-[3px] left-0 w-2.5 h-2.5 bg-white rounded-full shadow-sm"
                  />
                </div>
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div className="text-[11px] text-[#94a3b8] leading-relaxed space-y-1">
                <p><strong className="text-[#64748b]">✋ يدوي:</strong> المحرر يقدر ينشر أخبار لهالموقع يدوياً من استديو التحرير</p>
                <p><strong className="text-[#64748b]">⚡ تلقائي:</strong> السكيدولر ينشر الأخبار الأوتوماتيكية تلقائياً</p>
                <p><strong className="text-[#64748b]">ينزل مباشر / مسودة:</strong> لما الخبر يوصل للموقع الخارجي — ينزل منشور أم يبقى draft</p>
              </div>

              {autoPublishTargets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <div className="w-12 h-12 bg-[#f1f5f9] rounded-2xl flex items-center justify-center">
                    <Globe size={22} className="text-[#cbd5e1]" />
                  </div>
                  <p className="text-sm text-[#94a3b8] font-medium">لا توجد مواقع نشر مُضافة</p>
                </div>
              ) : (
                autoPublishTargets.map((target) => {
                  const manualOn: boolean = target.manualEnabled ?? target.manual_enabled ?? target.isEnabled ?? false;
                  const autoOn: boolean   = target.autoEnabled   ?? target.auto_enabled   ?? target.isEnabled ?? false;
                  const anyOn = manualOn || autoOn;

                  const statusText = !manualOn && !autoOn ? "⛔ موقوف — لا يُنشر على هذا الموقع"
                    : manualOn && autoOn  ? "✅ يدوي + تلقائي مفعّلان"
                    : manualOn && !autoOn ? "✋ يدوي فقط — المحرر ينشر"
                    : "⚡ تلقائي فقط — السكيدولر ينشر";

                  const statusColor = !manualOn && !autoOn ? "text-rose-400"
                    : manualOn && autoOn  ? "text-emerald-600"
                    : "text-[#64748b]";

                  return (
                    <div
                      key={target.id}
                      className={`rounded-2xl border p-4 transition-all ${anyOn ? "border-[#e2e8f0] bg-white" : "border-[#f1f5f9] bg-[#f8fafc]"}`}
                    >
                      {/* اسم + إحصائيات */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${anyOn ? "bg-[#eef2ff]" : "bg-[#f1f5f9]"}`}>
                            <ExternalLink size={15} className={anyOn ? "text-[#4A7C9E]" : "text-[#94a3b8]"} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#1e293b]">{target.name}</p>
                            <p className="text-[10px] text-[#64748b]">{target.mediaUnitName}</p>
                          </div>
                        </div>
                        <div className="text-left shrink-0">
                          <p className="text-base font-bold text-[#1e293b]">{target.totalPublished || 0}</p>
                          <p className="text-[10px] text-[#94a3b8]">منشور</p>
                          {target.publishedToday > 0 && (
                            <p className="text-[10px] text-emerald-600 font-bold">{target.publishedToday} اليوم</p>
                          )}
                        </div>
                      </div>

                      {/* الزران */}
                      <div className="grid grid-cols-2 gap-2">
                        {/* ✋ يدوي */}
                        <button
                          onClick={() => handleToggleManual(target.id, manualOn)}
                          disabled={saveStatus === "saving"}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                            saveStatus === "saving" ? "opacity-50 cursor-not-allowed" : ""
                          } ${manualOn
                            ? "bg-amber-50 border-amber-200 text-amber-700 hover:border-amber-300"
                            : "bg-[#f8fafc] border-[#e2e8f0] text-[#94a3b8] hover:border-amber-200 hover:bg-amber-50/50"
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <span>✋</span> يدوي
                          </span>
                          <div className={`w-8 h-4 rounded-full relative shrink-0 ${manualOn ? "bg-amber-400" : "bg-[#cbd5e1]"}`}>
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
                          className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                            saveStatus === "saving" ? "opacity-50 cursor-not-allowed" : ""
                          } ${autoOn
                            ? "bg-blue-50 border-blue-200 text-blue-700 hover:border-blue-300"
                            : "bg-[#f8fafc] border-[#e2e8f0] text-[#94a3b8] hover:border-blue-200 hover:bg-blue-50/50"
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <span>⚡</span> تلقائي
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

                      {/* حالة الموقع */}
                      <p className={`text-[10px] font-semibold mt-2.5 ${statusColor}`}>
                        {statusText}
                      </p>

                      {/* ── الحد اليومي للنشر التلقائي ── */}
                      {autoOn && (
                        <div className="mt-3 pt-3 border-t border-[#f1f5f9] space-y-2">
                          <label className="flex items-center gap-1.5 text-[10px] font-bold text-[#64748b] uppercase tracking-wider">
                            <Hash size={11} className="text-blue-500" />
                            الحد اليومي للنشر التلقائي
                          </label>
                          <p className="text-[9px] text-[#94a3b8]">الحد الأقصى لعدد الأخبار التي تُنشر تلقائياً يومياً — لا يؤثر على النشر اليدوي</p>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              max={500}
                              placeholder="بلا حد"
                              value={target.dailyAutoLimit ?? target.daily_auto_limit ?? ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                const numVal = val === "" ? null : parseInt(val, 10);
                                setAutoPublishTargets(prev => prev.map(t => t.id === target.id ? { ...t, dailyAutoLimit: numVal, daily_auto_limit: numVal } : t));
                              }}
                              className="flex-1 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 py-1.5 text-[11px] text-[#1e293b] focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20 transition-colors text-center font-mono"
                            />
                            <button
                              onClick={() => {
                                const val = target.dailyAutoLimit ?? target.daily_auto_limit ?? null;
                                handleUpdateDailyAutoLimit(target.id, val);
                              }}
                              disabled={saveStatus === "saving"}
                              className="px-3 py-1.5 rounded-lg text-[10px] font-bold border bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 transition-all disabled:opacity-50"
                            >
                              حفظ
                            </button>
                          </div>
                          {(target.dailyAutoLimit ?? target.daily_auto_limit) != null && target.publishedToday > 0 && (
                            <p className="text-[9px] text-[#64748b]">
                              📊 منشور اليوم: <strong className="text-[#1e293b]">{target.publishedToday}</strong> / <strong className="text-blue-600">{target.dailyAutoLimit ?? target.daily_auto_limit}</strong>
                              {target.publishedToday >= (target.dailyAutoLimit ?? target.daily_auto_limit ?? Infinity) && (
                                <span className="text-rose-500 mr-1"> — تم الوصول للحد ⛔</span>
                              )}
                            </p>
                          )}
                        </div>
                      )}

                      {/* إعدادات النشر على الموقع الخارجي — فقط للمواقع التي تدعم auto_publish و pin (مثل النجاح) */}
                      {anyOn && (target.authType === 'token' || target.auth_type === 'token') && (
                        <div className="mt-3 pt-3 border-t border-[#f1f5f9] space-y-3">
                          <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">وضع النشر على الموقع الخارجي</p>
                          <p className="text-[9px] text-[#94a3b8]">هذا الإعداد يحدد هل الخبر ينزل مباشرةً على الموقع أم يُحفظ كمسودة بانتظار مراجعة المحرر هناك</p>

                          {/* وضع النشر: مباشر أو مسودة */}
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-[#475569]">عند الإرسال للموقع:</span>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleUpdateTargetPublishMode(target.id, true)}
                                disabled={saveStatus === "saving"}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                                  (target.defaultAutoPublish ?? target.default_auto_publish ?? true)
                                    ? "bg-emerald-100 border-emerald-300 text-emerald-700"
                                    : "bg-[#f8fafc] border-[#e2e8f0] text-[#94a3b8] hover:border-emerald-200"
                                }`}
                              >
                                ينزل مباشر
                              </button>
                              <button
                                onClick={() => handleUpdateTargetPublishMode(target.id, false)}
                                disabled={saveStatus === "saving"}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                                  !(target.defaultAutoPublish ?? target.default_auto_publish ?? true)
                                    ? "bg-amber-100 border-amber-300 text-amber-700"
                                    : "bg-[#f8fafc] border-[#e2e8f0] text-[#94a3b8] hover:border-amber-200"
                                }`}
                              >
                                مسودة (Draft)
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── سجل التغييرات (Audit Log) ─── */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#f1f5f9] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={14} className="text-[#4A7C9E]" />
            <p className="text-xs font-bold text-[#64748b] uppercase tracking-widest">سجل تغييرات الإعدادات</p>
          </div>
          <button
            onClick={loadAuditLog}
            disabled={auditLoading}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#e2e8f0] bg-white hover:bg-[#f8fafc] text-[#64748b] text-[10px] font-medium transition-all"
          >
            <RefreshCw size={11} className={auditLoading ? "animate-spin" : ""} />
            تحديث
          </button>
        </div>

        <div className="p-5">
          {auditLoading && auditLog.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="text-[#4A7C9E] animate-spin" />
            </div>
          ) : auditLog.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <History size={24} className="text-[#cbd5e1]" />
              <p className="text-xs text-[#94a3b8]">لا توجد تغييرات مسجّلة بعد</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {auditLog.map((entry: any) => {
                const date = new Date(entry.created_at);
                const timeStr = date.toLocaleString('ar-PS', {
                  year: 'numeric', month: 'short', day: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                });

                // تحديد لون ونوع التغيير
                const isToggle = entry.action_type === 'toggle';
                const isEnabled = entry.new_value === 'true';
                const actionColor = isToggle
                  ? (isEnabled ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-rose-600 bg-rose-50 border-rose-200')
                  : 'text-blue-600 bg-blue-50 border-blue-200';

                return (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 p-3 rounded-xl border border-[#f1f5f9] hover:border-[#e2e8f0] transition-colors"
                  >
                    {/* أيقونة */}
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${actionColor}`}>
                      {isToggle ? (
                        <Power size={12} />
                      ) : (
                        <Settings2 size={12} />
                      )}
                    </div>

                    {/* التفاصيل */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-[#1e293b] truncate">
                        {entry.description || entry.setting_key}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {entry.old_value && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-500 font-mono">
                            {entry.old_value.length > 30 ? entry.old_value.substring(0, 30) + '...' : entry.old_value}
                          </span>
                        )}
                        {entry.old_value && <span className="text-[9px] text-[#94a3b8]">←</span>}
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 font-mono">
                          {entry.new_value.length > 30 ? entry.new_value.substring(0, 30) + '...' : entry.new_value}
                        </span>
                      </div>
                    </div>

                    {/* المستخدم والوقت */}
                    <div className="text-left shrink-0">
                      {entry.changed_by_email && (
                        <div className="flex items-center gap-1 justify-end">
                          <User size={9} className="text-[#94a3b8]" />
                          <span className="text-[9px] text-[#64748b] font-medium">
                            {entry.changed_by_email.split('@')[0]}
                          </span>
                        </div>
                      )}
                      <p className="text-[9px] text-[#94a3b8] mt-0.5">{timeStr}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
