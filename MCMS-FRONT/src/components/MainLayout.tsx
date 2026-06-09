import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation, Link, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ClipboardList, 
  CheckSquare, 
  FileText, 
  Tv, 
  Users, 
  ShieldCheck, 
  Bell, 
  Menu, 
  ChevronLeft,
  Layers,
  Mic,
  LogOut,
  Briefcase,
  Calendar,
  Home,
  ListChecks
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import { Notification, UnreadCountResponse, NotificationsResponse } from '../types';
import ChatWidget from './ChatBot/ChatWidget';

export default function MainLayout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get<UnreadCountResponse>('/api/notifications/unread-count');
      if (res.success) setUnreadCount(res.data.unread_count);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLatestNotifications = async () => {
    try {
      const res = await api.get<NotificationsResponse>('/api/notifications?limit=5');
      if (res.success) setNotifications(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      fetchLatestNotifications();
      checkAdminProcAccess();
      
      socketService.onNotification(() => {
        fetchUnreadCount();
        fetchLatestNotifications();
      });

      return () => socketService.offNotification();
    }
  }, [user]);

  const checkAdminProcAccess = async () => {
    try {
      const res = await api.get<{ success: boolean; data: { has_access: boolean } }>(
        '/api/administrative/access/check'
      );
      if (res.success) {
        setHasAdminAccess(res.data?.has_access || false);
      }
    } catch (err) {
      setHasAdminAccess(false);
    }
  };

  if (loading || !user) return <div className="min-h-screen bg-[#020617]" />;

  const menuItems = [
    { name: 'الصفحة الرئيسية', path: '/welcome', icon: Home },
    { name: 'لوحة التحكم', path: '/dashboard', icon: LayoutDashboard, permission: 'kpi.view' },
    { name: 'الطلبات', path: '/orders', icon: ClipboardList, permission: 'orders.view' },
    { name: 'المهام', path: '/tasks', icon: CheckSquare, permission: 'tasks.view' },
    { name: 'الأرشيف الذكي', path: '/content', icon: FileText, permission: 'content.view' },
    { name: 'البرامج والحلقات', path: '/programs', icon: Tv, permission: 'programs.view' },
    { name: 'الأقسام والفرق', path: '/departments', icon: Layers, permission: 'users.view' },
    { name: 'إدارة المستخدمين', path: '/users', icon: Users, permission: 'users.manage' },
    { name: 'بوابة إدخال المراسلين', path: 'https://manual-reporter-input-frontend.onrender.com/', icon: Mic },
  ];

  // العناصر الأساسية (الصفحة الرئيسية فقط - تظهر للجميع)
  const homeItem = menuItems[0];
  // باقي العناصر حسب الصلاحيات
  const otherMenuItems = menuItems.slice(1).filter(item => 
    !item.permission || user.permissions?.includes(item.permission)
  );

  const getCurrentPageName = () => {
    const item = menuItems.find(i => i.path === location.pathname);
    if (item) return item.name;
    if (location.pathname === '/welcome') return 'الرئيسية';
    if (location.pathname === '/profile') return 'بياناتي';
    if (location.pathname === '/change-password') return 'تغيير كلمة السر';
    if (location.pathname === '/notifications') return 'الإشعارات';
    if (location.pathname === '/my-leave-request') return 'طلب إجازة / مغادرة';
    if (location.pathname === '/my-admin-tasks') return 'مهامي الإدارية';
    if (location.pathname === '/administrative/archive') return 'الأرشيف الخاص بالإداريين';
    if (location.pathname.startsWith('/administrative')) return 'الإجراءات الإدارية';
    return '';
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] text-[#1e293b] overflow-hidden font-sans">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="fixed md:relative h-full bg-gradient-to-b from-[#2d5570] to-[#1f3a4f] text-white border-l border-white/10 z-40 transition-all flex flex-col right-0 shadow-2xl"
      >
        <div className="p-6 h-[100px] flex items-center justify-between border-b border-white/20">
          {isSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 flex-1"
            >
              <img 
                src="/Media Center  logo.png" 
                alt="مركز الإعلام" 
                className="w-20 h-20 object-contain drop-shadow-lg flex-shrink-0"
              />
              <div className="flex flex-col">
                <span className="font-bold text-2xl tracking-tight whitespace-nowrap text-white/95 drop-shadow-md">مركز الإعلام</span>
                <span className="text-sm text-white/85 drop-shadow-sm font-medium">جامعة النجاح الوطنية</span>
              </div>
            </motion.div>
          )}
          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-white/15 rounded-xl text-white hover:text-white transition-all flex-shrink-0"
          >
            {isSidebarOpen ? <ChevronLeft size={28} className="text-white drop-shadow-md" /> : <Menu size={24} className="text-white" />}
          </button>
        </div>

        {/* Logo Section - Removed */}

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {/* الصفحة الرئيسية */}
          <Link
            to="/welcome"
            className={cn(
              "flex items-center gap-4 px-4 py-4 rounded-xl transition-all group relative text-[15px] font-semibold",
              location.pathname === '/welcome'
                ? "bg-white/20 text-white shadow-lg backdrop-blur-sm border border-white/10" 
                : "text-white/80 hover:text-white hover:bg-white/10"
            )}
          >
            <Home size={24} className={cn("min-w-[24px]", location.pathname === '/welcome' ? "text-[#FF9F4A] drop-shadow-lg" : "text-white/90 group-hover:text-white")} />
            {isSidebarOpen && <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="whitespace-nowrap drop-shadow-sm">الصفحة الرئيسية</motion.span>}
            {location.pathname === '/welcome' && <motion.div layoutId="active-bar" className="absolute right-0 top-2 bottom-2 w-1.5 bg-[#FF9F4A] rounded-l-full shadow-lg shadow-orange-500/50" />}
          </Link>

          {/* ═══ خدمات الموظفين ═══ */}
          <div className="my-3 px-4">
            <div className="h-px bg-gradient-to-r from-transparent via-green-400/50 to-transparent" />
            {isSidebarOpen && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-green-400 mt-3 mb-1 font-bold uppercase tracking-wider drop-shadow-sm">
                خدمات الموظفين
              </motion.p>
            )}
          </div>

          <Link
            to="/my-leave-request"
            className={cn(
              "flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all group relative text-[15px] font-semibold",
              location.pathname === '/my-leave-request'
                ? "bg-gradient-to-l from-green-500/30 to-emerald-600/20 text-white shadow-lg backdrop-blur-sm border border-green-500/30" 
                : "text-white/80 hover:text-white hover:bg-white/10"
            )}
          >
            <Calendar size={24} className={cn("min-w-[24px]", location.pathname === '/my-leave-request' ? "text-green-400 drop-shadow-lg" : "text-white/90 group-hover:text-white")} />
            {isSidebarOpen && <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="whitespace-nowrap drop-shadow-sm">طلب إجازة / مغادرة</motion.span>}
            {location.pathname === '/my-leave-request' && <motion.div layoutId="active-bar" className="absolute right-0 top-2 bottom-2 w-1.5 bg-green-400 rounded-l-full shadow-lg shadow-green-500/50" />}
          </Link>

          <Link
            to="/my-admin-tasks"
            className={cn(
              "flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all group relative text-[15px] font-semibold",
              location.pathname === '/my-admin-tasks'
                ? "bg-gradient-to-l from-purple-500/30 to-indigo-600/20 text-white shadow-lg backdrop-blur-sm border border-purple-500/30" 
                : "text-white/80 hover:text-white hover:bg-white/10"
            )}
          >
            <ClipboardList size={24} className={cn("min-w-[24px]", location.pathname === '/my-admin-tasks' ? "text-purple-400 drop-shadow-lg" : "text-white/90 group-hover:text-white")} />
            {isSidebarOpen && <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="whitespace-nowrap drop-shadow-sm">مهامي الإدارية</motion.span>}
            {location.pathname === '/my-admin-tasks' && <motion.div layoutId="active-bar" className="absolute right-0 top-2 bottom-2 w-1.5 bg-purple-400 rounded-l-full shadow-lg shadow-purple-500/50" />}
          </Link>

          <Link
            to="/my-daily-tasks"
            className={cn(
              "flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all group relative text-[15px] font-semibold",
              location.pathname === '/my-daily-tasks'
                ? "bg-gradient-to-l from-emerald-500/30 to-teal-600/20 text-white shadow-lg backdrop-blur-sm border border-emerald-500/30"
                : "text-white/80 hover:text-white hover:bg-white/10"
            )}
          >
            <CheckSquare size={24} className={cn("min-w-[24px]", location.pathname === '/my-daily-tasks' ? "text-emerald-400 drop-shadow-lg" : "text-white/90 group-hover:text-white")} />
            {isSidebarOpen && <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="whitespace-nowrap drop-shadow-sm">مهامي اليومية</motion.span>}
            {location.pathname === '/my-daily-tasks' && <motion.div layoutId="active-bar" className="absolute right-0 top-2 bottom-2 w-1.5 bg-emerald-400 rounded-l-full shadow-lg shadow-emerald-500/50" />}
          </Link>

          {user.permissions?.includes('daily_tasks.manage') && (
            <Link
              to="/daily-tasks-manage"
              className={cn(
                "flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all group relative text-[15px] font-semibold",
                location.pathname === '/daily-tasks-manage'
                  ? "bg-gradient-to-l from-emerald-500/30 to-teal-600/20 text-white shadow-lg backdrop-blur-sm border border-emerald-500/30"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              )}
            >
              <ListChecks size={24} className={cn("min-w-[24px]", location.pathname === '/daily-tasks-manage' ? "text-emerald-400 drop-shadow-lg" : "text-white/90 group-hover:text-white")} />
              {isSidebarOpen && <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="whitespace-nowrap drop-shadow-sm">إدارة المهام اليومية</motion.span>}
              {location.pathname === '/daily-tasks-manage' && <motion.div layoutId="active-bar" className="absolute right-0 top-2 bottom-2 w-1.5 bg-emerald-400 rounded-l-full shadow-lg shadow-emerald-500/50" />}
            </Link>
          )}

          {/* ═══ نظام الذكاء الاصطناعي ═══ */}
          <div className="my-3 px-2">
            <a
              href="https://automation-and-ai-hub-frontend.onrender.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="block relative overflow-hidden rounded-xl p-3 bg-gradient-to-r from-[#f97316] via-[#ea580c] to-[#dc2626] shadow-lg shadow-orange-500/30 hover:shadow-xl hover:scale-[1.02] transition-all group"
            >
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-50" />
              <div className="relative flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <span className="text-xl">🤖</span>
                </div>
                {isSidebarOpen && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                    <p className="text-white font-bold text-sm leading-tight">نظام أتمتة الأخبار</p>
                    <p className="text-white/70 text-[10px] mt-0.5">وتقنيات الذكاء الاصطناعي</p>
                  </motion.div>
                )}
              </div>
            </a>
          </div>

          {/* ═══ الإجراءات الإدارية ═══ */}
          {hasAdminAccess && (
            <>
              <div className="my-3 px-4">
                <div className="h-px bg-gradient-to-r from-transparent via-[#FF9F4A]/50 to-transparent" />
                {isSidebarOpen && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-[#FF9F4A] mt-3 mb-1 font-bold uppercase tracking-wider drop-shadow-sm">
                    الإجراءات الإدارية
                  </motion.p>
                )}
              </div>

              <Link
                to="/administrative"
                className={cn(
                  "flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all group relative text-[15px] font-semibold",
                  location.pathname.startsWith('/administrative')
                    ? "bg-gradient-to-l from-[#FF9F4A]/30 to-orange-600/20 text-white shadow-lg backdrop-blur-sm border border-[#FF9F4A]/30" 
                    : "text-white/80 hover:text-white hover:bg-white/10"
                )}
              >
                <Briefcase size={24} className={cn("min-w-[24px]", location.pathname.startsWith('/administrative') ? "text-[#FF9F4A] drop-shadow-lg" : "text-white/90 group-hover:text-white")} />
                {isSidebarOpen && <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="whitespace-nowrap drop-shadow-sm">قسم الإجراءات الإدارية</motion.span>}
                {location.pathname.startsWith('/administrative') && <motion.div layoutId="active-bar" className="absolute right-0 top-2 bottom-2 w-1.5 bg-[#FF9F4A] rounded-l-full shadow-lg shadow-orange-500/50" />}
              </Link>
            </>
          )}

          {/* ═══ إدارة النظام ═══ */}
          <div className="my-3 px-4">
            <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            {isSidebarOpen && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-white/50 mt-3 mb-1 font-bold uppercase tracking-wider drop-shadow-sm">
                إدارة النظام
              </motion.p>
            )}
          </div>

          {otherMenuItems.map((item) => {
            const isExternal = item.path.startsWith('http');
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            
            const linkContent = (
              <>
                <item.icon size={24} className={cn("min-w-[24px]", isActive ? "text-[#FF9F4A] drop-shadow-lg" : "text-white/90 group-hover:text-white")} />
                {isSidebarOpen && <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="whitespace-nowrap overflow-hidden drop-shadow-sm">{item.name}</motion.span>}
                {isActive && <motion.div layoutId="active-bar" className="absolute right-0 top-2 bottom-2 w-1.5 bg-[#FF9F4A] rounded-l-full shadow-lg shadow-orange-500/50" />}
              </>
            );

            if (isExternal) {
              return (
                <a key={item.path} href={item.path} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all group relative text-[15px] font-semibold text-white/80 hover:text-white hover:bg-white/10">
                  {linkContent}
                </a>
              );
            }

            return (
              <Link key={item.path} to={item.path}
                className={cn("flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all group relative text-[15px] font-semibold",
                  isActive ? "bg-white/20 text-white shadow-lg backdrop-blur-sm border border-white/10" : "text-white/80 hover:text-white hover:bg-white/10"
                )}>
                {linkContent}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/20">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/15 backdrop-blur-sm border border-white/10">
            <div className="w-12 h-12 rounded-full bg-[#FF9F4A]/30 border-2 border-[#FF9F4A]/50 flex items-center justify-center font-bold text-white text-lg shadow-lg">
              {user.name.substring(0, 2)}
            </div>
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate text-white drop-shadow-sm">{user.name}</div>
                <div className="text-xs text-white/80 truncate font-medium">{user.roles[0]?.name}</div>
              </div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative h-full">
        {/* Topbar */}
        <header className="h-[80px] bg-gradient-to-l from-[#3d6a8a] to-[#4d7a9a] text-white border-b border-white/20 flex items-center justify-between px-8 relative z-30 shadow-xl">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white drop-shadow-md">{getCurrentPageName()}</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2.5 text-white hover:bg-white/15 hover:shadow-lg hover:shadow-blue-500/30 transition-all cursor-pointer outline-none rounded-xl"
              >
                <Bell size={26} className="text-white drop-shadow-md" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-5 h-5 bg-red-600 text-[11px] text-white flex items-center justify-center rounded-full border-2 border-[#3d6a8a] font-bold shadow-lg shadow-red-600/50 animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              
              <AnimatePresence>
                {isNotificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setNotificationsOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute left-0 mt-2 w-80 glass-dark rounded-2xl shadow-2xl z-20 overflow-hidden text-white"
                    >
                      <div className="p-4 border-b border-white/5 flex items-center justify-between">
                        <span className="font-semibold">الإشعارات</span>
                        <button 
                          onClick={async () => {
                            try {
                              await api.patch('/api/notifications/read-all', {});
                              setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                              setUnreadCount(0);
                            } catch (error) {
                              console.error('Failed to mark all as read:', error);
                            }
                          }}
                          className="text-xs text-blue-500 hover:underline"
                        >
                          قراءة الكل
                        </button>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-gray-400 text-sm">لا توجد إشعارات جديدة</div>
                        ) : (
                          notifications.map((notif) => {
                            // تحديد الألوان حسب النوع
                            let bgColor = 'bg-blue-200';
                            let borderColor = 'border-blue-400';
                            let textColor = 'text-gray-900';
                            let messageColor = 'text-gray-800';
                            
                            if (notif.type === 'task_status_changed' || notif.type === 'content_uploaded') {
                              bgColor = 'bg-green-200';
                              borderColor = 'border-green-400';
                            } else if (notif.type === 'deadline_approaching' || notif.type === 'task_assigned') {
                              bgColor = 'bg-orange-200';
                              borderColor = 'border-orange-400';
                            } else if (notif.type === 'order_created') {
                              bgColor = 'bg-red-200';
                              borderColor = 'border-red-400';
                            }
                            
                            return (
                              <div 
                                key={notif.id}
                                onClick={async () => {
                                  // وسّم كمقروء
                                  if (!notif.is_read) {
                                    try {
                                      await api.patch(`/api/notifications/${notif.id}/read`, {});
                                      // تحديث الإشعارات والرقم تلقائياً
                                      setNotifications(prev =>
                                        prev.map(n =>
                                          n.id === notif.id ? { ...n, is_read: true } : n
                                        )
                                      );
                                      setUnreadCount(prev => Math.max(0, prev - 1));
                                    } catch (error) {
                                      console.error('Failed to mark as read:', error);
                                    }
                                  }
                                  
                                  // انتقل للصفحة المناسبة
                                  if (notif.entity_type === 'task' && notif.entity_id) {
                                    navigate(`/tasks/${notif.entity_id}`);
                                  } else if (notif.entity_type === 'order' && notif.entity_id) {
                                    navigate(`/orders/${notif.entity_id}`);
                                  } else if (notif.entity_type === 'admin_task' && notif.entity_id) {
                                    navigate(`/administrative/tasks/${notif.entity_id}`);
                                  } else if (notif.entity_type === 'admin_order' && notif.entity_id) {
                                    navigate(`/administrative/orders/${notif.entity_id}`);
                                  } else if (notif.entity_type === 'content' && notif.entity_id) {
                                    navigate(`/content/${notif.entity_id}`);
                                  } else if (notif.entity_type === 'shooting' && notif.entity_id) {
                                    navigate(`/shootings/${notif.entity_id}`);
                                  }
                                  setNotificationsOpen(false);
                                }}
                                className={`p-4 border-b border-white/5 hover:shadow-md transition-all cursor-pointer ${bgColor} ${borderColor} ${!notif.is_read ? 'border-l-4' : ''}`}
                              >
                                <p className={`text-sm font-bold ${textColor} mb-1`}>{notif.title}</p>
                                <p className={`text-xs line-clamp-2 ${messageColor}`}>{notif.message}</p>
                              </div>
                            );
                          })
                        )}
                      </div>
                      <Link 
                        to="/notifications" 
                        onClick={() => setNotificationsOpen(false)}
                        className="block p-3 text-center text-xs text-blue-500 border-t border-white/5 hover:bg-white/5"
                      >
                        عرض الكل
                      </Link>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => logout()}
              className="flex items-center gap-2 px-4 py-2.5 text-white hover:bg-red-600/20 hover:text-red-300 transition-all rounded-xl border border-red-500/30 hover:border-red-500/60 font-semibold text-sm"
              title="تسجيل خروج"
            >
              <LogOut size={20} />
              <span className="hidden md:inline">خروج</span>
            </button>
          </div>
        </header>

        {/* Views */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={location.pathname}
            className="max-w-7xl mx-auto w-full"
          >
            <Outlet />
          </motion.div>

          {/* Footer */}
          <div className="text-center py-8 mt-12 border-t border-gray-200">
            <p className="text-sm text-gray-500 font-medium">
              نظام إدارة مركز الإعلام © 2026 | تصميم وتنفيذ وحدة ليمينال
            </p>
            <p className="text-sm text-gray-400 mt-1">
              جميع الحقوق محفوظة لدى وحدة ليمينال للحلول الذكية والتقنية
            </p>
          </div>
        </main>
      </div>

      {/* المساعد الذكي العائم */}
      <ChatWidget />
    </div>
  );
}