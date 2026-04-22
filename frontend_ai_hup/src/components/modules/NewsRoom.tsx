import React, { useState, useEffect } from 'react';
import {
  Newspaper, Loader2, Copy, Check, FileText, LayoutList,
  Trash2, Search, Sparkles, RefreshCw, Plus, Sun, Moon, Hash
} from 'lucide-react';
import { generateAIContent } from '../../lib/ai-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

type NewsMode = 'SUMMARY' | 'BULLETIN';
type TimeOfDay = 'MORNING' | 'EVENING';

interface NewsItem {
  id: string;
  content: string;
  title: string;
  selected: boolean;
  media_unit_id?: number;
  media_unit_name?: string;
  category_name?: string;
}

const COUNT_PRESETS = [5, 10, 15];

export default function NewsRoom({ mediaUnitId }: { mediaUnitId: number | null }) {
  const [activeMode, setActiveMode] = useState<NewsMode>('SUMMARY');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('MORNING');
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  // News count selection
  const [countPreset, setCountPreset] = useState<number | 'custom'>(5);
  const [customCount, setCustomCount] = useState<string>('');

  // Derived: how many items to auto-select
  const targetCount = countPreset === 'custom'
    ? (parseInt(customCount) || 0)
    : countPreset;

  // Fetch news on mount and when mediaUnitId prop changes
  useEffect(() => {
    fetchNews();
  }, [mediaUnitId]);

  const fetchNews = async () => {
    setIsLoadingNews(true);
    setDbError(null);
    try {
      const muParam = mediaUnitId ? `&media_unit_id=${mediaUnitId}` : '';
      const res = await fetch(`${API_URL}/flow/published?limit=50${muParam}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const items: NewsItem[] = (data.data || data.items || []).map((item: any, idx: number) => ({
        id: String(item.id ?? idx),
        title: item.title || 'بدون عنوان',
        content: item.content || item.summary || '',
        selected: false,
        media_unit_id: item.media_unit_id,
        media_unit_name: item.media_unit_name || '',
        category_name: item.category_name || '',
      }));
      setNewsItems(items);
    } catch {
      try {
        const muParam = mediaUnitId ? `&media_unit_id=${mediaUnitId}` : '';
        const res2 = await fetch(`${API_URL}/data/articles?limit=50${muParam}`);
        if (!res2.ok) throw new Error(`HTTP ${res2.status}`);
        const data2 = await res2.json();
        const items: NewsItem[] = (data2.data || []).map((item: any, idx: number) => ({
          id: String(item.id ?? idx),
          title: item.title || 'بدون عنوان',
          content: item.content || item.summary || '',
          selected: false,
          media_unit_id: item.media_unit_id,
          media_unit_name: item.media_unit_name || '',
          category_name: item.category_name || '',
        }));
        setNewsItems(items);
      } catch {
        setDbError('تعذّر جلب الأخبار');
      }
    } finally {
      setIsLoadingNews(false);
    }
  };

  const toggleSelect = (id: string) =>
    setNewsItems(newsItems.map(item => item.id === id ? { ...item, selected: !item.selected } : item));

  const selectAll = () =>
    setNewsItems(newsItems.map(item => ({ ...item, selected: true })));

  // Select exactly N items from the top
  const selectCount = (n: number) => {
    setNewsItems(prev => prev.map((item, idx) => ({ ...item, selected: idx < n })));
  };

  const removeNewsItem = (id: string) =>
    setNewsItems(newsItems.filter(item => item.id !== id));

  const filteredItems = newsItems.filter(item =>
    item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCount = newsItems.filter(i => i.selected).length;

  const handleGenerate = async () => {
    const selectedContent = newsItems.filter(i => i.selected).map(i => i.content).join('\n\n---\n\n');
    if (!selectedContent) return;
    setIsLoading(true);
    setResult(null);

    // Determine media unit name from first selected item
    const firstSelected = newsItems.find(i => i.selected);
    const mediaUnitName = firstSelected?.media_unit_name || 'الميديا يونت المختارة';

    const timeLabel = timeOfDay === 'MORNING' ? 'الصباحية' : 'المسائية';

    const bulletinIntro = `أهلاً بكم مستمعينا الكرام في نشرة الأخبار ${timeLabel} من "${mediaUnitName}"، نستهلها بأبرز العناوين`;
    const summaryIntro = `موجز الأخبار ${timeLabel} من "${mediaUnitName}"، أهلاً بكم`;

    const system = 'أنت محرر أخبار محترف متخصص في الإعلام العربي. مهمتك تحرير المادة الخبرية بدقة واحترافية وأسلوب إذاعي رصين.';

    const prompt = activeMode === 'SUMMARY'
      ? `ابدأ بهذه المقدمة تماماً:\n"${summaryIntro}"\n\nثم لخّص الأخبار التالية في موجز إخباري بنقاط واضحة ومرقّمة، بأسلوب إذاعي مختصر:\n\n${selectedContent}`
      : `ابدأ بهذه المقدمة تماماً:\n"${bulletinIntro}"\n\nثم صُغ الأخبار التالية كنشرة إخبارية ${timeLabel} كاملة جاهزة للإلقاء، بأسلوب إذاعي احترافي:\n\n${selectedContent}`;

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
            {/* Search + refresh */}
            <div className="flex gap-2">
              <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-xl border border-white/10 flex-1">
                <Search size={14} className="text-gray-500 shrink-0" />
                <input
                  type="text"
                  placeholder="ابحث في الأخبار..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-sm"
                />
              </div>
              <button
                onClick={fetchNews}
                disabled={isLoadingNews}
                className="p-2 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-colors text-gray-400 hover:text-white"
                title="تحديث"
              >
                <RefreshCw size={14} className={isLoadingNews ? 'animate-spin' : ''} />
              </button>
            </div>

            {/* Select all + count */}
            {filteredItems.length > 0 && (
              <div className="flex items-center justify-between text-xs text-gray-500">
                <button onClick={selectAll} className="hover:text-white transition-colors flex items-center gap-1">
                  <Plus size={12} />
                  تحديد الكل
                </button>
                <span>{selectedCount} محدد من {filteredItems.length}</span>
              </div>
            )}

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
              {isLoadingNews ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-500">
                  <Loader2 size={20} className="animate-spin" />
                  <span className="text-xs">جاري تحميل الأخبار...</span>
                </div>
              ) : dbError ? (
                <div className="text-center py-8 text-red-400 text-xs">{dbError}</div>
              ) : filteredItems.length === 0 ? (
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
                  {(item.media_unit_name || item.category_name) && (
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      {item.media_unit_name && (
                        <span className="text-[10px] bg-[#2563eb]/10 text-[#2563eb] px-1.5 py-0.5 rounded-full">{item.media_unit_name}</span>
                      )}
                      {item.category_name && (
                        <span className="text-[10px] bg-white/5 text-gray-500 px-1.5 py-0.5 rounded-full">{item.category_name}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-white/5 pt-3 flex flex-col gap-2">
              {/* ── Time of Day ── */}
              <div className="flex gap-1.5 p-1 bg-white/5 rounded-lg">
                <button
                  onClick={() => setTimeOfDay('MORNING')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs transition-all ${timeOfDay === 'MORNING' ? 'bg-amber-500 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  <Sun size={12} /> صباحي
                </button>
                <button
                  onClick={() => setTimeOfDay('EVENING')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs transition-all ${timeOfDay === 'EVENING' ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  <Moon size={12} /> مسائي
                </button>
              </div>

              {/* ── Mode: Summary / Bulletin ── */}
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

              {/* ── News Count ── */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-gray-500 text-right flex items-center gap-1 justify-end">
                  <Hash size={10} /> عدد الأخبار
                </span>
                <div className="flex gap-1.5">
                  {COUNT_PRESETS.map(n => (
                    <button
                      key={n}
                      onClick={() => { setCountPreset(n); selectCount(n); }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border ${countPreset === n ? 'bg-[#2563eb] border-[#2563eb] text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20'}`}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    onClick={() => setCountPreset('custom')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border ${countPreset === 'custom' ? 'bg-[#2563eb] border-[#2563eb] text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20'}`}
                  >
                    يدوي
                  </button>
                </div>
                {countPreset === 'custom' && (
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      min={1}
                      max={newsItems.length}
                      placeholder="أدخل العدد"
                      value={customCount}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomCount(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-[#2563eb] text-right"
                    />
                    <button
                      onClick={() => selectCount(parseInt(customCount) || 0)}
                      className="px-3 py-1.5 bg-[#2563eb]/20 text-[#2563eb] rounded-lg text-xs hover:bg-[#2563eb]/30 transition-colors border border-[#2563eb]/30"
                    >
                      تطبيق
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={handleGenerate}
                disabled={isLoading || selectedCount === 0}
                className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 disabled:opacity-30 text-sm"
              >
                {isLoading
                  ? <Loader2 className="animate-spin" size={16} />
                  : <><Sparkles size={14} /><span>إنشاء {activeMode === 'BULLETIN' ? 'النشرة' : 'الموجز'} ({selectedCount})</span></>
                }
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
                <div className="flex flex-col">
                  <h3 className="text-sm font-bold">المنتج النهائي</h3>
                  <span className="text-[10px] text-gray-500">
                    {activeMode === 'BULLETIN' ? 'نشرة' : 'موجز'} {timeOfDay === 'MORNING' ? 'صباحية' : 'مسائية'}
                  </span>
                </div>
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
                  <p className="text-xs">حدد الأخبار ثم اضغط إنشاء</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
