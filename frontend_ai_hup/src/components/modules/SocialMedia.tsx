import React, { useState } from 'react';
import { Share2, Send, Loader2, Copy, Check, Hash, Repeat, Newspaper, Sparkles } from 'lucide-react';
import { generateAIContent } from '../../lib/ai-client';

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
    const system = 'أنت متخصص في إدارة وسائل التواصل الاجتماعي وصناعة المحتوى الرقمي.';

    if (activeTab === 'CAPTION') {
      prompt = `المنصة: ${platform}\nالنبرة: ${tone}\nالفكرة: ${content}\n\nاكتب Caption جذاب مع إيموجي مناسبة.`;
    } else if (activeTab === 'HASHTAGS') {
      prompt = `المحتوى: ${content}\n\nاقترح هاشتاجات نشطة ومناسبة باللغة العربية.`;
    } else {
      prompt = `الخبر:\n${content}\n\nالمنصة: ${platform}\nالنبرة: ${tone}\n\nحوّل الخبر لمنشور جذاب مع إيموجي.`;
    }

    try {
      const res = await generateAIContent(prompt, system);
      setResult(res);
    } catch {
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
    <div className="space-y-4 text-right">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold">وحدة التواصل الاجتماعي</h2>
        <p className="text-gray-400 text-xs">حوّل الأخبار إلى منشورات تفاعلية في لحظات.</p>
      </div>

      <div className="flex gap-2 p-1 bg-white/5 rounded-xl w-fit mr-auto ml-0 flex-row-reverse">
        {[
          { id: 'TRANSFORM', label: 'تحويل خبر', icon: Newspaper },
          { id: 'CAPTION', label: 'محتوى جديد', icon: Share2 },
          { id: 'HASHTAGS', label: 'هاشتاجات', icon: Hash },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as SocialTab); setResult(null); }}
            className={`px-5 py-2 rounded-lg text-xs font-arabic transition-all flex items-center gap-1.5 ${
              activeTab === tab.id ? 'bg-[#2563eb] text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input */}
        <div className="glass-panel p-4 space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400">
              {activeTab === 'TRANSFORM' ? 'نص الخبر' : 'وصف المنشور أو الفكرة'}
            </label>
            <textarea
              value={content}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
              rows={8}
              placeholder={activeTab === 'TRANSFORM' ? 'انسخ محتوى الخبر هنا...' : 'اكتب فكرتك...'}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#2563eb]/20 outline-none transition-all placeholder:text-gray-600 resize-none font-arabic leading-relaxed text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400">المنصة</label>
              <select value={platform} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPlatform(e.target.value)} className="w-full text-sm">
                <option value="Instagram">Instagram</option>
                <option value="Facebook">Facebook</option>
                <option value="X (Twitter)">X (Twitter)</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="TikTok">TikTok</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400">النبرة</label>
              <select value={tone} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTone(e.target.value)} className="w-full text-sm">
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
            className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
          >
            {isLoading ? <Loader2 className="animate-spin" size={16} /> : <><Sparkles size={14} /><span>إنشاء المنشور</span></>}
          </button>
        </div>

        {/* Output */}
        <div className="glass-panel p-4 flex flex-col bg-[#0b1224] border-dashed border-white/10 min-h-[300px]">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#2563eb]/10 rounded-lg flex items-center justify-center text-[#2563eb]">
                <Share2 size={14} />
              </div>
              <h3 className="text-sm font-bold">معاينة المحتوى</h3>
            </div>
            {result && (
              <button
                onClick={copyToClipboard}
                className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white flex items-center gap-1.5 text-xs border border-white/5"
              >
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                <span>{copied ? 'تم' : 'نسخ'}</span>
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 bg-white/[0.02] rounded-xl border border-white/10 font-arabic text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center gap-3">
                <div className="relative">
                  <div className="w-8 h-8 border-2 border-[#2563eb]/20 border-t-[#2563eb] rounded-full animate-spin" />
                  <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#2563eb]" size={12} />
                </div>
                <p className="text-xs text-gray-500">جاري الإنشاء...</p>
              </div>
            ) : result ? result : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-10 gap-3">
                <Repeat size={40} />
                <p className="text-xs">اكتب فكرتك واضغط إنشاء</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
