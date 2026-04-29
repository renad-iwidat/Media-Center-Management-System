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
  LogOut,
} from 'lucide-react';

// ── News Components ──
import { OverviewView } from './components/news/OverviewView';
import { SourcesView } from './components/news/SourcesView';
import { IncompleteView } from './components/news/IncompleteView';
import { QueueView } from './components/news/QueueView';
import { PoliciesView } from './components/news/PoliciesView';
import { PublishedView } from './components/news/PublishedView';
import { SystemSettingsModal } from './components/shared/SystemSettingsModal';

// ── Auth Components ──
import { LoginPage } from './components/auth/LoginPage';

// ── AI Components ──
import IdeaGeneration from './components/ai/IdeaGeneration';
import TextEditing from './components/ai/TextEditing';
import SocialMedia from './components/ai/SocialMedia';
import AudioProcessing from './components/ai/AudioProcessing';
import NewsRoom from './components/ai/NewsRoom';
import ChatInterface from './components/ai/ChatInterface';

// ── Services ──
import { api, getAuthToken, getCurrentUser, clearAuthToken, clearCurrentUser } from './services/api';
import { useMediaUnits, clearMediaUnitsCache } from './lib/useMediaUnits';

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
  // ═══ جميع الـ useState hooks في البداية ═══
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = getAuthToken();
    const user = getCurrentUser();
    console.log('🔍 [APP] Initial auth check - token:', !!token, 'user:', !!user);
    return !!(token && user);
  });
  
  const [currentUser, setCurrentUserState] = useState(() => {
    return getCurrentUser();
  });
  
  const [isCheckingAuth, setIsCheckingAuth] = useState(() => {
    const token = getAuthToken();
    const user = getCurrentUser();
    
    // فقط نتحقق إذا كان في توكن بس مافيش user، أو مافيش حاجة خالص
    const shouldCheck = !!(token && !user);
    console.log('🔍 [APP] Initial checking state:', shouldCheck, 'token:', !!token, 'user:', !!user);
    
    // إذا مافيش توكن ولا user، ما نتحققش
    if (!token && !user) {
      console.log('🔍 [APP] لا يوجد توكن ولا مستخدم - لا نحتاج للتحقق');
      return false;
    }
    
    return shouldCheck;
  });
  
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
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ id: SectionId; label: string; group: string }>>([]);

  // ═══ جميع الـ custom hooks بعد useState ═══
  const { mediaUnits, loading } = useMediaUnits();

  // ═══ جميع الـ useEffect hooks بترتيب ثابت ═══
  
  // 1. Persist activeSection
  useEffect(() => {
    localStorage.setItem('activeSection', activeSection);
  }, [activeSection]);

  // 2. Persist selectedMediaUnitId  
  useEffect(() => {
    if (selectedMediaUnitId) {
      localStorage.setItem('selectedUnitId', String(selectedMediaUnitId));
    } else {
      localStorage.removeItem('selectedUnitId');
    }
  }, [selectedMediaUnitId]);

  // 3. Token verification
  useEffect(() => {
    const verifyToken = async () => {
      if (!isCheckingAuth) {
        console.log('⏭️ [APP] تم تخطي التحقق لأن isCheckingAuth = false');
        return;
      }

      console.log('🔐 [APP] بدء التحقق من التوكن');
      
      try {
        const token = getAuthToken();
        
        if (!token) {
          console.log('❌ [APP] لا يوجد توكن في localStorage');
          setIsAuthenticated(false);
          setIsCheckingAuth(false);
          return;
        }

        console.log('✅ [APP] وجدنا توكن:', token.substring(0, 20) + '...');

        const user = getCurrentUser();
        if (user) {
          console.log('✅ [APP] وجدنا بيانات المستخدم في localStorage:', user.name);
          setCurrentUserState(user);
          setIsAuthenticated(true);
          setIsCheckingAuth(false);
          return;
        }

        console.log('🌐 [APP] جاري التحقق من صحة التوكن...');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const managementApiUrl = import.meta.env.VITE_MANAGEMENT_API_URL || 'https://media-center-management-system.onrender.com';

        try {
          const response = await fetch(
            `${managementApiUrl}/api/auth/me`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              signal: controller.signal,
            }
          );

          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            
            if (data.success && data.data) {
              console.log('💾 [APP] حفظ بيانات المستخدم:', data.data.name);
              setCurrentUserState(data.data);
              setIsAuthenticated(true);
            } else {
              console.error('❌ [APP] لا توجد بيانات في الرد');
              clearAuthToken();
              clearCurrentUser();
              setIsAuthenticated(false);
            }
          } else if (response.status === 401) {
            console.log('⏱️ [APP] التوكن انتهى (401)');
            clearAuthToken();
            clearCurrentUser();
            setIsAuthenticated(false);
          } else {
            console.error('❌ [APP] خطأ من السيرفر:', response.status);
            clearAuthToken();
            clearCurrentUser();
            setIsAuthenticated(false);
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);
          console.error('❌ [APP] خطأ في الاتصال:', fetchError);
          
          const savedUser = getCurrentUser();
          if (savedUser && token) {
            console.log('⚠️ [APP] فشل التحقق من السيرفر، لكن سنستخدم البيانات المحفوظة');
            setCurrentUserState(savedUser);
            setIsAuthenticated(true);
          } else {
            clearAuthToken();
            clearCurrentUser();
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        console.error('❌ [APP] خطأ عام في التحقق:', error);
        setIsAuthenticated(false);
      } finally {
        console.log('🏁 [APP] انتهاء التحقق من التوكن');
        setIsCheckingAuth(false);
      }
    };

    verifyToken();

    const emergencyTimeout = setTimeout(() => {
      console.warn('⚠️ [APP] Timeout احتياطي - إجبار إنهاء التحقق');
      setIsCheckingAuth(false);
    }, 8000);

    return () => clearTimeout(emergencyTimeout);
  }, []); // بدون dependencies

  // 4. System status
  useEffect(() => {
    if (!isAuthenticated) return; // فقط إذا كان مسجل دخول
    
    api.getSystemToggles()
      .then((res) => {
        const d = res.data || {};
        setIsSystemOnline(!!(d.scheduler_enabled && d.classifier_enabled && d.flow_enabled));
      })
      .catch(() => setIsSystemOnline(false));
  }, [isAuthenticated]); // dependency على isAuthenticated

  // 5. Search functionality
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const results: Array<{ id: SectionId; label: string; group: string }> = [];

    NAV_GROUPS.forEach((group) => {
      group.items.forEach((item) => {
        if (
          item.label.toLowerCase().includes(query) ||
          group.label.toLowerCase().includes(query)
        ) {
          results.push({
            id: item.id,
            label: item.label,
            group: group.label,
          });
        }
      });
    });

    setSearchResults(results);
  }, [searchQuery]);

  // 6. Auto-refresh every 5 minutes (300000ms)
  useEffect(() => {
    if (!isAuthenticated) return; // فقط إذا كان مسجل دخول

    // دالة لتحديث البيانات
    const refreshData = () => {
      console.log('🔄 [AUTO-REFRESH] تحديث البيانات تلقائياً...');
      
      // تحديث إحصائيات النظام
      api.getSystemToggles()
        .then((res) => {
          const d = res.data || {};
          setIsSystemOnline(!!(d.scheduler_enabled && d.classifier_enabled && d.flow_enabled));
        })
        .catch(() => setIsSystemOnline(false));
      
      // إرسال حدث مخصص لتحديث البيانات في المكونات الأخرى
      window.dispatchEvent(new CustomEvent('dataRefresh', { detail: { timestamp: Date.now() } }));
    };

    // تشغيل الريفريش الأول بعد 5 دقايق
    const intervalId = setInterval(refreshData, 5 * 60 * 1000); // 5 دقايق

    console.log('⏰ [AUTO-REFRESH] تم تفعيل الريفريش التلقائي كل 5 دقايق');

    return () => {
      clearInterval(intervalId);
      console.log('⏹️ [AUTO-REFRESH] تم إيقاف الريفريش التلقائي');
    };
  }, [isAuthenticated]);
  
  // دالة تسجيل الخروج
  const handleLogout = () => {
    console.log('🚪 [LOGOUT] بدء عملية تسجيل الخروج');
    
    // تحديث الحالة فوراً قبل مسح البيانات
    setIsAuthenticated(false);
    setCurrentUserState(null);
    setIsCheckingAuth(false);
    
    // وضع flag إنه تم عمل logout
    localStorage.setItem('justLoggedOut', 'true');
    
    // مسح التوكن وبيانات المستخدم
    clearAuthToken();
    clearCurrentUser();
    
    // مسح cache وحدات الإعلام
    clearMediaUnitsCache();
    
    console.log('✅ [LOGOUT] تم تسجيل الخروج بنجاح - العودة لصفحة اللوجين فوراً');
  };
  
  const toggleGroup = (label: string) => {
    setCollapsedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const handleSearchSelect = (sectionId: SectionId) => {
    setActiveSection(sectionId);
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  const showMediaUnitFilter = isSidebarOpen;
  const ActiveIcon = SECTION_ICONS[activeSection] || LayoutDashboard;

  // ═══ Early returns مع error handling ═══
  
  // إذا لم يكن المستخدم مسجل دخول — عرض صفحة تسجيل الدخول
  if (!isAuthenticated) {
    return (
      <LoginPage
        onLoginSuccess={() => {
          console.log('🎉 [APP] تم استدعاء onLoginSuccess');
          const user = getCurrentUser();
          console.log('👤 [APP] بيانات المستخدم بعد Login:', user);
          
          // تحديث الحالة فوراً
          setIsAuthenticated(true);
          setCurrentUserState(user);
          setIsCheckingAuth(false);
          
          console.log('✅ [APP] تم تحديث جميع الحالات بعد Login - دخول فوري للنظام');
        }}
      />
    );
  }

  // إذا كان التطبيق بيتحقق من التوكن — عرض loading (بس لفترة قصيرة)
  if (isCheckingAuth) {
    console.log('⏳ [APP] عرض شاشة التحميل - isCheckingAuth:', isCheckingAuth);
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1e4a66] via-[#2c5f7f] to-[#1e4a66] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-[#FF9F43] to-[#FF8C2E] rounded-xl flex items-center justify-center shadow-xl shadow-[#FF9F43]/30 mx-auto mb-3 animate-pulse relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
            <TrendingUp className="text-white w-6 h-6 relative z-10" />
          </div>
          <p className="text-gray-400 text-sm">جاري التحقق من بيانات الدخول...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex text-gray-100 selection:bg-[#FF9F43]/30 bg-gray-100"
      style={{ 
        paddingRight: isSidebarOpen ? '260px' : '70px', 
        transition: 'padding-right 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {/* ══════════════════════════════════════════════════════════
          SIDEBAR
         ══════════════════════════════════════════════════════════ */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 70 }}
        className="bg-gradient-to-b from-[#4A7C9C] via-[#5A8CAC] to-[#4A7C9C] border-l border-white/10 flex flex-col h-screen fixed right-0 top-0 z-50 overflow-hidden max-w-[90vw] sm:max-w-none shadow-2xl"
      >
        {/* Logo & Header */}
        <div className="p-4 sm:p-6 flex items-center justify-between shrink-0 border-b border-white/10 bg-[#4A7C9C]/90 backdrop-blur-sm">
          {isSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ delay: 0.1 }}
              className="flex items-center gap-3 min-w-0"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-[#FF9F43] to-[#FF8C2E] rounded-2xl flex items-center justify-center shadow-xl shadow-[#FF9F43]/40 shrink-0 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                <TrendingUp className="text-white w-7 h-7 relative z-10" />
              </div>
              <div className="flex flex-col">
                <span className="font-arabic font-bold text-xl tracking-tight truncate text-white">
                  مركز <span className="text-[#FF9F43]">الإعلام</span>
                </span>
              </div>
            </motion.div>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-3 hover:bg-white/10 rounded-xl transition-all duration-200 hover:shadow-lg shrink-0 group"
          >
            <motion.div
              animate={{ rotate: isSidebarOpen ? 0 : 180 }}
              transition={{ duration: 0.3 }}
            >
              {isSidebarOpen ? <X size={20} className="text-white group-hover:text-[#FF9F43] transition-colors" /> : <Menu size={20} className="text-white group-hover:text-[#FF9F43] transition-colors" />}
            </motion.div>
          </motion.button>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 px-3 sm:px-4 py-6 space-y-6 overflow-y-auto custom-scrollbar">
          {NAV_GROUPS.map((group, groupIndex) => (
            <motion.div 
              key={group.label} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIndex * 0.1 }}
              className="space-y-2"
            >
              {/* Group Items - بدون header */}
              <motion.div 
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                className="space-y-2"
              >
                {group.items.map((item, itemIndex) => {
                  const isActive = activeSection === item.id;
                  const Icon = item.icon;
                  return (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: itemIndex * 0.05 }}
                      whileHover={{ x: 4, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden
                        ${isActive
                          ? 'bg-gradient-to-r from-[#FF9F43] to-[#FF8C2E] text-white shadow-lg shadow-[#FF9F43]/30'
                          : 'text-white/80 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/20'
                        }`}
                    >
                      {/* Background glow effect for active item */}
                      {isActive && (
                        <motion.div
                          layoutId="activeGlow"
                          className="absolute inset-0 bg-gradient-to-r from-[#FF9F43]/20 to-[#FF8C2E]/20 rounded-xl blur-sm"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      
                      <div className={`p-2 rounded-lg transition-all duration-300 relative z-10 ${
                        isActive 
                          ? 'bg-white/20 shadow-lg' 
                          : 'group-hover:bg-white/10'
                      }`}>
                        <Icon size={18} className={`transition-all duration-300 ${
                          isActive ? 'text-white' : 'text-white/90 group-hover:text-white'
                        }`} />
                      </div>
                      
                      {isSidebarOpen && (
                        <motion.span
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="font-semibold text-sm whitespace-nowrap truncate relative z-10"
                        >
                          {item.label}
                        </motion.span>
                      )}
                      
                      {/* Active indicator */}
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full shadow-lg shadow-white/50"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </motion.div>
              
              {/* Elegant divider between groups */}
              {groupIndex < NAV_GROUPS.length - 1 && isSidebarOpen && (
                <motion.div 
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.5 }}
                  className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent my-6 relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#FF9F43]/30 to-transparent blur-sm"></div>
                </motion.div>
              )}
            </motion.div>
          ))}

          {/* Settings Button */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="pt-4 border-t border-white/20"
          >
            <motion.button
              whileHover={{ x: 4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsSettingsOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 text-white/80 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/20 group relative overflow-hidden"
            >
              <div className="p-2 rounded-lg transition-all duration-300 group-hover:bg-white/10">
                <Settings2 size={18} className="text-white/90 group-hover:text-[#FF9F43] transition-colors duration-300" />
              </div>
              {isSidebarOpen && (
                <motion.span 
                  initial={{ opacity: 0, x: 10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  className="font-semibold text-sm whitespace-nowrap truncate"
                >
                  إعدادات النظام
                </motion.span>
              )}
            </motion.button>
          </motion.div>
        </nav>

        {/* ── Media Unit Filter ── */}
        <AnimatePresence>
          {showMediaUnitFilter && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mx-2 sm:mx-3 mb-4 overflow-hidden shrink-0"
            >
              <div className="bg-white/10 border border-white/20 rounded-2xl overflow-hidden backdrop-blur-sm">
                <button
                  onClick={() => setIsMediaUnitOpen(!isMediaUnitOpen)}
                  className="w-full flex items-center justify-between px-2 sm:px-3 py-2.5 hover:bg-white/10 transition-colors"
                >
                  <ChevronDown
                    size={16}
                    className={`text-white/70 transition-transform shrink-0 ${isMediaUnitOpen ? 'rotate-180' : ''}`}
                  />
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <Building2 size={16} className="text-[#FF9F43] shrink-0" />
                    <span className="text-xs font-bold text-white truncate">الوحدة الإعلامية</span>
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
                      <div className="px-2 sm:px-3 pb-3 space-y-1">
                        <button
                          onClick={() => setSelectedMediaUnitId(null)}
                          className={`w-full text-right px-2 sm:px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-between ${
                            selectedMediaUnitId === null
                              ? 'bg-[#FF9F43] text-white shadow-lg shadow-[#FF9F43]/30'
                              : 'text-white/70 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${selectedMediaUnitId === null ? 'bg-white' : 'bg-transparent'}`} />
                          <span>الكل</span>
                        </button>
                        {mediaUnits.length > 0 ? (
                          mediaUnits.map((mu: { id: number; name: string }) => (
                            <button
                              key={mu.id}
                              onClick={() => setSelectedMediaUnitId(mu.id)}
                              className={`w-full text-right px-2 sm:px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-between ${
                                selectedMediaUnitId === mu.id
                                  ? 'bg-[#FF9F43] text-white shadow-lg shadow-[#FF9F43]/30'
                                  : 'text-white/70 hover:bg-white/10 hover:text-white'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${selectedMediaUnitId === mu.id ? 'bg-white' : 'bg-white/30'}`} />
                              <span className="truncate">{mu.name}</span>
                            </button>
                          ))
                        ) : loading ? (
                          <div className="px-2 sm:px-3 py-2 text-xs text-white/50 text-center">
                            جاري تحميل الوحدات...
                          </div>
                        ) : (
                          <div className="px-2 sm:px-3 py-2 text-xs text-white/50 text-center">
                            لا توجد وحدات إعلامية
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Logout Section */}
        <div className="p-3 sm:p-4 border-t border-gradient-to-r from-white/5 via-white/10 to-white/5 shrink-0">
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-gray-300 hover:bg-gradient-to-r hover:from-red-500/10 hover:to-red-600/10 hover:text-red-400 border border-white/10 hover:border-red-500/30 group relative overflow-hidden ${!isSidebarOpen && 'justify-center'}`}
          >
            {/* Background glow effect */}
            <motion.div
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-red-600/5 rounded-xl"
            />
            
            <div className="p-2 rounded-lg transition-all duration-300 group-hover:bg-red-500/20 relative z-10">
              <LogOut size={18} className="shrink-0 transition-all duration-300 group-hover:rotate-12" />
            </div>
            
            {isSidebarOpen && (
              <motion.span 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="font-semibold text-sm whitespace-nowrap relative z-10"
              >
                تسجيل الخروج
              </motion.span>
            )}
          </motion.button>
        </div>
      </motion.aside>

      {/* ══════════════════════════════════════════════════════════
          MAIN CONTENT
         ══════════════════════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col transition-all duration-300 bg-gray-50">
        {/* Header */}
        <header className="h-14 border-b border-gray-200 flex items-center justify-between px-3 sm:px-6 bg-white/80 backdrop-blur-md sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="text-gray-500 text-xs sm:text-sm flex items-center gap-1 sm:gap-2 truncate">
              <span className="hidden sm:inline">الرئيسية</span>
              <ChevronRight size={14} className="shrink-0" />
              <span className="text-gray-800 font-medium truncate">{SECTION_LABELS[activeSection]}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Active media unit badge */}
            {selectedMediaUnitId !== null && mediaUnits.length > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-[#FF9F43]/10 border border-[#FF9F43]/20 rounded-xl">
                <Building2 size={12} className="text-[#FF9F43] shrink-0" />
                <span className="text-xs text-[#FF9F43] font-medium truncate max-w-[150px]">
                  {mediaUnits.find((m: { id: number }) => m.id === selectedMediaUnitId)?.name || `الوحدة ${selectedMediaUnitId}`}
                </span>
                <button
                  onClick={() => setSelectedMediaUnitId(null)}
                  className="text-[#FF9F43]/60 hover:text-[#FF9F43] transition-colors shrink-0"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            <div className="relative group hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#FF9F43] transition-colors" size={16} />
              <input
                type="text"
                placeholder="بحث سريع..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchOpen(true)}
                onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
                className="bg-white border border-gray-300 rounded-full pl-4 pr-10 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#FF9F43]/50 focus:ring-1 focus:ring-[#FF9F43]/30 focus:w-64 transition-all w-48"
              />
              
              {/* Search Results Dropdown */}
              <AnimatePresence>
                {isSearchOpen && searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute left-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden z-50"
                  >
                    <div className="p-2 border-b border-gray-200 bg-gradient-to-r from-[#FF9F43]/10 to-transparent">
                      <p className="text-xs text-gray-600 px-3 py-1">نتائج البحث ({searchResults.length})</p>
                    </div>
                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                      {searchResults.map((result) => {
                        const Icon = SECTION_ICONS[result.id];
                        return (
                          <button
                            key={result.id}
                            onClick={() => handleSearchSelect(result.id)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#FF9F43]/10 transition-colors text-right group"
                          >
                            <Icon size={18} className="text-[#FF9F43] group-hover:text-[#FF8C2E] transition-colors shrink-0" />
                            <div className="flex flex-col items-end flex-1 min-w-0">
                              <span className="text-sm font-semibold text-gray-800 truncate w-full">{result.label}</span>
                              <span className="text-xs text-gray-500 truncate w-full">{result.group}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* No Results */}
              <AnimatePresence>
                {isSearchOpen && searchQuery.trim() !== '' && searchResults.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute left-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden z-50 p-4"
                  >
                    <div className="text-center">
                      <Search size={32} className="text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">لا توجد نتائج</p>
                      <p className="text-xs text-gray-400 mt-1">جرب كلمات بحث أخرى</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Info in Header */}
            <div className="flex items-center gap-2 sm:gap-3 px-3 py-2 rounded-xl bg-gray-100 border border-gray-200 hover:bg-gray-200 transition-colors cursor-pointer group">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#4A7C9C] to-[#7BA5C1] shrink-0 border border-white/10 shadow-lg shadow-[#4A7C9C]/20 flex items-center justify-center font-bold text-xs text-white">
                {currentUser?.name?.charAt(0) || 'U'}
              </div>
              <div className="hidden sm:flex flex-col min-w-0">
                <span className="text-xs font-semibold text-gray-800 truncate max-w-[140px]">
                  {currentUser?.name || 'المستخدم'}
                </span>
                <span className="text-xs text-[#FF9F43] truncate max-w-[140px]">
                  {currentUser?.roles?.[0]?.name || 'موظف'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 custom-scrollbar bg-gray-50">
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
                <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#FF9F43]/20 to-[#FF8C2E]/20 rounded-2xl flex items-center justify-center border border-[#FF9F43]/30 shrink-0 shadow-lg shadow-[#FF9F43]/20">
                    <ActiveIcon size={20} className="text-[#FF9F43] sm:w-6 sm:h-6" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-800 truncate">{SECTION_LABELS[activeSection]}</h2>
                    <p className="text-gray-500 text-xs sm:text-sm hidden sm:block">نظام الإدارة الموحد لمركز الإعلام</p>
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
              {activeSection === 'audio' && <AudioProcessing mediaUnitId={selectedMediaUnitId} />}
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
    { id: 'ideas' as SectionId,    title: 'وحدة التفكير',        desc: 'توليد أفكار مبدعة، أسئلة مقابلات، وعناوين جذابة.',  icon: Lightbulb,     color: 'text-[#FF9F43]', bg: 'bg-[#FF9F43]/10' },
    { id: 'editing' as SectionId,  title: 'التحرير الصحفي',       desc: 'إعادة صياغة، تلخيص، وتدقيق لغوي فوري.',            icon: PenTool,       color: 'text-[#4A7C9C]',   bg: 'bg-[#4A7C9C]/10'   },
    { id: 'social' as SectionId,   title: 'التواصل الاجتماعي',    desc: 'منشورات تفاعلية، هاشتاجات، وتحويل الأخبار.',       icon: Share2,        color: 'text-[#FF9F43]',   bg: 'bg-[#FF9F43]/10'   },
    { id: 'audio' as SectionId,    title: 'المختبر الصوتي',       desc: 'تحويل الصوت إلى نص وبالعكس من الأرشيف.',           icon: Mic2,          color: 'text-[#7BA5C1]', bg: 'bg-[#7BA5C1]/10' },
    { id: 'newsroom' as SectionId, title: 'غرفة الأخبار',         desc: 'إنشاء نشرات ومواجيز إخبارية من مادتك الخبرية.',    icon: Newspaper,     color: 'text-[#4A7C9C]',bg: 'bg-[#4A7C9C]/10'},
    { id: 'chat' as SectionId,     title: 'مساعد AI ذكي',         desc: 'دردشة تفاعلية لمساعدتك في المهام الإعلامية.',      icon: MessageSquare, color: 'text-[#FF9F43]',   bg: 'bg-[#FF9F43]/10'   },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl sm:text-2xl text-gray-800">أهلاً بك في وحدة الذكاء الاصطناعي</h1>
        <p className="text-gray-600 text-xs sm:text-sm">بماذا يمكننا مساعدتك اليوم في رحلتك الإبداعية؟</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => setActiveSection(card.id)}
            className="glass-panel p-4 sm:p-5 text-right group hover:border-[#FF9F43] transition-all duration-300 hover:-translate-y-1 flex flex-col gap-4 h-full hover:shadow-lg hover:shadow-[#FF9F43]/20"
          >
            <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center transition-transform group-hover:scale-110`}>
              <card.icon className={`${card.color} w-5 h-5`} />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <h3 className="text-sm sm:text-base font-bold">{card.title}</h3>
              <p className="text-gray-400 text-xs leading-relaxed">{card.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
