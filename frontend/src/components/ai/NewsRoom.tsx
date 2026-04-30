import { useState, useEffect } from 'react';
import {
  Newspaper, Loader2, Copy, Check, FileText, LayoutList,
  Trash2, Search, Sparkles, RefreshCw, Plus, Sun, Moon, Hash, X
} from 'lucide-react';
import { generateAIContent } from '../../lib/ai-client';
import { api } from '../../services/api';
import { useLocalStorageBatch } from '../../lib/useLocalStorageBatch';
import { getCategoryColor } from '../../lib/categoryColors';

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
  // Load from localStorage
  const loadFromStorage = (key: string, defaultValue: any) => {
    try {
      const saved = localStorage.getItem(`newsRoom_${key}`);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [activeMode, setActiveMode] = useState<NewsMode>(() => loadFromStorage('activeMode', 'SUMMARY'));
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(() => loadFromStorage('timeOfDay', 'MORNING'));
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(() => loadFromStorage('selectedCategory', ''));
  const [result, setResult] = useState<string | null>(() => loadFromStorage('result', null));
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  // News count selection
  const [countPreset, setCountPreset] = useState<number | 'custom'>(() => loadFromStorage('countPreset', 5));
  const [customCount, setCustomCount] = useState<string>(() => loadFromStorage('customCount', ''));

  // Fetch news on mount and when mediaUnitId prop changes - مع حماية من unmount
  useEffect(() => {
    let isMounted = true;
    
    if (isMounted) {
      fetchNews();
    }
    
    return () => {
      isMounted = false;
    };
  }, [mediaUnitId]);

  // Save to localStorage (batched to prevent infinite loops)
  useLocalStorageBatch([
    { key: 'newsRoom_activeMode', value: activeMode },
    { key: 'newsRoom_timeOfDay', value: timeOfDay },
    { key: 'newsRoom_result', value: result },
    { key: 'newsRoom_countPreset', value: countPreset },
    { key: 'newsRoom_customCount', value: customCount },
    { key: 'newsRoom_selectedCategory', value: selectedCategory },
  ], 200);

  const fetchNews = async () => {
    setIsLoadingNews(true);
    setDbError(null);
    try {
      const res = await api.getPublished(mediaUnitId);
      const items: NewsItem[] = (res.data || res.items || []).map((item: any, idx: number) => ({
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
        const res2 = await api.getArticles(50, 0);
        const items: NewsItem[] = (res2.data || []).map((item: any, idx: number) => ({
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

  const deselectAll = () =>
    setNewsItems(newsItems.map(item => ({ ...item, selected: false })));

  // Select exactly N items from the top
  const selectCount = (n: number) => {
    setNewsItems(prev => prev.map((item, idx) => ({ ...item, selected: idx < n })));
  };

  const removeNewsItem = (id: string) =>
    setNewsItems(newsItems.filter(item => item.id !== id));

  const filteredItems = newsItems.filter(item =>
    (item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.title.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (selectedCategory === '' || item.category_name === selectedCategory)
  );

  // Get unique categories
  const categories = [...new Set(newsItems.map(item => item.category_name).filter(Boolean))].sort();

  const selectedCount = newsItems.filter(i => i.selected).length;

  const handleGenerate = async () => {
    const selectedContent = newsItems.filter(i => i.selected).map(i => i.content).join('\n\n---\n\n');
    if (!selectedContent) return;
    setIsLoading(true);
    setResult(null);

    // Determine media unit name from first selected item
    const firstSelected = newsItems.find(i => i.selected);
    const mediaUnitName = firstSelected?.media_unit_name || 'الميديا يونت المختارة';

    // Get category breakdown
    const selectedItems = newsItems.filter(i => i.selected);
    const categoryBreakdown = selectedItems.reduce((acc: Record<string, number>, item) => {
      const cat = item.category_name || 'غير مصنف';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});
    const categoryInfo = Object.entries(categoryBreakdown)
      .map(([cat, count]) => `${count} من ${cat}`)
      .join('، ');

    const timeLabel = timeOfDay === 'MORNING' ? 'الصباحية' : 'المسائية';

    const bulletinIntro = `أهلاً بكم مستمعينا الكرام في نشرة الأخبار ${timeLabel} من "${mediaUnitName}"، نستهلها بأبرز العناوين`;
    const summaryIntro = `موجز الأخبار ${timeLabel} من "${mediaUnitName}"، أهلاً بكم`;

    const system = `أنت محرر أخبار محترف متخصص في الإعلام العربي. مهمتك تحرير المادة الخبرية بدقة واحترافية وأسلوب إذاعي رصين. الأخبار المختارة تشمل: ${categoryInfo}.`;

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
        <h2 className="text-xl font-bold text-gray-900">غرفة الأخبار الذكية</h2>
        <p className="text-gray-600 text-xs">اجمع الأخبار وصغ نشرتك الاحترافية في ثوانٍ.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* News list */}
        <div className="lg:col-span-6 flex flex-col">
          <div className="glass-panel p-4 space-y-3 flex flex-col flex-1 max-h-[600px] bg-white border border-gray-200">
            {/* Search + refresh */}
            <div className="flex gap-2">
              <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-xl border border-gray-300 flex-1 hover:border-blue-400 transition-colors">
                <Search size={16} className="text-gray-500 shrink-0" />
                <input
                  type="text"
                  placeholder="ابحث في الأخبار..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-base text-gray-900 placeholder-gray-500"
                />
              </div>
              <button
                onClick={fetchNews}
                disabled={isLoadingNews}
                className="p-3 bg-white border border-gray-300 rounded-xl hover:border-blue-400 hover:shadow-sm transition-all text-gray-600 hover:text-blue-600 disabled:opacity-50"
                title="تحديث"
              >
                <RefreshCw size={16} className={isLoadingNews ? 'animate-spin' : ''} />
              </button>
            </div>

            {/* Category Filter */}
            {categories.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs text-gray-600 font-bold">فلتر حسب التصنيف</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 text-gray-900 hover:border-blue-400 transition-colors"
                >
                  <option value="">كل التصنيفات</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Select all + deselect all + count */}
            {filteredItems.length > 0 && (
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex gap-2">
                <button onClick={selectAll} className="hover:text-blue-600 transition-colors flex items-center gap-1 text-sm font-medium text-gray-700">
                  <Plus size={14} />
                  تحديد الكل
                </button>
                {selectedCount > 0 && (
                  <button onClick={deselectAll} className="hover:text-red-600 transition-colors flex items-center gap-1 text-sm font-medium text-gray-700">
                    <X size={14} />
                    إلغاء الكل
                  </button>
                )}
              </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold bg-gray-100 text-gray-900 px-3 py-1.5 rounded-lg border border-gray-300">{selectedCount} محدد من {filteredItems.length}</span>
                  {selectedCategory && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full border border-blue-300">
                      {selectedCategory}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
              {isLoadingNews ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-500">
                  <Loader2 size={24} className="animate-spin" />
                  <span className="text-sm">جاري تحميل الأخبار...</span>
                </div>
              ) : dbError ? (
                <div className="text-center py-8 text-red-600 text-sm">{dbError}</div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-8 opacity-40 flex flex-col items-center gap-2">
                  <Newspaper size={40} />
                  <p className="text-sm">لا توجد أخبار</p>
                </div>
              ) : filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    item.selected ? 'bg-blue-100 border-blue-400 shadow-lg shadow-blue-200' : 'bg-gray-50 border-gray-300 hover:border-blue-300 hover:shadow-md'
                  }`}
                  onClick={() => toggleSelect(item.id)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded border-2 transition-colors shrink-0 flex items-center justify-center ${item.selected ? 'bg-blue-600 border-blue-600' : 'border-gray-400 hover:border-gray-600'}`}>
                        {item.selected && <Check size={12} className="text-white" />}
                      </div>
                      <h4 className="font-bold text-sm text-gray-900 leading-tight">{item.title}</h4>
                    </div>
                    <button
                      onClick={(e: React.MouseEvent) => { e.stopPropagation(); removeNewsItem(item.id); }}
                      className="text-gray-500 hover:text-red-600 transition-colors shrink-0 ml-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed mb-3">{item.content}</p>
                  {(item.media_unit_name || item.category_name) && (
                    <div className="flex gap-2 flex-wrap">
                      {item.media_unit_name && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-md border border-blue-300 font-medium">{item.media_unit_name}</span>
                      )}
                      {item.category_name && (() => {
                        const colors = getCategoryColor(item.category_name);
                        return (
                          <span className={`text-xs font-bold px-3 py-1.5 rounded-md border ${colors.bg} ${colors.text} ${colors.border}`}>
                            {item.category_name}
                          </span>
                        );
                      })()}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-3 flex flex-col gap-2">
              {/* ── Time of Day ── */}
              <div className="flex gap-1.5 p-1.5 bg-gray-100 rounded-lg">
                <button
                  onClick={() => setTimeOfDay('MORNING')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${timeOfDay === 'MORNING' ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-gray-700 border border-gray-300 hover:border-amber-400 hover:shadow-sm'}`}
                >
                  <Sun size={14} /> صباحي
                </button>
                <button
                  onClick={() => setTimeOfDay('EVENING')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${timeOfDay === 'EVENING' ? 'bg-sky-500 text-white shadow-md' : 'bg-white text-gray-700 border border-gray-300 hover:border-sky-400 hover:shadow-sm'}`}
                >
                  <Moon size={14} /> مسائي
                </button>
              </div>

              {/* ── Mode: Summary / Bulletin ── */}
              <div className="flex gap-1.5 p-1.5 bg-gray-100 rounded-lg">
                <button
                  onClick={() => setActiveMode('SUMMARY')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${activeMode === 'SUMMARY' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400 hover:shadow-sm'}`}
                >
                  <LayoutList size={14} /> موجز
                </button>
                <button
                  onClick={() => setActiveMode('BULLETIN')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${activeMode === 'BULLETIN' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400 hover:shadow-sm'}`}
                >
                  <FileText size={14} /> نشرة
                </button>
              </div>

              {/* ── News Count ── */}
              <div className="flex flex-col gap-2">
                <span className="text-xs text-gray-600 text-right flex items-center gap-1 justify-end">
                  <Hash size={12} /> عدد الأخبار
                </span>
                <div className="flex gap-1.5">
                  {COUNT_PRESETS.map(n => (
                    <button
                      key={n}
                      onClick={() => { setCountPreset(n); selectCount(n); }}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all border ${countPreset === n ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400 hover:shadow-sm'}`}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    onClick={() => setCountPreset('custom')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all border ${countPreset === 'custom' ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400 hover:shadow-sm'}`}
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
                      className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#FF9F43] text-right text-gray-900"
                    />
                    <button
                      onClick={() => selectCount(parseInt(customCount) || 0)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors border border-blue-600 font-medium"
                    >
                      تطبيق
                    </button>
                  </div>
                )}
              </div>

              {/* Category breakdown of selected items */}
              {selectedCount > 0 && (() => {
                const selectedItems = newsItems.filter(i => i.selected);
                const categoryBreakdown = selectedItems.reduce((acc: Record<string, number>, item) => {
                  const cat = item.category_name || 'غير مصنف';
                  acc[cat] = (acc[cat] || 0) + 1;
                  return acc;
                }, {});
                
                return Object.keys(categoryBreakdown).length > 0 ? (
                  <div className="bg-gray-50 border border-gray-300 rounded-xl p-3">
                    <p className="text-xs text-gray-700 mb-2.5 font-bold uppercase tracking-wide">التصنيفات المختارة:</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(categoryBreakdown).map(([cat, count]) => {
                        const colors = getCategoryColor(cat);
                        return (
                          <span key={cat} className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${colors.bg} ${colors.text} ${colors.border}`}>
                            {cat}: <span className="font-extrabold">{count}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ) : null;
              })()}

              <button
                onClick={handleGenerate}
                disabled={isLoading || selectedCount === 0}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-30 text-base"
              >
                {isLoading
                  ? <Loader2 className="animate-spin" size={18} />
                  : <><Sparkles size={16} /><span>إنشاء {activeMode === 'BULLETIN' ? 'النشرة' : 'الموجز'} ({selectedCount})</span></>
                }
              </button>
            </div>
          </div>
        </div>

        {/* Result */}
        <div className="lg:col-span-6 flex flex-col">
          <div className="glass-panel p-5 bg-white border border-gray-200 border-r-4 border-r-blue-600 flex flex-col flex-1 min-h-[600px]">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                  <Newspaper size={16} />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-base font-bold text-gray-900">المنتج النهائي</h3>
                  <span className="text-xs text-gray-600">
                    {activeMode === 'BULLETIN' ? 'نشرة' : 'موجز'} {timeOfDay === 'MORNING' ? 'صباحية' : 'مسائية'}
                  </span>
                </div>
              </div>
              {result && (
                <button
                  onClick={copyToClipboard}
                  className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-gray-600 hover:text-blue-600 flex items-center gap-2 text-sm border border-gray-300 hover:border-blue-400"
                >
                  {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                  <span>{copied ? 'تم' : 'نسخ'}</span>
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar leading-relaxed text-gray-900 font-arabic text-base whitespace-pre-wrap p-4 bg-white rounded-xl border border-gray-300">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center gap-3">
                  <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                  <p className="text-sm text-gray-600">جاري التحرير...</p>
                </div>
              ) : result ? result : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 gap-3">
                  <Newspaper size={48} />
                  <p className="text-sm text-gray-900">حدد الأخبار ثم اضغط إنشاء</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
