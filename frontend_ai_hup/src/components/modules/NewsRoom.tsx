import React, { useState } from 'react';
import { Newspaper, Loader2, Copy, Check, FileText, LayoutList, Trash2, Search, Sparkles } from 'lucide-react';
import { generateAIContent } from '../../lib/ai-client';
import { MOCK_NEWS } from '../../lib/mockData';

type NewsMode = 'SUMMARY' | 'BULLETIN';

interface NewsItem {
  id: string;
  content: string;
  title: string;
  selected: boolean;
  timestamp: Date;
}

export default function NewsRoom() {
  const [activeMode, setActiveMode] = useState<NewsMode>('SUMMARY');
  const [newsItems, setNewsItems] = useState<NewsItem[]>(
    MOCK_NEWS.map(n => ({ ...n, selected: true, timestamp: new Date() }))
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggleSelect = (id: string) =>
    setNewsItems(newsItems.map(item => item.id === id ? { ...item, selected: !item.selected } : item));

  const removeNewsItem = (id: string) =>
    setNewsItems(newsItems.filter(item => item.id !== id));

  const filteredItems = newsItems.filter(item =>
    item.content.includes(searchTerm) || item.title.includes(searchTerm)
  );

  const handleGenerate = async () => {
    const selectedContent = newsItems.filter(i => i.selected).map(i => i.content).join('\n\n---\n\n');
    if (!selectedContent) return;
    setIsLoading(true);
    setResult(null);

    const system = 'أنت محرر أخبار محترف. مهمتك تحرير المادة الخبرية بدقة واحترافية.';
    const prompt = activeMode === 'SUMMARY'
      ? `إليك الأخبار:\n${selectedContent}\n\nلخصها في موجز إخباري بنقاط واضحة.`
      : `إليك المادة الخبرية:\n${selectedContent}\n\nصغها كنشرة إخبارية كاملة جاهزة للإلقاء.`;

    try {
      const res = await generateAIContent(prompt, system);
      setResult(res);
    } catch {
      setResult('حدث خطأ. حاول مجدداً.');
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
    <div className="space-y-4">
      <div className="flex flex-col gap-1 text-right">
        <h2 className="text-xl font-bold">غرفة الأخبار الذكية</h2>
        <p className="text-gray-400 text-xs">اجمع الأخبار وصغ نشرتك الاحترافية في ثوانٍ.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* News list */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="glass-panel p-4 space-y-3 flex flex-col flex-1 max-h-[520px]">
            <div className="flex items-center gap-3 bg-white/5 px-3 py-2 rounded-xl border border-white/10">
              <Search size={14} className="text-gray-500 shrink-0" />
              <input
                type="text"
                placeholder="ابحث في الأخبار..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-sm"
              />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
              {filteredItems.length === 0 ? (
                <div className="text-center py-8 opacity-20 flex flex-col items-center gap-2">
                  <Newspaper size={32} />
                  <p className="text-xs">لا توجد أخبار</p>
                </div>
              ) : filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    item.selected ? 'bg-[#2563eb]/10 border-[#2563eb]/50' : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                  onClick={() => toggleSelect(item.id)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-3.5 h-3.5 rounded border transition-colors shrink-0 flex items-center justify-center ${item.selected ? 'bg-[#2563eb] border-[#2563eb]' : 'border-gray-600'}`}>
                        {item.selected && <Check size={10} className="text-white" />}
                      </div>
                      <h4 className="font-bold text-xs truncate max-w-[180px]">{item.title}</h4>
                    </div>
                    <button
                      onClick={(e: React.MouseEvent) => { e.stopPropagation(); removeNewsItem(item.id); }}
                      className="text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">{item.content}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-white/5 pt-3 flex flex-col gap-2">
              <div className="flex gap-1.5 p-1 bg-white/5 rounded-lg">
                <button
                  onClick={() => setActiveMode('SUMMARY')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs transition-all ${activeMode === 'SUMMARY' ? 'bg-[#2563eb] text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  <LayoutList size={12} /> موجز
                </button>
                <button
                  onClick={() => setActiveMode('BULLETIN')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs transition-all ${activeMode === 'BULLETIN' ? 'bg-[#2563eb] text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  <FileText size={12} /> نشرة
                </button>
              </div>
              <button
                onClick={handleGenerate}
                disabled={isLoading || !newsItems.some(i => i.selected)}
                className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 disabled:opacity-30 text-sm"
              >
                {isLoading ? <Loader2 className="animate-spin" size={16} /> : <><Sparkles size={14} /><span>إنشاء المحتوى</span></>}
              </button>
            </div>
          </div>
        </div>

        {/* Result */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="glass-panel p-4 bg-[#0b1224] border-r-4 border-r-[#2563eb] flex flex-col flex-1 min-h-[460px]">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-[#2563eb]/10 rounded-lg flex items-center justify-center text-[#2563eb]">
                  <Newspaper size={14} />
                </div>
                <h3 className="text-sm font-bold">المنتج النهائي</h3>
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
            <div className="flex-1 overflow-y-auto custom-scrollbar leading-relaxed text-gray-200 font-arabic text-sm whitespace-pre-wrap p-3 bg-white/[0.02] rounded-xl border border-white/5">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-2 border-[#2563eb]/20 border-t-[#2563eb] rounded-full animate-spin" />
                  <p className="text-xs text-gray-500">جاري التحرير...</p>
                </div>
              ) : result ? result : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-10 gap-3">
                  <Newspaper size={40} />
                  <p className="text-xs">اجمع الأخبار ثم اضغط إنشاء</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
