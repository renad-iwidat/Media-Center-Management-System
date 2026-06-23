/**
 * صفحة تسجيل الدخول - تصميم واضح لكبار السن
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff, AlertCircle, Loader2, TrendingUp, Lock, Mail } from 'lucide-react';
import { api, setAuthToken, setCurrentUser } from '../../services/api';

// دعم runtime environment variables من Docker
const getEnvVar = (key: keyof ImportMetaEnv): string | undefined => {
  if (typeof window !== 'undefined' && window.ENV && window.ENV[key]) {
    return window.ENV[key];
  }
  return import.meta.env[key];
};

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [email, setEmail] = useState(() => localStorage.getItem('savedEmail') || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setEmail(v);
    if (v.trim()) localStorage.setItem('savedEmail', v);
    else localStorage.removeItem('savedEmail');
  };

  useEffect(() => {
    const logoutFlag = localStorage.getItem('justLoggedOut');
    if (logoutFlag) {
      localStorage.removeItem('savedEmail');
      localStorage.removeItem('justLoggedOut');
      setEmail('');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const managementApiUrl = getEnvVar('VITE_MANAGEMENT_API_URL') || 'https://mcms-backend-iw71.onrender.com';

      const loginResponse = await fetch(`${managementApiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!loginResponse.ok) {
        const errorData = await loginResponse.json();
        throw new Error(errorData.error || 'فشل تسجيل الدخول');
      }

      const loginData = await loginResponse.json();
      if (!loginData.success || !loginData.data?.token) throw new Error('فشل تسجيل الدخول');

      setAuthToken(loginData.data.token);

      const meResponse = await fetch(`${managementApiUrl}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${loginData.data.token}`, 'Content-Type': 'application/json' },
      });

      if (!meResponse.ok) throw new Error('فشل جلب بيانات المستخدم');
      const meData = await meResponse.json();
      if (!meData.success || !meData.data) throw new Error('فشل جلب بيانات المستخدم');

      setCurrentUser(meData.data);
      onLoginSuccess();
    } catch (err: any) {
      if (err.name === 'AbortError') setError('انتهت مهلة الانتظار — تحقق من الاتصال بالإنترنت');
      else setError(err.message || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1f2e] via-[#1f3a4f] to-[#0f1f2e] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#FF9F4A]/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-[#3d6a8a]/15 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="relative w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-white/[0.07] backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#FF9F4A] to-[#FF8C2E] rounded-2xl flex items-center justify-center shadow-2xl shadow-[#FF9F4A]/40 mx-auto mb-5">
              <TrendingUp className="text-white w-8 h-8" />
            </div>
            <h1 className="text-2xl font-arabic font-bold text-white mb-1">
              نظام مركز <span className="text-[#FF9F4A]">الإعلام الرقمي</span>
            </h1>
            <p className="text-white/40 text-sm">نظام الأخبار</p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-3"
              role="alert"
            >
              <AlertCircle className="text-rose-400 w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-rose-300 text-sm leading-relaxed">{error}</p>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-white/70">البريد الإلكتروني</label>
              <div className="relative">
                <Mail size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="example@domain.com"
                  disabled={isLoading}
                  dir="ltr"
                  className="w-full pr-10 pl-4 py-3 bg-white/8 border border-white/10 rounded-xl text-white placeholder-white/25 focus:outline-none focus:border-[#FF9F4A]/50 focus:ring-2 focus:ring-[#FF9F4A]/15 transition-all disabled:opacity-50 text-sm"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-white/70">كلمة المرور</label>
              <div className="relative">
                <Lock size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="w-full pr-10 pl-10 py-3 bg-white/8 border border-white/10 rounded-xl text-white placeholder-white/25 focus:outline-none focus:border-[#FF9F4A]/50 focus:ring-2 focus:ring-[#FF9F4A]/15 transition-all disabled:opacity-50 text-sm"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors p-1"
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full mt-2 py-3.5 bg-gradient-to-r from-[#FF9F4A] to-[#FF8C2E] text-white font-bold rounded-xl hover:shadow-2xl hover:shadow-[#FF9F4A]/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2.5 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/15 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin relative z-10" />
                  <span className="relative z-10">جاري التحقق...</span>
                </>
              ) : (
                <span className="relative z-10 text-base">دخول</span>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-5 border-t border-white/8 space-y-2">
            <p className="text-center text-white/25 text-xs leading-relaxed">
              هذا النظام مخصص للموظفين المصرح لهم فقط
            </p>
            <p className="text-center text-white/20 text-[10px] leading-relaxed">
              نظام إدارة مركز الإعلام 2026 ©
              <br />
              تصميم وتنفيذ: وحدة ليمينال للحلول الذكية والتقنية
              <br />
              جميع الحقوق محفوظة لدى وحدة ليمينال للحلول الذكية والتقنية
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
