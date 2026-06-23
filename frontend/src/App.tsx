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
  Archive,
} from 'lucide-react';

import { OverviewView } from './components/news/OverviewView';
import { SourcesView } from './components/news/SourcesView';
import { IncompleteView } from './components/news/IncompleteView';
import { QueueView } from './components/news/QueueView';
import { PoliciesView } from './components/news/PoliciesView';
import { PublishedView } from './components/news/PublishedView';
import { ArchiveView } from './components/news/ArchiveView';
import { SystemSettingsPage } from './components/settings/SystemSettingsPage';
import { LoginPage } from './components/auth/LoginPage';
import IdeaGeneration from './components/ai/IdeaGeneration';
import TextEditing from './components/ai/TextEditing';
import SocialMedia from './components/ai/SocialMedia';
import AudioProcessing from './components/ai/AudioProcessing';
import NewsRoom from './components/ai/NewsRoom';
import ChatInterface from './components/ai/ChatInterface';
import SmartTranscription from './components/ai/SmartTranscription';
import { NewsAdminDashboard } from './components/news/NewsAdminDashboard';

import { api, getAuthToken, setAuthToken, getCurrentUser, setCurrentUser, clearAuthToken, clearCurrentUser } from './services/api';
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
  | 'overview' | 'sources' | 'incomplete' | 'queue' | 'policies' | 'published' | 'archive' | 'news-admin'
  | 'ai-dashboard' | 'ideas' | 'editing' | 'social' | 'audio' | 'newsroom' | 'chat' | 'smart-transcription'
  | 'settings';

interface NavItem {
  id: SectionId;
  label: string;
  description: string;
  icon: any;
  group: 'news' | 'ai';
}

const NAV_ITEMS: NavItem[] = [
  { id: 'news-admin', label: 'لوحة الإدارة',      description: 'إحصائيات الموظفين والأداء',   icon: TrendingUp,     group: 'news' },
  { id: 'overview',   label: 'نظرة عامة',         description: 'ملخص الأخبار والإحصائيات',    icon: LayoutDashboard, group: 'news' },
  { id: 'sources',    label: 'مصادر المحتوى',      description: 'إدارة مصادر الأخبار',         icon: Rss,            group: 'news' },
  { id: 'incomplete', label: 'أخبار غير مكتملة',   description: 'أخبار تحتاج إكمال',           icon: AlertTriangle,  group: 'news' },
  { id: 'queue',      label: 'قسم التحرير',         description: 'تحرير ومراجعة الأخبار',       icon: FileEdit,       group: 'news' },
  { id: 'policies',   label: 'السياسات التحريرية',  description: 'قواعد وسياسات النشر',         icon: PenTool,        group: 'news' },
  { id: 'published',  label: 'قسم النشر',           description: 'الأخبار التحريرية الجاهزة للنشر', icon: CheckCircle,    group: 'news' },
  { id: 'archive',    label: 'الأرشيف',             description: 'الأخبار المؤرشفة مع روابط النشر', icon: Archive,       group: 'news' },
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
(SECTION_LABELS as any)['settings'] = 'إعدادات النظام';

const SECTION_ICONS: Record<SectionId, any> = {} as any;
NAV_ITEMS.forEach(i => { (SECTION_ICONS as any)[i.id] = i.icon; });
(SECTION_ICONS as any)['settings'] = Settings2;

/**
 * ربط كل section بالـ permission المطلوب
 * null = متاح للجميع بدون شرط
 */
const SECTION_PERMISSIONS: Record<SectionId, string | null> = {
  // وحدة الأخبار
  'news-admin':          'news.dashboard',
  'overview':            'news.view',
  'sources':             'news.settings',
  'incomplete':          'news.edit',
  'queue':               'news.edit',
  'policies':            'news.settings',
  'published':           'news.publish',
  'archive':             'news.view',
  // وحدة AI (ai.use = الكل)
  'ai-dashboard':        'ai.use',
  'ideas':               'ai.use',
  'editing':             'ai.use',
  'social':              'ai.use',
  'audio':               'ai.use',
  'newsroom':            'ai.use',
  'chat':                null,
  'smart-transcription': 'ai.use',
  // إعدادات
  'settings':            'news.settings',
};

/**
 * دالة فحص الصلاحية من بيانات المستخدم المحفوظة
 */
function hasPermission(user: any, permission: string): boolean {
  if (!user || !user.permissions) return false;
  return user.permissions.includes(permission);
}

/**
 * فحص إذا المستخدم يملك أي صلاحية أخبار — لإظهار/إخفاء مجموعة الأخبار كاملة
 */
function hasAnyNewsPermission(user: any): boolean {
  if (!user || !user.permissions) return false;
  return user.permissions.some((p: string) => p.startsWith('news.'));
}

/**
 * فحص إذا المستخدم يملك صلاحية AI
 */
function hasAIPermission(user: any): boolean {
  if (!user || !user.permissions) return false;
  return user.permissions.some((p: string) => p.startsWith('ai.'));
}

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

  // === Auto-login من التوكن بالـ URL (redirect من مشروع خارجي) ===
  useEffect(() => {
    let isMounted = true;

    const handleTokenFromUrl = async () => {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');

      // إذا ما في توكن بالـ URL أو المستخدم مسجل دخول أصلاً، ما نعمل شي
      if (!urlToken || isAuthenticated) return;

      // نظّف الـ URL من الـ params (عشان ما يضل التوكن ظاهر)
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);

      // احفظ التوكن وحاول تتحقق منه
      setAuthToken(urlToken);
      setIsCheckingAuth(true);

      try {
        const managementApiUrl = getEnvVar('VITE_MANAGEMENT_API_URL') || 'https://mcms-backend-iw71.onrender.com';
        const response = await fetch(`${managementApiUrl}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${urlToken}`, 'Content-Type': 'application/json' },
        });

        if (!isMounted) return;

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setCurrentUser(data.data);
            setCurrentUserState(data.data);
            setIsAuthenticated(true);
          } else {
            // التوكن مش صالح
            clearAuthToken();
            clearCurrentUser();
            setIsAuthenticated(false);
          }
        } else {
          // التوكن انتهى أو غير صالح
          clearAuthToken();
          clearCurrentUser();
          setIsAuthenticated(false);
        }
      } catch {
        // خطأ بالشبكة — نحاول نستخدم بيانات الـ URL كـ fallback
        if (isMounted) {
          const userId = params.get('user_id');
          const userEmail = params.get('user_email');
          if (userId && userEmail) {
            const fallbackUser = { id: Number(userId), email: userEmail };
            setCurrentUser(fallbackUser);
            setCurrentUserState(fallbackUser);
            setIsAuthenticated(true);
          } else {
            clearAuthToken();
            setIsAuthenticated(false);
          }
        }
      } finally {
        if (isMounted) setIsCheckingAuth(false);
      }
    };

    handleTokenFromUrl();
    return () => { isMounted = false; };
  }, []);

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

        const managementApiUrl = getEnvVar('VITE_MANAGEMENT_API_URL') || 'https://mcms-backend-iw71.onrender.com';
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

  // ═══ تحديث صلاحيات المستخدم من سيرفر الأخبار ═══
  // مهم: سيرفر الإدارة (login) قد لا يضمّ user_permissions (الصلاحيات اليدوية)،
  // فنجيب الصلاحيات الكاملة من سيرفر الأخبار الذي يضمّ كل المصادر (أدوار + يدوي).
  // التوكن مشترك بين السيرفرين (نفس JWT_SECRET).
  useEffect(() => {
    let isMounted = true;
    if (!isAuthenticated) return;

    const token = getAuthToken();
    if (!token) return;

    const newsApiUrl = getEnvVar('VITE_API_URL') || 'https://automation-and-ai-hub-backend.onrender.com';
    fetch(`${newsApiUrl}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!isMounted || !data?.success || !data?.data) return;
        // ندمج: نحافظ على الحقول الموجودة ونحدّث الصلاحيات/الأدوار من سيرفر الأخبار
        const merged = { ...(getCurrentUser() || {}), ...data.data };
        setCurrentUser(merged);
        setCurrentUserState(merged);
      })
      .catch(() => { /* صامت — لو فشل الشبكة نكمّل بالنسخة المخزّنة */ });

    return () => { isMounted = false; };
  }, [isAuthenticated]);

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
      <div className="min-h-screen bg-gradient-to-br from-[#1f3a4f] via-[#2d5570] to-[#1f3a4f] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-[#FF9F4A] to-[#FF8C2E] rounded-2xl flex items-center justify-center shadow-2xl shadow-[#FF9F4A]/40 mx-auto">
            <TrendingUp className="text-white w-8 h-8" />
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
        animate={{ width: isSidebarOpen ? 272 : 72 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="bg-gradient-to-b from-[#1f3a4f] to-[#0f2535] flex flex-col h-screen fixed right-0 top-0 z-50 overflow-hidden shadow-2xl"
        role="navigation"
        aria-label="القائمة الرئيسية"
      >
        {/* Logo Header */}
        <div className="h-16 flex items-center justify-between px-4 shrink-0 border-b border-white/8">
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
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
            className="p-2 hover:bg-white/10 rounded-lg transition-colors shrink-0"
            aria-label={isSidebarOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
          >
            {isSidebarOpen ? <ChevronLeft size={18} className="text-white/60" /> : <Menu size={18} className="text-white/60" />}
          </button>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 custom-scrollbar space-y-1">
          {/* News Management Group */}
          {hasAnyNewsPermission(currentUser) && (
            <>
              {isSidebarOpen && (
                <p className="text-[10px] font-bold text-[#FF9F4A]/70 uppercase tracking-widest px-3 mb-2">
                  إدارة الأخبار
                </p>
              )}
              {NAV_ITEMS.filter(i => i.group === 'news').filter(item => {
                const perm = SECTION_PERMISSIONS[item.id];
                if (!perm) return true;
                return hasPermission(currentUser, perm);
              }).map((item) => {
                const isActive = activeSection === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    title={!isSidebarOpen ? item.label : undefined}
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                      isActive
                        ? 'bg-[#FF9F4A] text-white shadow-lg shadow-[#FF9F4A]/25'
                        : 'text-white/60 hover:bg-white/8 hover:text-white'
                    } ${!isSidebarOpen ? 'justify-center' : ''}`}
                  >
                    <div className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-lg ${
                      isActive ? 'bg-white/20' : 'group-hover:bg-white/8'
                    }`}>
                      <Icon size={16} />
                    </div>
                    {isSidebarOpen && (
                      <span className="text-sm font-medium truncate">{item.label}</span>
                    )}
                  </button>
                );
              })}
            </>
          )}

          {/* Divider */}
          {hasAnyNewsPermission(currentUser) && hasAIPermission(currentUser) && (
            <div className="mx-3 my-3 h-px bg-white/8" />
          )}

          {/* AI Tools Group */}
          {hasAIPermission(currentUser) && (
            <>
              {isSidebarOpen && (
                <p className="text-[10px] font-bold text-[#FF9F4A]/70 uppercase tracking-widest px-3 mb-2">
                  أدوات الذكاء الاصطناعي
                </p>
              )}
              {NAV_ITEMS.filter(i => i.group === 'ai').filter(item => {
                const perm = SECTION_PERMISSIONS[item.id];
                if (!perm) return true;
                return hasPermission(currentUser, perm);
              }).map((item) => {
                const isActive = activeSection === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    title={!isSidebarOpen ? item.label : undefined}
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                      isActive
                        ? 'bg-[#FF9F4A] text-white shadow-lg shadow-[#FF9F4A]/25'
                        : 'text-white/60 hover:bg-white/8 hover:text-white'
                    } ${!isSidebarOpen ? 'justify-center' : ''}`}
                  >
                    <div className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-lg ${
                      isActive ? 'bg-white/20' : 'group-hover:bg-white/8'
                    }`}>
                      <Icon size={16} />
                    </div>
                    {isSidebarOpen && (
                      <span className="text-sm font-medium truncate">{item.label}</span>
                    )}
                  </button>
                );
              })}
            </>
          )}
        </nav>


        {/* Settings + User Footer */}
        <div className="border-t border-white/8 p-3 space-y-1 shrink-0">
          {hasPermission(currentUser, 'news.settings') && (
            <button
              onClick={() => setActiveSection('settings')}
              title="إعدادات النظام"
              aria-label="إعدادات النظام"
              aria-current={activeSection === 'settings' ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                activeSection === 'settings'
                  ? 'bg-[#FF9F4A] text-white shadow-lg shadow-[#FF9F4A]/25'
                  : 'text-white/50 hover:bg-white/8 hover:text-white'
              } ${!isSidebarOpen ? 'justify-center' : ''}`}
            >
              <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${activeSection === 'settings' ? 'bg-white/20' : 'group-hover:bg-white/8'}`}>
                <Settings2 size={16} />
              </div>
              {isSidebarOpen && <span className="text-sm font-medium">إعدادات النظام</span>}
            </button>
          )}

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
                aria-label="تسجيل الخروج"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              title="تسجيل الخروج"
              aria-label="تسجيل الخروج"
              className="w-full flex items-center justify-center p-2.5 rounded-xl transition-all text-white/30 hover:bg-red-500/15 hover:text-red-400"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </motion.aside>

      {/* ══ MAIN CONTENT ══ */}
      <main
        id="main-content"
        className="flex-1 flex flex-col h-screen overflow-hidden"
        style={{
          paddingRight: isSidebarOpen ? '272px' : '72px',
          transition: 'padding-right 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Top Header - Simple & Clear */}
        <header className="shrink-0 bg-white border-b border-[#e2e8f0] shadow-sm">
          {/* Main header row */}
          <div className="h-14 flex items-center justify-between px-5 sm:px-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setActiveSection('overview')}
                className="p-2 rounded-lg hover:bg-[#f0f4f8] transition-colors"
                aria-label="الصفحة الرئيسية"
              >
                <Home size={18} className="text-[#3d6a8a]" />
              </button>
              <ArrowRight size={14} className="text-[#cbd5e1] shrink-0" />
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isAISection ? 'bg-purple-100' : 'bg-[#3d6a8a]/10'
                }`}>
                  <ActiveIcon size={16} className={isAISection ? 'text-purple-600' : 'text-[#3d6a8a]'} />
                </div>
                <span className="text-sm font-semibold text-[#1e293b] truncate">
                  {SECTION_LABELS[activeSection]}
                </span>
              </div>
            </div>

            {/* Right side - Status */}
            <div className="flex items-center gap-3 shrink-0">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                isSystemOnline
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                  : 'bg-gray-50 border-gray-200 text-gray-400'
              }`}>
                <div className={`w-2 h-2 rounded-full shrink-0 ${isSystemOnline ? 'bg-emerald-400 animate-pulse' : 'bg-gray-300'}`} />
                <span>{isSystemOnline ? 'النظام نشط' : 'النظام متوقف'}</span>
              </div>
            </div>
          </div>

          {/* Media Unit Selector - Horizontal tabs */}
          <div className="px-5 sm:px-6 py-2.5 bg-[#f8fafc] border-t border-[#e2e8f0]">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 shrink-0">
                <Building2 size={15} className="text-[#3d6a8a]" />
                <span className="text-xs font-bold text-[#64748b]">الوحدة:</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedMediaUnitId(null)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    selectedMediaUnitId === null
                      ? 'bg-[#3d6a8a] text-white border-[#3d6a8a] shadow-sm'
                      : 'bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#3d6a8a] hover:text-[#1e293b]'
                  }`}
                >
                  الكل
                </button>
                {loading ? (
                  <span className="text-xs text-[#94a3b8]">تحميل...</span>
                ) : (
                  mediaUnits.map((mu: { id: number; name: string }) => (
                    <button
                      key={mu.id}
                      onClick={() => setSelectedMediaUnitId(mu.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                        selectedMediaUnitId === mu.id
                          ? 'bg-[#3d6a8a] text-white border-[#3d6a8a] shadow-sm'
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
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="max-w-7xl mx-auto p-4 sm:p-6"
            >
              {/* Page Header */}
              {!isAISection && activeSection !== 'overview' && activeSection !== 'settings' && (
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
              {activeSection === 'news-admin' && <NewsAdminDashboard />}
              {activeSection === 'overview'   && <OverviewView unitId={selectedMediaUnitId} />}
              {activeSection === 'sources'    && <SourcesView autoEnabled={isSystemOnline} unitId={selectedMediaUnitId} />}
              {activeSection === 'incomplete' && <IncompleteView unitId={selectedMediaUnitId} />}
              {activeSection === 'queue'      && <QueueView unitId={selectedMediaUnitId} />}
              {activeSection === 'policies'   && <PoliciesView unitId={selectedMediaUnitId} />}
              {activeSection === 'published'  && <PublishedView unitId={selectedMediaUnitId} onNavigateToAI={(section, content) => {
                localStorage.setItem('ai_prefill_content', JSON.stringify(content));
                setActiveSection(section as SectionId);
              }} />}
              {activeSection === 'archive'    && <ArchiveView unitId={selectedMediaUnitId} />}
              {activeSection === 'settings'   && <SystemSettingsPage onSystemStatusChange={(enabled) => setIsSystemOnline(enabled)} />}

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
    <div className="space-y-6">
      {/* Hero - Large & Clear */}
      <div className="bg-gradient-to-bl from-[#2d5570] via-[#3d6a8a] to-[#1f3a4f] rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-64 h-64 bg-[#FF9F4A]/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
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
            className={`${card.bg} border ${card.border} rounded-2xl p-5 text-right group hover:shadow-lg transition-all duration-200 flex flex-col gap-4`}
            aria-label={`فتح ${card.title}`}
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
