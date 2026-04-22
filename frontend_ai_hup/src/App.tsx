/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lightbulb, 
  PenTool,
  Share2, 
  Mic2, 
  Newspaper, 
  MessageSquare,
  Sparkles,
  ChevronLeft,
  Search,
  Menu,
  X,
  Building2,
  ChevronDown
} from 'lucide-react';

import IdeaGeneration from './components/modules/IdeaGeneration';
import TextEditing from './components/modules/TextEditing';
import SocialMedia from './components/modules/SocialMedia';
import AudioProcessing from './components/modules/AudioProcessing';
import NewsRoom from './components/modules/NewsRoom';
import ChatInterface from './components/modules/ChatInterface';
import { useMediaUnits } from './lib/useMediaUnits';

type ModuleId = 'IDEAS' | 'EDITING' | 'SOCIAL' | 'AUDIO' | 'NEWS' | 'CHAT' | 'DASHBOARD';

export default function App() {
  const [activeModule, setActiveModule] = useState<ModuleId>('DASHBOARD');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedMediaUnitId, setSelectedMediaUnitId] = useState<number | null>(null);
  const [isMediaUnitOpen, setIsMediaUnitOpen] = useState(true);

  const { mediaUnits } = useMediaUnits();

  const showMediaUnitFilter = isSidebarOpen && mediaUnits.length > 0;

  return (
    <div className="min-h-screen flex text-gray-100 selection:bg-blue-500/30">
      {/* ── Sidebar ── */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="bg-[#0b1224] border-l border-white/5 flex flex-col h-screen fixed right-0 z-50 overflow-hidden"
      >
        {/* Logo */}
        <div className="p-6 flex items-center justify-between shrink-0">
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-[#2563eb] rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                <Sparkles className="text-white w-6 h-6" />
              </div>
              <span className="font-arabic font-bold text-xl tracking-tight">AI HUB</span>
            </motion.div>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-white/5 rounded-xl transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="px-3 py-2 shrink-0">
          <button
            onClick={() => setActiveModule('DASHBOARD')}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 group ${
              activeModule === 'DASHBOARD'
                ? 'bg-[#2563eb] text-white shadow-lg shadow-blue-600/20'
                : 'hover:bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles size={22} className="group-hover:scale-110 transition-transform shrink-0" />
            {isSidebarOpen && (
              <span className="font-arabic font-medium truncate">وحدة الذكاء الاصطناعي</span>
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
              className="mx-3 mt-3 overflow-hidden shrink-0"
            >
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
                {/* Header */}
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

                {/* Options */}
                <AnimatePresence>
                  {isMediaUnitOpen && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 space-y-1">
                        {/* All */}
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

                        {/* Units */}
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

        {/* Spacer */}
        <div className="flex-1" />

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

      {/* ── Main Content ── */}
      <main className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'pr-[280px]' : 'pr-[80px]'}`}>
        <header className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#020617]/50 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-6 flex-1">
            <div className="relative w-full max-w-md group">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#2563eb] transition-colors" size={18} />
              <input
                type="text"
                placeholder="ابحث عن أداة أو فكرة..."
                className="w-full bg-[#0b1224] border border-white/5 rounded-2xl py-2.5 pr-12 pl-4 focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all outline-none text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Active media unit badge in header */}
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

            <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-sm">
                SH
              </div>
              <div className="flex flex-col text-right">
                <span className="text-sm font-bold">ستوديو التحرير</span>
                <span className="text-xs text-gray-500">مشترك متميز</span>
              </div>
            </div>
          </div>
        </header>

        <div className="p-5 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeModule !== 'DASHBOARD' && (
                <button
                  onClick={() => setActiveModule('DASHBOARD')}
                  className="mb-4 flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
                >
                  <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center group-hover:bg-[#2563eb] group-hover:text-white transition-all">
                    <ChevronLeft size={18} className="rotate-180" />
                  </div>
                  <span className="font-arabic text-sm">العودة إلى وحدة الذكاء الاصطناعي</span>
                </button>
              )}

              {activeModule === 'DASHBOARD' && <Dashboard setActiveModule={setActiveModule} />}
              {activeModule === 'IDEAS' && <IdeaGeneration mediaUnitId={selectedMediaUnitId} />}
              {activeModule === 'EDITING' && <TextEditing />}
              {activeModule === 'SOCIAL' && <SocialMedia mediaUnitId={selectedMediaUnitId} />}
              {activeModule === 'AUDIO' && <AudioProcessing />}
              {activeModule === 'NEWS' && <NewsRoom mediaUnitId={selectedMediaUnitId} />}
              {activeModule === 'CHAT' && <ChatInterface />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function Dashboard({ setActiveModule }: { setActiveModule: (m: ModuleId) => void }) {
  const cards = [
    { id: 'IDEAS',   title: 'وحدة التفكير',        desc: 'توليد أفكار مبدعة، أسئلة مقابلات، وعناوين جذابة.',  icon: Lightbulb,     color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { id: 'EDITING', title: 'التحرير الصحفي',       desc: 'إعادة صياغة، تلخيص، وتدقيق لغوي فوري.',            icon: PenTool,       color: 'text-blue-400',   bg: 'bg-blue-400/10'   },
    { id: 'SOCIAL',  title: 'التواصل الاجتماعي',    desc: 'منشورات تفاعلية، هاشتاجات، وتحويل الأخبار.',       icon: Share2,        color: 'text-pink-400',   bg: 'bg-pink-400/10'   },
    { id: 'AUDIO',   title: 'المختبر الصوتي',       desc: 'تحويل الصوت إلى نص وبالعكس من الأرشيف.',           icon: Mic2,          color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { id: 'NEWS',    title: 'غرفة الأخبار',         desc: 'إنشاء نشرات ومواجيز إخبارية من مادتك الخبرية.',    icon: Newspaper,     color: 'text-emerald-400',bg: 'bg-emerald-400/10'},
    { id: 'CHAT',    title: 'مساعد AI ذكي',         desc: 'دردشة تفاعلية لمساعدتك في المهام الإعلامية.',      icon: MessageSquare, color: 'text-blue-500',   bg: 'bg-blue-500/10'   },
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
            onClick={() => setActiveModule(card.id as ModuleId)}
            className="glass-panel p-5 text-right group hover:border-[#2563eb] transition-all duration-300 hover:-translate-y-1 flex flex-col gap-4 h-full"
          >
            <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center transition-transform group-hover:scale-110`}>
              <card.icon className={`${card.color} w-5 h-5`} />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <h3 className="text-base font-bold">{card.title}</h3>
              <p className="text-gray-400 text-xs leading-relaxed">{card.desc}</p>
            </div>
            <div className="flex items-center text-[#2563eb] font-bold text-xs gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <span>ابدأ الآن</span>
              <ChevronLeft size={14} />
            </div>
          </button>
        ))}
      </div>

      <div className="glass-panel p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold">آخر النشاطات</h3>
          <button className="text-[#2563eb] text-xs hover:underline">عرض الكل</button>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500/10 text-blue-400 rounded-lg flex items-center justify-center">
                  <Sparkles size={14} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold">توليد عناوين لمقالة "مستقبل AI"</span>
                  <span className="text-xs text-gray-500">تمت العملية قبل 10 دقائق</span>
                </div>
              </div>
              <button className="p-1.5 hover:bg-white/5 rounded-lg">
                <ChevronLeft size={16} className="translate-x-1" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
