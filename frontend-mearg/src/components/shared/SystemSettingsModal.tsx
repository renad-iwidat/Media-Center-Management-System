/**
 * SystemSettingsModal
 * نافذة إعدادات النظام الآلي
 */

import { useState, useEffect } from "react";
import { X, Settings2, Clock, Hash, Power, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { api } from "../../services/api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSystemStatusChange?: (enabled: boolean) => void;
}

type SaveStatus = "idle" | "saving" | "success" | "error";

export function SystemSettingsModal({ isOpen, onClose, onSystemStatusChange }: Props) {
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  // القيم الحالية
  const [schedulerEnabled, setSchedulerEnabled] = useState(true);
  const [classifierEnabled, setClassifierEnabled] = useState(true);
  const [flowEnabled, setFlowEnabled] = useState(true);
  const [intervalMinutes, setIntervalMinutes] = useState(15);
  const [articlesPerSource, setArticlesPerSource] = useState(20);

  // القيم المؤقتة للتعديل
  const [intervalInput, setIntervalInput] = useState("15");
  const [articlesInput, setArticlesInput] = useState("20");

  const allEnabled = schedulerEnabled && classifierEnabled && flowEnabled;

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    api.getSystemToggles()
      .then((res) => {
        const d = res.data || {};
        setSchedulerEnabled(!!d.scheduler_enabled);
        setClassifierEnabled(!!d.classifier_enabled);
        setFlowEnabled(!!d.flow_enabled);
        setIntervalMinutes(d.scheduler_interval_minutes ?? 15);
        setArticlesPerSource(d.articles_per_source ?? 20);
        setIntervalInput(String(d.scheduler_interval_minutes ?? 15));
        setArticlesInput(String(d.articles_per_source ?? 20));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen]);

  // تشغيل/إيقاف الثلاثة دفعة واحدة
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
    } catch {
      setSaveStatus("error");
    } finally {
      setTimeout(() => setSaveStatus("idle"), 2000);
    }
  };

  // حفظ الإعدادات الرقمية
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
    } catch {
      setSaveStatus("error");
    } finally {
      setTimeout(() => setSaveStatus("idle"), 2000);
    }
  };

  const hasNumberChanges =
    intervalInput !== String(intervalMinutes) ||
    articlesInput !== String(articlesPerSource);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="bg-[#0b1224] border border-white/10 rounded-3xl shadow-2xl w-full max-w-md pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center">
                    <Settings2 size={20} className="text-indigo-400" />
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 size={28} className="text-indigo-400 animate-spin" />
                </div>
              ) : (
                <div className="p-6 space-y-6">

                  {/* زر تشغيل/إيقاف الثلاثة */}
                  <div className="space-y-3">
                    <p className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold">
                      تشغيل النظام الآلي
                    </p>
                    <button
                      onClick={handleToggleAll}
                      disabled={saveStatus === "saving"}
                      className={`w-full p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between group
                        ${saveStatus === "saving" ? "opacity-60 cursor-not-allowed" : ""}
                        ${allEnabled
                          ? "bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/50"
                          : "bg-white/[0.03] border-white/10 hover:border-white/20"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors
                          ${allEnabled ? "bg-emerald-500/20" : "bg-white/5"}`}>
                          <Power size={20} className={allEnabled ? "text-emerald-400" : "text-gray-500"} />
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-white">
                            {allEnabled ? "النظام شغّال" : "النظام متوقف"}
                          </p>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            السحب · التصنيف · التوجيه
                          </p>
                        </div>
                      </div>
                      {/* Toggle Switch */}
                      <div className={`w-12 h-6 rounded-full relative transition-colors shrink-0
                        ${allEnabled ? "bg-emerald-500" : "bg-white/10"}`}>
                        <motion.div
                          animate={{ x: allEnabled ? 24 : 2 }}
                          transition={{ type: "spring", damping: 20, stiffness: 300 }}
                          className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm"
                        />
                      </div>
                    </button>

                    {/* تفاصيل الثلاثة */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "السحب", value: schedulerEnabled, key: "scheduler" },
                        { label: "التصنيف", value: classifierEnabled, key: "classifier" },
                        { label: "التوجيه", value: flowEnabled, key: "flow" },
                      ].map((item) => (
                        <div
                          key={item.key}
                          className={`rounded-xl p-3 border text-center transition-colors
                            ${item.value
                              ? "bg-emerald-500/5 border-emerald-500/20"
                              : "bg-white/[0.02] border-white/5"
                            }`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full mx-auto mb-1.5
                            ${item.value ? "bg-emerald-500" : "bg-gray-600"}`} />
                          <p className={`text-[11px] font-medium
                            ${item.value ? "text-emerald-400" : "text-gray-500"}`}>
                            {item.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* فاصل */}
                  <div className="border-t border-white/5" />

                  {/* إعدادات السحب */}
                  <div className="space-y-4">
                    <p className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold">
                      إعدادات السحب
                    </p>

                    {/* الفترة الزمنية */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm text-gray-300">
                        <Clock size={14} className="text-blue-400" />
                        الفترة بين كل سحب (بالدقائق)
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min={1}
                          max={1440}
                          value={intervalInput}
                          onChange={(e) => setIntervalInput(e.target.value)}
                          className="flex-1 bg-[#020617] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors text-center font-mono"
                        />
                        <div className="text-xs text-gray-500 shrink-0">
                          {parseInt(intervalInput) >= 60
                            ? `${Math.floor(parseInt(intervalInput) / 60)}س ${parseInt(intervalInput) % 60}د`
                            : "دقيقة"}
                        </div>
                      </div>
                    </div>

                    {/* عدد الأخبار */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm text-gray-300">
                        <Hash size={14} className="text-purple-400" />
                        عدد الأخبار لكل مصدر
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={articlesInput}
                        onChange={(e) => setArticlesInput(e.target.value)}
                        className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors text-center font-mono"
                      />
                    </div>

                    {/* زر الحفظ */}
                    <button
                      onClick={handleSaveNumbers}
                      disabled={!hasNumberChanges || saveStatus === "saving"}
                      className={`w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2
                        ${!hasNumberChanges || saveStatus === "saving"
                          ? "bg-white/5 text-gray-500 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                        }`}
                    >
                      {saveStatus === "saving" && <Loader2 size={16} className="animate-spin" />}
                      {saveStatus === "success" && <CheckCircle2 size={16} className="text-emerald-400" />}
                      {saveStatus === "error" && <AlertCircle size={16} className="text-rose-400" />}
                      {saveStatus === "idle" && "حفظ الإعدادات"}
                      {saveStatus === "saving" && "جاري الحفظ..."}
                      {saveStatus === "success" && "تم الحفظ"}
                      {saveStatus === "error" && "خطأ في الحفظ"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
