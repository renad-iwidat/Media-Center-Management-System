/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Media Center Management System - Elderly-Friendly UI
 * تصميم مبسط وواضح لكبار السن مع تنقل تسلسلي
 */

import { useState, useEffect, useCallback } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Rss,
  AlertTriangle,
  FileEdit,
  CheckCircle,
  PenTool,
  Lightbulb,
  Share2,
  Mic2,
  Newspaper,
  MessageSquare,
  Sparkles,
  Menu,
  X,
  Settings2,
  Building2,
  ChevronDown,
  TrendingUp,
  LogOut,
  ChevronLeft,
  Home,
  ArrowRight,
} from 'lucide-react';

import { OverviewView } from './components/news/OverviewView';
import { SourcesView } from './components/news/SourcesView';
import { IncompleteView } from './components/news/IncompleteView';
import { QueueView } from './components/news/QueueView';
import { PoliciesView } from './components/news/PoliciesView';
import { PublishedView } from './components/news/PublishedView';
import { SystemSettingsModal } from './components/shared/SystemSettingsModal';
import { LoginPage } from './components/auth/LoginPage';
import IdeaGeneration from './components/ai/IdeaGeneration';
import TextEditing from './components/ai/TextEditing';
import SocialMedia from './components/ai/SocialMedia';
import AudioProcessing from './components/ai/AudioProcessing';
import NewsRoom from './components/ai/NewsRoom';
import ChatInterface from './components/ai/ChatInterface';
import SmartTranscription from './components/ai/SmartTranscription';

import { api, getAuthToken, getCurrentUser, clearAuthToken, clearCurrentUser } from './services/api';
import { useMediaUnits, clearMediaUnitsCache } from './lib/useMediaUnits';
import { useRenderTracker } from './lib/useRenderTracker';

// دعم runtime environment variables من Docker
const getEnvVar = (key: keyof ImportMetaEnv): string | undefined => {
  if (typeof window !== 'undefined' && window.ENV && window.ENV[key]) {
    return window.ENV[key];
  }
  return import.meta.env[key];
};

type SectionId =
  | 'overview' | 'sources' | 'incomplete' | 'queue' | 'policies' | 'published'
  | 'ai-dashboard' | 'ideas' | 'editing' | 'social' | 'audio' | 'newsroom' | 'chat' | 'smart-transcription';

interface NavItem {
  id: SectionId;
  label: string;
  description: string;
  icon: any;
  group: 'news' | 'ai';
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview',   label: 'نظرة عامة',         description: 'ملخص الأخبار والإحصائيات',    icon: LayoutDashboard, group: 'news' },
  { id: 'sources',    label: 'مصادر المحتوى',      description: 'إدارة مصادر الأخبار',         icon: Rss,            group: 'news' },
  { id: 'incomplete', label: 'أخبار غير مكتملة',   description: 'أخبار تحتاج إكمال',           icon: AlertTriangle,  group: 'news' },
  { id: 'queue',      label: 'ستوديو التحرير',     description: 'تحرير ومراجعة الأخبار',       icon: FileEdit,       group: 'news' },
  { id: 'policies',   label: 'السياسات التحريرية',  description: 'قواعد وسياسات النشر',         icon: PenTool,        group: 'news' },
  { id: 'published',  label: 'الأرشيف المنشور',    description: 'الأخبار المنشورة سابقاً',     icon: CheckCircle,    group: 'news' },
  { id: 'ai-dashboard', label: 'أدوات الذكاء الاصطناعي', description: 'جميع أدوات AI',        icon: Sparkles,       group: 'ai' },
  { id: 'ideas',      label: 'وحدة التفكير',       description: 'توليد أفكار وعناوين',         icon: Lightbulb,      group: 'ai' },
  { id: 'editing',    label: 'التحرير الصحفي',     description: 'إعادة صياغة وتلخيص',          icon: PenTool,        group: 'ai' },
  { id: 'social',     label: 'التواصل الاجتماعي',  description: 'منشورات وهاشتاجات',           icon: Share2,         group: 'ai' },
  { id: 'audio',      label: 'المختبر الصوتي',     description: 'تحويل صوت لنص',               icon: Mic2,           group: 'ai' },
  { id: 'newsroom',   label: 'غرفة الأخبار',       description: 'إنشاء نشرات إخبارية',         icon: Newspaper,      group: 'ai' },
  { id: 'chat',       label: 'مساعد AI ذكي',       description: 'دردشة مع المساعد',            icon: MessageSquare,  group: 'ai' },
  { id: 'smart-transcription', label: 'التفريغ الذكي', description: 'تفريغ صوتي ذكي',          icon: Sparkles,       group: 'ai' },
];

const SECTION_LABELS: Record<SectionId, string> = {} as any;
NAV_ITEMS.forEach(i => { (SECTION_LABELS as any)[i.id] = i.label; });

const SECTION_ICONS: Record<SectionId, any> = {} as any;
NAV_ITEMS.forEach(i => { (SECTION_ICONS as any)[i.id] = i.icon; });

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = getAuthToken();
    const user = getCurrentUser();
    return !!(token && user);
  });

  const [currentUser, setCurrentUserState] = useState(() => getCurrentUser());

  const [isCheckingAuth, setIsCheckingAuth] = useState(() => {
    const token = getAuthToken();
    const user = getCurrentUser();
    return !!(token && !user);
  });

  const [activeSection, setActiveSection] = useState<SectionId>(() => {
    const saved = localStorage.getItem('activeSection');
    return (saved as SectionId) || 'overview';
  });

  if (process.env.NODE_ENV === 'development') {
    useRenderTracker('App', { isAuthenticated, isCheckingAuth, activeSection });
  }

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedMediaUnitId, setSelectedMediaUnitId] = useState<number | null>(() => {
    const saved = localStorage.getItem('selectedUnitId');
    return saved ? Number(saved) : null;
  });

  const [isSystemOnline, setIsSystemOnline] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { mediaUnits, loading, refetch: refetchMediaUnits } = useMediaUnits();

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

  useEffect(() => {
    let isMounted = true;
    let hasRun = false;

    const verifyToken = async () => {
      if (hasRun || !isCheckingAuth) return;
      hasRun = true;

      try {
        const token = getAuthToken();
        if (!token) {
          if (isMounted) { setIsAuthenticated(false); setIsCheckingAuth(false); }
          return;
        }

        const user = getCurrentUser();
        if (user) {
          if (isMounted) { setCurrentUserState(user); setIsAuthenticated(true); setIsCheckingAuth(false); }
          return;
        }

        const managementApiUrl = getEnvVar('VITE_MANAGEMENT_API_URL') || 'https://media-center-management-system.onrender.com';
        try {
          const response = await fetch(`${managementApiUrl}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          });
          if (!isMounted) return;
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              setCurrentUserState(data.data);
              setIsAuthenticated(true);
            } else {
              clearAuthToken(); clearCurrentUser(); setIsAuthenticated(false);
            }
          } else {
            clearAuthToken(); clearCurrentUser(); setIsAuthenticated(false);
          }
        } catch {
          const savedUser = getCurrentUser();
          if (savedUser && token) {
            setCurrentUserState(savedUser); setIsAuthenticated(true);
          } else {
            clearAuthToken(); clearCurrentUser(); setIsAuthenticated(false);
          }
        }
      } catch {
        if (isMounted) setIsAuthenticated(false);
      } finally {
        if (isMounted) setIsCheckingAuth(false);
      }
    };

    if (isCheckingAuth) verifyToken();

    const emergencyTimeout = setTimeout(() => {
      if (isMounted) setIsCheckingAuth(false);
    }, 8000);

    return () => { isMounted = false; clearTimeout(emergencyTimeout); };
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (!isAuthenticated) return;
    api.getSystemToggles()
      .then((res) => {
        if (isMounted) {
          const d = res.data || {};
          setIsSystemOnline(!!(d.scheduler_enabled && d.classifier_enabled && d.flow_enabled));
        }
      })
      .catch(() => { if (isMounted) setIsSystemOnline(false); });
    return () => { isMounted = false; };
  }, [isAuthenticated]);

  useEffect(() => {
    let isMounted = true;
    if (!isAuthenticated) return;
    if (isMounted) {
      clearMediaUnitsCache();
      setTimeout(() => { if (isMounted) refetchMediaUnits(); }, 100);
    }
    return () => { isMounted = false; };
  }, [isAuthenticated]);

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    setCurrentUserState(null);
    setIsCheckingAuth(false);
    localStorage.setItem('justLoggedOut', 'true');
    clearAuthToken();
    clearCurrentUser();
    clearMediaUnitsCache();
  }, []);

  const ActiveIcon = SECTION_ICONS[activeSection] || LayoutDashboard;
  const isAISection = activeSection.startsWith('ai-') || ['ideas', 'editing', 'social', 'audio', 'newsroom', 'chat', 'smart-transcription'].includes(activeSection);

  // ═══ Login Screen ═══
  if (!isAuthenticated) {
    return (
      <LoginPage
        onLoginSuccess={() => {
          const user = getCurrentUser();
          setIsAuthenticated(true);
          setCurrentUserState(user);
          setIsCheckingAuth(false);
        }}
      />
    );
  }

  // ═══ Loading Screen ═══
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-gradient-to-br from-[#FF9F4A] to-[#FF8C2E] rounded-3xl flex items-center justify-center shadow-2xl shadow-[#FF9F4A]/40 mx-auto">
            <TrendingUp className="text-white w-10 h-10" />
          </div>
          <div className="flex items-center justify-center gap-3">
            <div className="w-3 h-3 bg-[#FF9F4A] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-3 h-3 bg-[#FF9F4A] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-3 h-3 bg-[#FF9F4A] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="text-[#1e293b] text-xl font-bold">جاري التحقق من بيانات الدخول...</p>
        </div>
      </div>
    );
  }

  // ═══ Main Layout ═══
  return (
    <div className="min-h-screen flex text-[#1e293b] bg-[#f0f4f8]">
      {/* Skip to content - Accessibility */}
      <a href="#main-content" className="skip-to-content">
        انتقل إلى المحتوى الرئيسي
      </a>

      {/* ══ SIDEBAR ══ */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 320 : 88 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="bg-gradient-to-b from-[#1f3a4f] to-[#0f2535] flex flex-col h-screen fixed right-0 top-0 z-50 overflow-hidden shadow-2xl"
        role="navigation"
        aria-label="القائمة الرئيسية"
      >
        {/* Logo Header */}
        <div className="h-20 flex items-center justify-between px-5 shrink-0 border-b border-white/10">
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-4 min-w-0"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-[#FF9F4A] to-[#FF8C2E] rounded-2xl flex items-center justify-center shadow-lg shadow-[#FF9F4A]/30 shrink-0">
                  <TrendingUp className="text-white w-6 h-6" />
                </div>
                <div>
                  <p className="font-arabic font-bold text-xl text-white leading-tight">مركز <span className="text-[#FF9F4A]">الإعلام</span></p>
                  <p className="text-white/50 text-sm mt-0.5">نظام إدارة الأخبار</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!isSidebarOpen && (
            <div className="w-12 h-12 bg-gradient-to-br from-[#FF9F4A] to-[#FF8C2E] rounded-2xl flex items-center justify-center shadow-lg shadow-[#FF9F4A]/30 mx-auto">
              <TrendingUp className="text-white w-6 h-6" />
            </div>
          )}

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-3 hover:bg-white/10 rounded-xl transition-colors shrink-0"
            aria-label={isSidebarOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
          >
            {isSidebarOpen ? <ChevronLeft size={22} className="text-white/70" /> : <Menu size={22} className="text-white/70" />}
          </button>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar space-y-2">
          {/* News Management Group */}
          {isSidebarOpen && (
            <p className="text-sm font-bold text-[#FF9F4A] uppercase tracking-wider px-3 mb-3">
              إدارة الأخبار
            </p>
          )}
          {NAV_ITEMS.filter(i => i.group === 'news').map((item) => {
            const isActive = activeSection === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                title={!isSidebarOpen ? item.label : undefined}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-200 ${
                  isActive
                    ? 'bg-[#FF9F4A] text-white shadow-lg shadow-[#FF9F4A]/30'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                } ${!isSidebarOpen ? 'justify-center px-3' : ''}`}
              >
                <div className={`shrink-0 flex items-center justify-center w-11 h-11 rounded-xl ${
                  isActive ? 'bg-white/20' : 'bg-white/5'
                }`}>
                  <Icon size={22} />
                </div>
                {isSidebarOpen && (
                  <div className="flex-1 text-right min-w-0">
                    <span className="text-base font-bold block truncate">{item.label}</span>
                    <span className={`text-sm block truncate ${isActive ? 'text-white/80' : 'text-white/40'}`}>
                      {item.description}
                    </span>
                  </div>
                )}
              </button>
            );
          })}

          {/* Divider */}
          <div className="mx-3 my-4 h-px bg-white/10" />

          {/* AI Tools Group */}
          {isSidebarOpen && (
            <p className="text-sm font-bold text-[#FF9F4A] uppercase tracking-wider px-3 mb-3">
              أدوات الذكاء الاصطناعي
            </p>
          )}
          {NAV_ITEMS.filter(i => i.group === 'ai').map((item) => {
            const isActive = activeSection === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                title={!isSidebarOpen ? item.label : undefined}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-200 ${
                  isActive
                    ? 'bg-[#FF9F4A] text-white shadow-lg shadow-[#FF9F4A]/30'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                } ${!isSidebarOpen ? 'justify-center px-3' : ''}`}
              >
                <div className={`shrink-0 flex items-center justify-center w-11 h-11 rounded-xl ${
                  isActive ? 'bg-white/20' : 'bg-white/5'
                }`}>
                  <Icon size={22} />
                </div>
                {isSidebarOpen && (
                  <div className="flex-1 text-right min-w-0">
                    <span className="text-base font-bold block truncate">{item.label}</span>
                    <span className={`text-sm block truncate ${isActive ? 'text-white/80' : 'text-white/40'}`}>
                      {item.description}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </nav>


        {/* Settings + User Footer */}
        <div className="border-t border-white/10 p-3 space-y-2 shrink-0">
          <button
            onClick={() => setIsSettingsOpen(true)}
            title="إعدادات النظام"
            aria-label="إعدادات النظام"
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all text-white/60 hover:bg-white/10 hover:text-white ${!isSidebarOpen ? 'justify-center' : ''}`}
          >
            <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/5">
              <Settings2 size={22} />
            </div>
            {isSidebarOpen && <span className="text-base font-bold">إعدادات النظام</span>}
          </button>

          {isSidebarOpen ? (
            <div className="flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4A7C9E] to-[#3d6a8a] flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-lg">
                {currentUser?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-white truncate">{currentUser?.name || 'المستخدم'}</p>
                <p className="text-sm text-[#FF9F4A] truncate">{currentUser?.roles?.[0]?.name || 'موظف'}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-3 hover:bg-red-500/20 rounded-xl transition-colors text-white/40 hover:text-red-400 shrink-0"
                title="تسجيل الخروج"
                aria-label="تسجيل الخروج"
              >
                <LogOut size={22} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              title="تسجيل الخروج"
              aria-label="تسجيل الخروج"
              className="w-full flex items-center justify-center p-3.5 rounded-2xl transition-all text-white/40 hover:bg-red-500/15 hover:text-red-400"
            >
              <LogOut size={22} />
            </button>
          )}
        </div>
      </motion.aside>

      {/* ══ MAIN CONTENT ══ */}
      <main
        id="main-content"
        className="flex-1 flex flex-col h-screen overflow-hidden"
        style={{
          paddingRight: isSidebarOpen ? '320px' : '88px',
          transition: 'padding-right 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Top Header - Simple & Clear */}
        <header className="shrink-0 bg-white border-b-2 border-[#e2e8f0] shadow-sm">
          {/* Main header row */}
          <div className="h-20 flex items-center justify-between px-8">
            {/* Breadcrumb - Large & Clear */}
            <div className="flex items-center gap-4 min-w-0">
              <button
                onClick={() => setActiveSection('overview')}
                className="p-3 rounded-xl hover:bg-[#f0f4f8] transition-colors"
                aria-label="الصفحة الرئيسية"
              >
                <Home size={24} className="text-[#3d6a8a]" />
              </button>
              <ArrowRight size={20} className="text-[#cbd5e1] shrink-0" />
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  isAISection ? 'bg-purple-100' : 'bg-[#3d6a8a]/10'
                }`}>
                  <ActiveIcon size={24} className={isAISection ? 'text-purple-600' : 'text-[#3d6a8a]'} />
                </div>
                <h1 className="text-2xl font-bold text-[#1e293b] truncate">
                  {SECTION_LABELS[activeSection]}
                </h1>
              </div>
            </div>

            {/* Right side - Status */}
            <div className="flex items-center gap-4 shrink-0">
              {/* System Status */}
              <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 text-base font-bold ${
                isSystemOnline
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-gray-50 border-gray-200 text-gray-500'
              }`}>
                <div className={`w-3 h-3 rounded-full shrink-0 ${isSystemOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                <span>{isSystemOnline ? 'النظام نشط' : 'النظام متوقف'}</span>
              </div>
            </div>
          </div>

          {/* Media Unit Selector - Clear horizontal bar */}
          <div className="px-8 py-3 bg-[#f8fafc] border-t border-[#e2e8f0]">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 shrink-0">
                <Building2 size={22} className="text-[#3d6a8a]" />
                <span className="text-base font-bold text-[#1e293b]">الوحدة الإعلامية:</span>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => setSelectedMediaUnitId(null)}
                  className={`px-5 py-3 rounded-xl text-base font-bold transition-all border-2 min-h-[48px] ${
                    selectedMediaUnitId === null
                      ? 'bg-[#3d6a8a] text-white border-[#3d6a8a] shadow-md'
                      : 'bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#3d6a8a] hover:text-[#1e293b]'
                  }`}
                >
                  جميع الوحدات
                </button>
                {loading ? (
                  <span className="text-base text-[#94a3b8] px-4">جاري التحميل...</span>
                ) : (
                  mediaUnits.map((mu: { id: number; name: string }) => (
                    <button
                      key={mu.id}
                      onClick={() => setSelectedMediaUnitId(mu.id)}
                      className={`px-5 py-3 rounded-xl text-base font-bold transition-all border-2 min-h-[48px] ${
                        selectedMediaUnitId === mu.id
                          ? 'bg-[#3d6a8a] text-white border-[#3d6a8a] shadow-md'
                          : 'bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#3d6a8a] hover:text-[#1e293b]'
                      }`}
                    >
                      {mu.name}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="max-w-6xl mx-auto p-6 sm:p-8"
            >
              {/* Page Header */}
              {!isAISection && activeSection !== 'overview' && (
                <div className="mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#3d6a8a] to-[#2d5570] rounded-2xl flex items-center justify-center shadow-lg shadow-[#3d6a8a]/20 shrink-0">
                      <ActiveIcon size={28} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-[#1e293b]">{SECTION_LABELS[activeSection]}</h2>
                      <p className="text-[#64748b] text-base mt-1">
                        {NAV_ITEMS.find(i => i.id === activeSection)?.description}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* News Views */}
              {activeSection === 'overview'   && <OverviewView unitId={selectedMediaUnitId} />}
              {activeSection === 'sources'    && <SourcesView autoEnabled={isSystemOnline} />}
              {activeSection === 'incomplete' && <IncompleteView unitId={selectedMediaUnitId} />}
              {activeSection === 'queue'      && <QueueView unitId={selectedMediaUnitId} />}
              {activeSection === 'policies'   && <PoliciesView unitId={selectedMediaUnitId} />}
              {activeSection === 'published'  && <PublishedView unitId={selectedMediaUnitId} />}

              {/* AI Views */}
              {activeSection === 'ai-dashboard' && <AIDashboard setActiveSection={setActiveSection} />}
              {activeSection === 'ideas'        && <IdeaGeneration mediaUnitId={selectedMediaUnitId} />}
              {activeSection === 'editing'      && <TextEditing mediaUnitId={selectedMediaUnitId} />}
              {activeSection === 'social'       && <SocialMedia mediaUnitId={selectedMediaUnitId} />}
              {activeSection === 'audio'        && <AudioProcessing mediaUnitId={selectedMediaUnitId} />}
              {activeSection === 'newsroom'     && <NewsRoom mediaUnitId={selectedMediaUnitId} />}
              {activeSection === 'chat'         && <ChatInterface />}
              {activeSection === 'smart-transcription' && <SmartTranscription mediaUnitId={selectedMediaUnitId} />}
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

// ─── AI Dashboard - Elderly Friendly ────────────────────────────────────────
const AIDashboard = React.memo(({ setActiveSection }: { setActiveSection: (s: SectionId) => void }) => {
  const cards = [
    {
      id: 'ideas' as SectionId,
      title: 'وحدة التفكير',
      desc: 'توليد أفكار مبدعة، أسئلة مقابلات، وعناوين جذابة.',
      icon: Lightbulb,
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
    },
    {
      id: 'editing' as SectionId,
      title: 'التحرير الصحفي',
      desc: 'إعادة صياغة، تلخيص، وتدقيق لغوي فوري.',
      icon: PenTool,
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      iconBg: 'bg-blue-100',
      iconColor: 'text-[#4A7C9E]',
    },
    {
      id: 'social' as SectionId,
      title: 'التواصل الاجتماعي',
      desc: 'منشورات تفاعلية، هاشتاجات، وتحويل الأخبار لمنشورات.',
      icon: Share2,
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      iconBg: 'bg-orange-100',
      iconColor: 'text-[#FF9F4A]',
    },
    {
      id: 'audio' as SectionId,
      title: 'المختبر الصوتي',
      desc: 'تحويل الصوت إلى نص مكتوب والعكس.',
      icon: Mic2,
      bg: 'bg-violet-50',
      border: 'border-violet-200',
      iconBg: 'bg-violet-100',
      iconColor: 'text-violet-600',
    },
    {
      id: 'newsroom' as SectionId,
      title: 'غرفة الأخبار',
      desc: 'إنشاء نشرات ومواجيز إخبارية احترافية.',
      icon: Newspaper,
      bg: 'bg-teal-50',
      border: 'border-teal-200',
      iconBg: 'bg-teal-100',
      iconColor: 'text-teal-600',
    },
    {
      id: 'chat' as SectionId,
      title: 'مساعد AI ذكي',
      desc: 'دردشة تفاعلية لمساعدتك في أي مهمة إعلامية.',
      icon: MessageSquare,
      bg: 'bg-pink-50',
      border: 'border-pink-200',
      iconBg: 'bg-pink-100',
      iconColor: 'text-pink-600',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero - Large & Clear */}
      <div className="bg-gradient-to-bl from-[#2d5570] via-[#3d6a8a] to-[#1f3a4f] rounded-3xl p-8 sm:p-10 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-80 h-80 bg-[#FF9F4A]/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-16 h-16 bg-gradient-to-br from-[#FF9F4A] to-[#FF8C2E] rounded-2xl flex items-center justify-center shadow-xl shadow-[#FF9F4A]/30 shrink-0">
            <Sparkles className="text-white w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-arabic font-bold text-white">أدوات الذكاء الاصطناعي</h1>
            <p className="text-white/70 text-lg mt-2">اختر الأداة التي تريد استخدامها</p>
          </div>
        </div>
      </div>

      {/* Cards Grid - Large touch targets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => setActiveSection(card.id)}
            className={`${card.bg} border-2 ${card.border} rounded-3xl p-7 text-right group hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col gap-5 min-h-[180px]`}
            aria-label={`فتح ${card.title}`}
          >
            <div className="flex items-start justify-between">
              <div className={`w-14 h-14 ${card.iconBg} rounded-2xl flex items-center justify-center shrink-0`}>
                <card.icon className={`${card.iconColor} w-7 h-7`} />
              </div>
              <ChevronLeft size={22} className="text-gray-300 group-hover:text-gray-500 transition-colors mt-2" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#1e293b] mb-2">{card.title}</h3>
              <p className="text-[#64748b] text-base leading-relaxed">{card.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
});
