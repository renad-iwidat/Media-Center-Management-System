/**
 * صفحة تسجيل الدخول
 * تتصل بسيرفر الإدارة وتحفظ التوكن
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { LogIn, AlertCircle, Loader } from 'lucide-react';
import { api, setAuthToken, setCurrentUser } from '../../services/api';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [email, setEmail] = useState(() => {
    // استرجاع البريد المحفوظ من localStorage
    return localStorage.getItem('savedEmail') || '';
  });
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // حفظ البريد الإلكتروني في localStorage عند تغييره
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    
    // حفظ البريد في localStorage إذا كان غير فارغ
    if (newEmail.trim()) {
      localStorage.setItem('savedEmail', newEmail);
    } else {
      localStorage.removeItem('savedEmail');
    }
  };

  // التحقق من وجود logout flag لمسح البريد المحفوظ
  useEffect(() => {
    const logoutFlag = localStorage.getItem('justLoggedOut');
    if (logoutFlag) {
      console.log('🧹 [LOGIN] تم اكتشاف logout - مسح البريد المحفوظ');
      localStorage.removeItem('savedEmail');
      localStorage.removeItem('justLoggedOut');
      setEmail(''); // مسح البريد من الـ input
      
      // عرض رسالة ترحيب بعد الخروج
      setTimeout(() => {
        console.log('👋 [LOGIN] مرحباً مرة أخرى!');
      }, 500);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('🔐 [LOGIN] بدء عملية تسجيل الدخول');
      console.log('📧 البريد الإلكتروني:', email);

      // تسجيل الدخول مع timeout 10 ثواني
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const managementApiUrl = import.meta.env.VITE_MANAGEMENT_API_URL || 'https://media-center-management-system.onrender.com';

      console.log('🌐 [LOGIN] الرابط:', `${managementApiUrl}/api/auth/login`);

      const loginResponse = await fetch(
        `${managementApiUrl}/api/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      console.log('📨 [LOGIN] الرد من السيرفر:', loginResponse.status, loginResponse.statusText);

      if (!loginResponse.ok) {
        const errorData = await loginResponse.json();
        console.error('❌ [LOGIN] خطأ من السيرفر:', errorData);
        throw new Error(errorData.error || 'فشل تسجيل الدخول');
      }

      const loginData = await loginResponse.json();
      
      console.log('✅ [LOGIN] بيانات الرد:', loginData);
      
      if (!loginData.success || !loginData.data?.token) {
        console.error('❌ [LOGIN] لا يوجد توكن في الرد');
        throw new Error('فشل تسجيل الدخول');
      }

      console.log('🔑 [LOGIN] التوكن:', loginData.data.token.substring(0, 20) + '...');

      // حفظ التوكن
      setAuthToken(loginData.data.token);
      console.log('💾 [LOGIN] تم حفظ التوكن في localStorage');

      // جلب بيانات المستخدم مع timeout 5 ثواني
      const meController = new AbortController();
      const meTimeoutId = setTimeout(() => meController.abort(), 5000);

      console.log('🌐 [LOGIN] جاري جلب بيانات المستخدم...');

      const meResponse = await fetch(
        `${managementApiUrl}/api/auth/me`,
        {
          headers: {
            'Authorization': `Bearer ${loginData.data.token}`,
            'Content-Type': 'application/json',
          },
          signal: meController.signal,
        }
      );

      clearTimeout(meTimeoutId);

      console.log('📨 [LOGIN] الرد من /auth/me:', meResponse.status, meResponse.statusText);

      if (!meResponse.ok) {
        console.error('❌ [LOGIN] خطأ في جلب بيانات المستخدم');
        throw new Error('فشل جلب بيانات المستخدم');
      }

      const meData = await meResponse.json();
      
      console.log('✅ [LOGIN] بيانات المستخدم:', meData);
      
      if (!meData.success || !meData.data) {
        console.error('❌ [LOGIN] لا توجد بيانات مستخدم في الرد');
        throw new Error('فشل جلب بيانات المستخدم');
      }

      // حفظ بيانات المستخدم
      setCurrentUser(meData.data);
      console.log('💾 [LOGIN] تم حفظ بيانات المستخدم:', meData.data.name);

      console.log('🎉 [LOGIN] تم تسجيل الدخول بنجاح!');

      // استدعاء callback النجاح
      onLoginSuccess();
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.error('⏱️ [LOGIN] انتهت مهلة الانتظار');
        setError('انتهت مهلة الانتظار — تحقق من الاتصال بالإنترنت');
      } else {
        console.error('❌ [LOGIN] خطأ:', err.message);
        setError(err.message || 'حدث خطأ أثناء تسجيل الدخول');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020617] via-[#0b1224] to-[#020617] flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#4A7C9C]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#FF9F43]/10 rounded-full blur-3xl" />
      </div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="bg-[#0b1224]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#FF9F43] to-[#FF8C2E] rounded-2xl flex items-center justify-center shadow-xl shadow-[#FF9F43]/30 mx-auto mb-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
              <LogIn className="text-white w-8 h-8 relative z-10" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">تسجيل الدخول</h1>
            <p className="text-gray-400 text-sm">
              <span className="text-[#FF9F43] font-semibold">مركز الإعلام</span> — جامعة النجاح الوطنية
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3"
            >
              <AlertCircle className="text-red-400 w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="example@domain.com"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#FF9F43]/50 focus:ring-1 focus:ring-[#FF9F43]/30 focus:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                required
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">كلمة المرور</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#FF9F43]/50 focus:ring-1 focus:ring-[#FF9F43]/30 focus:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#FF9F43] transition-colors disabled:opacity-50"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full py-3 bg-gradient-to-r from-[#FF9F43] to-[#FF8C2E] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#FF9F43]/30 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              {isLoading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin relative z-10" />
                  <span className="relative z-10">جاري التحقق...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">دخول</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-center text-gray-500 text-xs">
              هذا النظام مخصص للموظفين المصرح لهم فقط
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
