/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Merged Frontend — News Management + AI Hub
 * سايدبار موحد يجمع كل الأقسام من كلا المشروعين
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
  Search,
  Settings2,
  Building2,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  LogOut,
  Bell,
  ChevronLeft,
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
import { useDebounce } from './lib/useDebounce';

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

interface NavGroup {
  label: string;
  icon: any;
  items: { id: SectionId; label: string; icon: any }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'إدارة الأخبار',
    icon: Newspaper,
    items: [
      { id: 'overview',   label: 'نظرة عامة',         icon: LayoutDashboard },
      { id: 'sources',    label: 'مصادر المحتوى',      icon: Rss },
      { id: 'incomplete', label: 'أخبار غير مكتملة',   icon: AlertTriangle },
      { id: 'queue',      label: 'ستوديو التحرير',     icon: FileEdit },
      { id: 'policies',   label: 'السياسات التحريرية',  icon: PenTool },
      { id: 'published',  label: 'الأرشيف المنشور',    icon: CheckCircle },
    ],
  },
  {
    label: 'أدوات الذكاء الاصطناعي',
    icon: Sparkles,
    items: [
      { id: 'ai-dashboard', label: 'وحدة AI',           icon: Sparkles },
      { id: 'ideas',        label: 'وحدة التفكير',       icon: Lightbulb },
      { id: 'editing',      label: 'التحرير الصحفي',     icon: PenTool },
      { id: 'social',       label: 'التواصل الاجتماعي',  icon: Share2 },
      { id: 'audio',        label: 'المختبر الصوتي',     icon: Mic2 },
      { id: 'newsroom',     label: 'غرفة الأخبار',       icon: Newspaper },
      { id: 'chat',         label: 'مساعد AI ذكي',       icon: MessageSquare },
      { id: 'smart-transcription', label: 'التفريغ الذكي', icon: Sparkles },
    ],
  },
];

const SECTION_LABELS: Record<SectionId, string> = {} as any;
NAV_GROUPS.forEach(g => g.items.forEach(i => { (SECTION_LABELS as any)[i.id] = i.label; }));

const SECTION_ICONS: Record<SectionId, any> = {} as any;
NAV_GROUPS.forEach(g => g.items.forEach(i => { (SECTION_ICONS as any)[i.id] = i.icon; }));

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
  const [isMediaUnitOpen, setIsMediaUnitOpen] = useState(true);
  const [selectedMediaUnitId, setSelectedMediaUnitId] = useState<number | null>(() => {
    const saved = localStorage.getItem('selectedUnitId');
    return saved ? Number(saved) : null;
  });

  const [isSystemOnline, setIsSystemOnline] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ id: SectionId; label: string; group: string }>>([]);

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

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (debouncedSearchQuery.trim() === '') { setSearchResults([]); return; }
    const query = debouncedSearchQuery.toLowerCase().trim();
    const results: Array<{ id: SectionId; label: string; group: string }> = [];
    NAV_GROUPS.forEach((group) => {
      group.items.forEach((item) => {
        if (item.label.toLowerCase().includes(query) || group.label.toLowerCase().includes(query)) {
          results.push({ id: item.id, label: item.label, group: group.label });
        }
      });
    });
    setSearchResults(results);
  }, [debouncedSearchQuery]);

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    setCurrentUserState(null);
    setIsCheckingAuth(false);
    localStorage.setItem('justLoggedOut', 'true');
    clearAuthToken();
    clearCurrentUser();
    clearMediaUnitsCache();
  }, []);

  const toggleGroup = useCallback((label: string) => {
    setCollapsedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  }, []);

  const handleSearchSelect = useCallback((sectionId: SectionId) => {
    setActiveSection(sectionId);
    setSearchQuery('');
    setIsSearchOpen(false);
  }, []);

  const ActiveIcon = SECTION_ICONS[activeSection] || LayoutDashboard;
  const isAISection = activeSection.startsWith('ai-') || ['ideas', 'editing', 'social', 'audio', 'newsroom', 'chat'].includes(activeSection);

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

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1f3a4f] via-[#2d5570] to-[#1f3a4f] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-[#FF9F4A] to-[#FF8C2E] rounded-2xl flex items-center justify-center shadow-2xl shadow-[#FF9F4A]/40 mx-auto relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
            <TrendingUp className="text-white w-8 h-8 relative z-10" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-[#FF9F4A] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-[#FF9F4A] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-[#FF9F4A] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="text-white/60 text-sm">جاري التحقق من بيانات الدخول...</p>
        </div>
      </div>
    );
  }

  const selectedUnitName = selectedMediaUnitId
    ? mediaUnits.find((m: { id: number }) => m.id === selectedMediaUnitId)?.name
    : null;

  return (
    <div
      className="min-h-screen flex text-[#1e293b] bg-[#f0f4f8]"
      style={{
        paddingRight: isSidebarOpen ? '272px' : '72px',
        transition: 'padding-right 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {/* ══ SIDEBAR ══ */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 272 : 72 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="bg-gradient-to-b from-[#1f3a4f] to-[#0f2535] flex flex-col h-screen fixed right-0 top-0 z-50 overflow-hidden shadow-2xl"
      >
        {/* Logo Header */}
        <div className="h-16 flex items-center justify-between px-4 shrink-0 border-b border-white/8">
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3 min-w-0"
              >
                <div className="w-9 h-9 bg-gradient-to-br from-[#FF9F4A] to-[#FF8C2E] rounded-xl flex items-center justify-center shadow-lg shadow-[#FF9F4A]/30 shrink-0">
                  <TrendingUp className="text-white w-5 h-5" />
                </div>
                <div>
                  <p className="font-arabic font-bold text-base text-white leading-none">مركز <span className="text-[#FF9F4A]">الإعلام</span></p>
                  <p className="text-white/40 text-[10px] mt-0.5">نظام الأخبار</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!isSidebarOpen && (
            <div className="w-9 h-9 bg-gradient-to-br from-[#FF9F4A] to-[#FF8C2E] rounded-xl flex items-center justify-center shadow-lg shadow-[#FF9F4A]/30 mx-auto">
              <TrendingUp className="text-white w-5 h-5" />
            </div>
          )}

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-2 hover:bg-white/10 rounded-lg transition-colors shrink-0 ${!isSidebarOpen ? 'hidden' : ''}`}
          >
            <ChevronLeft size={18} className="text-white/60 hover:text-white transition-colors" />
          </button>
        </div>

        {/* Toggle button when collapsed */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="mx-auto mt-3 p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Menu size={18} className="text-white/60 hover:text-white transition-colors" />
          </button>
        )}

        {/* System Status Pill */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mx-4 mt-3 mb-1"
            >
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold ${
                isSystemOnline
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-white/5 border-white/10 text-white/40'
              }`}>
                <div className={`w-2 h-2 rounded-full shrink-0 ${isSystemOnline ? 'bg-emerald-400 animate-pulse' : 'bg-white/20'}`} />
                <span>{isSystemOnline ? 'النظام الآلي نشط' : 'النظام الآلي متوقف'}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 custom-scrollbar">
          {NAV_GROUPS.map((group, groupIndex) => (
            <div key={group.label} className="mb-1">
              {/* Group Label */}
              <AnimatePresence>
                {isSidebarOpen && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => toggleGroup(group.label)}
                    className="w-full flex items-center justify-between px-4 py-2 mb-1 group"
                  >
                    <div className="flex items-center gap-2">
                      <group.icon size={13} className="text-[#FF9F4A]/70" />
                      <span className="text-[10px] font-bold tracking-widest text-white/40 uppercase group-hover:text-white/60 transition-colors">
                        {group.label}
                      </span>
                    </div>
                    <ChevronDown
                      size={13}
                      className={`text-white/30 transition-transform duration-200 ${collapsedGroups[group.label] ? '-rotate-90' : ''}`}
                    />
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Group Items */}
              <AnimatePresence>
                {!collapsedGroups[group.label] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden px-3 space-y-0.5"
                  >
                    {group.items.map((item) => {
                      const isActive = activeSection === item.id;
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveSection(item.id)}
                          title={!isSidebarOpen ? item.label : undefined}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                            isActive
                              ? 'bg-[#FF9F4A] text-white shadow-lg shadow-[#FF9F4A]/25'
                              : 'text-white/60 hover:bg-white/8 hover:text-white'
                          } ${!isSidebarOpen ? 'justify-center' : ''}`}
                        >
                          {/* Active left indicator */}
                          {isActive && isSidebarOpen && (
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white/60 rounded-l-full" />
                          )}

                          <div className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
                            isActive
                              ? 'bg-white/20'
                              : 'group-hover:bg-white/8'
                          }`}>
                            <Icon size={16} className={`transition-colors ${isActive ? 'text-white' : 'text-white/70 group-hover:text-white'}`} />
                          </div>

                          {isSidebarOpen && (
                            <span className={`text-sm font-medium truncate transition-colors ${
                              isActive ? 'text-white' : 'text-white/70 group-hover:text-white'
                            }`}>
                              {item.label}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Divider between groups */}
              {groupIndex < NAV_GROUPS.length - 1 && (
                <div className="mx-4 mt-3 mb-2 h-px bg-white/8" />
              )}
            </div>
          ))}
        </nav>

        {/* Media Unit Selector */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mx-3 mb-3 overflow-hidden"
            >
              <div className="bg-white/6 border border-white/10 rounded-xl overflow-hidden">
                <button
                  onClick={() => setIsMediaUnitOpen(!isMediaUnitOpen)}
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/5 transition-colors"
                >
                  <ChevronDown size={14} className={`text-white/50 transition-transform ${isMediaUnitOpen ? 'rotate-180' : ''}`} />
                  <div className="flex items-center gap-2">
                    <Building2 size={14} className="text-[#FF9F4A]" />
                    <span className="text-xs font-semibold text-white/70">الوحدة الإعلامية</span>
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
                      <div className="px-3 pb-3 space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                        <button
                          onClick={() => setSelectedMediaUnitId(null)}
                          className={`w-full text-right px-3 py-1.5 rounded-lg text-xs transition-all ${
                            selectedMediaUnitId === null
                              ? 'bg-[#FF9F4A]/20 text-[#FF9F4A] font-semibold'
                              : 'text-white/50 hover:text-white hover:bg-white/8'
                          }`}
                        >
                          الكل
                        </button>
                        {loading ? (
                          <p className="text-xs text-white/30 text-center py-2">تحميل...</p>
                        ) : mediaUnits.length === 0 ? (
                          <p className="text-xs text-white/30 text-center py-2">لا توجد وحدات</p>
                        ) : (
                          mediaUnits.map((mu: { id: number; name: string }) => (
                            <button
                              key={mu.id}
                              onClick={() => setSelectedMediaUnitId(mu.id)}
                              className={`w-full text-right px-3 py-1.5 rounded-lg text-xs transition-all truncate ${
                                selectedMediaUnitId === mu.id
                                  ? 'bg-[#FF9F4A]/20 text-[#FF9F4A] font-semibold'
                                  : 'text-white/50 hover:text-white hover:bg-white/8'
                              }`}
                            >
                              {mu.name}
                            </button>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings + Logout Footer */}
        <div className="border-t border-white/8 p-3 space-y-1 shrink-0">
          <button
            onClick={() => setIsSettingsOpen(true)}
            title={!isSidebarOpen ? 'إعدادات النظام' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-white/50 hover:bg-white/8 hover:text-white group ${!isSidebarOpen ? 'justify-center' : ''}`}
          >
            <div className="w-8 h-8 flex items-center justify-center rounded-lg group-hover:bg-white/8">
              <Settings2 size={16} />
            </div>
            {isSidebarOpen && <span className="text-sm font-medium">إعدادات النظام</span>}
          </button>

          {isSidebarOpen ? (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 border border-white/8">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#4A7C9E] to-[#3d6a8a] flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg">
                {currentUser?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{currentUser?.name || 'المستخدم'}</p>
                <p className="text-[10px] text-[#FF9F4A]/80 truncate">{currentUser?.roles?.[0]?.name || 'موظف'}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors text-white/30 hover:text-red-400 shrink-0"
                title="تسجيل الخروج"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              title="تسجيل الخروج"
              className="w-full flex items-center justify-center p-2.5 rounded-xl transition-all text-white/30 hover:bg-red-500/15 hover:text-red-400"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </motion.aside>

      {/* ══ MAIN CONTENT ══ */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 shrink-0 bg-white border-b border-[#e2e8f0] flex items-center justify-between px-5 sm:px-6 shadow-sm">
          {/* Left: Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                isAISection
                  ? 'bg-purple-100'
                  : 'bg-[#3d6a8a]/10'
              }`}>
                <ActiveIcon size={16} className={isAISection ? 'text-purple-600' : 'text-[#3d6a8a]'} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[#64748b] text-xs">
                  <button
                    onClick={() => setActiveSection('overview')}
                    className="hidden sm:inline text-[#64748b] hover:text-[#4A7C9E] transition-colors cursor-pointer"
                  >الرئيسية</button>
                  <ChevronRight size={12} className="hidden sm:block shrink-0" />
                  <span className={`font-semibold truncate ${isAISection ? 'text-purple-700' : 'text-[#1e293b]'}`}>
                    {SECTION_LABELS[activeSection]}
                  </span>
                </div>
              </div>
            </div>

            {/* Active unit badge */}
            {selectedUnitName && (
              <div className="hidden sm:flex items-center gap-1.5 bg-[#FF9F4A]/10 border border-[#FF9F4A]/20 text-[#FF9F4A] px-2.5 py-1 rounded-lg text-xs font-medium">
                <Building2 size={11} />
                <span className="max-w-[120px] truncate">{selectedUnitName}</span>
                <button
                  onClick={() => setSelectedMediaUnitId(null)}
                  className="hover:text-[#FF8C2E] transition-colors"
                >
                  <X size={11} />
                </button>
              </div>
            )}
          </div>

          {/* Right: Search + User */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Search */}
            <div className="relative hidden md:block">
              <div className="flex items-center gap-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2 focus-within:border-[#FF9F4A]/50 focus-within:ring-2 focus-within:ring-[#FF9F4A]/10 transition-all">
                <Search size={15} className="text-[#94a3b8] shrink-0" />
                <input
                  type="text"
                  placeholder="بحث سريع..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchOpen(true)}
                  onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
                  className="bg-transparent text-sm text-[#1e293b] placeholder-[#94a3b8] focus:outline-none w-40 focus:w-52 transition-all duration-300"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-[#94a3b8] hover:text-[#64748b]">
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Search Dropdown */}
              <AnimatePresence>
                {isSearchOpen && (searchResults.length > 0 || searchQuery.trim()) && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute left-0 top-full mt-2 w-72 bg-white border border-[#e2e8f0] rounded-2xl shadow-xl overflow-hidden z-50"
                  >
                    {searchResults.length > 0 ? (
                      <>
                        <div className="px-4 py-2.5 border-b border-[#e2e8f0] bg-[#f8fafc]">
                          <p className="text-xs text-[#64748b] font-medium">النتائج ({searchResults.length})</p>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {searchResults.map((result) => {
                            const Icon = SECTION_ICONS[result.id];
                            return (
                              <button
                                key={result.id}
                                onClick={() => handleSearchSelect(result.id)}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f8fafc] transition-colors text-right"
                              >
                                <div className="w-8 h-8 bg-[#FF9F4A]/10 rounded-lg flex items-center justify-center shrink-0">
                                  <Icon size={15} className="text-[#FF9F4A]" />
                                </div>
                                <div className="flex flex-col items-end flex-1 min-w-0">
                                  <span className="text-sm font-medium text-[#1e293b] truncate w-full">{result.label}</span>
                                  <span className="text-xs text-[#94a3b8] truncate w-full">{result.group}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <div className="p-6 text-center">
                        <Search size={28} className="text-[#cbd5e1] mx-auto mb-2" />
                        <p className="text-sm text-[#64748b]">لا توجد نتائج</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>


            {/* User info */}
            <div className="flex items-center gap-2.5 bg-[#f8fafc] border border-[#e2e8f0] hover:border-[#cbd5e1] rounded-xl px-3 py-2 transition-all cursor-default">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#4A7C9E] to-[#3d6a8a] flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                {currentUser?.name?.charAt(0) || 'U'}
              </div>
              <div className="hidden sm:block min-w-0">
                <p className="text-xs font-semibold text-[#1e293b] truncate max-w-[120px]">{currentUser?.name || 'المستخدم'}</p>
                <p className="text-[10px] text-[#FF9F4A] truncate max-w-[120px]">{currentUser?.roles?.[0]?.name || 'موظف'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="max-w-7xl mx-auto p-4 sm:p-6"
            >
              {/* Page Header - News only */}
              {!isAISection && (
                <div className="mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#3d6a8a] to-[#2d5570] rounded-2xl flex items-center justify-center shadow-lg shadow-[#3d6a8a]/20 shrink-0">
                      <ActiveIcon size={20} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[#1e293b]">{SECTION_LABELS[activeSection]}</h2>
                      <p className="text-[#64748b] text-xs mt-0.5">نظام الأخبار</p>
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

// ─── AI Dashboard ────────────────────────────────────────────
const AIDashboard = React.memo(({ setActiveSection }: { setActiveSection: (s: SectionId) => void }) => {
  const cards = [
    {
      id: 'ideas' as SectionId,
      title: 'وحدة التفكير',
      desc: 'توليد أفكار مبدعة، أسئلة مقابلات، وعناوين جذابة.',
      icon: Lightbulb,
      gradient: 'from-amber-500 to-orange-500',
      bg: 'from-amber-50 to-orange-50',
      border: 'border-amber-200',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
    },
    {
      id: 'editing' as SectionId,
      title: 'التحرير الصحفي',
      desc: 'إعادة صياغة، تلخيص، وتدقيق لغوي فوري.',
      icon: PenTool,
      gradient: 'from-[#4A7C9E] to-[#3d6a8a]',
      bg: 'from-blue-50 to-sky-50',
      border: 'border-blue-200',
      iconBg: 'bg-blue-100',
      iconColor: 'text-[#4A7C9E]',
    },
    {
      id: 'social' as SectionId,
      title: 'التواصل الاجتماعي',
      desc: 'منشورات تفاعلية، هاشتاجات، وتحويل الأخبار.',
      icon: Share2,
      gradient: 'from-[#FF9F4A] to-[#FF8C2E]',
      bg: 'from-orange-50 to-amber-50',
      border: 'border-orange-200',
      iconBg: 'bg-orange-100',
      iconColor: 'text-[#FF9F4A]',
    },
    {
      id: 'audio' as SectionId,
      title: 'المختبر الصوتي',
      desc: 'تحويل الصوت إلى نص وبالعكس من الأرشيف.',
      icon: Mic2,
      gradient: 'from-violet-500 to-purple-500',
      bg: 'from-violet-50 to-purple-50',
      border: 'border-violet-200',
      iconBg: 'bg-violet-100',
      iconColor: 'text-violet-600',
    },
    {
      id: 'newsroom' as SectionId,
      title: 'غرفة الأخبار',
      desc: 'إنشاء نشرات ومواجيز إخبارية من مادتك الخبرية.',
      icon: Newspaper,
      gradient: 'from-teal-500 to-emerald-500',
      bg: 'from-teal-50 to-emerald-50',
      border: 'border-teal-200',
      iconBg: 'bg-teal-100',
      iconColor: 'text-teal-600',
    },
    {
      id: 'chat' as SectionId,
      title: 'مساعد AI ذكي',
      desc: 'دردشة تفاعلية لمساعدتك في المهام الإعلامية.',
      icon: MessageSquare,
      gradient: 'from-pink-500 to-rose-500',
      bg: 'from-pink-50 to-rose-50',
      border: 'border-pink-200',
      iconBg: 'bg-pink-100',
      iconColor: 'text-pink-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-gradient-to-bl from-[#2d5570] via-[#3d6a8a] to-[#1f3a4f] rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-64 h-64 bg-[#FF9F4A]/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl translate-x-1/4 translate-y-1/4" />
        </div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-[#FF9F4A] to-[#FF8C2E] rounded-2xl flex items-center justify-center shadow-xl shadow-[#FF9F4A]/30 shrink-0">
            <Sparkles className="text-white w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-arabic font-bold text-white">أدوات الذكاء الاصطناعي</h1>
            <p className="text-white/60 text-sm mt-1">استخدم قوة الـ AI لتسريع عملك الإعلامي</p>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <motion.button
            key={card.id}
            whileHover={{ y: -3, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveSection(card.id)}
            className={`bg-gradient-to-br ${card.bg} border ${card.border} rounded-2xl p-5 text-right group hover:shadow-lg transition-all duration-200 flex flex-col gap-4`}
          >
            <div className="flex items-start justify-between">
              <motion.div
                whileHover={{ rotate: 10 }}
                className={`w-11 h-11 ${card.iconBg} rounded-xl flex items-center justify-center shrink-0`}
              >
                <card.icon className={`${card.iconColor} w-5 h-5`} />
              </motion.div>
              <ChevronLeft size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors mt-1" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1e293b] mb-1.5">{card.title}</h3>
              <p className="text-[#64748b] text-xs leading-relaxed">{card.desc}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
});
