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
      const managementApiUrl = getEnvVar('VITE_MANAGEMENT_API_URL') || 'https://media-center-management-system.onrender.com';

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
    <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-lg"
      >
        {/* Card */}
        <div className="bg-white border-2 border-[#e2e8f0] rounded-3xl p-10 shadow-lg">
          {/* Logo */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-gradient-to-br from-[#FF9F4A] to-[#FF8C2E] rounded-3xl flex items-center justify-center shadow-xl shadow-[#FF9F4A]/30 mx-auto mb-6">
              <TrendingUp className="text-white w-10 h-10" />
            </div>
            <h1 className="text-3xl font-arabic font-bold text-[#1e293b] mb-2">
              مركز <span className="text-[#FF9F4A]">الإعلام</span>
            </h1>
            <p className="text-[#64748b] text-lg">تسجيل الدخول إلى النظام</p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-5 bg-red-50 border-2 border-red-200 rounded-2xl flex items-start gap-4"
              role="alert"
            >
              <AlertCircle className="text-red-500 w-6 h-6 shrink-0 mt-0.5" />
              <p className="text-red-700 text-lg font-bold leading-relaxed">{error}</p>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div className="space-y-3">
              <label htmlFor="email" className="block text-lg font-bold text-[#1e293b]">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Mail size={22} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="example@domain.com"
                  disabled={isLoading}
                  dir="ltr"
                  className="w-full pr-14 pl-5 py-4 text-lg"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-3">
              <label htmlFor="password" className="block text-lg font-bold text-[#1e293b]">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock size={22} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  disabled={isLoading}
                  className="w-full pr-14 pl-14 py-4 text-lg"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#3d6a8a] transition-colors p-1"
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="btn-primary w-full text-xl py-5 mt-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>جاري التحقق...</span>
                </>
              ) : (
                <span>تسجيل الدخول</span>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t-2 border-[#e2e8f0]">
            <p className="text-center text-[#64748b] text-base">
              هذا النظام مخصص للموظفين المصرح لهم فقط
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
