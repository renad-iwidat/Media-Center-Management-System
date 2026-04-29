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
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import { Notification, UnreadCountResponse, NotificationsResponse } from '../types';

export default function MainLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);

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
      
      socketService.onNotification(() => {
        fetchUnreadCount();
        fetchLatestNotifications();
      });

      return () => socketService.offNotification();
    }
  }, [user]);

  if (loading || !user) return <div className="min-h-screen bg-[#020617]" />;

  const menuItems = [
    { name: 'لوحة التحكم', path: '/dashboard', icon: LayoutDashboard, permission: 'kpi.view' },
    { name: 'الأوردرات', path: '/orders', icon: ClipboardList, permission: 'orders.view' },
    { name: 'المهام', path: '/tasks', icon: CheckSquare, permission: 'tasks.view' },
    { name: 'المحتوى والأرشيف', path: '/content', icon: FileText, permission: 'content.view' },
    { name: 'البرامج والحلقات', path: '/programs', icon: Tv, permission: 'programs.view' },
    { name: 'الأقسام والفرق', path: '/departments', icon: Layers, permission: 'users.view' },
    { name: 'إدارة المستخدمين', path: '/users', icon: Users, permission: 'users.manage' },
    { name: 'الصلاحيات', path: '/permissions', icon: ShieldCheck, permission: 'roles.manage' },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    !item.permission || user.permissions?.includes(item.permission)
  );

  const getCurrentPageName = () => {
    const item = menuItems.find(i => i.path === location.pathname);
    if (item) return item.name;
    if (location.pathname === '/profile') return 'بياناتي';
    if (location.pathname === '/change-password') return 'تغيير كلمة السر';
    if (location.pathname === '/notifications') return 'الإشعارات';
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

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {filteredMenuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-4 px-4 py-4 rounded-xl transition-all group relative text-[15px] font-semibold",
                location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
                  ? "bg-white/20 text-white shadow-lg backdrop-blur-sm border border-white/10" 
                  : "text-white/80 hover:text-white hover:bg-white/10"
              )}
            >
              <item.icon size={24} className={cn(
                "min-w-[24px]",
                location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path)) ? "text-[#FF9F4A] drop-shadow-lg" : "text-white/90 group-hover:text-white"
              )} />
              {isSidebarOpen && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="whitespace-nowrap overflow-hidden drop-shadow-sm"
                >
                  {item.name}
                </motion.span>
              )}
              {(location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))) && (
                <motion.div 
                  layoutId="active-bar"
                  className="absolute right-0 top-2 bottom-2 w-1.5 bg-[#FF9F4A] rounded-l-full shadow-lg shadow-orange-500/50"
                />
              )}
            </Link>
          ))}
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
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/25 border border-green-400/40 rounded-full backdrop-blur-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-green-300 shadow-lg shadow-green-400/50 animate-pulse"></div>
              <span className="text-sm text-white font-semibold tracking-wide drop-shadow-sm">متصل لحظياً</span>
            </div>
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
                        <button className="text-xs text-blue-500 hover:underline">قراءة الكل</button>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-gray-500 text-sm">لا توجد إشعارات جديدة</div>
                        ) : (
                          notifications.map((notif) => (
                            <div 
                              key={notif.id}
                              className={cn(
                                "p-4 border-b border-white/5 hover:bg-white/5 transition-all cursor-pointer",
                                !notif.is_read && "bg-blue-600/5"
                              )}
                            >
                              <p className="text-sm font-medium mb-1">{notif.title}</p>
                              <p className="text-xs text-gray-400 line-clamp-2">{notif.message}</p>
                            </div>
                          ))
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
        </main>
      </div>
    </div>
  );
}
