/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Merged Frontend — News Management + AI Hub
 * سايدبار موحد يجمع كل الأقسام من كلا المشروعين
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  // News icons
  LayoutDashboard,
  Rss,
  AlertTriangle,
  FileEdit,
  CheckCircle,
  PenTool,
  // AI icons
  Lightbulb,
  Share2,
  Mic2,
  Newspaper,
  MessageSquare,
  // Shared icons
  Sparkles,
  Menu,
  X,
  Search,
  Settings2,
  Building2,
  ChevronDown,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

// ── News Components ──
import { OverviewView } from './components/news/OverviewView';
import { SourcesView } from './components/news/SourcesView';
import { IncompleteView } from './components/news/IncompleteView';
import { QueueView } from './components/news/QueueView';
import { PoliciesView } from './components/news/PoliciesView';
import { PublishedView } from './components/news/PublishedView';
import { SystemSettingsModal } from './components/shared/SystemSettingsModal';

// ── AI Components ──
import IdeaGeneration from './components/ai/IdeaGeneration';
import TextEditing from './components/ai/TextEditing';
import SocialMedia from './components/ai/SocialMedia';
import AudioProcessing from './components/ai/AudioProcessing';
import NewsRoom from './components/ai/NewsRoom';
import ChatInterface from './components/ai/ChatInterface';

// ── Services ──
import { api } from './services/api';
import { useMediaUnits } from './lib/useMediaUnits';

// ─── Types ────────────────────────────────────────────────────
type SectionId =
  // News sections
  | 'overview' | 'sources' | 'incomplete' | 'queue' | 'policies' | 'published'
  // AI sections
  | 'ai-dashboard' | 'ideas' | 'editing' | 'social' | 'audio' | 'newsroom' | 'chat';

interface NavGroup {
  label: string;
  items: { id: SectionId; label: string; icon: any }[];
}

// ─── Navigation Structure ─────────────────────────────────────
const NAV_GROUPS: NavGroup[] = [
  {
    label: 'إدارة الأخبار',
    items: [
      { id: 'overview',   label: 'نظرة عامة',          icon: LayoutDashboard },
      { id: 'sources',    label: 'مصادر المحتوى',       icon: Rss },
      { id: 'incomplete', label: 'أخبار غير مكتملة',    icon: AlertTriangle },
      { id: 'queue',      label: 'ستوديو التحرير',      icon: FileEdit },
      { id: 'policies',   label: 'السياسات التحريرية',   icon: PenTool },
      { id: 'published',  label: 'الأرشيف المنشور',     icon: CheckCircle },
    ],
  },
  {
    label: 'أدوات الذكاء الاصطناعي',
    items: [
      { id: 'ai-dashboard', label: 'وحدة AI',            icon: Sparkles },
      { id: 'ideas',        label: 'وحدة التفكير',        icon: Lightbulb },
      { id: 'editing',      label: 'التحرير الصحفي',      icon: PenTool },
      { id: 'social',       label: 'التواصل الاجتماعي',   icon: Share2 },
      { id: 'audio',        label: 'المختبر الصوتي',      icon: Mic2 },
      { id: 'newsroom',     label: 'غرفة الأخبار',        icon: Newspaper },
      { id: 'chat',         label: 'مساعد AI ذكي',        icon: MessageSquare },
    ],
  },
];

// ─── Section Labels (flat) ────────────────────────────────────
const SECTION_LABELS: Record<SectionId, string> = {} as any;
NAV_GROUPS.forEach(g => g.items.forEach(i => { (SECTION_LABELS as any)[i.id] = i.label; }));

// ─── Section Icons (flat) ─────────────────────────────────────
const SECTION_ICONS: Record<SectionId, any> = {} as any;
NAV_GROUPS.forEach(g => g.items.forEach(i => { (SECTION_ICONS as any)[i.id] = i.icon; }));

export default function App() {
  const [activeSection, setActiveSection] = useState<SectionId>(() => {
    const saved = localStorage.getItem('activeSection');
    return (saved as SectionId) || 'overview';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMediaUnitOpen, setIsMediaUnitOpen] = useState(true);
  const [selectedMediaUnitId, setSelectedMediaUnitId] = useState<number | null>(() => {
    const saved = localStorage.getItem('selectedUnitId');
    return saved ? Number(saved) : null;
  });
  const [isSystemOnline, setIsSystemOnline] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const { mediaUnits } = useMediaUnits();

  // ── Persist state ──
  useEffect(() => {
    localStorage.setItem('activeSection', activeSection);
  }, [activeSection]);

  useEffect(() => {
    if (selectedMediaUnitId) {
      localStorage.setItem('selectedUnitId', String(selectedMediaUnitId));
    } else {
      localStorage.removeItem('selectedUnitId');
    }
  }, [selectedMediaUnitId]);

  // ── Fetch system status ──
  useEffect(() => {
    api.getSystemToggles()
      .then((res) => {
        const d = res.data || {};
        setIsSystemOnline(!!(d.scheduler_enabled && d.classifier_enabled && d.flow_enabled));
      })
      .catch(() => setIsSystemOnline(false));
  }, []);

  const toggleGroup = (label: string) => {
    setCollapsedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const showMediaUnitFilter = isSidebarOpen && mediaUnits.length > 0;
  const ActiveIcon = SECTION_ICONS[activeSection] || LayoutDashboard;

  return (
    <div className="min-h-screen flex text-gray-100 selection:bg-blue-500/30">
      {/* ══════════════════════════════════════════════════════════
          SIDEBAR
         ══════════════════════════════════════════════════════════ */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="bg-[#0b1224] border-l border-white/5 flex flex-col h-screen fixed right-0 z-50 overflow-hidden"
      >
        {/* Logo */}
        <div className="p-5 flex items-center justify-between shrink-0 border-b border-white/5">
          {isSidebarOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#2563eb] rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                <TrendingUp className="text-white w-5 h-5" />
              </div>
              <span className="font-arabic font-bold text-lg tracking-tight">
                Media<span className="text-blue-400">Pro</span>
              </span>
            </motion.div>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-white/5 rounded-xl transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-3">
              {/* Group Header */}
              {isSidebarOpen && (
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="w-full flex items-center justify-between px-3 py-2 mb-1 text-[10px] uppercase tracking-widest text-gray-500 font-semibold hover:text-gray-300 transition-colors"
                >
                  <span>{group.label}</span>
                  <ChevronDown
                    size={12}
                    className={`transition-transform ${collapsedGroups[group.label] ? '-rotate-90' : ''}`}
                  />
                </button>
              )}

              {/* Group Items */}
              {!collapsedGroups[group.label] && group.items.map((item) => {
                const isActive = activeSection === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group
                      ${isActive
                        ? 'bg-blue-600/10 text-blue-400 border border-blue-400/20'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
                      }`}
                  >
                    <Icon size={20} className={`shrink-0 ${isActive ? 'text-blue-400' : ''}`} />
                    {isSidebarOpen && (
                      <motion.span
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="font-medium text-sm whitespace-nowrap truncate"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {/* Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-gray-400 hover:bg-white/5 hover:text-white border border-transparent mt-2"
          >
            <Settings2 size={20} className="shrink-0" />
            {isSidebarOpen && (
              <motion.span initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="font-medium text-sm whitespace-nowrap">
                إعدادات النظام
              </motion.span>
            )}
          </button>
        </nav>

        {/* ── Media Unit Filter ── */}
        <AnimatePresence>
          {showMediaUnitFilter && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mx-3 mb-3 overflow-hidden shrink-0"
            >
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setIsMediaUnitOpen(!isMediaUnitOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
                >
                  <ChevronDown
                    size={14}
                    className={`text-gray-500 transition-transform ${isMediaUnitOpen ? 'rotate-180' : ''}`}
                  />
                  <div className="flex items-center gap-2">
                    <Building2 size={14} className="text-[#2563eb]" />
                    <span className="text-xs font-bold text-gray-300">الوحدة الإعلامية</span>
                  </div>
                </button>

                <AnimatePresence>
                  {isMediaUnitOpen && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 space-y-1">
                        <button
                          onClick={() => setSelectedMediaUnitId(null)}
                          className={`w-full text-right px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-between ${
                            selectedMediaUnitId === null
                              ? 'bg-[#2563eb] text-white'
                              : 'text-gray-400 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${selectedMediaUnitId === null ? 'bg-white' : 'bg-transparent'}`} />
                          <span>الكل</span>
                        </button>
                        {mediaUnits.map((mu: { id: number; name: string }) => (
                          <button
                            key={mu.id}
                            onClick={() => setSelectedMediaUnitId(mu.id)}
                            className={`w-full text-right px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-between ${
                              selectedMediaUnitId === mu.id
                                ? 'bg-[#2563eb] text-white'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${selectedMediaUnitId === mu.id ? 'bg-white' : 'bg-white/20'}`} />
                            <span className="truncate">{mu.name}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User */}
        <div className="p-4 border-t border-white/5 shrink-0">
          <div className={`flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 cursor-pointer ${!isSidebarOpen && 'justify-center'}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
              SH
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-bold truncate">ستوديو التحرير</span>
                <span className="text-xs text-gray-500">مشترك متميز</span>
              </div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* ══════════════════════════════════════════════════════════
          MAIN CONTENT
         ══════════════════════════════════════════════════════════ */}
      <main className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'pr-[280px]' : 'pr-[80px]'}`}>
        {/* Header */}
        <header className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#020617]/50 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <div className="text-gray-500 text-sm flex items-center gap-2">
              <span>الرئيسية</span>
              <ChevronRight size={14} />
              <span className="text-white font-medium">{SECTION_LABELS[activeSection]}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Active media unit badge */}
            {selectedMediaUnitId !== null && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2563eb]/10 border border-[#2563eb]/20 rounded-xl">
                <Building2 size={12} className="text-[#2563eb]" />
                <span className="text-xs text-[#2563eb] font-medium">
                  {mediaUnits.find((m: { id: number }) => m.id === selectedMediaUnitId)?.name}
                </span>
                <button
                  onClick={() => setSelectedMediaUnitId(null)}
                  className="text-[#2563eb]/60 hover:text-[#2563eb] transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={16} />
              <input
                type="text"
                placeholder="بحث سريع..."
                className="bg-[#0b1224] border border-white/5 rounded-full pl-4 pr-10 py-1.5 text-xs focus:outline-none focus:border-blue-500/50 focus:w-64 transition-all w-48"
              />
            </div>

            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 shrink-0 border border-white/10 shadow-lg shadow-blue-500/20" />
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-7xl mx-auto"
            >
              {/* Section Header — for news sections */}
              {!activeSection.startsWith('ai-') && !['ideas', 'editing', 'social', 'audio', 'newsroom', 'chat'].includes(activeSection) && (
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                    <ActiveIcon size={24} className="text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">{SECTION_LABELS[activeSection]}</h2>
                    <p className="text-gray-500 text-sm">نظام الإدارة الموحد لمركز الإعلام</p>
                  </div>
                </div>
              )}

              {/* ── News Views ── */}
              {activeSection === 'overview' && <OverviewView unitId={selectedMediaUnitId} />}
              {activeSection === 'sources' && <SourcesView autoEnabled={isSystemOnline} />}
              {activeSection === 'incomplete' && <IncompleteView unitId={selectedMediaUnitId} />}
              {activeSection === 'queue' && <QueueView unitId={selectedMediaUnitId} />}
              {activeSection === 'policies' && <PoliciesView unitId={selectedMediaUnitId} />}
              {activeSection === 'published' && <PublishedView unitId={selectedMediaUnitId} />}

              {/* ── AI Views ── */}
              {activeSection === 'ai-dashboard' && <AIDashboard setActiveSection={setActiveSection} />}
              {activeSection === 'ideas' && <IdeaGeneration mediaUnitId={selectedMediaUnitId} />}
              {activeSection === 'editing' && <TextEditing mediaUnitId={selectedMediaUnitId} />}
              {activeSection === 'social' && <SocialMedia mediaUnitId={selectedMediaUnitId} />}
              {activeSection === 'audio' && <AudioProcessing />}
              {activeSection === 'newsroom' && <NewsRoom mediaUnitId={selectedMediaUnitId} />}
              {activeSection === 'chat' && <ChatInterface />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* System Settings Modal */}
      <SystemSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSystemStatusChange={(enabled) => setIsSystemOnline(enabled)}
      />
    </div>
  );
}

// ─── AI Dashboard (landing page for AI section) ───────────────
function AIDashboard({ setActiveSection }: { setActiveSection: (s: SectionId) => void }) {
  const cards = [
    { id: 'ideas' as SectionId,    title: 'وحدة التفكير',        desc: 'توليد أفكار مبدعة، أسئلة مقابلات، وعناوين جذابة.',  icon: Lightbulb,     color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { id: 'editing' as SectionId,  title: 'التحرير الصحفي',       desc: 'إعادة صياغة، تلخيص، وتدقيق لغوي فوري.',            icon: PenTool,       color: 'text-blue-400',   bg: 'bg-blue-400/10'   },
    { id: 'social' as SectionId,   title: 'التواصل الاجتماعي',    desc: 'منشورات تفاعلية، هاشتاجات، وتحويل الأخبار.',       icon: Share2,        color: 'text-pink-400',   bg: 'bg-pink-400/10'   },
    { id: 'audio' as SectionId,    title: 'المختبر الصوتي',       desc: 'تحويل الصوت إلى نص وبالعكس من الأرشيف.',           icon: Mic2,          color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { id: 'newsroom' as SectionId, title: 'غرفة الأخبار',         desc: 'إنشاء نشرات ومواجيز إخبارية من مادتك الخبرية.',    icon: Newspaper,     color: 'text-emerald-400',bg: 'bg-emerald-400/10'},
    { id: 'chat' as SectionId,     title: 'مساعد AI ذكي',         desc: 'دردشة تفاعلية لمساعدتك في المهام الإعلامية.',      icon: MessageSquare, color: 'text-blue-500',   bg: 'bg-blue-500/10'   },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl text-white">أهلاً بك في وحدة الذكاء الاصطناعي</h1>
        <p className="text-gray-400 text-sm">بماذا يمكننا مساعدتك اليوم في رحلتك الإبداعية؟</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => setActiveSection(card.id)}
            className="glass-panel p-5 text-right group hover:border-[#2563eb] transition-all duration-300 hover:-translate-y-1 flex flex-col gap-4 h-full"
          >
            <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center transition-transform group-hover:scale-110`}>
              <card.icon className={`${card.color} w-5 h-5`} />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <h3 className="text-base font-bold">{card.title}</h3>
              <p className="text-gray-400 text-xs leading-relaxed">{card.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
