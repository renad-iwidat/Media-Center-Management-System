import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Megaphone, 
  TrendingUp, 
  Users, 
  Briefcase,
  ArrowLeft,
  Lock,
  Archive
} from 'lucide-react';
import { api } from '../../services/api';
import { AdminProcCategory, AdminProcResponse, AdminProcListResponse } from '../../types/administrative';

// Map of icon names to Lucide components
const ICON_MAP: Record<string, any> = {
  BookOpen,
  Megaphone,
  TrendingUp,
  Users,
  Briefcase,
};

export default function AdminProceduresPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<AdminProcCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    checkAccessAndLoad();
  }, []);

  const checkAccessAndLoad = async () => {
    try {
      // 1. فحص صلاحية الوصول
      const accessRes = await api.get<AdminProcResponse<{ has_access: boolean }>>(
        '/api/administrative/access/check'
      );
      
      if (!accessRes.success || !accessRes.data?.has_access) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      setHasAccess(true);

      // 2. جلب الأقسام
      const categoriesRes = await api.get<AdminProcListResponse<AdminProcCategory>>(
        '/api/administrative/categories'
      );

      if (categoriesRes.success) {
        setCategories(categoriesRes.data);
      }
    } catch (err) {
      console.error('Failed to load admin procedures:', err);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md p-8 bg-red-50 border-2 border-red-200 rounded-2xl"
        >
          <Lock className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-700 mb-2">صلاحية مرفوضة</h2>
          <p className="text-red-600">
            هذه الصفحة مخصصة للإداريين فقط. ليس لديك صلاحية للوصول إليها.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-6 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            العودة للوحة التحكم
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="p-4 bg-gradient-to-br from-[#FF9F4A] to-orange-600 rounded-2xl shadow-lg shadow-orange-500/30">
            <Briefcase className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">الإجراءات الإدارية</h1>
            <p className="text-gray-500 mt-1">
              نظام مخصص للإجراءات الإدارية والشؤون التنظيمية
            </p>
          </div>
        </div>

        {/* زر الأرشيف الخاص بالإداريين */}
        <button
          onClick={() => navigate('/administrative/archive')}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all"
        >
          <Archive className="w-5 h-5" />
          الأرشيف الخاص بالإداريين
        </button>
      </motion.div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((category, index) => {
          const IconComponent = ICON_MAP[category.icon || 'Briefcase'] || Briefcase;
          const color = category.color || '#3B82F6';

          return (
            <motion.div
              key={category.id.toString()}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -4 }}
              onClick={() => navigate(`/administrative/categories/${category.id}`)}
              className="cursor-pointer bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border-2 border-transparent hover:border-[#FF9F4A]/30 group relative overflow-hidden"
            >
              {/* Background decoration */}
              <div 
                className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-10 group-hover:opacity-20 transition-opacity"
                style={{ backgroundColor: color }}
              />
              
              <div className="relative">
                <div className="flex items-start justify-between mb-6">
                  <div 
                    className="p-4 rounded-2xl shadow-lg transition-transform group-hover:scale-110"
                    style={{ 
                      backgroundColor: color + '20',
                      boxShadow: `0 8px 16px ${color}30`,
                    }}
                  >
                    <IconComponent 
                      className="w-10 h-10" 
                      style={{ color: color }}
                    />
                  </div>
                  <ArrowLeft 
                    className="w-6 h-6 text-gray-300 group-hover:text-[#FF9F4A] group-hover:-translate-x-1 transition-all" 
                  />
                </div>

                <h3 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-[#FF9F4A] transition-colors">
                  {category.name}
                </h3>
                <p className="text-gray-500 leading-relaxed">
                  {category.description || 'لا يوجد وصف'}
                </p>

                <div className="mt-6 flex items-center gap-2 text-sm font-semibold" style={{ color: color }}>
                  <span>عرض الطلبات</span>
                  <ArrowLeft className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 flex items-start gap-4"
      >
        <div className="p-3 bg-blue-500 rounded-xl flex-shrink-0">
          <Lock className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-blue-900 mb-1">نظام مخصص للإداريين</h3>
          <p className="text-blue-700 text-sm leading-relaxed">
            الطلبات والمهام في هذا النظام لا تظهر إلا للأشخاص المعينين أو المنشن عليهم. 
            الأرشيف خاص ومنفصل عن أرشيف النظام العادي.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
