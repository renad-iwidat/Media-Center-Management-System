import React, { useState, useEffect } from 'react';
import {
  Send, Loader2, Copy, Check, Type, AlignLeft, ShieldCheck,
  PenLine, Database, Search, X, ChevronDown, Plus,
  Newspaper, RefreshCw
} from 'lucide-react';
import { generateAIContent, summarizeContent, rewriteContent, SummarizeStyle, RewriteStyle } from '../../lib/ai-client';
import { parseNumberedList } from '../../lib/markdown-parser';

const API_URL = '/api';

type EditMode   = 'REWRITE' | 'SUMMARIZE' | 'GRAMMAR';
type InputMode  = 'MANUAL'  | 'DATABASE';

interface Article {
  id: number;
  title: string;
  content: string;
  category_name?: string;
  media_unit_name?: string;
  published_at?: string;
}

// ─── style maps ──────────────────────────────────────────────
const REWRITE_STYLES: { value: RewriteStyle; label: string }[] = [
  { value: 'radio_broadcast', label: 'بث إذاعي'      },
  { value: 'investigative',   label: 'صحفي استقصائي' },
  { value: 'social_media',    label: 'سوشل ميديا'    },
  { value: 'formal',          label: 'رسمي مؤسسي'    },
  { value: 'casual',          label: 'عامي/كاجوال'   },
];

const SUMMARIZE_STYLES: { value: SummarizeStyle; label: string }[] = [
  { value: 'bullet_points',   label: 'نقاط'          },
  { value: 'short_paragraph', label: 'فقرة قصيرة'    },
  { value: 'headlines',       label: 'موجز العناوين' },
];

const GRAMMAR_STYLES = [
  { value: 'full',   label: 'تدقيق كامل وشرح' },
  { value: 'silent', label: 'تصحيح صامت'       },
];

export default function TextEditing({ mediaUnitId }: { mediaUnitId?: number | null }) {
  // ── modes ──
  const [activeMode,  setActiveMode]  = useState<EditMode>('REWRITE');
  const [inputMode,   setInputMode]   = useState<InputMode>('MANUAL');

  // ── manual input ──
  const [manualText, setManualText] = useState('');

  // ── database mode ──
  const [articles,         setArticles]         = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [selectedArticles, setSelectedArticles] = useState<Article[]>([]);
  const [isLoadingDB,      setIsLoadingDB]      = useState(false);
  const [dbError,          setDbError]          = useState<string | null>(null);
  const [searchQuery,      setSearchQuery]      = useState('');
  const [showDropdown,     setShowDropdown]     = useState(false);

  // ── style selectors ──
  const [rewriteStyle,   setRewriteStyle]   = useState<RewriteStyle>('radio_broadcast');
  const [summarizeStyle, setSummarizeStyle] = useState<SummarizeStyle>('bullet_points');
  const [grammarStyle,   setGrammarStyle]   = useState('full');

  // ── output ──
  const [result,    setResult]    = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied,    setCopied]    = useState(false);

  // ── fetch articles ──
  const fetchArticles = async () => {
    setIsLoadingDB(true);
    setDbError(null);
    try {
      const muParam = mediaUnitId ? `&media_unit_id=${mediaUnitId}` : '';
      const res = await fetch(`${API_URL}/flow/published?limit=200${muParam}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const items: Article[] = (data.data || data.items || []).map((item: any) => ({
        id:              item.id,
        title:           item.title || 'بدون عنوان',
        content:         item.content || item.summary || '',
        category_name:   item.category_name || '',
        media_unit_name: item.media_unit_name || '',
        published_at:    item.published_at || item.created_at || '',
      }));
      setArticles(items);
    } catch {
      try {
        const muParam = mediaUnitId ? `&media_unit_id=${mediaUnitId}` : '';
        const res2 = await fetch(`${API_URL}/data/articles?limit=200${muParam}`);
        if (!res2.ok) throw new Error();
        const data2 = await res2.json();
        const items: Article[] = (data2.data || []).map((item: any) => ({
          id:              item.id,
          title:           item.title || 'بدون عنوان',
          content:         item.content || item.summary || '',
          category_name:   item.category_name || '',
          media_unit_name: item.media_unit_name || '',
          published_at:    item.published_at || item.created_at || '',
        }));
        setArticles(items);
      } catch {
        setDbError('تعذّر جلب الأخبار');
      }
    } finally {
      setIsLoadingDB(false);
    }
  };

  // جلب عند الدخول لوضع DATABASE
  useEffect(() => {
    if (inputMode === 'DATABASE' && articles.length === 0) fetchArticles();
  }, [inputMode]);

  // إعادة الجلب عند تغيير الوحدة الإعلامية
  useEffect(() => {
    if (inputMode === 'DATABASE') {
      setArticles([]);
      setSelectedArticles([]);
      setResult(null);
      fetchArticles();
    }
  }, [mediaUnitId]);

  useEffect(() => {
    if (!searchQuery.trim()) { setFilteredArticles(articles); return; }
    const q = searchQuery.toLowerCase();
    setFilteredArticles(articles.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.category_name?.toLowerCase().includes(q) ||
      a.media_unit_name?.toLowerCase().includes(q)
    ));
  }, [searchQuery, articles]);

  // ── helpers ──
  const toggleArticle = (article: Article) => {
    setSelectedArticles(prev =>
      prev.find(a => a.id === article.id)
        ? prev.filter(a => a.id !== article.id)
        : [...prev, article]
    );
  };

  const isSelected = (id: number) => selectedArticles.some(a => a.id === id);

  const getSourceText = (): string => {
    if (inputMode === 'MANUAL') return manualText.trim();
    if (selectedArticles.length === 0) return '';
    if (selectedArticles.length === 1)
      return `العنوان: ${selectedArticles[0].title}\n\n${selectedArticles[0].content}`;
    // متعدد — نجمعهم مرقّمين
    return selectedArticles
      .map((a, i) => `[${i + 1}] ${a.title}\n${a.content}`)
      .join('\n\n---\n\n');
  };

  const hasInput = inputMode === 'MANUAL'
    ? manualText.trim().length > 0
    : selectedArticles.length > 0;

  // ── process ──
  const handleProcess = async () => {
    const sourceText = getSourceText();
    if (!sourceText) return;
    setIsLoading(true);
    setResult(null);

    try {
      let res = '';

      if (activeMode === 'REWRITE') {
        res = await rewriteContent(sourceText, rewriteStyle);

      } else if (activeMode === 'SUMMARIZE') {
        res = await summarizeContent(sourceText, summarizeStyle);

      } else {
        // GRAMMAR — endpoint مخصص
        const system = 'أنت خبير في اللغة العربية وقواعدها. يجب أن تكون إجابتك في حدود 1000 رمز (token) فقط، كن مختصراً ودقيقاً.';
        const prompt = grammarStyle === 'silent'
          ? `صحّح النص التالي لغوياً بصمت (أعد كتابته مصحَّحاً فقط بدون شرح). الرد في حدود 1000 توكن:\n\n${sourceText}`
          : `دقّق النص التالي لغوياً واشرح الأخطاء مع اقتراح التصحيحات. الرد في حدود 1000 توكن:\n\n${sourceText}`;
        res = await generateAIContent(prompt, system, { max_tokens: 1200 });
      }

      setResult(res);
    } catch {
      setResult('حدث خطأ. يرجى المحاولة لاحقاً.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (d: string) => {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('ar', { day: 'numeric', month: 'short' }); }
    catch { return ''; }
  };

  // ── render ──
  return (
    <div className="space-y-4 text-right">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold">محرر التحرير الصحفي</h2>
        <p className="text-gray-400 text-xs">إعادة صياغة، تلخيص، وتدقيق — على نص يدوي أو أخبار من قاعدة البيانات.</p>
      </div>

      {/* Edit Mode Tabs */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-xl w-fit">
        {[
          { id: 'REWRITE',   label: 'إعادة صياغة', icon: Type        },
          { id: 'SUMMARIZE', label: 'تلخيص',        icon: AlignLeft   },
          { id: 'GRAMMAR',   label: 'تدقيق لغوي',   icon: ShieldCheck },
        ].map((mode) => (
          <button
            key={mode.id}
            onClick={() => { setActiveMode(mode.id as EditMode); setResult(null); }}
            className={`px-5 py-2 rounded-lg text-xs font-arabic transition-all flex items-center gap-1.5 ${
              activeMode === mode.id
                ? 'bg-[#2563eb] text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <mode.icon size={14} />
            {mode.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ══ Input Panel ══ */}
        <div className="glass-panel p-4 space-y-3">

          {/* Input Mode Toggle */}
          <div className="flex gap-2 p-1 bg-white/5 rounded-xl w-full">
            {[
              { id: 'MANUAL',   label: 'كتابة يدوية',       icon: PenLine  },
              { id: 'DATABASE', label: 'من قاعدة البيانات',  icon: Database },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  setInputMode(m.id as InputMode);
                  setResult(null);
                  setSelectedArticles([]);
                  setManualText('');
                }}
                className={`flex-1 px-3 py-2 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 ${
                  inputMode === m.id
                    ? 'bg-[#2563eb] text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <m.icon size={13} />
                {m.label}
              </button>
            ))}
          </div>

          {/* ── MANUAL ── */}
          {inputMode === 'MANUAL' && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400">النص الأصلي</label>
              <textarea
                value={manualText}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setManualText(e.target.value)}
                rows={10}
                placeholder="ضع نصك هنا للمعالجة..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#2563eb]/20 outline-none transition-all placeholder:text-gray-600 resize-none leading-relaxed text-sm"
              />
            </div>
          )}

          {/* ── DATABASE ── */}
          {inputMode === 'DATABASE' && (
            <div className="space-y-3">

              {/* Search dropdown */}
              <div className="relative">
                <div
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 flex items-center gap-2 cursor-pointer hover:border-[#2563eb]/40 transition-all"
                  onClick={() => { setShowDropdown(!showDropdown); if (!showDropdown && articles.length === 0) fetchArticles(); }}
                >
                  <ChevronDown size={14} className={`text-gray-400 transition-transform flex-shrink-0 ${showDropdown ? 'rotate-180' : ''}`} />
                  <span className="text-sm text-gray-500 flex-1 text-right">
                    {selectedArticles.length > 0
                      ? `${selectedArticles.length} خبر محدد`
                      : 'اختر خبراً أو أكثر...'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); fetchArticles(); }}
                      className="p-1 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white transition-colors"
                      title="تحديث"
                    >
                      <RefreshCw size={12} className={isLoadingDB ? 'animate-spin' : ''} />
                    </button>
                    <Database size={14} className="text-gray-500 flex-shrink-0" />
                  </div>
                </div>

                {showDropdown && (
                  <div className="absolute top-full mt-1 right-0 left-0 z-50 bg-[#0f1a2e] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                    {/* Search */}
                    <div className="p-2 border-b border-white/5">
                      <div className="relative">
                        <Search size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="ابحث في الأخبار..."
                          className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pr-8 pl-3 text-xs outline-none focus:border-[#2563eb]/40 text-right"
                          autoFocus
                        />
                      </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                      {isLoadingDB ? (
                        <div className="flex items-center justify-center gap-2 py-6 text-gray-400 text-xs">
                          <Loader2 size={14} className="animate-spin" />
                          <span>جاري التحميل...</span>
                        </div>
                      ) : dbError ? (
                        <div className="py-6 text-center text-xs text-red-400 px-4">{dbError}</div>
                      ) : filteredArticles.length === 0 ? (
                        <div className="py-6 text-center text-xs text-gray-500">لا توجد نتائج</div>
                      ) : filteredArticles.map((article) => (
                        <button
                          key={article.id}
                          onClick={() => toggleArticle(article)}
                          className={`w-full text-right px-4 py-3 transition-colors border-b border-white/5 last:border-0 flex items-start gap-3 ${
                            isSelected(article.id) ? 'bg-[#2563eb]/10' : 'hover:bg-white/5'
                          }`}
                        >
                          {/* checkbox */}
                          <div className={`w-4 h-4 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                            isSelected(article.id) ? 'bg-[#2563eb] border-[#2563eb]' : 'border-gray-600'
                          }`}>
                            {isSelected(article.id) && <Check size={10} className="text-white" />}
                          </div>
                          <div className="flex flex-col gap-1 flex-1 min-w-0">
                            <span className="text-xs font-bold text-white leading-snug line-clamp-2">{article.title}</span>
                            <div className="flex items-center gap-2 flex-wrap">
                              {article.category_name && (
                                <span className="text-[10px] text-[#2563eb]">{article.category_name}</span>
                              )}
                              {article.media_unit_name && (
                                <span className="text-[10px] text-gray-500">{article.media_unit_name}</span>
                              )}
                              {article.published_at && (
                                <span className="text-[10px] text-gray-600">{formatDate(article.published_at)}</span>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Footer */}
                    {selectedArticles.length > 0 && (
                      <div className="p-2 border-t border-white/5 flex items-center justify-between">
                        <button
                          onClick={() => setShowDropdown(false)}
                          className="px-3 py-1.5 bg-[#2563eb] text-white rounded-lg text-xs hover:bg-[#2563eb]/80 transition-colors"
                        >
                          تأكيد ({selectedArticles.length})
                        </button>
                        <button
                          onClick={() => setSelectedArticles([])}
                          className="text-xs text-gray-500 hover:text-red-400 transition-colors"
                        >
                          إلغاء التحديد
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Selected articles chips */}
              {selectedArticles.length > 0 && (
                <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                  {selectedArticles.map((article, idx) => (
                    <div
                      key={article.id}
                      className="flex items-start gap-2 bg-[#2563eb]/10 border border-[#2563eb]/20 rounded-xl p-2.5"
                    >
                      <button
                        onClick={() => toggleArticle(article)}
                        className="p-0.5 hover:bg-white/10 rounded text-gray-400 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5"
                      >
                        <X size={12} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] text-[#2563eb] font-bold flex-shrink-0">[{idx + 1}]</span>
                          <span className="text-xs font-bold text-white truncate">{article.title}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 line-clamp-1">{article.content?.substring(0, 100)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedArticles.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 gap-2 opacity-20">
                  <Newspaper size={28} />
                  <p className="text-xs">لم تختر أي خبر بعد</p>
                </div>
              )}
            </div>
          )}

          {/* Style selector + Process button */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400">
                {activeMode === 'REWRITE' ? 'الأسلوب' : activeMode === 'SUMMARIZE' ? 'نوع التلخيص' : 'خيار التدقيق'}
              </label>
              <select
                className="w-full text-sm"
                value={
                  activeMode === 'REWRITE'   ? rewriteStyle :
                  activeMode === 'SUMMARIZE' ? summarizeStyle :
                  grammarStyle
                }
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  if (activeMode === 'REWRITE')   setRewriteStyle(e.target.value as RewriteStyle);
                  if (activeMode === 'SUMMARIZE') setSummarizeStyle(e.target.value as SummarizeStyle);
                  if (activeMode === 'GRAMMAR')   setGrammarStyle(e.target.value);
                }}
              >
                {activeMode === 'REWRITE'   && REWRITE_STYLES.map(s   => <option key={s.value} value={s.value}>{s.label}</option>)}
                {activeMode === 'SUMMARIZE' && SUMMARIZE_STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                {activeMode === 'GRAMMAR'   && GRAMMAR_STYLES.map(s   => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleProcess}
                disabled={isLoading || !hasInput}
                className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
              >
                {isLoading
                  ? <Loader2 className="animate-spin" size={16} />
                  : <><Send size={14} /><span>معالجة</span></>
                }
              </button>
            </div>
          </div>

          {/* Multi-article note */}
          {inputMode === 'DATABASE' && selectedArticles.length > 1 && (
            <p className="text-[10px] text-gray-500 text-right flex items-center gap-1">
              <Plus size={10} />
              سيتم معالجة {selectedArticles.length} أخبار معاً كنص موحّد
            </p>
          )}
        </div>

        {/* ══ Output Panel ══ */}
        <div className="glass-panel p-4 bg-[#0b1224] border-dashed border-white/10 flex flex-col min-h-[300px]">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#2563eb]/10 rounded-lg flex items-center justify-center text-[#2563eb]">
                {activeMode === 'REWRITE'   && <Type size={14} />}
                {activeMode === 'SUMMARIZE' && <AlignLeft size={14} />}
                {activeMode === 'GRAMMAR'   && <ShieldCheck size={14} />}
              </div>
              <div>
                <h3 className="text-sm font-bold">النص المعالج</h3>
                {inputMode === 'DATABASE' && selectedArticles.length > 0 && (
                  <span className="text-[10px] text-gray-500">
                    {selectedArticles.length === 1
                      ? selectedArticles[0].title.substring(0, 40) + (selectedArticles[0].title.length > 40 ? '...' : '')
                      : `${selectedArticles.length} أخبار`}
                  </span>
                )}
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

          <div className="flex-1 overflow-y-auto custom-scrollbar leading-relaxed text-gray-300 font-arabic text-sm p-2">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-2 border-[#2563eb]/20 border-t-[#2563eb] rounded-full animate-spin" />
                <p className="text-gray-500 text-xs">جاري المعالجة...</p>
              </div>
            ) : result ? (
              <div className="space-y-1">{parseNumberedList(result)}</div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-10 gap-3">
                {activeMode === 'REWRITE'   && <Type size={36} />}
                {activeMode === 'SUMMARIZE' && <AlignLeft size={36} />}
                {activeMode === 'GRAMMAR'   && <ShieldCheck size={36} />}
                <p className="text-xs">
                  {inputMode === 'MANUAL'
                    ? 'اكتب نصاً ثم اضغط معالجة'
                    : 'اختر خبراً أو أكثر ثم اضغط معالجة'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
