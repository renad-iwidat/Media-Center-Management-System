import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ClipboardList, 
  Calendar, 
  Bell, 
  CheckSquare,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function WelcomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'صباح الخير';
    if (hour < 17) return 'مساء الخير';
    return 'مساء النور';
  };

  const quickLinks = [
    {
      title: 'مهامي الإدارية',
      description: 'تابع المهام المعينة عليك وأنجزها',
      icon: CheckSquare,
      path: '/my-admin-tasks',
      color: 'from-purple-500 to-indigo-600',
      bg: 'bg-purple-50',
      border: 'border-purple-100 hover:border-purple-300',
      textColor: 'text-purple-700',
    },
    {
      title: 'طلب إجازة / مغادرة',
      description: 'قدّم طلب إجازة أو مغادرة وتابع حالته',
      icon: Calendar,
      path: '/my-leave-request',
      color: 'from-green-500 to-emerald-600',
      bg: 'bg-green-50',
      border: 'border-green-100 hover:border-green-300',
      textColor: 'text-green-700',
    },
    {
      title: 'الإشعارات',
      description: 'اطّلع على آخر التحديثات والتنبيهات',
      icon: Bell,
      path: '/notifications',
      color: 'from-amber-500 to-orange-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100 hover:border-amber-300',
      textColor: 'text-amber-700',
    },
    {
      title: 'المهام',
      description: 'مهام العمل اليومية والمتابعة',
      icon: ClipboardList,
      path: '/tasks',
      color: 'from-blue-500 to-cyan-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100 hover:border-blue-300',
      textColor: 'text-blue-700',
    },
  ];

  return (
    <div className="flex flex-col items-center px-4 py-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-4xl bg-gradient-to-br from-[#2d5570] to-[#1f3a4f] rounded-3xl p-10 text-center text-white shadow-2xl shadow-[#2d5570]/30 mb-10"
      >
        {/* Logos */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center gap-6 mb-6"
        >
          <img src="/Media Center  logo.png" alt="مركز الإعلام" className="w-20 h-20 object-contain drop-shadow-lg" />
          <div className="h-14 w-px bg-white/30" />
          <img src="/liminal-logo.jpeg" alt="ليمينال" className="w-20 h-20 object-contain rounded-2xl shadow-lg" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl md:text-4xl font-black mb-3 tracking-tight"
        >
          نظام مركز الإعلام الرقمي
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-white/70 text-lg font-medium"
        >
          جامعة النجاح الوطنية
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 pt-6 border-t border-white/15"
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-[#FF9F4A]" />
            <p className="text-xl font-bold text-white/90">مرحبًا بكم في نظام مركز الإعلام الرقمي</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="text-center mb-10"
      >
        <p className="text-3xl font-black text-gray-800">
          {getGreeting()}، <span className="text-[#FF9F4A]">{user?.name}</span> 👋
        </p>
        <p className="text-gray-500 mt-3 text-base font-medium">ماذا تريد أن تفعل اليوم؟</p>
      </motion.div>

      {/* Quick Links */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-4xl"
      >
        {quickLinks.map((link, index) => (
          <motion.div
            key={link.path}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + index * 0.1 }}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(link.path)}
            className={`cursor-pointer ${link.bg} rounded-2xl p-6 border-2 ${link.border} transition-all group shadow-sm hover:shadow-lg`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform flex-shrink-0`}>
                <link.icon className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className={`font-black text-lg ${link.textColor} mb-1`}>{link.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{link.description}</p>
                <div className="mt-3 flex items-center gap-1 text-sm font-bold text-gray-400 group-hover:text-[#FF9F4A] transition-colors">
                  <span>انتقل</span>
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
