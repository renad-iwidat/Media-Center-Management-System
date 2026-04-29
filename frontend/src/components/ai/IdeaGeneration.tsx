import { useState, useEffect } from 'react';
import {
  Lightbulb, Loader2, Copy, Check, Sparkles,
  Search, User, Tv, Hash, ChevronDown, ChevronUp, Film
} from 'lucide-react';
import { generateIdeasContent, IdeasPayload } from '../../lib/ai-client';
import { parseNumberedList } from '../../lib/markdown-parser';
import { api } from '../../services/api';
import { useLocalStorageBatch } from '../../lib/useLocalStorageBatch';

// ─── Types ────────────────────────────────────────────────────
interface Program {
  id: number;
  title: string;
  description?: string;
  media_unit_id?: number;
  media_unit_name?: string;
}

interface Episode {
  id: number;
  program_id: number;
  title: string;
  air_date?: string;
  program_title?: string;
}

interface Guest {
  id: number;
  name: string;
  title?: string;
}

type Tool = 'IDEAS' | 'QUESTIONS' | 'TITLES';

// ─── Component ────────────────────────────────────────────────
export default function IdeaGeneration({ mediaUnitId }: { mediaUnitId: number | null }) {
  // Load from localStorage
  const loadFromStorage = (key: string, defaultValue: any) => {
    try {
      const saved = localStorage.getItem(`ideaGen_${key}`);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [activeTool, setActiveTool] = useState<Tool>(() => loadFromStorage('activeTool', 'IDEAS'));
  const [programSearch, setProgramSearch] = useState('');
  const [guestSearch, setGuestSearch] = useState('');

  // Data from API
  const [programs, setPrograms] = useState<Program[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [episodeGuests, setEpisodeGuests] = useState<Guest[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingGuests, setLoadingGuests] = useState(false);

  // Selections
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(() => loadFromStorage('selectedProgram', null));
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(() => loadFromStorage('selectedEpisode', null));
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(() => loadFromStorage('selectedGuest', null));
  const [showEpisodes, setShowEpisodes] = useState(false);

  // AI
  const [additionalContext, setAdditionalContext] = useState(() => loadFromStorage('additionalContext', ''));
  const [result, setResult] = useState<string | null>(() => loadFromStorage('result', null));
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Pagination
  const [programPage, setProgramPage] = useState(1);
  const [episodePage, setEpisodePage] = useState(1);
  const itemsPerPage = 10;

  // ─── Load initial data ──────────────────────────────────────
  useEffect(() => {
    setLoadingData(true);
    Promise.all([api.getPrograms(), api.getGuests()])
      .then(([progsRes, gstsRes]) => {
        setPrograms(progsRes.data || []);
        setGuests(gstsRes.data || []);
      })
      .catch(console.error)
      .finally(() => setLoadingData(false));
  }, []);

  // ─── Save to localStorage (batched to prevent infinite loops) ───────────────────────────────────
  useLocalStorageBatch([
    { key: 'ideaGen_activeTool', value: activeTool },
    { key: 'ideaGen_selectedProgram', value: selectedProgram },
    { key: 'ideaGen_selectedEpisode', value: selectedEpisode },
    { key: 'ideaGen_selectedGuest', value: selectedGuest },
    { key: 'ideaGen_additionalContext', value: additionalContext },
    { key: 'ideaGen_result', value: result },
  ], 200);

  // ─── Search guests with debounce - مع حماية من unmount ─────────────────────────────
  useEffect(() => {
    let isMounted = true;
    
    if (activeTool !== 'QUESTIONS') return;
    
    setLoadingGuests(true);
    const timer = setTimeout(() => {
      if (isMounted) {
        api.getGuests(guestSearch)
          .then((res) => {
            if (isMounted) setGuests(res.data || []);
          })
          .catch(console.error)
          .finally(() => {
            if (isMounted) setLoadingGuests(false);
          });
      }
    }, 300);
    
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [guestSearch, activeTool]);

  // ─── Load episodes when program selected - مع حماية من unmount ────────────────────
  useEffect(() => {
    let isMounted = true;
    
    if (!selectedProgram) {
      setEpisodes([]);
      setSelectedEpisode(null);
      setEpisodeGuests([]);
      return;
    }
    
    api.getProgramEpisodes(selectedProgram.id)
      .then((res) => {
        if (isMounted) setEpisodes(res.data || []);
      })
      .catch(console.error);
      
    return () => {
      isMounted = false;
    };
  }, [selectedProgram]);

  // ─── Load episode guests when episode selected - مع حماية من unmount ───────────────
  useEffect(() => {
    let isMounted = true;
    
    if (!selectedEpisode) {
      setEpisodeGuests([]);
      return;
    }
    
    api.getEpisodeGuests(selectedEpisode.id)
      .then((res) => {
        if (isMounted) setEpisodeGuests(res.data || []);
      })
      .catch(console.error);
      
    return () => {
      isMounted = false;
    };
  }, [selectedEpisode]);

  // ─── Filter helpers ──────────────────────────────────────────
  const filteredPrograms = programs.filter((p: Program) => {
    const matchesSearch = p.title.toLowerCase().includes(programSearch.toLowerCase());
    const matchesUnit = mediaUnitId === null || p.media_unit_id === mediaUnitId;
    return matchesSearch && matchesUnit;
  });
  
  const filteredGuests = guests.filter((g: Guest) =>
    g.name.toLowerCase().includes(guestSearch.toLowerCase()) ||
    (g.title && g.title.toLowerCase().includes(guestSearch.toLowerCase()))
  );

  const filteredEpisodes = episodes;

  // Pagination
  const totalProgramPages = Math.ceil(filteredPrograms.length / itemsPerPage);
  const paginatedPrograms = filteredPrograms.slice(
    (programPage - 1) * itemsPerPage,
    programPage * itemsPerPage
  );

  const totalEpisodePages = Math.ceil(filteredEpisodes.length / itemsPerPage);
  const paginatedEpisodes = filteredEpisodes.slice(
    (episodePage - 1) * itemsPerPage,
    episodePage * itemsPerPage
  );

  // ─── Generate ────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!selectedProgram) return;
    setIsLoading(true);
    setResult(null);

    const payload: IdeasPayload = {
      tool: activeTool,
      program: {
        title: selectedProgram.title,
        description: selectedProgram.description,
        media_unit_name: selectedProgram.media_unit_name,
      },
      ...(selectedEpisode && {
        episode: {
          title: selectedEpisode.title,
          air_date: selectedEpisode.air_date,
          guests: episodeGuests.map((g: Guest) => g.name),
        },
      }),
      ...(activeTool === 'QUESTIONS' && selectedGuest && {
        guest: { name: selectedGuest.name, title: selectedGuest.title },
      }),
      additional_context: additionalContext || undefined,
    };

    try {
      const res = await generateIdeasContent(payload);
      setResult(res);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'خطأ غير معروف';
      setResult(`عذراً، حدث خطأ أثناء التوليد:\n${msg}`);
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

  const canGenerate = activeTool === 'QUESTIONS'
    ? !!selectedProgram && !!selectedGuest
    : !!selectedProgram;

  // ─── Render ──────────────────────────────────────────────────
  return (
    <div className="space-y-4 text-right">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold">وحدة الابتكار الإعلامي</h2>
        <p className="text-gray-400 text-xs">ولد أفكاراً ذكية مرتبطة ببرامجك وحلقاتك وضيوفك الفعليين.</p>
      </div>

      {/* Tool Tabs */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit mr-auto ml-0 flex-row-reverse">
        {[
          { id: 'IDEAS', label: 'تطوير حلقات', icon: Lightbulb },
          { id: 'QUESTIONS', label: 'أسئلة لقاءات', icon: User },
          { id: 'TITLES', label: 'عناوين إبداعية', icon: Hash },
        ].map((tool) => (
          <button
            key={tool.id}
            onClick={() => { setActiveTool(tool.id as Tool); setResult(null); setProgramSearch(''); setGuestSearch(''); }}
            className={`px-5 py-2 rounded-lg text-xs font-arabic transition-all flex items-center gap-1.5 ${
              activeTool === tool.id
                ? 'bg-[#FF9F43] text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            <tool.icon size={14} />
            {tool.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ── Selector Panel ── */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-4 space-y-3 flex-1 flex flex-col border border-gray-200">
            {/* Search — Programs */}
            <div className="relative group">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input
                type="text"
                placeholder="ابحث عن برنامج..."
                value={programSearch}
                onChange={(e) => setProgramSearch(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl py-3 pr-11 pl-4 text-sm outline-none focus:ring-2 focus:ring-[#FF9F43]/20 text-gray-900"
              />
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-1 max-h-[420px]">
              {/* Programs list */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600 block sticky top-0 bg-white py-1 z-10">اختر البرنامج</label>
                {loadingData ? (
                  <div className="flex items-center justify-center py-6 text-gray-500 gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm">جاري التحميل...</span>
                  </div>
                ) : filteredPrograms.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">لا توجد برامج</p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-2">
                      {paginatedPrograms.map(p => (
                      <div key={p.id}>
                        <div
                          onClick={() => {
                            setSelectedProgram(selectedProgram?.id === p.id ? null : p);
                            setSelectedEpisode(null);
                            setShowEpisodes(false);
                          }}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                            selectedProgram?.id === p.id
                              ? 'bg-[#FF9F43]/10 border-[#FF9F43]'
                              : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Tv size={16} className="text-[#1e4a66] shrink-0" />
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-gray-900">{p.title}</span>
                              {p.media_unit_name && (
                                <span className="text-[10px] text-gray-600">{p.media_unit_name}</span>
                              )}
                            </div>
                          </div>
                          {selectedProgram?.id === p.id && <Check size={14} className="text-[#FF9F43]" />}
                        </div>

                        {/* Episodes dropdown */}
                        {selectedProgram?.id === p.id && episodes.length > 0 && (
                          <div className="mt-1 mr-4">
                            <button
                              onClick={() => setShowEpisodes(!showEpisodes)}
                              className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900 py-1 px-2 transition-colors"
                            >
                              <Film size={12} />
                              <span>{episodes.length} حلقة</span>
                              {showEpisodes ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>

                            {showEpisodes && (
                              <div className="mt-1 space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                                {paginatedEpisodes.map(ep => (
                                  <div
                                    key={ep.id}
                                    onClick={() => setSelectedEpisode(selectedEpisode?.id === ep.id ? null : ep)}
                                    className={`p-2 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                                      selectedEpisode?.id === ep.id
                                        ? 'bg-[#FF9F43]/10 border-[#FF9F43]'
                                        : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <Film size={12} className="text-[#1e4a66] shrink-0" />
                                      <div className="flex flex-col">
                                        <span className="text-xs font-medium text-gray-900">{ep.title}</span>
                                        {ep.air_date && (
                                          <span className="text-[10px] text-gray-600">
                                            {new Date(ep.air_date).toLocaleDateString('ar')}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    {selectedEpisode?.id === ep.id && (
                                      <Check size={12} className="text-[#FF9F43]" />
                                    )}
                                  </div>
                                ))}
                                
                                {/* Episode Pagination */}
                                {totalEpisodePages > 1 && (
                                  <div className="flex items-center justify-center gap-1 pt-2">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setEpisodePage(p => Math.max(1, p - 1)); }}
                                      disabled={episodePage === 1}
                                      className="px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded disabled:opacity-30 text-gray-900"
                                    >
                                      السابق
                                    </button>
                                    <span className="text-xs text-gray-600">
                                      {episodePage} / {totalEpisodePages}
                                    </span>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setEpisodePage(p => Math.min(totalEpisodePages, p + 1)); }}
                                      disabled={episodePage === totalEpisodePages}
                                      className="px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded disabled:opacity-30 text-gray-900"
                                    >
                                      التالي
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Program Pagination */}
                  {totalProgramPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-2 border-t border-gray-200">
                      <button
                        onClick={() => setProgramPage(p => Math.max(1, p - 1))}
                        disabled={programPage === 1}
                        className="px-3 py-1.5 text-xs bg-gray-100 border border-gray-300 rounded-lg disabled:opacity-30 hover:bg-gray-200 transition-colors text-gray-900"
                      >
                        السابق
                      </button>
                      <span className="text-xs text-gray-600">
                        صفحة {programPage} من {totalProgramPages}
                      </span>
                      <button
                        onClick={() => setProgramPage(p => Math.min(totalProgramPages, p + 1))}
                        disabled={programPage === totalProgramPages}
                        className="px-3 py-1.5 text-xs bg-gray-100 border border-gray-300 rounded-lg disabled:opacity-30 hover:bg-gray-200 transition-colors text-gray-900"
                      >
                        التالي
                      </button>
                    </div>
                  )}
                </>
                )}
              </div>

              {/* Guests list — only for QUESTIONS */}
              {activeTool === 'QUESTIONS' && (
                <div className="space-y-2 pt-2 border-t border-gray-200">
                  <label className="text-xs font-bold text-gray-600 block sticky top-0 bg-white py-1 z-10">
                    اختر الضيف
                    {episodeGuests.length > 0 && (
                      <span className="text-[#FF9F43] mr-2">(ضيوف الحلقة المختارة مميزون)</span>
                    )}
                  </label>

                  {/* Guest search */}
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                    <input
                      type="text"
                      placeholder="ابحث عن ضيف..."
                      value={guestSearch}
                      onChange={(e) => setGuestSearch(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-xl py-2.5 pr-9 pl-3 text-sm outline-none focus:ring-2 focus:ring-[#FF9F43]/20 text-gray-900"
                    />
                    {loadingGuests && (
                      <Loader2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 animate-spin" />
                    )}
                  </div>

                  {/* hint */}
                  {!guestSearch && (
                    <p className="text-[10px] text-gray-600 text-right">
                      يعرض آخر 5 ضيوف — ابحث لرؤية المزيد
                    </p>
                  )}

                  {loadingData ? (
                    <div className="flex items-center justify-center py-4 text-gray-500 gap-2">
                      <Loader2 size={14} className="animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[280px] overflow-y-auto custom-scrollbar pr-1">
                      <div className="grid grid-cols-1 gap-2">
                        {/* Episode guests first */}
                        {episodeGuests.map(g => (
                          <div
                            key={`ep-${g.id}`}
                            onClick={() => setSelectedGuest(selectedGuest?.id === g.id ? null : g)}
                            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                              selectedGuest?.id === g.id
                                ? 'bg-[#FF9F43]/10 border-[#FF9F43]'
                                : 'bg-orange-50 border-orange-200 hover:border-orange-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <User size={16} className="text-[#FF9F43] shrink-0" />
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-gray-900">{g.name}</span>
                                {g.title && <span className="text-[10px] text-gray-600">{g.title}</span>}
                                <span className="text-[10px] text-[#FF9F43]">ضيف الحلقة</span>
                              </div>
                            </div>
                            {selectedGuest?.id === g.id && <Check size={14} className="text-[#FF9F43]" />}
                          </div>
                        ))}

                        {/* All other guests */}
                        {filteredGuests
                          .filter((g: Guest) => !episodeGuests.find((eg: Guest) => eg.id === g.id))
                          .map((g: Guest) => (
                            <div
                              key={g.id}
                              onClick={() => setSelectedGuest(selectedGuest?.id === g.id ? null : g)}
                              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                                selectedGuest?.id === g.id
                                  ? 'bg-[#FF9F43]/10 border-[#FF9F43]'
                                  : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <User size={16} className="text-[#1e4a66] shrink-0" />
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-gray-900">{g.name}</span>
                                  {g.title && <span className="text-[10px] text-gray-600">{g.title}</span>}
                                </div>
                              </div>
                              {selectedGuest?.id === g.id && <Check size={14} className="text-[#FF9F43]" />}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Context summary badge */}
            {selectedProgram && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-600 space-y-1">
                <div className="flex items-center gap-2">
                  <Tv size={12} className="text-[#1e4a66]" />
                  <span className="text-gray-900 font-medium">{selectedProgram.title}</span>
                </div>
                {selectedEpisode && (
                  <div className="flex items-center gap-2 mr-4">
                    <Film size={12} className="text-[#FF9F43]" />
                    <span className="text-gray-700">{selectedEpisode.title}</span>
                    {episodeGuests.length > 0 && (
                      <span className="text-gray-500">· {episodeGuests.map(g => g.name).join('، ')}</span>
                    )}
                  </div>
                )}
                {activeTool === 'QUESTIONS' && selectedGuest && (
                  <div className="flex items-center gap-2 mr-4">
                    <User size={12} className="text-[#FF9F43]" />
                    <div className="flex flex-col">
                      <span className="text-gray-700">{selectedGuest.name}</span>
                      {selectedGuest.title && <span className="text-[10px] text-gray-600">{selectedGuest.title}</span>}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Additional context */}
            <div className="space-y-1 border-t border-gray-200 pt-3">
              <label className="text-xs font-bold text-gray-600">سياق إضافي أو موضوع الحلقة</label>
              <textarea
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                placeholder="مثال: حلقة عن التحديات العقارية في دبي..."
                rows={2}
                className="w-full bg-white border border-gray-300 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-[#FF9F43]/20 text-sm resize-none text-gray-900"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={isLoading || !canGenerate}
              className="w-full py-3 flex items-center justify-center gap-2 disabled:opacity-30 text-sm bg-[#FF9F43] hover:bg-[#FF8C2E] text-white font-bold rounded-xl transition-colors"
            >
              {isLoading
                ? <Loader2 className="animate-spin" size={20} />
                : <><Sparkles size={18} /><span>إنشاء مخرجات إبداعية</span></>
              }
            </button>
          </div>
        </div>

        {/* ── Result Panel ── */}
        <div className="lg:col-span-7">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-5 min-h-[480px] flex flex-col justify-center border border-gray-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF9F43]/5 rounded-bl-full blur-2xl" />

            {result ? (
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#FF9F43]/10 rounded-lg flex items-center justify-center text-[#FF9F43]">
                      <Lightbulb size={16} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">الاقتراحات الإبداعية</h3>
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-600 hover:text-gray-900 flex items-center gap-2 border border-gray-300"
                  >
                    {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                    <span className="text-xs">{copied ? 'تم النسخ' : 'نسخ الكل'}</span>
                  </button>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-200 font-arabic text-gray-900 leading-loose shadow-inner overflow-y-auto max-h-[420px]">
                  {parseNumberedList(result)}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-20 gap-4 py-20">
                <Sparkles size={80} />
                <p className="text-xl text-gray-900">اختر برنامجاً وسنولد لك أفكاراً مذهلة</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
