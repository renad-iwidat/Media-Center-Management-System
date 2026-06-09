import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { 
  Users, CheckCircle2, AlertCircle, Clock, 
  ClipboardList, CheckSquare, TrendingUp, Calendar,
  Award, ArrowUpRight, Timer, Database
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardData, TrendData, UserPerformance } from '../types';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<string>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [data, setData] = useState<DashboardData | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [userPerformers, setUserPerformers] = useState<UserPerformance[]>([]);
  const [leaveCount, setLeaveCount] = useState(0);
  const [tablePage, setTablePage] = useState(0);
  const [contentStats, setContentStats] = useState<any>(null);
  const TABLE_PAGE_SIZE = 10;

  const getDateRange = () => {
    if (period === 'custom' && customFrom && customTo) {
      return { from: customFrom, to: customTo };
    }
    if (period === 'all') return { from: '', to: '' };

    const to = new Date();
    const from = new Date();
    
    switch (period) {
      case 'this-week':
        from.setDate(to.getDate() - to.getDay()); // بداية الأسبوع الحالي
        break;
      case 'last-week':
        from.setDate(to.getDate() - to.getDay() - 7);
        to.setDate(to.getDate() - to.getDay() - 1);
        break;
      case 'this-month':
        from.setDate(1); // بداية الشهر الحالي
        break;
      case 'last-month':
        from.setMonth(to.getMonth() - 1, 1);
        to.setDate(0); // آخر يوم من الشهر الماضي
        break;
      case '3-months':
        from.setMonth(to.getMonth() - 3);
        break;
      case '6-months':
        from.setMonth(to.getMonth() - 6);
        break;
      case 'year':
        from.setFullYear(to.getFullYear() - 1);
        break;
    }
    return { from: format(from, 'yyyy-MM-dd'), to: format(to, 'yyyy-MM-dd') };
  };

  const fetchData = async () => {
    setLoading(true);
    const { from, to } = getDateRange();
    const dateQuery = from && to ? `?from=${from}&to=${to}` : '';
    try {
      const [dashRes, trendRes, userRes, leaveRes] = await Promise.all([
        api.get<any>(`/api/kpi/dashboard${dateQuery}`).catch(() => ({ success: false, data: null })),
        api.get<any>('/api/kpi/trends?months=6').catch(() => ({ success: false, data: [] })),
        api.get<any>('/api/kpi/users?limit=200').catch(() => ({ success: false, data: [] })),
        api.get<any>('/api/administrative/orders?category_id=4&limit=500').catch(() => ({ success: false, data: [] })),
      ]);

      if (dashRes.success && dashRes.data) setData(dashRes.data);
      if (trendRes.success && Array.isArray(trendRes.data)) setTrends([...trendRes.data].reverse());
      if (userRes.success && Array.isArray(userRes.data)) setUserPerformers(userRes.data);
      if (leaveRes.success && Array.isArray(leaveRes.data)) {
        setLeaveCount(leaveRes.data.length);
      }

      // إحصائيات الأرشيف من الـ dashboard data
      if (dashRes.success && dashRes.data?.content) {
        setContentStats({
          total: dashRes.data.content.total || 0,
          archived: dashRes.data.content.archived || 0,
          totalSizeMB: dashRes.data.content.total_size_mb || 0,
          totalSizeGB: ((dashRes.data.content.total_size_mb || 0) / 1024).toFixed(2),
          totalReuses: dashRes.data.reuse?.total_reuses || 0,
          types: dashRes.data.content.types || [],
          byDesk: dashRes.data.content.byDesk || [],
          topReused: dashRes.data.reuse?.top_reused || [],
        });
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [period, customFrom, customTo]);

  if (loading && !data) return <DashboardSkeleton />;
  if (!data) return (
    <div className="text-center py-20">
      <p className="text-gray-500 text-lg">جاري تحميل البيانات...</p>
      <button onClick={fetchData} className="mt-4 px-6 py-2 bg-[#2d5570] text-white rounded-xl font-bold">
        إعادة المحاولة
      </button>
    </div>
  );

  // بيانات الـ Pie Chart
  const tasksPieData = [
    { name: 'منجز', value: data.tasks.completed, color: '#10b981' },
    { name: 'قيد التنفيذ', value: data.tasks.in_progress, color: '#3b82f6' },
    { name: 'معلق', value: data.tasks.pending, color: '#f59e0b' },
    { name: 'متأخر', value: data.tasks.overdue, color: '#ef4444' },
  ].filter(d => d.value > 0);

  // ترتيب الموظفين حسب الإنجاز
  const sortedPerformers = [...userPerformers]
    .sort((a, b) => b.completed_tasks - a.completed_tasks);

  const topPerformer = sortedPerformers[0];

  return (
    <div className="space-y-6 pb-8">
      {/* Header + Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">لوحة التحكم</h1>
          <p className="text-sm text-gray-500">نظرة شاملة على أداء مركز الإعلام</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm flex-wrap">
            {[
              { key: 'all', label: 'الكل' },
              { key: 'this-week', label: 'هذا الأسبوع' },
              { key: 'last-week', label: 'الأسبوع الماضي' },
              { key: 'this-month', label: 'هذا الشهر' },
              { key: 'last-month', label: 'الشهر الماضي' },
              { key: '3-months', label: '3 أشهر' },
              { key: '6-months', label: '6 أشهر' },
              { key: 'year', label: 'سنة' },
              { key: 'custom', label: 'مخصص' },
            ].map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  period === p.key
                    ? 'bg-[#2d5570] text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {period === 'custom' && (
            <div className="flex items-center gap-2">
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs" />
              <span className="text-gray-400 text-xs">إلى</span>
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs" />
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards - Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="الموظفين"
          value={data.users.total}
          color="bg-indigo-500"
          bgLight="bg-indigo-50"
        />
        <StatCard
          icon={<ClipboardList className="w-5 h-5" />}
          label="الطلبات"
          value={data.orders.total}
          sub={`${data.orders.completed} منجز`}
          color="bg-blue-500"
          bgLight="bg-blue-50"
        />
        <StatCard
          icon={<CheckSquare className="w-5 h-5" />}
          label="المهام"
          value={data.tasks.total}
          sub={`${data.tasks.completed} منجز`}
          color="bg-emerald-500"
          bgLight="bg-emerald-50"
        />
        <StatCard
          icon={<Calendar className="w-5 h-5" />}
          label="الإجازات/المغادرات"
          value={leaveCount}
          color="bg-amber-500"
          bgLight="bg-amber-50"
        />
      </div>

      {/* Stats Cards - Row 2 (Task Status) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStat label="مهام منجزة" value={data.tasks.completed} icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />} />
        <MiniStat label="قيد التنفيذ" value={data.tasks.in_progress} icon={<Clock className="w-4 h-4 text-blue-500" />} />
        <MiniStat label="مهام متأخرة" value={data.tasks.overdue} icon={<AlertCircle className="w-4 h-4 text-red-500" />} />
        <MiniStat label="نسبة الإنجاز" value={`${data.tasks.completion_rate}%`} icon={<TrendingUp className="w-4 h-4 text-purple-500" />} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trends Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">الاتجاهات الشهرية</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="tasks" name="المهام" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={2} />
              <Area type="monotone" dataKey="orders" name="الطلبات" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">توزيع المهام</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={tasksPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                {tasksPieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {tasksPieData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-gray-600 font-medium">{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performer Highlight */}
      {topPerformer && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6 flex items-center gap-5"
        >
          <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Award className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-sm text-amber-700 font-bold">أكثر موظف إنجازاً</p>
            <p className="text-2xl font-black text-gray-900">{topPerformer.user_name}</p>
            <p className="text-sm text-gray-500 mt-0.5">
              {topPerformer.completed_tasks} مهمة منجزة • {topPerformer.on_time_percentage}% في الوقت
            </p>
          </div>
        </motion.div>
      )}

      {/* Employee Performance Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800">أداء الموظفين</h3>
          <span className="text-xs text-gray-400 font-medium">{sortedPerformers.length} موظف</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 font-bold uppercase">
                <th className="px-6 py-3 text-right">#</th>
                <th className="px-6 py-3 text-right">الموظف</th>
                <th className="px-6 py-3 text-center">المهام الكلية</th>
                <th className="px-6 py-3 text-center">منجز</th>
                <th className="px-6 py-3 text-center">متأخر</th>
                <th className="px-6 py-3 text-center">المهام اليومية</th>
                <th className="px-6 py-3 text-center">الإنجاز اليومي</th>
                <th className="px-6 py-3 text-center">نسبة الإنجاز الكلي</th>
                <th className="px-6 py-3 text-center">الأداء</th>
              </tr>
            </thead>
            <tbody>
              {sortedPerformers.slice(tablePage * TABLE_PAGE_SIZE, (tablePage + 1) * TABLE_PAGE_SIZE).map((user, i) => {
                const globalIndex = tablePage * TABLE_PAGE_SIZE + i;
                const rate = user.total_tasks_assigned > 0 
                  ? Math.round((user.completed_tasks / user.total_tasks_assigned) * 100) 
                  : 0;
                return (
                  <tr key={user.user_id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        globalIndex === 0 ? 'bg-amber-100 text-amber-700' : globalIndex === 1 ? 'bg-gray-200 text-gray-700' : globalIndex === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {globalIndex + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-800">{user.user_name}</p>
                      <p className="text-xs text-gray-400">{user.role_name}</p>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-gray-700">{user.total_tasks_assigned}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-bold">{user.completed_tasks}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-lg text-sm font-bold ${user.overdue_tasks > 0 ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-400'}`}>
                        {user.overdue_tasks}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 bg-teal-50 text-teal-700 rounded-lg text-sm font-bold">
                        {user.daily_completed_tasks ?? 0} / {user.daily_total_tasks ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-teal-600">{user.daily_completion_rate ?? 0}%</td>
                    <td className="px-6 py-4 text-center font-bold text-gray-700">{rate}%</td>
                    <td className="px-6 py-4">
                      <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full transition-all ${rate >= 80 ? 'bg-emerald-500' : rate >= 50 ? 'bg-blue-500' : rate >= 30 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(rate, 100)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {sortedPerformers.length === 0 && (
            <div className="text-center py-12 text-gray-400">لا توجد بيانات أداء</div>
          )}
        </div>
        {/* Pagination */}
        {sortedPerformers.length > TABLE_PAGE_SIZE && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              عرض {tablePage * TABLE_PAGE_SIZE + 1} - {Math.min((tablePage + 1) * TABLE_PAGE_SIZE, sortedPerformers.length)} من {sortedPerformers.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTablePage(p => Math.max(0, p - 1))}
                disabled={tablePage === 0}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold disabled:opacity-40 hover:bg-gray-200 transition-colors"
              >
                السابق
              </button>
              <span className="text-sm font-bold text-gray-600">
                {tablePage + 1} / {Math.ceil(sortedPerformers.length / TABLE_PAGE_SIZE)}
              </span>
              <button
                onClick={() => setTablePage(p => Math.min(Math.ceil(sortedPerformers.length / TABLE_PAGE_SIZE) - 1, p + 1))}
                disabled={tablePage >= Math.ceil(sortedPerformers.length / TABLE_PAGE_SIZE) - 1}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold disabled:opacity-40 hover:bg-gray-200 transition-colors"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Employee Bar Chart - Top 10 */}
      {sortedPerformers.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-6">أعلى 10 موظفين إنجازاً</h3>
          <ResponsiveContainer width="100%" height={Math.max(Math.min(sortedPerformers.length, 10) * 45, 200)}>
            <BarChart data={sortedPerformers.slice(0, 10)} layout="vertical" margin={{ right: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis 
                type="category" 
                dataKey="user_name" 
                tick={{ fontSize: 11 }} 
                stroke="#94a3b8" 
                width={120}
              />
              <Tooltip 
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                formatter={(value: any, name: string) => [value, name]}
              />
              <Bar dataKey="completed_tasks" name="منجز" fill="#10b981" radius={[0, 6, 6, 0]} barSize={20} />
              <Bar dataKey="overdue_tasks" name="متأخر" fill="#ef4444" radius={[0, 6, 6, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-emerald-500" />
              <span className="text-gray-600 font-medium">مهام منجزة</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-red-500" />
              <span className="text-gray-600 font-medium">مهام متأخرة</span>
            </div>
          </div>
        </div>
      )}

      {/* Orders Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStat label="طلبات منجزة" value={data.orders.completed} icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />} />
        <MiniStat label="طلبات قيد التنفيذ" value={data.orders.in_progress} icon={<Clock className="w-4 h-4 text-blue-500" />} />
        <MiniStat label="طلبات متأخرة" value={data.orders.overdue} icon={<AlertCircle className="w-4 h-4 text-red-500" />} />
        <MiniStat label="متوسط مدة المهمة" value={`${data.performance.avg_task_duration_minutes || 0} ساعة`} icon={<Timer className="w-4 h-4 text-indigo-500" />} />
      </div>

      {/* إحصائيات الأرشيف الذكي */}
      {contentStats && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-sm">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">إحصائيات الأرشيف الذكي</h3>
              <p className="text-xs text-gray-400">جميع الملفات والمحتوى المخزن في النظام</p>
            </div>
          </div>

          {/* الأرقام */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-cyan-50 rounded-xl p-4 border border-cyan-100 text-center">
              <p className="text-3xl font-black text-gray-900">{contentStats.total}</p>
              <p className="text-xs text-cyan-700 font-bold mt-1">إجمالي الملفات</p>
            </div>
            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100 text-center">
              <p className="text-3xl font-black text-gray-900">{contentStats.archived}</p>
              <p className="text-xs text-indigo-700 font-bold mt-1">محتوى مؤرشف</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 text-center">
              <p className="text-3xl font-black text-gray-900">{contentStats.totalSizeMB > 1024 ? contentStats.totalSizeGB + ' GB' : contentStats.totalSizeMB + ' MB'}</p>
              <p className="text-xs text-blue-700 font-bold mt-1">حجم التخزين</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100 text-center">
              <p className="text-3xl font-black text-gray-900">{contentStats.totalReuses}</p>
              <p className="text-xs text-purple-700 font-bold mt-1">إعادة استخدام</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Pie Chart - أنواع المحتوى */}
            {contentStats.types && contentStats.types.length > 0 && (
              <div className="border border-gray-100 rounded-xl p-5">
                <h4 className="text-sm font-bold text-gray-700 mb-4 text-center">توزيع أنواع المحتوى</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie 
                      data={contentStats.types} 
                      cx="50%" cy="50%" 
                      innerRadius={45} outerRadius={75} 
                      dataKey="count" 
                      nameKey="name"
                      paddingAngle={3}
                    >
                      {contentStats.types.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any, name: string) => [`${value} ملف`, name]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-2 mt-3">
                  {contentStats.types.map((t: any, i: number) => (
                    <div key={t.name} className="flex items-center gap-1.5 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-gray-600">{t.name} ({t.count})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pie Chart - المحتوى حسب القسم */}
            {contentStats.byDesk && contentStats.byDesk.length > 0 && (
              <div className="border border-gray-100 rounded-xl p-5">
                <h4 className="text-sm font-bold text-gray-700 mb-4 text-center">المحتوى حسب القسم (الديسك)</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie 
                      data={contentStats.byDesk} 
                      cx="50%" cy="50%" 
                      innerRadius={45} outerRadius={75} 
                      dataKey="count" 
                      nameKey="name"
                      paddingAngle={3}
                    >
                      {contentStats.byDesk.map((_: any, i: number) => (
                        <Cell key={i} fill={['#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444', '#10b981', '#06b6d4'][i % 6]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any, name: string) => [`${value} ملف`, name]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-2 mt-3">
                  {contentStats.byDesk.map((d: any, i: number) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ['#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444', '#10b981', '#06b6d4'][i % 6] }} />
                      <span className="text-gray-600">{d.name} ({d.count})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* أكثر محتوى تم إعادة استخدامه */}
          {contentStats.topReused && contentStats.topReused.length > 0 && (
            <div>
              <p className="text-sm font-bold text-gray-700 mb-3">أكثر محتوى تم إعادة استخدامه</p>
              <div className="space-y-2">
                {contentStats.topReused.map((item: any, i: number) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                      <div>
                        <p className="text-sm font-bold text-gray-800">{item.title}</p>
                        {item.type && <p className="text-xs text-gray-400">{item.type}</p>}
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold">{item.reuseCount} مرة</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════ Components ═══════════════

function StatCard({ icon, label, value, sub, color, bgLight }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${bgLight} rounded-2xl p-5 border border-gray-100`}
    >
      <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center text-white mb-3 shadow-sm`}>
        {icon}
      </div>
      <p className="text-3xl font-black text-gray-900">{value}</p>
      <p className="text-sm font-bold text-gray-600 mt-1">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </motion.div>
  );
}

function MiniStat({ label, value, icon }: any) {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
      <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xl font-black text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-8 w-40 bg-gray-200 rounded-lg" />
        <div className="h-10 w-64 bg-gray-200 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-80 bg-gray-100 rounded-2xl" />
        <div className="h-80 bg-gray-100 rounded-2xl" />
      </div>
      <div className="h-64 bg-gray-100 rounded-2xl" />
    </div>
  );
}
