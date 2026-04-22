import React, { useState } from 'react';
import { Share2, Send, Loader2, Copy, Check, Hash, Facebook, Instagram, Twitter, Repeat, Newspaper, Sparkles } from 'lucide-react';
import { generateAIContent } from '../../lib/ai-clientent';

type SocialTab = 'CAPTION' | 'HASHTAGS' | 'TRANSFORM';

export default function SocialMedia() {
  const [activeTab, setActiveTab] = useState<SocialTab>('CAPTION');
  const [content, setContent] = useState('');
  const [platform, setPlatform] = useState('Instagram');
  const [tone, setTone] = useState('جذاب ومبدع');
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!content) return;
    setIsLoading(true);
    setResult(null);

    let prompt = '';
    let system = "أنت متخصص في إدارة وسائل التواصل الاجتماعي وصناعة المحتوى الرقمي. مهمتك كتابة محتوى جذاب واحترافية يتناسب مع كل منصة.";

    if (activeTab === 'CAPTION') {
      prompt = `المنصة: ${platform}\nالنبرة: ${tone}\nالفكرة/المحتوى: ${content}\n\nيرجى كتابة نص (Caption) جذاب للمنشور شامل الإيموجي المناسبة.`;
    } else if (activeTab === 'HASHTAGS') {
      prompt = `المحتوى: ${content}\n\nيرجى اقتراح قائمة من الهاشتاجات النشطة والمناسبة لهذا المحتوى باللغة العربية، مع توضيح مدى قوة كل هاشتاج.`;
    } else if (activeTab === 'TRANSFORM') {
      prompt = `الخبر الأصلي:\n${content}\n\nالمنصة المستهدفة: ${platform}\nالنبرة: ${tone}\n\nيرجى تحويل هذا الخبر إلى منشور (Social Media Post) جذاب ومناسب لهذه المنصة، مع مراعاة قواعد النشر فيها وإضافة الإيموجي.`;
    }

    try {
      const res = await generateAIContent(prompt, system);
      setResult(res);
    } catch (e) {
      setResult('حدث خطأ. يرجى المحاولة لاحقاً.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-8 text-right">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold">وحدة التواصل الاجتماعي</h2>
        <p className="text-gray-400">انشر محتواك بذكاء. حوّل الأخبار إلى منشورات تفاعلية في لحظات.</p>
      </div>

      <div className="flex gap-4 p-1 bg-white/5 rounded-2xl w-fit mr-auto ml-0 flex-row-reverse">
        {[
          { id: 'TRANSFORM', label: 'تحويل خبر لمنشور', icon: Newspaper },
          { id: 'CAPTION', label: 'كتابة محتوى جديد', icon: Share2 },
          { id: 'HASHTAGS', label: 'هاشتاجات ذكية', icon: Hash },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as SocialTab); setResult(null); }}
            className={`px-6 py-3 rounded-xl text-sm font-arabic transition-all flex items-center gap-2 ${
              activeTab === tab.id ? 'bg-[#2563eb] text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-400">
              {activeTab === 'TRANSFORM' ? 'أدخل تفاصيل الخبر هنا' : 'وصف المنشور أو الفكرة'}
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              placeholder={activeTab === 'TRANSFORM' ? "انسخ محتوى الخبر الذي تريد تحويله هنا..." : "اكتب فكرتك أو موضوع المنشور..."}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 focus:ring-2 focus:ring-[#2563eb]/20 outline-none transition-all placeholder:text-gray-600 resize-none hover:bg-white/10 font-arabic leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-400">المنصة المستهدفة</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full bg-white/10 border border-white/10 rounded-xl py-2.5 px-4 outline-none focus:ring-2 focus:ring-[#2563eb]/20 font-arabic"
              >
                <option value="Instagram">Instagram</option>
                <option value="Facebook">Facebook</option>
                <option value="X (Twitter)">X (Twitter)</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="TikTok">TikTok (Caption)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-400">النبرة</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full bg-white/10 border border-white/10 rounded-xl py-2.5 px-4 outline-none focus:ring-2 focus:ring-[#2563eb]/20 font-arabic"
              >
                <option value="جذاب ومبدع">جذاب ومبدع</option>
                <option value="رسمي مهني">رسمي مهني</option>
                <option value="تشويقي">تشويقي</option>
                <option value="شخصي/ودي">شخصي/ودي</option>
                <option value="سريع ومختصر">سريع ومختصر</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading || !content}
            className="btn-primary w-full flex items-center justify-center gap-3 disabled:opacity-50 py-3"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <><Sparkles size={18} /> <span>إنشاء المنشور الذكي</span></>}
          </button>
        </div>

        <div className="glass-panel p-8 flex flex-col bg-[#0b1224] relative group overflow-hidden border-dashed border-white/10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#2563eb]/5 rounded-bl-full blur-2xl" />
          
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#2563eb]/10 rounded-xl flex items-center justify-center text-[#2563eb]">
                   <Share2 size={20} />
                </div>
                <h3 className="text-lg font-bold">معاينة المحتوى</h3>
              </div>
              {result && (
                <button
                  onClick={copyToClipboard}
                  className="p-2.5 hover:bg-white/5 rounded-xl transition-colors text-gray-400 hover:text-white flex items-center gap-2 border border-white/5"
                >
                  {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                  <span className="text-xs">{copied ? 'تم النسخ' : 'نسخ النتيجة'}</span>
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-white/[0.02] rounded-3xl border border-white/10 font-arabic text-gray-300 whitespace-pre-wrap leading-relaxed shadow-inner">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center gap-4">
                  <div className="relative">
                    <div className="w-14 h-14 border-2 border-[#2563eb]/20 border-t-[#2563eb] rounded-full animate-spin"></div>
                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#2563eb] animate-pulse" size={20} />
                  </div>
                  <p className="text-sm text-gray-500 font-arabic">جاري إعداد المحتوى التفاعلي...</p>
                </div>
              ) : result ? (
                result
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-10 gap-4 py-20">
                  <Repeat size={80} />
                  <p className="text-xl">اكتب فكرتك واضغط إنشاء للمعاينة</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
