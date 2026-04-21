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
  LayoutDashboard,
  Search,
  Bell,
  Settings,
  Menu,
  X
} from 'lucide-react';

// Modules (will be implemented in separate files or components)
import IdeaGeneration from './components/modules/IdeaGeneration';
import TextEditing from './components/modules/TextEditing';
import SocialMedia from './components/modules/SocialMedia';
import AudioProcessing from './components/modules/AudioProcessing';
import NewsRoom from './components/modules/NewsRoom';
import ChatInterface from './components/modules/ChatInterface';

type ModuleId = 'IDEAS' | 'EDITING' | 'SOCIAL' | 'AUDIO' | 'NEWS' | 'CHAT' | 'DASHBOARD';

export default function App() {
  const [activeModule, setActiveModule] = useState<ModuleId>('DASHBOARD');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const menuItems = [
    { id: 'DASHBOARD', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'IDEAS', label: 'وحدة الأفكار', icon: Lightbulb },
    { id: 'EDITING', label: 'التحرير الصحفي', icon: PenTool },
    { id: 'SOCIAL', label: 'التواصل الاجتماعي', icon: Share2 },
    { id: 'AUDIO', label: 'المختبر الصوتي', icon: Mic2 },
    { id: 'NEWS', label: 'غرفة الأخبار', icon: Newspaper },
    { id: 'CHAT', label: 'مساعد AI ذكي', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen flex text-gray-100 selection:bg-blue-500/30">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="bg-brand-surface border-l border-brand-border flex flex-col h-screen fixed right-0 z-50 overflow-hidden"
      >
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-brand-accent rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
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

        <nav className="flex-1 px-3 py-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id as ModuleId)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 group ${
                activeModule === item.id 
                ? 'bg-brand-accent text-white shadow-lg shadow-blue-600/20' 
                : 'hover:bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <item.icon size={22} className={activeModule === item.id ? 'text-white' : 'group-hover:scale-110 transition-transform'} />
              {isSidebarOpen && (
                <span className="font-arabic font-medium truncate">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-brand-border">
          <div className={`flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 cursor-pointer ${!isSidebarOpen && 'justify-center'}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-sm">
              SH
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col">
                <span className="text-sm font-bold">ستوديو التحرير</span>
                <span className="text-xs text-gray-500">مشترك متميز</span>
              </div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'pr-[280px]' : 'pr-[80px]'}`}>
        <header className="h-20 border-b border-brand-border flex items-center justify-between px-8 bg-brand-bg/50 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-6 flex-1">
            <div className="relative w-full max-w-md group">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-accent transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="ابحث عن أداة أو فكرة..."
                className="w-full bg-brand-surface border border-brand-border rounded-2xl py-2.5 pr-12 pl-4 focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition-all outline-none text-sm"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 cursor-pointer`}>
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

        <div className="p-8 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeModule === 'DASHBOARD' && <Dashboard setActiveModule={setActiveModule} />}
              {activeModule === 'IDEAS' && <IdeaGeneration />}
              {activeModule === 'EDITING' && <TextEditing />}
              {activeModule === 'SOCIAL' && <SocialMedia />}
              {activeModule === 'AUDIO' && <AudioProcessing />}
              {activeModule === 'NEWS' && <NewsRoom />}
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
    { id: 'IDEAS', title: 'توليد أفكار مبدعة', desc: 'اقتراحات برامج، أسئلة مقابلات، وعناوين جذابة.', icon: Lightbulb, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { id: 'EDITING', title: 'محرر النصوص الذكي', icon: PenTool, desc: 'إعادة صياغة، تلخيص، وتدقيق لغوي فوري.', color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { id: 'AUDIO', title: 'المختبر الصوتي', icon: Mic2, desc: 'تحويل الصوت إلى نص وبالعكس بأصوات طبيعية.', color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { id: 'NEWS', title: 'غرفة الأخبار', icon: Newspaper, desc: 'إنشاء نشرات ومواجيز إخبارية جاهزة للإلقاء.', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl text-white">أهلاً بك في وحدة الذكاء الاصطناعي</h1>
        <p className="text-gray-400 text-lg">بماذا يمكننا مساعدتك اليوم في رحلتك الإبداعية؟</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => setActiveModule(card.id as ModuleId)}
            className="glass-panel p-8 text-right group hover:border-brand-accent transition-all duration-300 hover:-translate-y-2 flex flex-col gap-6 h-full"
          >
            <div className={`w-14 h-14 ${card.bg} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110`}>
              <card.icon className={`${card.color} w-8 h-8`} />
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <h3 className="text-xl">{card.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{card.desc}</p>
            </div>
            <div className="flex items-center text-brand-accent font-bold text-sm gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <span>ابدأ الآن</span>
              <ChevronLeft size={16} />
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1">
        <div className="glass-panel p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl">آخر النشاطات</h3>
            <button className="text-brand-accent text-sm hover:underline">عرض الكل</button>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center">
                    <Sparkles size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold">توليد عناوين لمقالة "مستقبل AI"</span>
                    <span className="text-xs text-gray-500">تمت العملية قبل 10 دقائق</span>
                  </div>
                </div>
                <button className="p-2 hover:bg-white/5 rounded-lg">
                  <ChevronLeft size={18} className="translate-x-1" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
