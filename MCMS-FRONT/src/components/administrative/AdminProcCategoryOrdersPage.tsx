import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  ArrowRight,
  ArrowLeft,
  Calendar,
  User,
  Clock,
  ListTodo,
  CheckCircle2,
  AlertCircle,
  Lock,
  BookOpen,
  Megaphone,
  TrendingUp,
  Users,
  Briefcase,
  Archive
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { api } from '../../services/api';
import { 
  AdminProcCategory, 
  AdminProcOrder, 
  AdminProcResponse, 
  AdminProcListResponse 
} from '../../types/administrative';
import AdminProcOrderForm from './AdminProcOrderForm';

const ICON_MAP: Record<string, any> = {
  BookOpen, Megaphone, TrendingUp, Users, Briefcase,
};

export default function AdminProcCategoryOrdersPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();

  const [category, setCategory] = useState<AdminProcCategory | null>(null);
  const [orders, setOrders] = useState<AdminProcOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    if (categoryId) {
      checkAccessAndLoad();
    }
  }, [categoryId, showArchived]);

  const checkAccessAndLoad = async () => {
    try {
      // 1. فحص الصلاحية
      const accessRes = await api.get<AdminProcResponse<{ has_access: boolean }>>(
        '/api/administrative/access/check'
      );

      // 2. جلب القسم
      const categoryRes = await api.get<AdminProcResponse<AdminProcCategory>>(
        `/api/administrative/categories/${categoryId}`
      );

      if (categoryRes.success) {
        setCategory(categoryRes.data);
      }

      // 3. جلب الطلبات (المسموح بها للمستخدم)
      const ordersRes = await api.get<AdminProcListResponse<AdminProcOrder>>(
        `/api/administrative/categories/${categoryId}/orders?is_archived=${showArchived}`
      );

      if (ordersRes.success) {
        setOrders(ordersRes.data);
        // لو في طلبات → يعني له وصول
        setHasAccess(accessRes.data?.has_access || ordersRes.data.length > 0);
      } else {
        setHasAccess(accessRes.data?.has_access || false);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((o) =>
    !search || o.title.toLowerCase().includes(search.toLowerCase()) ||
    (o.description && o.description.toLowerCase().includes(search.toLowerCase()))
  );

  const handleOrderCreated = () => {
    setShowForm(false);
    checkAccessAndLoad();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (hasAccess === false && orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md p-8 bg-red-50 border-2 border-red-200 rounded-2xl">
          <Lock className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-700 mb-2">صلاحية مرفوضة</h2>
          <p className="text-red-600">ليس لديك صلاحية لعرض هذا القسم</p>
        </div>
      </div>
    );
  }

  const IconComponent = ICON_MAP[category?.icon || 'Briefcase'] || Briefcase;
  const color = category?.color || '#3B82F6';

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <button
          onClick={() => navigate('/administrative')}
          className="flex items-center gap-2 text-gray-500 hover:text-[#FF9F4A] mb-4 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة للأقسام</span>
        </button>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div 
              className="p-4 rounded-2xl shadow-lg"
              style={{ backgroundColor: color + '20', boxShadow: `0 8px 16px ${color}30` }}
            >
              <IconComponent className="w-8 h-8" style={{ color }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{category?.name}</h1>
              <p className="text-gray-500 mt-1">{category?.description}</p>
            </div>
          </div>

          {hasAccess && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#FF9F4A] to-orange-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all"
            >
              <Plus className="w-5 h-5" />
              إنشاء طلب جديد
            </button>
          )}
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="ابحث عن طلب..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-[#FF9F4A] focus:outline-none transition-colors"
          />
        </div>

        <button
          onClick={() => setShowArchived(!showArchived)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
            showArchived
              ? 'bg-gray-700 text-white'
              : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-[#FF9F4A]'
          }`}
        >
          <Archive className="w-5 h-5" />
          {showArchived ? 'المؤرشف' : 'النشطة'}
        </button>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300"
        >
          <ListTodo className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-500 mb-2">
            {showArchived ? 'لا توجد طلبات مؤرشفة' : 'لا توجد طلبات بعد'}
          </h3>
          <p className="text-gray-400">
            {hasAccess && !showArchived && 'ابدأ بإنشاء طلب جديد لهذا القسم'}
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOrders.map((order, index) => (
            <motion.div
              key={order.id.toString()}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.01 }}
              onClick={() => navigate(`/administrative/orders/${order.id}`)}
              className="cursor-pointer bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-[#FF9F4A]/30"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-bold text-gray-800 flex-1">{order.title}</h3>
                <ArrowLeft className="w-5 h-5 text-gray-300" />
              </div>

              {order.description && (
                <p className="text-gray-600 mb-4 line-clamp-2">{order.description}</p>
              )}

              <div className="flex items-center flex-wrap gap-3 text-sm">
                {order.status_name && (
                  <span 
                    className="px-3 py-1 rounded-full font-semibold text-xs"
                    style={{ backgroundColor: color + '20', color }}
                  >
                    {order.status_name}
                  </span>
                )}

                {order.tasks_count !== undefined && (
                  <span className="flex items-center gap-1 text-gray-500">
                    <CheckCircle2 className="w-4 h-4" />
                    {order.completed_tasks_count || 0} / {order.tasks_count} مهمة
                  </span>
                )}

                {order.deadline && (
                  <span className="flex items-center gap-1 text-gray-500">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(order.deadline), 'dd MMM yyyy', { locale: ar })}
                  </span>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {order.created_by_name || 'مستخدم'}
                </span>
                {order.created_at && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(order.created_at), 'dd MMM', { locale: ar })}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && category && (
        <AdminProcOrderForm
          category={category}
          onClose={() => setShowForm(false)}
          onCreated={handleOrderCreated}
        />
      )}
    </div>
  );
}
