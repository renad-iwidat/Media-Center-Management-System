import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Newspaper, Send, Loader2, Copy, Check, FileText, LayoutList, Plus, Trash2, Search, Filter, Sparkles } from 'lucide-react';
import { generateAIContent } from '../../lib/ai-clientent';
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
  const [newsItems, setNewsItems] = useState<NewsItem[]>(MOCK_NEWS.map(n => ({ ...n, selected: true, timestamp: new Date() })));
  const [searchTerm, setSearchTerm] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggleSelect = (id: string) => {
    setNewsItems(newsItems.map(item => item.id === id ? { ...item, selected: !item.selected } : item));
  };

  const removeNewsItem = (id: string) => {
    setNewsItems(newsItems.filter(item => item.id !== id));
  };

  const filteredItems = newsItems.filter(item => 
    item.content.includes(searchTerm) || item.title.includes(searchTerm)
  );

  const handleGenerate = async () => {
    const selectedContent = newsItems
      .filter(item => item.selected)
      .map(item => item.content)
      .join('\n\n---\n\n');

    if (!selectedContent) return;
    
    setIsLoading(true);
    setResult(null);

    let prompt = '';
    let system = "أنت محرر أخبار محترف في غرفة أخبار عالمية. مهمتك تحرير المادة الخبرية بدقة واحترافية عالية.";

    if (activeMode === 'SUMMARY') {
      prompt = `إليك مجموعة من الأخبار المختارة:\n${selectedContent}\n\nيرجى دمجها وتلخيصها في موجز إخباري مركز يتكون من نقاط واضحة (Bullet Points).`;
    } else {
      prompt = `إليك المادة الخبرية المختارة:\n${selectedContent}\n\nيرجى صياغة هذه المادة في شكل "نشرة إخبارية كاملة" (News Bulletin) تتضمن: مقدمة قوية، جسم الخبر المفصل، وخاتمة مناسبة. اجعلها جاهزة للإلقاء الإذاعي أو التلفزيوني.`;
    }

    try {
      const res = await generateAIContent(prompt, system);
      setResult(res);
    } catch (e) {
      setResult('حدث خطأ أثناء إعداد النشرة. حاول مجدداً.');
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
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold">غرفة الأخبار الذكية</h2>
          <p className="text-gray-400">اجمع الأخبار، فلترها، وصغ نشرتك الاحترافية في ثوانٍ.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* News Collection Panel */}
        <div className="lg:col-span-5 space-y-6 flex flex-col h-full">
          <div className="glass-panel p-6 space-y-4 flex flex-col flex-1 max-h-[600px]">
            <div className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/10">
              <Search size={18} className="text-gray-500" />
              <input 
                type="text" 
                placeholder="ابحث في الخبر المجموع..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-sm"
              />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
              {filteredItems.length === 0 ? (
                <div className="text-center py-12 opacity-20 flex flex-col items-center">
                  <Newspaper size={48} className="mb-2" />
                  <p>لا توجد أخبار مجموعة حالياً</p>
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div 
                    key={item.id} 
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      item.selected 
                      ? 'bg-[#2563eb]/10 border-[#2563eb]/50' 
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                    onClick={() => toggleSelect(item.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded border transition-colors ${item.selected ? 'bg-[#2563eb] border-[#2563eb]' : 'border-gray-600'}`}>
                          {item.selected && <Check size={14} className="text-white" />}
                        </div>
                        <h4 className="font-bold text-sm truncate max-w-[200px]">{item.title}</h4>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeNewsItem(item.id); }}
                        className="text-gray-500 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {item.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-white/5 flex flex-col gap-4">
              <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
                <button
                  onClick={() => setActiveMode('SUMMARY')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs transition-all ${
                    activeMode === 'SUMMARY' ? 'bg-[#2563eb] text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <LayoutList size={14} />
                  موجز
                </button>
                <button
                  onClick={() => setActiveMode('BULLETIN')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs transition-all ${
                    activeMode === 'BULLETIN' ? 'bg-[#2563eb] text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <FileText size={14} />
                  نشرة
                </button>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isLoading || !newsItems.some(i => i.selected)}
                className="btn-primary w-full flex items-center justify-center gap-3 disabled:opacity-30 py-3"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <><Sparkles size={18} /> <span>إنشاء المحتوى المختار</span></>}
              </button>
            </div>
          </div>
        </div>

        {/* Result Panel */}
        <div className="lg:col-span-7 flex flex-col h-full">
          <div className="glass-panel p-8 bg-[#0b1224] border-r-4 border-r-[#2563eb] flex flex-col relative overflow-hidden flex-1 min-h-[500px]">
            <div className="absolute top-0 left-0 w-32 h-32 bg-[#2563eb]/5 rounded-br-full blur-2xl" />
            
            <div className="flex justify-between items-center mb-6 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#2563eb]/10 rounded-lg flex items-center justify-center text-[#2563eb]">
                   <Newspaper size={16} />
                </div>
                <h3 className="text-lg font-bold">المنتج النهائي</h3>
              </div>
              {result && (
                <button
                  onClick={copyToClipboard}
                  className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-400 hover:text-white flex items-center gap-2"
                >
                  {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                  <span className="text-xs">نسخ الخبر</span>
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar leading-relaxed text-gray-200 font-arabic whitespace-pre-wrap p-4 bg-white/[0.02] rounded-2xl border border-white/5">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center gap-4 py-12">
                   <div className="w-10 h-10 border-2 border-[#2563eb]/20 border-t-[#2563eb] rounded-full animate-spin"></div>
                   <p className="text-sm font-bold text-gray-500">جاري الربط والتحرير...</p>
                </div>
              ) : result ? (
                result
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-10 py-12">
                   <Newspaper size={80} className="mb-4" />
                   <p className="text-xl">اجمع بعض الأخبار ثم اضغط إنشاء</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
