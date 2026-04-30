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

      const managementApiUrl = import.meta.env.VITE_MANAGEMENT_API_URL || 'https://media-center-management-system.onrender.com';

      console.log('🌐 [LOGIN] الرابط:', `${managementApiUrl}/api/auth/login`);

      const loginResponse = await fetch(
        `${managementApiUrl}/api/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        }
      );

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

      console.log('🌐 [LOGIN] جاري جلب بيانات المستخدم...');

      const meResponse = await fetch(
        `${managementApiUrl}/api/auth/me`,
        {
          headers: {
            'Authorization': `Bearer ${loginData.data.token}`,
            'Content-Type': 'application/json',
          },
        }
      );

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
    <div className="min-h-screen bg-gradient-to-br from-[#1f3a4f] via-[#2d5570] to-[#1f3a4f] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration - subtle gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-[#FF9F4A]/15 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-br from-[#FF9F4A]/10 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="bg-white backdrop-blur-xl border border-gray-200 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#FF9F4A] to-[#FFB366] rounded-2xl flex items-center justify-center shadow-lg shadow-[#FF9F4A]/40 mx-auto mb-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
              <LogIn className="text-white w-8 h-8 relative z-10" />
            </div>
            <h1 className="text-2xl font-bold text-[#1e293b] mb-2">تسجيل الدخول</h1>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3"
            >
              <AlertCircle className="text-rose-600 w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-rose-700 text-sm">{error}</p>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-semibold text-[#1e293b] mb-2">البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="example@domain.com"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[#1e293b] placeholder-[#cbd5e1] focus:outline-none focus:border-[#FF9F4A] focus:ring-2 focus:ring-[#FF9F4A]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                required
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-semibold text-[#1e293b] mb-2">كلمة المرور</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[#1e293b] placeholder-[#cbd5e1] focus:outline-none focus:border-[#FF9F4A] focus:ring-2 focus:ring-[#FF9F4A]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#FF9F4A] transition-colors disabled:opacity-50"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full py-3 bg-gradient-to-r from-[#FF9F4A] to-[#FFB366] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#FF9F4A]/40 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative overflow-hidden group"
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
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-[#64748b] text-xs">
              هذا النظام مخصص للموظفين المصرح لهم فقط
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
