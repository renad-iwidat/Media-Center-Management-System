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
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
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
              className="bg-white border border-gray-200 rounded-3xl shadow-xl w-full max-w-md pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 border border-blue-300 rounded-xl flex items-center justify-center">
                    <Settings2 size={20} className="text-blue-600" />
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 size={28} className="text-blue-600 animate-spin" />
                </div>
              ) : (
                <div className="p-6 space-y-6">

                  {/* زر تشغيل/إيقاف الثلاثة */}
                  <div className="space-y-3">
                    <p className="text-[11px] uppercase tracking-widest text-gray-600 font-semibold">
                      تشغيل النظام الآلي
                    </p>
                    <button
                      onClick={handleToggleAll}
                      disabled={saveStatus === "saving"}
                      className={`w-full p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between group
                        ${saveStatus === "saving" ? "opacity-60 cursor-not-allowed" : ""}
                        ${allEnabled
                          ? "bg-emerald-50 border-emerald-300 hover:border-emerald-400"
                          : "bg-gray-50 border-gray-300 hover:border-gray-400"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors
                          ${allEnabled ? "bg-emerald-100" : "bg-gray-100"}`}>
                          <Power size={20} className={allEnabled ? "text-emerald-600" : "text-gray-600"} />
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">
                            {allEnabled ? "النظام شغّال" : "النظام متوقف"}
                          </p>
                          <p className="text-[11px] text-gray-600 mt-0.5">
                            السحب · التصنيف · التوجيه
                          </p>
                        </div>
                      </div>
                      {/* Toggle Switch */}
                      <div className={`w-12 h-6 rounded-full relative transition-colors shrink-0
                        ${allEnabled ? "bg-emerald-600" : "bg-gray-300"}`}>
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
                              ? "bg-emerald-50 border-emerald-300"
                              : "bg-gray-50 border-gray-300"
                            }`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full mx-auto mb-1.5
                            ${item.value ? "bg-emerald-600" : "bg-gray-400"}`} />
                          <p className={`text-[11px] font-medium
                            ${item.value ? "text-emerald-700" : "text-gray-600"}`}>
                            {item.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* فاصل */}
                  <div className="border-t border-gray-200" />

                  {/* إعدادات السحب */}
                  <div className="space-y-4">
                    <p className="text-[11px] uppercase tracking-widest text-gray-600 font-semibold">
                      إعدادات السحب
                    </p>

                    {/* الفترة الزمنية */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <Clock size={14} className="text-blue-600" />
                        الفترة بين كل سحب (بالدقائق)
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min={1}
                          max={1440}
                          value={intervalInput}
                          onChange={(e) => setIntervalInput(e.target.value)}
                          className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-colors text-center font-mono"
                        />
                        <div className="text-xs text-gray-600 shrink-0">
                          {parseInt(intervalInput) >= 60
                            ? `${Math.floor(parseInt(intervalInput) / 60)}س ${parseInt(intervalInput) % 60}د`
                            : "دقيقة"}
                        </div>
                      </div>
                    </div>

                    {/* عدد الأخبار */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <Hash size={14} className="text-orange-600" />
                        عدد الأخبار لكل مصدر
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={articlesInput}
                        onChange={(e) => setArticlesInput(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-colors text-center font-mono"
                      />
                    </div>

                    {/* زر الحفظ */}
                    <button
                      onClick={handleSaveNumbers}
                      disabled={!hasNumberChanges || saveStatus === "saving"}
                      className={`w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2
                        ${!hasNumberChanges || saveStatus === "saving"
                          ? "bg-gray-100 text-gray-600 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200"
                        }`}
                    >
                      {saveStatus === "saving" && <Loader2 size={16} className="animate-spin" />}
                      {saveStatus === "success" && <CheckCircle2 size={16} className="text-emerald-600" />}
                      {saveStatus === "error" && <AlertCircle size={16} className="text-rose-600" />}
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
