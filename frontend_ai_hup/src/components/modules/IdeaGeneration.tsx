import React, { useState, useEffect } from 'react';
import {
  Lightbulb, Loader2, Copy, Check, Sparkles,
  Search, User, Tv, Hash, ChevronDown, ChevronUp, Film
} from 'lucide-react';
import { generateIdeasContent, IdeasPayload } from '../../lib/ai-client';
import { parseNumberedList } from '../../lib/markdown-parser';

// ─── Types ────────────────────────────────────────────────────
interface Program {
  id: number;
  title: string;
  description?: string;
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
}

type Tool = 'IDEAS' | 'QUESTIONS' | 'TITLES';

// ─── API helpers ──────────────────────────────────────────────
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function fetchPrograms(): Promise<Program[]> {
  const res = await fetch(`${API_URL}/programs`);
  const json = await res.json();
  return json.success ? json.data : [];
}

async function fetchEpisodes(programId: number): Promise<Episode[]> {
  const res = await fetch(`${API_URL}/programs/${programId}/episodes`);
  const json = await res.json();
  return json.success ? json.data : [];
}

async function fetchGuests(search?: string): Promise<Guest[]> {
  const url = search && search.trim()
    ? `${API_URL}/guests?search=${encodeURIComponent(search.trim())}`
    : `${API_URL}/guests?recent=2`;
  const res = await fetch(url);
  const json = await res.json();
  return json.success ? json.data : [];
}

async function fetchEpisodeGuests(episodeId: number): Promise<Guest[]> {
  const res = await fetch(`${API_URL}/programs/episodes/${episodeId}/guests`);
  const json = await res.json();
  return json.success ? json.data : [];
}

// ─── Component ────────────────────────────────────────────────
export default function IdeaGeneration() {
  const [activeTool, setActiveTool] = useState<Tool>('IDEAS');
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
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [showEpisodes, setShowEpisodes] = useState(false);

  // AI
  const [additionalContext, setAdditionalContext] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // ─── Load initial data ──────────────────────────────────────
  useEffect(() => {
    setLoadingData(true);
    Promise.all([fetchPrograms(), fetchGuests()])
      .then(([progs, gsts]) => {
        setPrograms(progs);
        setGuests(gsts);
      })
      .catch(console.error)
      .finally(() => setLoadingData(false));
  }, []);

  // ─── Search guests with debounce ─────────────────────────────
  useEffect(() => {
    if (activeTool !== 'QUESTIONS') return;
    setLoadingGuests(true);
    const timer = setTimeout(() => {
      fetchGuests(guestSearch)
        .then(setGuests)
        .catch(console.error)
        .finally(() => setLoadingGuests(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [guestSearch, activeTool]);  // ─── Load episodes when program selected ────────────────────
  useEffect(() => {
    if (!selectedProgram) {
      setEpisodes([]);
      setSelectedEpisode(null);
      setEpisodeGuests([]);
      return;
    }
    fetchEpisodes(selectedProgram.id)
      .then(setEpisodes)
      .catch(console.error);
  }, [selectedProgram]);

  // ─── Load episode guests when episode selected ───────────────
  useEffect(() => {
    if (!selectedEpisode) {
      setEpisodeGuests([]);
      return;
    }
    fetchEpisodeGuests(selectedEpisode.id)
      .then(setEpisodeGuests)
      .catch(console.error);
  }, [selectedEpisode]);

  // ─── Filter helpers ──────────────────────────────────────────
  const filteredPrograms = programs.filter((p: Program) =>
    p.title.toLowerCase().includes(programSearch.toLowerCase())
  );
  const filteredGuests = guests.filter((g: Guest) =>
    g.name.toLowerCase().includes(guestSearch.toLowerCase())
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
        guest: { name: selectedGuest.name },
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
    <div className="space-y-8 text-right">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold">وحدة الابتكار الإعلامي</h2>
        <p className="text-gray-400">ولد أفكاراً ذكية مرتبطة ببرامجك وحلقاتك وضيوفك الفعليين.</p>
      </div>

      {/* Tool Tabs */}
      <div className="flex gap-4 p-1 bg-white/5 rounded-2xl w-fit mr-auto ml-0 flex-row-reverse">
        {[
          { id: 'IDEAS', label: 'تطوير حلقات', icon: Lightbulb },
          { id: 'QUESTIONS', label: 'أسئلة لقاءات', icon: User },
          { id: 'TITLES', label: 'عناوين إبداعية', icon: Hash },
        ].map((tool) => (
          <button
            key={tool.id}
            onClick={() => { setActiveTool(tool.id as Tool); setResult(null); setProgramSearch(''); setGuestSearch(''); }}
            className={`px-8 py-3 rounded-xl text-sm font-arabic transition-all flex items-center gap-2 ${
              activeTool === tool.id
                ? 'bg-[#2563eb] text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tool.icon size={18} />
            {tool.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ── Selector Panel ── */}
        <div className="lg:col-span-5 space-y-6 flex flex-col">
          <div className="glass-panel p-6 space-y-6 flex-1 flex flex-col">
            {/* Search — Programs */}
            <div className="relative group">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input
                type="text"
                placeholder="ابحث عن برنامج..."
                value={programSearch}
                onChange={(e) => setProgramSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pr-11 pl-4 text-sm outline-none focus:ring-2 focus:ring-[#2563eb]/20"
              />
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-1">
              {/* Programs list */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 block">اختر البرنامج</label>
                {loadingData ? (
                  <div className="flex items-center justify-center py-6 text-gray-500 gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm">جاري التحميل...</span>
                  </div>
                ) : filteredPrograms.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">لا توجد برامج</p>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {filteredPrograms.map(p => (
                      <div key={p.id}>
                        <div
                          onClick={() => {
                            setSelectedProgram(selectedProgram?.id === p.id ? null : p);
                            setSelectedEpisode(null);
                            setShowEpisodes(false);
                          }}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                            selectedProgram?.id === p.id
                              ? 'bg-[#2563eb]/10 border-[#2563eb]'
                              : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Tv size={16} className="text-blue-400 shrink-0" />
                            <div className="flex flex-col">
                              <span className="text-sm font-bold">{p.title}</span>
                              {p.media_unit_name && (
                                <span className="text-[10px] text-gray-500">{p.media_unit_name}</span>
                              )}
                            </div>
                          </div>
                          {selectedProgram?.id === p.id && <Check size={14} className="text-[#2563eb]" />}
                        </div>

                        {/* Episodes dropdown */}
                        {selectedProgram?.id === p.id && episodes.length > 0 && (
                          <div className="mt-1 mr-4">
                            <button
                              onClick={() => setShowEpisodes(!showEpisodes)}
                              className="flex items-center gap-2 text-xs text-gray-400 hover:text-white py-1 px-2 transition-colors"
                            >
                              <Film size={12} />
                              <span>{episodes.length} حلقة</span>
                              {showEpisodes ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>

                            {showEpisodes && (
                              <div className="mt-1 space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                                {episodes.map(ep => (
                                  <div
                                    key={ep.id}
                                    onClick={() => setSelectedEpisode(selectedEpisode?.id === ep.id ? null : ep)}
                                    className={`p-2 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                                      selectedEpisode?.id === ep.id
                                        ? 'bg-indigo-500/10 border-indigo-500/50'
                                        : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <Film size={12} className="text-indigo-400 shrink-0" />
                                      <div className="flex flex-col">
                                        <span className="text-xs font-medium">{ep.title}</span>
                                        {ep.air_date && (
                                          <span className="text-[10px] text-gray-500">
                                            {new Date(ep.air_date).toLocaleDateString('ar')}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    {selectedEpisode?.id === ep.id && (
                                      <Check size={12} className="text-indigo-400" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Guests list — only for QUESTIONS */}
              {activeTool === 'QUESTIONS' && (
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold text-gray-500 block">
                    اختر الضيف
                    {episodeGuests.length > 0 && (
                      <span className="text-indigo-400 mr-2">(ضيوف الحلقة المختارة مميزون)</span>
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
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pr-9 pl-3 text-sm outline-none focus:ring-2 focus:ring-[#2563eb]/20"
                    />
                    {loadingGuests && (
                      <Loader2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 animate-spin" />
                    )}
                  </div>

                  {/* hint */}
                  {!guestSearch && (
                    <p className="text-[10px] text-gray-600 text-right">
                      يعرض آخر ضيفين — ابحث لرؤية المزيد
                    </p>
                  )}

                  {loadingData ? (
                    <div className="flex items-center justify-center py-4 text-gray-500 gap-2">
                      <Loader2 size={14} className="animate-spin" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {/* Episode guests first */}
                      {episodeGuests.map(g => (
                        <div
                          key={`ep-${g.id}`}
                          onClick={() => setSelectedGuest(selectedGuest?.id === g.id ? null : g)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                            selectedGuest?.id === g.id
                              ? 'bg-[#2563eb]/10 border-[#2563eb]'
                              : 'bg-indigo-500/5 border-indigo-500/20 hover:border-indigo-500/40'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <User size={16} className="text-indigo-400 shrink-0" />
                            <div className="flex flex-col">
                              <span className="text-sm font-bold">{g.name}</span>
                              <span className="text-[10px] text-indigo-300">ضيف الحلقة</span>
                            </div>
                          </div>
                          {selectedGuest?.id === g.id && <Check size={14} className="text-[#2563eb]" />}
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
                                ? 'bg-[#2563eb]/10 border-[#2563eb]'
                                : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <User size={16} className="text-purple-400 shrink-0" />
                              <div className="flex flex-col">
                                <span className="text-sm font-bold">{g.name}</span>
                              </div>
                            </div>
                            {selectedGuest?.id === g.id && <Check size={14} className="text-[#2563eb]" />}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Context summary badge */}
            {selectedProgram && (
              <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3 text-xs text-gray-400 space-y-1">
                <div className="flex items-center gap-2">
                  <Tv size={12} className="text-blue-400" />
                  <span className="text-white font-medium">{selectedProgram.title}</span>
                </div>
                {selectedEpisode && (
                  <div className="flex items-center gap-2 mr-4">
                    <Film size={12} className="text-indigo-400" />
                    <span>{selectedEpisode.title}</span>
                    {episodeGuests.length > 0 && (
                      <span className="text-gray-500">· {episodeGuests.map(g => g.name).join('، ')}</span>
                    )}
                  </div>
                )}
                {activeTool === 'QUESTIONS' && selectedGuest && (
                  <div className="flex items-center gap-2 mr-4">
                    <User size={12} className="text-purple-400" />
                    <span>{selectedGuest.name}</span>
                  </div>
                )}
              </div>
            )}

            {/* Additional context */}
            <div className="space-y-2 border-t border-white/5 pt-4">
              <label className="text-xs font-bold text-gray-500">سياق إضافي أو موضوع الحلقة</label>
              <textarea
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                placeholder="مثال: حلقة عن التحديات العقارية في دبي..."
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-[#2563eb]/20 text-sm resize-none"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={isLoading || !canGenerate}
              className="btn-primary w-full py-4 flex items-center justify-center gap-3 disabled:opacity-30"
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
          <div className="glass-panel p-8 min-h-[550px] flex flex-col justify-center bg-[#0b1224] border-dashed border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#2563eb]/5 rounded-bl-full blur-2xl" />

            {result ? (
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#2563eb]/10 rounded-lg flex items-center justify-center text-[#2563eb]">
                      <Lightbulb size={16} />
                    </div>
                    <h3 className="text-lg font-bold">الاقتراحات الإبداعية</h3>
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-400 hover:text-white flex items-center gap-2 border border-white/5"
                  >
                    {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                    <span className="text-xs">{copied ? 'تم النسخ' : 'نسخ الكل'}</span>
                  </button>
                </div>
                <div className="bg-white/[0.02] rounded-3xl p-8 border border-white/10 font-arabic text-gray-200 leading-loose shadow-inner overflow-y-auto">
                  {parseNumberedList(result)}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-10 gap-4 py-20">
                <Sparkles size={80} />
                <p className="text-xl">اختر برنامجاً وسنولد لك أفكاراً مذهلة</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
