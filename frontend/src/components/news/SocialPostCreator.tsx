import { useState, useEffect } from "react";
import {
  Share2, Loader2, CheckCircle, ArrowRight, Eye, Send,
  PenLine, Sparkles, Image as ImageIcon, X, ExternalLink, Copy
} from "lucide-react";
import { motion } from "motion/react";
import { api } from "../../services/api";
import { generateAIContent } from "../../lib/ai-client";
import { Notification, NotificationData } from "../shared/Notification";

interface SocialPostCreatorProps {
  article: {
    raw_data_id: number;
    title: string;
    content: string;
    image_url?: string | null;
  };
  onClose: () => void;
  onSuccess?: (url: string) => void;
}

type Step = "edit" | "processing" | "preview" | "publishing" | "done";

export function SocialPostCreator({ article, onClose, onSuccess }: SocialPostCreatorProps) {
  const [step, setStep] = useState<Step>("edit");
  const [postText, setPostText] = useState("");
  const [imageUrl, setImageUrl] = useState(article.image_url || "");
  const [platform, setPlatform] = useState("facebook");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [processedPost, setProcessedPost] = useState("");
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationData | null>(null);
  const [configs, setConfigs] = useState<any[]>([]);
  const [loadingConfigs, setLoadingConfigs] = useState(true);

  // تحميل إعدادات المنصات
  useEffect(() => {
    setLoadingConfigs(true);
    api.getPlatformConfigs()
      .then((res) => {
        const socialConfigs = (res.data || res.configs || []).filter(
          (c: any) => c.is_enabled && c.platform !== "external_website"
        );
        setConfigs(socialConfigs);
      })
      .catch(() => setConfigs([]))
      .finally(() => setLoadingConfigs(false));
  }, []);

  // توليد مسودة المنشور بالذكاء الاصطناعي
  useEffect(() => {
    const generateDraft = async () => {
      setIsGenerating(true);
      try {
        const prompt = `أنت متخصص في صناعة محتوى السوشال ميديا. حوّل الخبر التالي إلى منشور جذاب وقصير مناسب لمنصة ${platform === "facebook" ? "فيسبوك" : platform === "instagram" ? "إنستغرام" : "تويتر"}.

العنوان: ${article.title}

المحتوى: ${article.content}

اكتب منشوراً جذاباً مع إيموجي مناسبة وهاشتاجات. اجعله مختصراً وجاذباً للقارئ.`;
        const system = "أنت متخصص في إدارة وسائل التواصل الاجتماعي وصناعة المحتوى الرقمي العربي.";
        const result = await generateAIContent(prompt, system);
        setPostText(result || `📰 ${article.title}\n\n${article.content.substring(0, 300)}...`);
      } catch {
        // fallback: استخدام العنوان والمحتوى مباشرة
        setPostText(`📰 ${article.title}\n\n${article.content.substring(0, 300)}${article.content.length > 300 ? "..." : ""}`);
      } finally {
        setIsGenerating(false);
      }
    };
    generateDraft();
  }, [article, platform]);

  // معالجة المنشور — تحويله لصيغة نهائية
  const handleProcess = async () => {
    setStep("processing");
    try {
      const prompt = `أنت محرر سوشال ميديا محترف. راجع المنشور التالي وأعد صياغته بشكل نهائي جاهز للنشر على ${platform === "facebook" ? "فيسبوك" : platform === "instagram" ? "إنستغرام" : "تويتر"}.

المنشور الحالي:
${postText}

قواعد:
- اجعله مناسباً لطبيعة المنصة
- أضف إيموجي مناسبة
- أضف هاشتاجات فعّالة (3-5 هاشتاجات)
- ${platform === "twitter" ? "لا تتجاوز 280 حرف" : "اجعله مختصراً وجاذباً"}
- اكتب المنشور النهائي فقط بدون أي شرح`;
      const system = "أنت محرر محتوى رقمي محترف متخصص في منصات التواصل الاجتماعي.";
      const result = await generateAIContent(prompt, system);
      setProcessedPost(result || postText);
      setStep("preview");
    } catch {
      setProcessedPost(postText);
      setStep("preview");
    }
  };

  // النشر الفعلي
  const handlePublish = async (configId: number) => {
    setStep("publishing");
    setIsPublishing(true);
    try {
      const res = await api.publishToPlatform(article.raw_data_id, configId);
      if (res.success || res.data?.external_url) {
        const url = res.data?.external_url || "";
        setPublishedUrl(url);
        setStep("done");
        // حفظ في الأرشيف تلقائياً
        try {
          await api.archiveArticle(article.raw_data_id);
        } catch {
          // الأرشفة اختيارية — لا نوقف العملية
        }
        if (onSuccess && url) onSuccess(url);
      } else {
        setNotification({ type: "error", message: `❌ ${res.message || "فشل النشر"}` });
        setStep("preview");
      }
    } catch (err: any) {
      setNotification({ type: "error", message: `❌ ${err?.message || "فشل النشر على المنصة"}` });
      setStep("preview");
    } finally {
      setIsPublishing(false);
    }
  };

  const PLATFORM_INFO: Record<string, { icon: string; label: string; color: string }> = {
    facebook: { icon: "📘", label: "فيسبوك", color: "border-indigo-300 bg-indigo-50" },
    instagram: { icon: "📷", label: "إنستغرام", color: "border-pink-300 bg-pink-50" },
    twitter: { icon: "🐦", label: "X (تويتر)", color: "border-sky-300 bg-sky-50" },
  };

  const STEPS_LABELS: Record<Step, string> = {
    edit: "تعديل المنشور",
    processing: "معالجة المنشور",
    preview: "معاينة المنشور",
    publishing: "جاري النشر",
    done: "تم النشر",
  };

  const stepOrder: Step[] = ["edit", "processing", "preview", "publishing", "done"];
  const currentStepIndex = stepOrder.indexOf(step);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-2xl border border-[#e2e8f0] shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0] sticky top-0 bg-white rounded-t-2xl z-10">
          <h3 className="text-base font-bold flex items-center gap-2 text-[#1e293b]">
            <Share2 size={18} className="text-[#FF9F4A]" />
            إنشاء منشور على السوشال ميديا
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-[#f1f5f9] rounded-xl transition-colors text-[#64748b]">
            <X size={18} />
          </button>
        </div>

        {/* Steps Progress */}
        <div className="px-6 py-3 bg-[#f8fafc] border-b border-[#e2e8f0]">
          <div className="flex items-center justify-center gap-2">
            {stepOrder.filter(s => s !== "publishing").map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                  stepOrder.indexOf(s) <= currentStepIndex
                    ? "bg-[#FF9F4A] text-white"
                    : "bg-[#e2e8f0] text-[#94a3b8]"
                }`}>
                  <span>{i + 1}</span>
                  <span>{STEPS_LABELS[s]}</span>
                </div>
                {i < 3 && <ArrowRight size={12} className="text-[#cbd5e1]" />}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-5">
          {notification && (
            <Notification notification={notification} onClose={() => setNotification(null)} />
          )}

          {/* ═══ Step 1: تعديل المنشور ═══ */}
          {step === "edit" && (
            <div className="space-y-4">
              {/* اختيار المنصة */}
              <div>
                <p className="text-xs font-bold text-[#64748b] mb-2">اختر المنصة المستهدفة</p>
                <div className="flex gap-2">
                  {configs.length > 0 ? configs.map((config) => (
                    <button
                      key={config.id}
                      onClick={() => setPlatform(config.platform)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all text-sm font-bold ${
                        platform === config.platform
                          ? "border-[#FF9F4A] bg-[#FF9F4A]/10 text-[#FF9F4A]"
                          : "border-[#e2e8f0] bg-white text-[#64748b] hover:border-[#FF9F4A]/50"
                      }`}
                    >
                      <span className="text-lg">{PLATFORM_INFO[config.platform]?.icon || "🌐"}</span>
                      <span>{PLATFORM_INFO[config.platform]?.label || config.name}</span>
                    </button>
                  )) : (
                    <p className="text-xs text-[#94a3b8]">
                      {loadingConfigs ? "جاري تحميل المنصات..." : "لا توجد منصات مفعّلة"}
                    </p>
                  )}
                </div>
              </div>

              {/* نص المنشور */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-[#64748b]">نص المنشور (مسودة AI — يمكنك التعديل)</p>
                  {isGenerating && (
                    <span className="flex items-center gap-1 text-[10px] text-[#FF9F4A]">
                      <Sparkles size={12} className="animate-pulse" /> جاري التوليد...
                    </span>
                  )}
                </div>
                {isGenerating ? (
                  <div className="w-full h-40 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 size={24} className="animate-spin text-[#FF9F4A]" />
                      <p className="text-xs text-[#94a3b8]">الذكاء الاصطناعي يجهّز المسودة...</p>
                    </div>
                  </div>
                ) : (
                  <textarea
                    value={postText}
                    onChange={(e) => setPostText(e.target.value)}
                    rows={7}
                    className="w-full bg-white border border-[#e2e8f0] rounded-xl py-3 px-4 text-sm text-[#1e293b] leading-relaxed resize-none focus:outline-none focus:border-[#FF9F4A] focus:ring-1 focus:ring-[#FF9F4A]/20"
                    placeholder="نص المنشور..."
                    dir="rtl"
                  />
                )}
              </div>

              {/* الصورة */}
              <div>
                <p className="text-xs font-bold text-[#64748b] mb-2">صورة المنشور (اختياري)</p>
                {imageUrl ? (
                  <div className="space-y-2">
                    <div className="relative w-full h-48 rounded-xl overflow-hidden border border-[#e2e8f0] bg-[#f8fafc]">
                      <img
                        src={imageUrl}
                        alt="صورة المنشور"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <button
                        onClick={() => setImageUrl("")}
                        className="absolute top-2 left-2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 py-2 text-xs text-[#64748b] focus:outline-none focus:border-[#FF9F4A]"
                      placeholder="رابط الصورة..."
                      dir="ltr"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-full h-32 bg-[#f8fafc] border-2 border-dashed border-[#e2e8f0] rounded-xl flex flex-col items-center justify-center gap-2">
                      <ImageIcon size={24} className="text-[#cbd5e1]" />
                      <p className="text-[10px] text-[#94a3b8]">لا توجد صورة — يمكنك إضافة رابط صورة</p>
                    </div>
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 py-2 text-xs text-[#64748b] focus:outline-none focus:border-[#FF9F4A]"
                      placeholder="أضف رابط صورة (اختياري)..."
                      dir="ltr"
                    />
                  </div>
                )}
              </div>

              {/* زر معالجة المنشور */}
              <button
                onClick={handleProcess}
                disabled={!postText.trim() || isGenerating}
                className="w-full bg-[#FF9F4A] hover:bg-[#e88a3a] disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#FF9F4A]/20"
              >
                <Sparkles size={16} />
                معالجة المنشور
              </button>
            </div>
          )}

          {/* ═══ Step 2: معالجة المنشور ═══ */}
          {step === "processing" && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-[#FF9F4A]/20 border-t-[#FF9F4A] rounded-full animate-spin" />
                <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#FF9F4A]" size={20} />
              </div>
              <p className="text-sm font-bold text-[#1e293b]">جاري معالجة المنشور...</p>
              <p className="text-xs text-[#94a3b8]">يتم تحويل الخبر إلى صيغة منشور جاهزة للنشر</p>
            </div>
          )}

          {/* ═══ Step 3: معاينة المنشور ═══ */}
          {step === "preview" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Eye size={16} className="text-[#3d6a8a]" />
                <p className="text-sm font-bold text-[#1e293b]">معاينة المنشور النهائي</p>
              </div>

              {/* محاكاة شكل المنشور */}
              <div className={`rounded-2xl border-2 p-5 space-y-3 ${PLATFORM_INFO[platform]?.color || "border-[#e2e8f0] bg-[#f8fafc]"}`}>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{PLATFORM_INFO[platform]?.icon || "🌐"}</span>
                  <div>
                    <p className="text-xs font-bold text-[#1e293b]">{PLATFORM_INFO[platform]?.label || platform}</p>
                    <p className="text-[10px] text-[#94a3b8]">منشور جديد</p>
                  </div>
                </div>

                {imageUrl && (
                  <div className="w-full h-52 rounded-xl overflow-hidden border border-white/50">
                    <img
                      src={imageUrl}
                      alt="صورة المنشور"
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                )}

                <p className="text-sm text-[#1e293b] leading-relaxed whitespace-pre-wrap" dir="rtl">
                  {processedPost}
                </p>
              </div>

              {/* أزرار التحكم */}
              <div className="flex gap-3">
                <button
                  onClick={() => { setPostText(processedPost); setStep("edit"); }}
                  className="flex-1 bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#e2e8f0] text-[#64748b] py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                >
                  <PenLine size={14} />
                  تعديل مرة أخرى
                </button>
              </div>

              {/* اختيار المنصة للنشر */}
              <div className="space-y-2 border-t border-[#e2e8f0] pt-4">
                <p className="text-xs font-bold text-[#64748b] mb-2">اختر المنصة للنشر الفعلي</p>
                {loadingConfigs ? (
                  <div className="flex items-center justify-center py-3">
                    <Loader2 size={14} className="animate-spin text-[#94a3b8]" />
                  </div>
                ) : configs.length === 0 ? (
                  <p className="text-xs text-[#94a3b8] text-center py-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                    لا توجد منصات سوشال ميديا مفعّلة — أضف إعدادات من قسم الإعدادات
                  </p>
                ) : (
                  configs.filter(c => c.platform === platform || platform === "").map((config) => (
                    <button
                      key={config.id}
                      onClick={() => handlePublish(config.id)}
                      disabled={isPublishing}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
                    >
                      <Send size={16} />
                      نشر على {PLATFORM_INFO[config.platform]?.label || config.name}
                    </button>
                  ))
                )}
                {/* إذا لم يكن هناك config مطابق للمنصة المختارة، اعرض الكل */}
                {configs.length > 0 && configs.filter(c => c.platform === platform).length === 0 && (
                  configs.map((config) => (
                    <button
                      key={config.id}
                      onClick={() => handlePublish(config.id)}
                      disabled={isPublishing}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
                    >
                      <Send size={16} />
                      نشر على {PLATFORM_INFO[config.platform]?.label || config.name}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ═══ Step: جاري النشر ═══ */}
          {step === "publishing" && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 size={40} className="animate-spin text-emerald-600" />
              <p className="text-sm font-bold text-[#1e293b]">جاري النشر على {PLATFORM_INFO[platform]?.label || platform}...</p>
              <p className="text-xs text-[#94a3b8]">يرجى الانتظار</p>
            </div>
          )}

          {/* ═══ Step 4: تم النشر بنجاح ═══ */}
          {step === "done" && (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle size={32} className="text-emerald-600" />
                </div>
                <p className="text-lg font-bold text-[#1e293b]">تم النشر بنجاح! 🎉</p>
                <p className="text-xs text-[#94a3b8]">
                  تم نشر المنشور على {PLATFORM_INFO[platform]?.label || platform} وحفظه في الأرشيف
                </p>
              </div>

              {publishedUrl && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                    <ExternalLink size={14} /> رابط المنشور
                  </p>
                  <div className="flex items-center gap-2">
                    <a
                      href={publishedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-700 underline break-all flex-1"
                    >
                      {publishedUrl}
                    </a>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(publishedUrl);
                        setNotification({ type: "success", message: "✅ تم نسخ الرابط" });
                      }}
                      className="shrink-0 px-3 py-1.5 bg-white border border-emerald-200 hover:bg-emerald-100 rounded-lg text-xs font-bold text-emerald-700 transition-all flex items-center gap-1"
                    >
                      <Copy size={12} /> نسخ
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full bg-[#3d6a8a] hover:bg-[#2d5570] text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
              >
                إغلاق
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
