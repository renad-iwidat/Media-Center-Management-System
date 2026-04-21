import React, { useState } from 'react';
import { Share2, Send, Loader2, Copy, Check, Hash, Facebook, Instagram, Twitter, Repeat, Newspaper, Sparkles, Search } from 'lucide-react';
import { generateAIContent } from '../../lib/gemini';
import { MOCK_NEWS } from '../../lib/mockData';

type SocialTab = 'CAPTION' | 'HASHTAGS' | 'TRANSFORM';

export default function SocialMedia() {
  const [activeTab, setActiveTab] = useState<SocialTab>('TRANSFORM');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  const [customContent, setCustomContent] = useState('');
  const [platform, setPlatform] = useState('Instagram');
  const [tone, setTone] = useState('جذاب ومبدع');
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const filteredNews = MOCK_NEWS.filter(item => 
    item.title.includes(searchTerm) || item.content.includes(searchTerm)
  );

  const handleGenerate = async () => {
    let sourceContent = '';
    if (activeTab === 'TRANSFORM' || activeTab === 'HASHTAGS') {
      const selectedNews = MOCK_NEWS.find(n => n.id === selectedNewsId);
      sourceContent = selectedNews ? selectedNews.content : customContent;
    } else {
      sourceContent = customContent;
    }

    if (!sourceContent) return;
    
    setIsLoading(true);
    setResult(null);

    let prompt = '';
    let system = "أنت متخصص في إدارة وسائل التواصل الاجتماعي وصناعة المحتوى الرقمي. مهمتك كتابة محتوى جذاب واحترافية يتناسب مع كل منصة.";

    if (activeTab === 'CAPTION') {
      prompt = `المنصة: ${platform}\nالنبرة: ${tone}\nالفكرة/المحتوى: ${sourceContent}\n\nيرجى كتابة نص (Caption) جذاب للمنشور شامل الإيموجي المناسبة.`;
    } else if (activeTab === 'HASHTAGS') {
      prompt = `المحتوى: ${sourceContent}\n\nيرجى اقتراح قائمة من الهاشتاجات النشطة والمناسبة لهذا المحتوى باللغة العربية، مع توضيح مدى قوة كل هاشتاج.`;
    } else if (activeTab === 'TRANSFORM') {
      prompt = `الخبر الأصلي:\n${sourceContent}\n\nالمنصة المستهدفة: ${platform}\nالنبرة: ${tone}\n\nيرجى تحويل هذا الخبر إلى منشور (Social Media Post) جذاب ومناسب لهذه المنصة، مع مراعاة قواعد النشر فيها وإضافة الإيموجي.`;
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
        <p className="text-gray-400">انشر محتواك بذكاء. حوّل الأخبار الموجودة في الأرشيف إلى منشورات تفاعلية.</p>
      </div>

      <div className="flex gap-4 p-1 bg-white/5 rounded-2xl w-fit mr-auto ml-0 flex-row-reverse">
        {[
          { id: 'TRANSFORM', label: 'تحويل خبر من الأرشيف', icon: Newspaper },
          { id: 'CAPTION', label: 'كتابة محتوى حر', icon: Share2 },
          { id: 'HASHTAGS', label: 'هاشتاجات للخبر', icon: Hash },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as SocialTab); setResult(null); setSearchTerm(''); }}
            className={`px-6 py-3 rounded-xl text-sm font-arabic transition-all flex items-center gap-2 ${
              activeTab === tab.id ? 'bg-brand-accent text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* News Selection Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 space-y-6 flex flex-col h-[550px]">
            <h3 className="font-bold border-b border-white/5 pb-3 flex items-center gap-2">
               <Newspaper size={18} className="text-brand-accent" />
               <span>{activeTab === 'CAPTION' ? 'وصف المحتوى الحر' : 'اختر خبراً من الأرشيف'}</span>
            </h3>

            {activeTab !== 'CAPTION' ? (
              <div className="space-y-4 flex flex-col flex-1">
                <div className="relative group">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <input 
                    type="text" 
                    placeholder="ابحث في الأخبار..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pr-11 pl-4 text-sm outline-none focus:ring-2 focus:ring-brand-accent/20"
                  />
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                  {filteredNews.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => setSelectedNewsId(item.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        selectedNewsId === item.id ? 'bg-brand-accent/10 border-brand-accent' : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                      }`}
                    >
                      <span className="text-sm font-bold truncate max-w-[200px]">{item.title}</span>
                      {selectedNewsId === item.id && <Check size={16} className="text-brand-accent" />}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 space-y-2">
                <textarea
                  value={customContent}
                  onChange={(e) => setCustomContent(e.target.value)}
                  rows={10}
                  placeholder="اكتب فكرتك أو المنشور الذي تريد العمل عليه..."
                  className="w-full h-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all placeholder:text-gray-600 resize-none font-arabic leading-relaxed"
                />
              </div>
            )}

            <div className="pt-4 border-t border-white/5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-brand-accent/20 font-arabic"
                >
                  <option value="Instagram">Instagram</option>
                  <option value="Facebook">Facebook</option>
                  <option value="X (Twitter)">X (Twitter)</option>
                  <option value="LinkedIn">LinkedIn</option>
                </select>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-brand-accent/20 font-arabic"
                >
                  <option value="جذاب ومبدع">جذاب ومبدع</option>
                  <option value="رسمي مهني">رسمي مهني</option>
                  <option value="تشويقي">تشويقي</option>
                </select>
              </div>
              <button
                onClick={handleGenerate}
                disabled={isLoading || (activeTab === 'CAPTION' ? !customContent : !selectedNewsId)}
                className="btn-primary w-full flex items-center justify-center gap-3 disabled:opacity-30 py-3"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <><Sparkles size={18} /> <span>إنشاء المحتوى الاجتماعي</span></>}
              </button>
            </div>
          </div>
        </div>

        {/* Result Preview Panel */}
        <div className="lg:col-span-7">
          <div className="glass-panel p-8 h-[550px] flex flex-col bg-brand-surface relative overflow-hidden border-dashed border-white/10">
            <div className="absolute top-0 left-0 w-32 h-32 bg-brand-accent/5 rounded-br-full blur-2xl" />
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-accent/10 rounded-xl flex items-center justify-center text-brand-accent">
                     <Share2 size={20} />
                  </div>
                  <h3 className="text-lg font-bold">معاينة المنشور</h3>
                </div>
                {result && (
                  <button
                    onClick={copyToClipboard}
                    className="p-2.5 hover:bg-white/5 rounded-xl transition-colors text-gray-400 hover:text-white flex items-center gap-2 border border-white/5"
                  >
                    {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                    <span className="text-xs">{copied ? 'تم النسخ' : 'نسخ النص'}</span>
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-white/[0.02] rounded-3xl border border-white/10 font-arabic text-gray-300 whitespace-pre-wrap leading-relaxed">
                {isLoading ? (
                  <div className="h-full flex flex-col items-center justify-center gap-4 py-20">
                    <div className="w-12 h-12 border-2 border-brand-accent/20 border-t-brand-accent rounded-full animate-spin"></div>
                    <p className="text-sm text-gray-500">جاري صياغة المنشور التفاعلي...</p>
                  </div>
                ) : result ? (
                  result
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-10 gap-4 py-20">
                    <Repeat size={80} />
                    <p className="text-xl">اختر خبراً واضغط إنشاء للمعاينة</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
