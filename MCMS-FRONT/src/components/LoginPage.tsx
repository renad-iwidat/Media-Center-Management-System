import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input } from './ui/Inputs';
import { motion } from 'framer-motion';
import { Lock, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول. يرجى التحقق من البيانات.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#020617] p-4 font-sans">
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-dark p-8 rounded-2xl relative z-10"
      >
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-600/40 mb-2">
            <Lock className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">نظام إدارة مركز الإعلام</h1>
          <p className="text-gray-400 text-sm">أدخل بياناتك للوصول إلى لوحة التحكم</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="relative">
            <Mail className="absolute right-4 top-[42px] text-gray-500 w-5 h-5" />
            <Input
              label="البريد الإلكتروني"
              type="email"
              placeholder="name@najah.edu"
              className="pr-12"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute right-4 top-[42px] text-gray-500 w-5 h-5" />
            <Input
              label="كلمة المرور"
              type="password"
              placeholder="••••••••"
              className="pr-12"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm py-2.5 px-4 rounded-xl"
            >
              {error}
            </motion.div>
          )}

          <Button type="submit" isLoading={loading} className="w-full h-12 text-lg mt-2">
            تسجيل الدخول
          </Button>
        </form>

      
      </motion.div>
    </div>
  );
}
