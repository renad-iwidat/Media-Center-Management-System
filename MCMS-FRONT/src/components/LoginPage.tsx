import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// المستخدمين المسموح لهم بلوحة التحكم
const DASHBOARD_ALLOWED_IDS = ['74', '39', '73', '71', '72'];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      const storedUser = localStorage.getItem('token');
      if (storedUser) {
        try {
          const payload = JSON.parse(atob(storedUser.split('.')[1]));
          const userId = payload.user_id?.toString() || payload.id?.toString() || '';
          if (DASHBOARD_ALLOWED_IDS.includes(userId)) {
            navigate('/dashboard');
          } else {
            navigate('/welcome');
          }
        } catch {
          navigate('/welcome');
        }
      } else {
        navigate('/welcome');
      }
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول. يرجى التحقق من البيانات.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#020617] p-4 font-sans" dir="rtl">
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-900/10 blur-[120px] rounded-full" />
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-dark p-8 rounded-2xl relative z-10 border border-white/10 shadow-2xl"
      >
        {/* Header */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-500/40 mb-2">
            <Lock className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white text-center">نظام مركز الإعلام الرقمي</h1>
          <p className="text-orange-400 text-sm font-medium">جامعة النجاح الوطنية</p>
          <p className="text-gray-500 text-xs mt-1">أدخل بياناتك للوصول إلى النظام</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-300 px-1">البريد الإلكتروني</label>
            <div className="relative">
              <input
                type="email"
                placeholder="name@najah.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pr-12 pl-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 outline-none transition-all focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 text-right"
              />
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-300 px-1">كلمة المرور</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pr-12 pl-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 outline-none transition-all focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 text-right"
              />
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-orange-400 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm py-2.5 px-4 rounded-xl text-right"
            >
              {error}
            </motion.div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 text-base font-semibold rounded-xl bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 mt-1"
          >
            {loading ? (
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : (
              'تسجيل الدخول'
            )}
          </button>
        </form>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="relative z-10 mt-8 text-center"
      >
        <p className="text-gray-500 text-xs leading-relaxed">
          نظام إدارة مركز الإعلام © 2026 | تصميم وتنفيذ وحدة ليمينال
        </p>
        <p className="text-gray-600 text-xs mt-1">
          الجميع الحقوق محفوظة لدى وحدة ليمينال للحلول الذكية والتقنية
        </p>
      </motion.div>
    </div>
  );
}
