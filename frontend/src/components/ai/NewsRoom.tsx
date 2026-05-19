import { useState, useEffect, useCallback } from 'react';
import {
  Newspaper, Loader2, Copy, Check, FileText, LayoutList,
  Trash2, Search, Sparkles, RefreshCw, Sun, Moon, Hash,
  X, ChevronDown, Radio, BookOpen, Tag, Calendar, Building2,
  CheckSquare, Square, Filter, Wand2, Plus, Edit3, Save, Volume2
} from 'lucide-react';
import { generateAIContent } from '../../lib/ai-client';
import { api } from '../../services/api';
import { useLocalStorageBatch } from '../../lib/useLocalStorageBatch';
import { getCategoryColor } from '../../lib/categoryColors';
import { parseNumberedList } from '../../lib/markdown-parser';

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
  source_name?: string;
  published_at?: string;
  image_url?: string;
}

const COUNT_PRESETS = [5, 10, 15];

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function NewsRoom({ mediaUnitId }: { mediaUnitId: number | null }) {
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
  const [countPreset, setCountPreset] = useState<number | 'custom'>(() => loadFromStorage('countPreset', 5));
  const [customCount, setCustomCount] = useState<string>(() => loadFromStorage('customCount', ''));
  const [showFilters, setShowFilters] = useState(false);
  const [totalFetched, setTotalFetched] = useState(0);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualContent, setManualContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchNews();
  }, [mediaUnitId]);

  useLocalStorageBatch([
    { key: 'newsRoom_activeMode', value: activeMode },
    { key: 'newsRoom_timeOfDay', value: timeOfDay },
    { key: 'newsRoom_result', value: result },
    { key: 'newsRoom_countPreset', value: countPreset },
    { key: 'newsRoom_customCount', value: customCount },
    { key: 'newsRoom_selectedCategory', value: selectedCategory },
  ], 200);

  const fetchNews = useCallback(async () => {
    setIsLoadingNews(true);
    setDbError(null);
    try {
      // Try editorial endpoint first (flow/editorial)
      let items: NewsItem[] = [];
      try {
        const editorialRes = await api.getPublished(mediaUnitId);
        const rawItems = editorialRes.data || editorialRes.items || editorialRes.articles || [];
        if (rawItems.length > 0) {
          items = rawItems.map((item: any, idx: number) => ({
            id: String(item.id ?? idx),
            title: item.title || 'بدون عنوان',
            content: item.content || item.body || item.summary || '',
            selected: false,
            media_unit_id: item.media_unit_id,
            media_unit_name: item.media_unit_name || item.mediaUnit?.name || '',
            category_name: item.category_name || item.category?.name || '',
            source_name: item.source_name || item.source?.name || '',
            published_at: item.published_at || item.created_at || item.createdAt || '',
            image_url: item.image_url || item.imageUrl || '',
          }));
        }
      } catch {
        // fallback
      }

      // If editorial returned nothing, try articles
      if (items.length === 0) {
        const res2 = await api.getArticles(100, 0);
        const rawItems2 = res2.data || res2.articles || [];
        items = rawItems2.map((item: any, idx: number) => ({
          id: String(item.id ?? idx),
          title: item.title || 'بدون عنوان',
          content: item.content || item.body || item.summary || '',
          selected: false,
          media_unit_id: item.media_unit_id,
          media_unit_name: item.media_unit_name || item.mediaUnit?.name || '',
          category_name: item.category_name || item.category?.name || '',
          source_name: item.source_name || item.source?.name || '',
          published_at: item.published_at || item.created_at || item.createdAt || '',
          image_url: item.image_url || item.imageUrl || '',
        }));
      }

      setNewsItems(items);
      setTotalFetched(items.length);
    } catch (err: any) {
      setDbError('تعذّر جلب الأخبار — تحقق من الاتصال');
    } finally {
      setIsLoadingNews(false);
    }
  }, [mediaUnitId]);

  const toggleSelect = (id: string) =>
    setNewsItems(prev => prev.map(item => item.id === id ? { ...item, selected: !item.selected } : item));

  const selectAll = () => setNewsItems(prev => prev.map(item => ({ ...item, selected: true })));
  const deselectAll = () => setNewsItems(prev => prev.map(item => ({ ...item, selected: false })));
  const selectCount = (n: number) =>
    setNewsItems(prev => prev.map((item, idx) => ({ ...item, selected: idx < n })));
  const removeNewsItem = (id: string) =>
    setNewsItems(prev => prev.filter(item => item.id !== id));

  const addManualNews = () => {
    if (!manualTitle.trim() || !manualContent.trim()) return;
    
    const newItem: NewsItem = {
      id: `manual-${Date.now()}`,
      title: manualTitle.trim(),
      content: manualContent.trim(),
      selected: true,
      category_name: 'يدوي',
    };
    
    setNewsItems(prev => [newItem, ...prev]);
    setManualTitle('');
    setManualContent('');
    setShowManualInput(false);
  };

  const filteredItems = newsItems.filter(item => {
    const matchSearch = !searchTerm ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = !selectedCategory || item.category_name === selectedCategory;
    return matchSearch && matchCat;
  });

  const categories = [...new Set(newsItems.map(item => item.category_name).filter(Boolean))].sort() as string[];
  const selectedItems = newsItems.filter(i => i.selected);
  const selectedCount = selectedItems.length;

  const categoryBreakdown = selectedItems.reduce((acc: Record<string, number>, item) => {
    const cat = item.category_name || 'غير مصنف';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const handleGenerate = async () => {
    const selectedContent = selectedItems.map(i => `العنوان: ${i.title}\n${i.content}`).join('\n\n---\n\n');
    if (!selectedContent) return;
    setIsLoading(true);
    setResult(null);

    const mediaUnitName = selectedItems[0]?.media_unit_name || 'نشرة الأخبار';
    const categoryInfo = Object.entries(categoryBreakdown)
      .map(([cat, count]) => `${count} خبر من ${cat}`)
      .join('، ');

    const timeLabel = timeOfDay === 'MORNING' ? 'الصباحية' : 'المسائية';
    const bulletinIntro = `أهلاً بكم مستمعينا الكرام في نشرة الأخبار ${timeLabel} من "${mediaUnitName}"، نستهلها بأبرز العناوين`;
    const summaryIntro = `موجز الأخبار ${timeLabel} من "${mediaUnitName}"، أهلاً بكم`;

    const system = `أنت محرر أخبار محترف متخصص في الإعلام العربي. مهمتك تحرير المادة الخبرية بدقة واحترافية وأسلوب إذاعي رصين. الأخبار المختارة تشمل: ${categoryInfo}.

استخدم التنسيق التالي:
- استخدم **نص** للعناوين والنقاط المهمة
- استخدم الأرقام (1. 2. 3.) للنقاط المرقمة
- اجعل كل خبر في فقرة منفصلة`;

    const prompt = activeMode === 'SUMMARY'
      ? `ابدأ بهذه المقدمة تماماً:\n"${summaryIntro}"\n\nثم لخّص الأخبار التالية في موجز إخباري بنقاط واضحة ومرقّمة، بأسلوب إذاعي مختصر. استخدم **نص** لتمييز العناوين المهمة:\n\n${selectedContent}`
      : `ابدأ بهذه المقدمة تماماً:\n"${bulletinIntro}"\n\nثم صُغ الأخبار التالية كنشرة إخبارية ${timeLabel} كاملة جاهزة للإلقاء، بأسلوب إذاعي احترافي. استخدم **نص** لتمييز العناوين والنقاط المهمة:\n\n${selectedContent}`;

    try {
      const res = await generateAIContent(prompt, system);
      setResult(res);
    } catch {
      setResult('حدث خطأ أثناء التوليد. حاول مجدداً.');
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

  const handleSaveBulletin = async () => {
    if (!result || !mediaUnitId) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const contentToSave = isEditing ? editedContent : result;
      const timeLabel = timeOfDay === 'MORNING' ? 'الصباحية' : 'المسائية';
      const typeLabel = activeMode === 'BULLETIN' ? 'نشرة' : 'موجز';
      const title = `${typeLabel} ${timeLabel} - ${new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' })}`;

      await api.createBulletin({
        media_unit_id: mediaUnitId,
        type: activeMode === 'BULLETIN' ? 'bulletin' : 'summary',
        time_of_day: timeOfDay === 'MORNING' ? 'morning' : 'evening',
        title,
        original_content: result,
        edited_content: isEditing ? editedContent : undefined,
        news_count: selectedCount,
      });

      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('❌ خطأ في حفظ الموجز/النشرة:', error);
      alert('حدث خطأ أثناء الحفظ. حاول مجدداً.');
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = () => {
    if (result) {
      setEditedContent(result);
      setIsEditing(true);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditedContent('');
  };

  const wordCount = result ? result.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = result ? result.length : 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2d5570, #4A7C9E)' }}>
            <Radio size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1e293b]">غرفة الأخبار الذكية</h2>
            <p className="text-xs text-[#64748b]">اجمع الأخبار وصُغ نشرتك أو موجزك الاحترافي في ثوانٍ</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#64748b] bg-[#f1f5f9] px-3 py-1.5 rounded-lg border border-[#e2e8f0]">
          <Newspaper size={13} />
          <span>{totalFetched} خبر متاح</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">

        {/* ── LEFT: News List ── */}
        <div className="xl:col-span-7 flex flex-col gap-3">

          {/* Search + Filter Row */}
          <div className="flex gap-2">
            <div className="flex items-center gap-2 bg-white px-3 py-2.5 rounded-xl border border-[#e2e8f0] flex-1 focus-within:border-[#4A7C9E] focus-within:shadow-sm transition-all">
              <Search size={15} className="text-[#94a3b8] shrink-0" />
              <input
                type="text"
                placeholder="ابحث في عناوين الأخبار..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-sm text-[#1e293b] placeholder-[#94a3b8]"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="text-[#94a3b8] hover:text-[#64748b]">
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowManualInput(true)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#4A7C9E] bg-[#4A7C9E] text-white text-sm font-medium transition-all hover:bg-[#2d5570] hover:border-[#2d5570] shadow-sm"
              title="إضافة خبر يدوياً"
            >
              <Plus size={15} />
              <span className="hidden sm:inline">إضافة خبر</span>
            </button>
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${showFilters || selectedCategory ? 'border-[#4A7C9E] bg-[#4A7C9E]/10 text-[#2d5570]' : 'border-[#e2e8f0] bg-white text-[#64748b] hover:border-[#4A7C9E]'}`}
            >
              <Filter size={15} />
              <span className="hidden sm:inline">فلتر</span>
              {selectedCategory && <span className="w-2 h-2 rounded-full bg-[#FF9F4A] shrink-0" />}
            </button>
            <button
              onClick={fetchNews}
              disabled={isLoadingNews}
              className="p-2.5 bg-white border border-[#e2e8f0] rounded-xl hover:border-[#4A7C9E] hover:text-[#2d5570] transition-all text-[#64748b] disabled:opacity-40"
              title="تحديث الأخبار"
            >
              <RefreshCw size={15} className={isLoadingNews ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Category Filter */}
          {showFilters && categories.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${!selectedCategory ? 'bg-[#2d5570] text-white border-[#2d5570]' : 'bg-white border-[#e2e8f0] text-[#64748b] hover:border-[#4A7C9E]'}`}
              >
                الكل
              </button>
              {categories.map(cat => {
                const colors = getCategoryColor(cat);
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat === selectedCategory ? '' : cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${isActive ? `${colors.bg} ${colors.text} ${colors.border}` : 'bg-white border-[#e2e8f0] text-[#64748b] hover:border-[#4A7C9E]'}`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          )}

          {/* Selection Controls */}
          {filteredItems.length > 0 && (
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-3">
                <button
                  onClick={selectAll}
                  className="flex items-center gap-1.5 text-xs font-medium text-[#4A7C9E] hover:text-[#2d5570] transition-colors"
                >
                  <CheckSquare size={14} /> تحديد الكل
                </button>
                {selectedCount > 0 && (
                  <button
                    onClick={deselectAll}
                    className="flex items-center gap-1.5 text-xs font-medium text-[#94a3b8] hover:text-red-500 transition-colors"
                  >
                    <Square size={14} /> إلغاء الكل
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selectedCount > 0 && (
                  <span className="text-xs font-bold text-white px-2.5 py-1 rounded-lg" style={{ background: '#FF9F4A' }}>
                    {selectedCount} محدد
                  </span>
                )}
                <span className="text-xs text-[#94a3b8]">{filteredItems.length} خبر</span>
              </div>
            </div>
          )}

          {/* News Cards */}
          <div className="space-y-2 max-h-[520px] overflow-y-auto custom-scrollbar pr-1">
            {isLoadingNews ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-[#94a3b8]">
                <Loader2 size={28} className="animate-spin text-[#4A7C9E]" />
                <span className="text-sm">جاري تحميل الأخبار...</span>
              </div>
            ) : dbError ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-red-500">
                <Newspaper size={36} className="opacity-40" />
                <p className="text-sm font-medium">{dbError}</p>
                <button
                  onClick={fetchNews}
                  className="text-xs text-[#4A7C9E] hover:underline flex items-center gap-1"
                >
                  <RefreshCw size={12} /> إعادة المحاولة
                </button>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-[#94a3b8]">
                <Newspaper size={40} className="opacity-30" />
                <p className="text-sm">لا توجد أخبار مطابقة</p>
              </div>
            ) : filteredItems.map(item => (
              <div
                key={item.id}
                onClick={() => toggleSelect(item.id)}
                className={`group relative rounded-xl border cursor-pointer transition-all duration-150 overflow-hidden ${
                  item.selected
                    ? 'border-[#4A7C9E] bg-[#4A7C9E]/5 shadow-sm'
                    : 'border-[#e2e8f0] bg-white hover:border-[#4A7C9E]/50 hover:shadow-sm'
                }`}
              >
                {/* Selection indicator bar */}
                {item.selected && (
                  <div className="absolute right-0 top-0 bottom-0 w-1 rounded-r-xl" style={{ background: '#4A7C9E' }} />
                )}

                <div className="flex gap-3 p-3">
                  {/* Checkbox */}
                  <div className="shrink-0 mt-0.5">
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      item.selected ? 'border-[#4A7C9E] bg-[#4A7C9E]' : 'border-[#cbd5e1] group-hover:border-[#4A7C9E]'
                    }`}>
                      {item.selected && <Check size={11} className="text-white" />}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-[#1e293b] leading-snug mb-1.5 line-clamp-2">
                      {item.title}
                    </h4>
                    <p className="text-xs text-[#64748b] line-clamp-2 leading-relaxed mb-2">
                      {item.content}
                    </p>

                    {/* Meta row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.id.startsWith('manual-') && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-gradient-to-r from-purple-500 to-purple-600 text-white border border-purple-400 shadow-sm">
                          <Edit3 size={9} />
                          يدوي
                        </span>
                      )}
                      {item.category_name && (() => {
                        const colors = getCategoryColor(item.category_name!);
                        return (
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${colors.bg} ${colors.text} ${colors.border}`}>
                            <Tag size={9} />
                            {item.category_name}
                          </span>
                        );
                      })()}
                      {item.media_unit_name && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-[#4A7C9E] bg-[#4A7C9E]/10 px-2 py-0.5 rounded-md border border-[#4A7C9E]/20">
                          <Building2 size={9} />
                          {item.media_unit_name}
                        </span>
                      )}
                      {item.source_name && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-[#64748b] bg-[#f1f5f9] px-2 py-0.5 rounded-md border border-[#e2e8f0]">
                          <BookOpen size={9} />
                          {item.source_name}
                        </span>
                      )}
                      {item.published_at && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-[#94a3b8]">
                          <Calendar size={9} />
                          {formatDate(item.published_at)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={e => { e.stopPropagation(); removeNewsItem(item.id); }}
                    className="shrink-0 opacity-0 group-hover:opacity-100 text-[#94a3b8] hover:text-red-500 transition-all p-1 rounded-lg hover:bg-red-50 self-start"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: Controls + Result ── */}
        <div className="xl:col-span-5 flex flex-col gap-3">

          {/* Controls Panel */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 flex flex-col gap-3">
            <p className="text-xs font-bold text-[#64748b] uppercase tracking-wider">إعدادات التوليد</p>

            {/* Time of Day */}
            <div className="flex gap-1.5 p-1 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
              <button
                onClick={() => setTimeOfDay('MORNING')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                  timeOfDay === 'MORNING'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-[#64748b] hover:text-amber-600'
                }`}
              >
                <Sun size={13} /> صباحي
              </button>
              <button
                onClick={() => setTimeOfDay('EVENING')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                  timeOfDay === 'EVENING'
                    ? 'bg-[#3d6a8a] text-white shadow-sm'
                    : 'text-[#64748b] hover:text-[#3d6a8a]'
                }`}
              >
                <Moon size={13} /> مسائي
              </button>
            </div>

            {/* Mode */}
            <div className="flex gap-1.5 p-1 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
              <button
                onClick={() => setActiveMode('SUMMARY')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeMode === 'SUMMARY'
                    ? 'text-white shadow-sm'
                    : 'text-[#64748b] hover:text-[#2d5570]'
                }`}
                style={activeMode === 'SUMMARY' ? { background: '#2d5570' } : {}}
              >
                <LayoutList size={13} /> موجز
              </button>
              <button
                onClick={() => setActiveMode('BULLETIN')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeMode === 'BULLETIN'
                    ? 'text-white shadow-sm'
                    : 'text-[#64748b] hover:text-[#2d5570]'
                }`}
                style={activeMode === 'BULLETIN' ? { background: '#2d5570' } : {}}
              >
                <FileText size={13} /> نشرة
              </button>
            </div>

            {/* Count Presets */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-xs text-[#64748b] font-bold">
                <Hash size={12} />
                <span>تحديد سريع للأخبار</span>
              </div>
              <div className="flex gap-1.5">
                {COUNT_PRESETS.map(n => (
                  <button
                    key={n}
                    onClick={() => { setCountPreset(n); selectCount(n); }}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${
                      countPreset === n
                        ? 'text-white border-transparent shadow-sm'
                        : 'bg-[#f8fafc] border-[#e2e8f0] text-[#64748b] hover:border-[#4A7C9E] hover:text-[#2d5570]'
                    }`}
                    style={countPreset === n ? { background: '#FF9F4A', borderColor: '#FF9F4A' } : {}}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setCountPreset('custom')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${
                    countPreset === 'custom'
                      ? 'text-white border-transparent shadow-sm'
                      : 'bg-[#f8fafc] border-[#e2e8f0] text-[#64748b] hover:border-[#4A7C9E]'
                  }`}
                  style={countPreset === 'custom' ? { background: '#FF9F4A', borderColor: '#FF9F4A' } : {}}
                >
                  يدوي
                </button>
              </div>
              {countPreset === 'custom' && (
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={1}
                    max={newsItems.length}
                    placeholder="العدد"
                    value={customCount}
                    onChange={e => setCustomCount(e.target.value)}
                    className="flex-1 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#4A7C9E] text-right text-[#1e293b]"
                  />
                  <button
                    onClick={() => selectCount(parseInt(customCount) || 0)}
                    className="px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors"
                    style={{ background: '#FF9F4A' }}
                  >
                    تطبيق
                  </button>
                </div>
              )}
            </div>

            {/* Category Breakdown */}
            {selectedCount > 0 && Object.keys(categoryBreakdown).length > 0 && (
              <div className="bg-[#f8fafc] rounded-xl border border-[#e2e8f0] p-3">
                <p className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-wider mb-2">التصنيفات المختارة</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(categoryBreakdown).map(([cat, count]) => {
                    const colors = getCategoryColor(cat);
                    return (
                      <span key={cat} className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${colors.bg} ${colors.text} ${colors.border}`}>
                        {cat} <span className="font-extrabold">({count})</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isLoading || selectedCount === 0}
              className="w-full py-3 flex items-center justify-center gap-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-[0.99]"
              style={{ background: selectedCount === 0 ? '#94a3b8' : 'linear-gradient(135deg, #2d5570, #4A7C9E)' }}
            >
              {isLoading ? (
                <><Loader2 size={16} className="animate-spin" /><span>جاري التوليد...</span></>
              ) : (
                <><Wand2 size={16} /><span>إنشاء {activeMode === 'BULLETIN' ? 'النشرة' : 'الموجز'}{selectedCount > 0 ? ` (${selectedCount} خبر)` : ''}</span></>
              )}
            </button>
          </div>

          {/* Result Panel */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] flex flex-col flex-1 min-h-[280px] overflow-hidden" style={{ borderRightWidth: '3px', borderRightColor: '#4A7C9E' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#e2e8f0]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#f1f5f9' }}>
                  <Radio size={14} style={{ color: '#4A7C9E' }} />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1e293b]">المنتج النهائي</p>
                  <p className="text-[10px] text-[#94a3b8]">
                    {activeMode === 'BULLETIN' ? 'نشرة' : 'موجز'} {timeOfDay === 'MORNING' ? 'صباحية' : 'مسائية'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {result && (
                  <>
                    <span className="text-[10px] text-[#94a3b8]">{wordCount} كلمة · {charCount} حرف</span>
                    {!isEditing ? (
                      <button
                        onClick={startEditing}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all"
                        style={{ background: '#f8fafc', color: '#64748b', borderColor: '#e2e8f0' }}
                        title="تعديل المحتوى"
                      >
                        <Edit3 size={12} /> تعديل
                      </button>
                    ) : (
                      <button
                        onClick={cancelEditing}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all text-red-500 border-red-200 bg-red-50 hover:bg-red-100"
                      >
                        <X size={12} /> إلغاء التعديل
                      </button>
                    )}
                    <button
                      onClick={handleSaveBulletin}
                      disabled={isSaving || !mediaUnitId}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all disabled:opacity-40"
                      style={saveSuccess
                        ? { background: '#dcfce7', color: '#16a34a', borderColor: '#86efac' }
                        : { background: '#eff6ff', color: '#2563eb', borderColor: '#bfdbfe' }
                      }
                      title="حفظ في قاعدة البيانات"
                    >
                      {isSaving ? <Loader2 size={12} className="animate-spin" /> : saveSuccess ? <><Check size={12} /> تم الحفظ</> : <><Save size={12} /> حفظ</>}
                    </button>
                    <button
                      onClick={copyToClipboard}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all"
                      style={copied
                        ? { background: '#dcfce7', color: '#16a34a', borderColor: '#86efac' }
                        : { background: '#f8fafc', color: '#64748b', borderColor: '#e2e8f0' }
                      }
                    >
                      {copied ? <><Check size={12} /> تم النسخ</> : <><Copy size={12} /> نسخ</>}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 text-sm leading-loose font-arabic bg-gradient-to-b from-white to-[#f8fafc]">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-[#94a3b8]">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 rounded-full border-4 border-[#e2e8f0]" />
                    <div className="absolute inset-0 rounded-full border-4 border-t-[#4A7C9E] animate-spin" />
                  </div>
                  <p className="text-xs">جاري التحرير الذكي...</p>
                </div>
              ) : result && isEditing ? (
                <textarea
                  value={editedContent}
                  onChange={e => setEditedContent(e.target.value)}
                  className="w-full h-full min-h-[200px] bg-white border border-[#e2e8f0] rounded-xl p-4 text-sm leading-loose text-[#1e293b] outline-none focus:border-[#4A7C9E] resize-none font-arabic"
                  dir="rtl"
                  placeholder="عدّل المحتوى هنا..."
                />
              ) : result ? (
                <div className="max-w-none">
                  <style>{`
                    .news-content ol {
                      list-style: decimal;
                      margin-right: 2rem;
                      margin-bottom: 1.5rem;
                      counter-reset: item;
                    }
                    .news-content ol li {
                      padding-right: 0.5rem;
                      margin-bottom: 1rem;
                      line-height: 1.8;
                      position: relative;
                    }
                    .news-content ol li::marker {
                      color: #4A7C9E;
                      font-weight: 800;
                      font-size: 1.1em;
                    }
                    .news-content strong {
                      font-weight: 800;
                      color: #1e293b;
                      font-size: 1.05em;
                      letter-spacing: -0.01em;
                    }
                    .news-content p {
                      margin-bottom: 1rem;
                      line-height: 1.9;
                      color: #1e293b;
                      font-size: 15px;
                    }
                    .news-content h1, .news-content h2, .news-content h3 {
                      color: #1e293b;
                      font-weight: 800;
                      margin-top: 1.5rem;
                      margin-bottom: 1rem;
                    }
                  `}</style>
                  <div className="news-content">
                    {parseNumberedList(result)}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-center text-[#94a3b8]">
                  <Sparkles size={36} className="opacity-30" />
                  <p className="text-xs max-w-[180px] leading-relaxed">حدد الأخبار من القائمة ثم اضغط إنشاء</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Manual News Input Modal */}
      {showManualInput && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowManualInput(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0] bg-gradient-to-r from-[#2d5570] to-[#4A7C9E]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Edit3 size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">إضافة خبر يدوياً</h3>
                  <p className="text-xs text-white/80">أدخل عنوان ومحتوى الخبر لإرساله إلى AI</p>
                </div>
              </div>
              <button
                onClick={() => setShowManualInput(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-180px)]">
              {/* Title Input */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-[#1e293b]">
                  <Newspaper size={14} className="text-[#4A7C9E]" />
                  عنوان الخبر
                </label>
                <input
                  type="text"
                  value={manualTitle}
                  onChange={e => setManualTitle(e.target.value)}
                  placeholder="أدخل عنوان الخبر..."
                  className="w-full px-4 py-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-sm text-[#1e293b] placeholder-[#94a3b8] outline-none focus:border-[#4A7C9E] focus:bg-white transition-all"
                  autoFocus
                />
              </div>

              {/* Content Input */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-[#1e293b]">
                  <FileText size={14} className="text-[#4A7C9E]" />
                  محتوى الخبر
                </label>
                <textarea
                  value={manualContent}
                  onChange={e => setManualContent(e.target.value)}
                  placeholder="أدخل تفاصيل الخبر..."
                  rows={8}
                  className="w-full px-4 py-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-sm text-[#1e293b] placeholder-[#94a3b8] outline-none focus:border-[#4A7C9E] focus:bg-white transition-all resize-none leading-relaxed"
                />
                <div className="flex items-center justify-between text-xs text-[#94a3b8]">
                  <span>{manualContent.length} حرف</span>
                  <span>{manualContent.trim().split(/\s+/).filter(Boolean).length} كلمة</span>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
                <Sparkles size={18} className="text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900 leading-relaxed">
                  <p className="font-bold mb-1">💡 نصيحة:</p>
                  <p>سيتم إضافة هذا الخبر إلى قائمة الأخبار وتحديده تلقائياً. يمكنك بعدها دمجه مع أخبار أخرى أو إرساله مباشرة إلى AI لتحريره.</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc]">
              <button
                onClick={() => {
                  setShowManualInput(false);
                  setManualTitle('');
                  setManualContent('');
                }}
                className="px-4 py-2.5 rounded-xl border border-[#e2e8f0] bg-white text-[#64748b] text-sm font-medium hover:border-[#cbd5e1] hover:text-[#475569] transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={addManualNews}
                disabled={!manualTitle.trim() || !manualContent.trim()}
                className="px-6 py-2.5 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-[0.98] flex items-center gap-2"
                style={{ background: 'linear-gradient(135deg, #2d5570, #4A7C9E)' }}
              >
                <Plus size={16} />
                إضافة الخبر
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
