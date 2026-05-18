import React, { useState, useEffect, useCallback } from 'react';
import {
  Share2, Loader2, Copy, Check, Hash, Repeat,
  Newspaper, Sparkles, Database, PenLine, Search, ChevronDown, X
} from 'lucide-react';
import { generateAIContent } from '../../lib/ai-client';
import { parseNumberedList } from '../../lib/markdown-parser';
import { getAuthToken } from '../../services/api';

// دعم runtime environment variables من Docker
const getEnvVar = (key: keyof ImportMetaEnv): string | undefined => {
  if (typeof window !== 'undefined' && window.ENV && window.ENV[key]) {
    return window.ENV[key];
  }
  return import.meta.env[key];
};

// استخدام VITE_API_URL من environment variables
const API_URL = getEnvVar('VITE_API_URL')
  ? `${getEnvVar('VITE_API_URL')}/api`
  : '/api';

// Helper function to get headers with Authorization
function getHeaders(): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

type SocialTab = 'CAPTION' | 'HASHTAGS' | 'TRANSFORM';
type InputMode = 'MANUAL' | 'DATABASE';

interface PublishedArticle {
  id: number;
  title: string;
  content: string;
  category_name: string;
  media_unit_name: string;
  media_unit_id?: number;
  published_at: string;
}

/** عرض الهاشتاجات كـ chips بدون تمرير markdown parser */
function HashtagsDisplay({ text }: { text: string }) {
  // استخرج كل الهاشتاجات من النص
  const hashtagRegex = /#[\u0600-\u06FFa-zA-Z0-9_]+/g;
  const hashtags = text.match(hashtagRegex) ?? [];

  // النص المتبقي بعد إزالة الهاشتاجات (قد يحتوي على شرح أو مقدمة)
  const plainText = text.replace(hashtagRegex, '').replace(/\n+/g, ' ').trim();

  return (
    <div className="space-y-3">
      {plainText && (
        <p className="text-xs text-gray-300 leading-relaxed">{plainText}</p>
      )}
      {hashtags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {hashtags.map((tag: string, i: number) => (
            <span
              key={i}
              className="px-3 py-1.5 bg-[#FF9F43]/15 border border-[#FF9F43]/30 text-[#FF9F43] rounded-full text-xs font-medium hover:bg-[#FF9F43]/25 transition-colors cursor-default"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      {hashtags.length === 0 && (
        <p className="text-sm text-white whitespace-pre-wrap">{text}</p>
      )}
    </div>
  );
}

export default function SocialMedia({ mediaUnitId }: { mediaUnitId: number | null }) {
  const [activeTab, setActiveTab] = useState<SocialTab>('TRANSFORM');
  const [inputMode, setInputMode] = useState<InputMode>('MANUAL');
  const [content, setContent] = useState('');
  const [platform, setPlatform] = useState('Instagram');
  const [tone, setTone] = useState('جذاب ومبدع');
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Database mode state
  const [articles, setArticles] = useState<PublishedArticle[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<PublishedArticle[]>([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<PublishedArticle | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // ── prefill from قسم النشر ──
  useEffect(() => {
    const prefill = localStorage.getItem('ai_prefill_content');
    if (prefill) {
      try {
        const { title, content: prefillContent } = JSON.parse(prefill);
        const text = title ? `${title}\n\n${prefillContent}` : prefillContent;
        if (text) {
          setContent(text);
          setInputMode('MANUAL');
        }
      } catch {}
      localStorage.removeItem('ai_prefill_content');
    }
  }, []);

  // تعريف fetchArticles قبل استخدامها في useEffect
  const fetchArticles = useCallback(async () => {
    setIsLoadingArticles(true);
    setDbError(null);
    try {
      const muParam = mediaUnitId ? `&media_unit_id=${mediaUnitId}` : '';
      const res = await fetch(`${API_URL}/flow/published?limit=200${muParam}`, { headers: getHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const items: PublishedArticle[] = (data.data || data.items || []).map((item: any) => ({
        id: item.id,
        title: item.title || 'بدون عنوان',
        content: item.content || item.summary || '',
        category_name: item.category_name || item.category || '',
        media_unit_name: item.media_unit_name || item.media_unit || '',
        media_unit_id: item.media_unit_id,
        published_at: item.published_at || item.created_at || '',
      }));
      setArticles(items);
    } catch {
      try {
        const muParam = mediaUnitId ? `&media_unit_id=${mediaUnitId}` : '';
        const res2 = await fetch(`${API_URL}/data/articles?limit=200${muParam}`, { headers: getHeaders() });
        if (!res2.ok) throw new Error(`HTTP ${res2.status}`);
        const data2 = await res2.json();
        const items: PublishedArticle[] = (data2.data || []).map((item: any) => ({
          id: item.id,
          title: item.title || 'بدون عنوان',
          content: item.content || item.summary || '',
          category_name: item.category_name || item.category || '',
          media_unit_name: item.media_unit_name || item.media_unit || '',
          media_unit_id: item.media_unit_id,
          published_at: item.published_at || item.pub_date || item.created_at || '',
        }));
        setArticles(items);
      } catch {
        setDbError('تعذّر جلب الأخبار من قاعدة البيانات');
      }
    } finally {
      setIsLoadingArticles(false);
    }
  }, [mediaUnitId]); // dependency على mediaUnitId فقط

  const selectArticle = useCallback((article: PublishedArticle) => {
    setSelectedArticle(article);
    setContent(article.content || article.title);
    setShowDropdown(false);
    setSearchQuery('');
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedArticle(null);
    setContent('');
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!content.trim()) return;
    setIsLoading(true);
    setResult(null);

    let prompt = '';
    const system = 'أنت متخصص في إدارة وسائل التواصل الاجتماعي وصناعة المحتوى الرقمي.';

    if (activeTab === 'CAPTION') {
      prompt = `المنصة: ${platform}\nالنبرة: ${tone}\nالفكرة: ${content}\n\nاكتب Caption جذاب مع إيموجي مناسبة.`;
    } else if (activeTab === 'HASHTAGS') {
      prompt = `المحتوى: ${content}\n\nاقترح هاشتاجات نشطة ومناسبة باللغة العربية والإنجليزية.`;
    } else {
      prompt = `الخبر:\n${content}\n\nالمنصة: ${platform}\nالنبرة: ${tone}\n\nحوّل الخبر لمنشور جذاب مع إيموجي مناسبة لمنصة ${platform}.`;
    }

    try {
      const res = await generateAIContent(prompt, system);
      setResult(res);
    } catch {
      setResult('حدث خطأ. يرجى المحاولة لاحقاً.');
    } finally {
      setIsLoading(false);
    }
  }, [content, activeTab, platform, tone]);

  const copyToClipboard = useCallback(() => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [result]);

  const formatDate = useCallback((dateStr: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('ar', { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  }, []);

  // تحميل المقالات عند تغيير وضع قاعدة البيانات أو mediaUnitId
  useEffect(() => {
    if (inputMode === 'DATABASE') {
      fetchArticles();
    }
  }, [inputMode, fetchArticles]);

  // فلترة المقالات حسب البحث
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = articles.filter(article =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredArticles(filtered);
    } else {
      setFilteredArticles(articles);
    }
  }, [articles, searchQuery]);

  return (
    <div className="space-y-4 text-right">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold">وحدة التواصل الاجتماعي</h2>
        <p className="text-gray-400 text-xs">أنشئ محتوى جاهزاً للنشر على منصاتك من خبر أو فكرة.</p>
      </div>

      {/* Tool Tabs */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit mr-auto ml-0 flex-row-reverse">
        {[
          { id: 'TRANSFORM', label: 'تحويل خبر إلى منشور', icon: Newspaper,  desc: 'خبر موجود ← منشور جاهز' },
          { id: 'CAPTION',   label: 'كتابة منشور جديد',    icon: Share2,     desc: 'فكرة ← caption كامل'   },
          { id: 'HASHTAGS',  label: 'توليد هاشتاجات',      icon: Hash,       desc: 'موضوع ← هاشتاجات'      },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as SocialTab); setResult(null); }}
            className={`px-4 py-2 rounded-lg text-xs font-arabic transition-all flex flex-col items-center gap-0.5 ${
              activeTab === tab.id
                ? 'bg-[#FF9F43] text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <tab.icon size={13} />
              <span className="font-bold">{tab.label}</span>
            </div>
            <span className={`text-[10px] ${activeTab === tab.id ? 'text-orange-100' : 'text-gray-600'}`}>{tab.desc}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ── Input Panel ── */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-4 space-y-3 border border-gray-200">

          {/* Input Mode Toggle */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-full flex-row-reverse">
            {[
              { id: 'MANUAL', label: 'إدخال يدوي', icon: PenLine },
              { id: 'DATABASE', label: 'من قاعدة البيانات', icon: Database },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => {
                  setInputMode(mode.id as InputMode);
                  setSelectedArticle(null);
                  setContent('');
                  setResult(null);
                }}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-arabic transition-all flex items-center justify-center gap-1.5 ${
                  inputMode === mode.id
                    ? 'bg-[#FF9F43] text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                <mode.icon size={13} />
                {mode.label}
              </button>
            ))}
          </div>

          {/* ── MANUAL MODE ── */}
          {inputMode === 'MANUAL' && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600">
                {activeTab === 'TRANSFORM'
                  ? 'نص الخبر — سيتحول إلى منشور جاهز'
                  : activeTab === 'CAPTION'
                  ? 'فكرة المنشور — سيكتب لك الـ caption كاملاً'
                  : 'الموضوع أو النص — سيولّد لك هاشتاجات مناسبة'}
              </label>
              <textarea
                value={content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
                rows={8}
                placeholder={
                  activeTab === 'TRANSFORM'
                    ? 'الصق نص الخبر هنا وسيحوّله الذكاء الاصطناعي لمنشور جذاب...'
                    : activeTab === 'CAPTION'
                    ? 'مثال: نريد منشور عن إطلاق برنامجنا الجديد...'
                    : 'مثال: برنامج حواري عن الاقتصاد والأسواق المالية...'
                }
                className="w-full bg-white border border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#FF9F43]/20 outline-none transition-all placeholder:text-gray-500 resize-none font-arabic leading-relaxed text-sm text-gray-900"
              />
            </div>
          )}

          {/* ── DATABASE MODE ── */}
          {inputMode === 'DATABASE' && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-600">اختر خبراً من قاعدة البيانات</label>

              {/* Selected Article Preview */}
              {selectedArticle ? (
                <div className="bg-[#FF9F43]/10 border border-[#FF9F43]/30 rounded-xl p-3 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <button
                      onClick={clearSelection}
                      className="p-1 hover:bg-gray-200 rounded-lg transition-colors text-gray-600 hover:text-gray-900 flex-shrink-0"
                    >
                      <X size={14} />
                    </button>
                    <p className="text-sm font-bold text-gray-900 leading-snug text-right flex-1">{selectedArticle.title}</p>
                  </div>
                  <div className="flex items-center gap-2 justify-end flex-wrap">
                    {selectedArticle.category_name && (
                      <span className="text-[10px] bg-gray-200 text-gray-900 px-2 py-0.5 rounded-full">{selectedArticle.category_name}</span>
                    )}
                    {selectedArticle.media_unit_name && (
                      <span className="text-[10px] bg-gray-200 text-gray-900 px-2 py-0.5 rounded-full">{selectedArticle.media_unit_name}</span>
                    )}
                    {selectedArticle.published_at && (
                      <span className="text-[10px] text-gray-600">{formatDate(selectedArticle.published_at)}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed line-clamp-3 text-right mt-1">
                    {selectedArticle.content?.substring(0, 200)}{selectedArticle.content?.length > 200 ? '...' : ''}
                  </p>
                </div>
              ) : (
                /* Search & Dropdown */
                <div className="relative">
                  <div
                    className="w-full bg-white border border-gray-300 rounded-xl py-2.5 px-4 flex items-center gap-2 cursor-pointer hover:border-[#FF9F43]/40 transition-all text-gray-900"
                    onClick={() => { setShowDropdown(!showDropdown); if (!showDropdown) fetchArticles(); }}
                  >
                    <ChevronDown size={14} className={`text-gray-600 transition-transform flex-shrink-0 ${showDropdown ? 'rotate-180' : ''}`} />
                    <span className="text-sm text-gray-700 flex-1 text-right">اختر خبراً...</span>
                    <Database size={14} className="text-gray-600 flex-shrink-0" />
                  </div>

                  {showDropdown && (
                    <div className="absolute top-full mt-1 right-0 left-0 z-50 bg-white border border-gray-300 rounded-xl shadow-2xl overflow-hidden">
                      {/* Search inside dropdown */}
                      <div className="p-2 border-b border-gray-200">
                        <div className="relative">
                          <Search size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="ابحث في الأخبار..."
                            className="w-full bg-gray-50 border border-gray-300 rounded-lg py-2 pr-8 pl-3 text-xs outline-none focus:border-[#FF9F43]/40 text-right text-gray-900"
                            autoFocus
                          />
                        </div>
                      </div>

                      <div className="max-h-64 overflow-y-auto custom-scrollbar">
                        {isLoadingArticles ? (
                          <div className="flex items-center justify-center gap-2 py-6 text-gray-600 text-xs">
                            <Loader2 size={14} className="animate-spin" />
                            <span>جاري التحميل...</span>
                          </div>
                        ) : dbError ? (
                          <div className="py-6 text-center text-xs text-red-600 px-4">{dbError}</div>
                        ) : filteredArticles.length === 0 ? (
                          <div className="py-6 text-center text-xs text-gray-600">لا توجد نتائج</div>
                        ) : (
                          filteredArticles.map((article) => (
                            <button
                              key={article.id}
                              onClick={() => selectArticle(article)}
                              className="w-full text-right px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-200 last:border-0 flex flex-col gap-1"
                            >
                              <span className="text-xs font-bold text-gray-900 leading-snug line-clamp-2">{article.title}</span>
                              <div className="flex items-center gap-2 flex-wrap">
                                {article.category_name && (
                                  <span className="text-[10px] text-[#FF9F43]">{article.category_name}</span>
                                )}
                                {article.media_unit_name && (
                                  <span className="text-[10px] text-gray-600">{article.media_unit_name}</span>
                                )}
                                {article.published_at && (
                                  <span className="text-[10px] text-gray-500">{formatDate(article.published_at)}</span>
                                )}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Content preview / edit after selection */}
              {selectedArticle && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600">محتوى الخبر (يمكنك التعديل)</label>
                  <textarea
                    value={content}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
                    rows={5}
                    className="w-full bg-white border border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#FF9F43]/20 outline-none transition-all resize-none font-arabic leading-relaxed text-sm text-gray-900"
                  />
                </div>
              )}
            </div>
          )}

          {/* Platform & Tone */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600">المنصة</label>
              <select
                value={platform}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPlatform(e.target.value)}
                className="w-full text-sm bg-white border border-gray-300 rounded-lg py-2 px-3 text-gray-900"
              >
                <option value="Instagram">Instagram</option>
                <option value="Facebook">Facebook</option>
                <option value="X (Twitter)">X (Twitter)</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="TikTok">TikTok</option>
                <option value="Snapchat">Snapchat</option>
                <option value="YouTube">YouTube</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600">النبرة</label>
              <select
                value={tone}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTone(e.target.value)}
                className="w-full text-sm bg-white border border-gray-300 rounded-lg py-2 px-3 text-gray-900"
              >
                <option value="جذاب ومبدع">جذاب ومبدع</option>
                <option value="رسمي مهني">رسمي مهني</option>
                <option value="تشويقي">تشويقي</option>
                <option value="شخصي/ودي">شخصي/ودي</option>
                <option value="سريع ومختصر">سريع ومختصر</option>
                <option value="إخباري محايد">إخباري محايد</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading || !content.trim()}
            className="w-full py-2.5 flex items-center justify-center gap-2 disabled:opacity-50 text-sm bg-[#FF9F43] hover:bg-[#FF8C2E] text-white font-bold rounded-lg transition-colors"
          >
            {isLoading
              ? <Loader2 className="animate-spin" size={16} />
              : <><Sparkles size={14} /><span>
                  {activeTab === 'TRANSFORM' ? 'حوّل الخبر إلى منشور'
                    : activeTab === 'CAPTION' ? 'اكتب الـ Caption'
                    : 'ولّد الهاشتاجات'}
                </span></>
            }
          </button>
        </div>

        {/* ── Output Panel ── */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-4 flex flex-col border border-gray-200 min-h-[300px]">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#FF9F43]/10 rounded-lg flex items-center justify-center text-[#FF9F43]">
                <Share2 size={14} />
              </div>
              <h3 className="text-sm font-bold text-gray-900">
                {activeTab === 'TRANSFORM' ? 'المنشور الجاهز'
                  : activeTab === 'CAPTION' ? 'الـ Caption المقترح'
                  : 'الهاشتاجات المقترحة'}
              </h3>
              {platform && result && (
                <span className="text-[10px] bg-[#FF9F43]/10 text-[#FF9F43] px-2 py-0.5 rounded-full border border-[#FF9F43]/20">
                  {platform}
                </span>
              )}
            </div>
            {result && (
              <button
                onClick={copyToClipboard}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900 flex items-center gap-1.5 text-xs border border-gray-300"
              >
                {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 bg-gray-50 rounded-xl border border-gray-300 font-arabic text-gray-900 text-sm leading-relaxed">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center gap-3">
                <div className="relative">
                  <div className="w-8 h-8 border-2 border-[#FF9F43]/20 border-t-[#FF9F43] rounded-full animate-spin" />
                  <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#FF9F43]" size={12} />
                </div>
                <p className="text-xs text-gray-600">جاري الإنشاء لـ {platform}...</p>
              </div>
            ) : result ? (
              activeTab === 'HASHTAGS'
                ? <HashtagsDisplay text={result} />
                : <div className="space-y-1">{parseNumberedList(result)}</div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-20 gap-3">
                <Repeat size={40} />
                <p className="text-xs text-gray-900">
                  {activeTab === 'TRANSFORM' ? 'أدخل خبراً واضغط تحويل'
                    : activeTab === 'CAPTION' ? 'اكتب فكرتك واضغط كتابة الـ Caption'
                    : 'أدخل الموضوع واضغط توليد الهاشتاجات'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
