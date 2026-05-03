import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { 
  Calendar, ArrowUpRight, ArrowDownRight, Clock, 
  CheckCircle2, AlertCircle, Users, Database, 
  Search, Filter, ChevronRight, BarChart3, TrendingUp,
  FileText, ClipboardList, CheckSquare, RefreshCcw
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardData, TrendData, UserPerformance, OverdueTask } from '../types';
import { Button, Input } from './ui/Inputs';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    from: format(new Date(new Date().setDate(new Date().getDate() - 30)), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd')
  });

  const [data, setData] = useState<DashboardData | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [userPerformers, setUserPerformers] = useState<UserPerformance[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<OverdueTask[]>([]);
  const [inProgressTasks, setInProgressTasks] = useState<any[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<any[]>([]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const [dashRes, trendRes, userRes, overdueRes, tasksRes] = await Promise.all([
        api.get<any>(`/api/kpi/dashboard?from=${filters.from}&to=${filters.to}`),
        api.get<any>(`/api/kpi/trends?months=6`),
        api.get<any>(`/api/kpi/users`),
        api.get<any>(`/api/tasks/overdue`),
        api.get<any>(`/api/tasks`)
      ]);

      if (dashRes.success) setData(dashRes.data);
      if (trendRes.success) setTrends(trendRes.data.reverse());
      if (userRes.success) setUserPerformers(userRes.data);
      if (overdueRes.success) setOverdueTasks(overdueRes.data);
      if (tasksRes.success && Array.isArray(tasksRes.data)) {
        const inProgress = tasksRes.data.filter((t: any) => 
          t.status_name === 'قيد التنفيذ' || t.status_name === 'جاري' || t.status_id === 2
        ).slice(0, 5);
        const upcoming = tasksRes.data.filter((t: any) => 
          t.status_name === 'معلق' || t.status_name === 'جديد' || t.status_name === 'قادم' || t.status_id === 1
        ).slice(0, 5);
        setInProgressTasks(inProgress);
        setUpcomingTasks(upcoming);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [filters]);

  const setPreset = (preset: 'week' | 'month' | 'quarter' | 'all') => {
    const to = new Date();
    let from = new Date();
    if (preset === 'week') from.setDate(to.getDate() - 7);
    else if (preset === 'month') from.setMonth(to.getMonth() - 1);
    else if (preset === 'quarter') from.setMonth(to.getMonth() - 3);
    else from = new Date('2024-01-01');

    setFilters({ 
      from: format(from, 'yyyy-MM-dd'), 
      to: format(to, 'yyyy-MM-dd') 
    });
  };

  if (loading && !data) return <DashboardSkeleton />;

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">لوحة التحكم</h1>
          <p className="text-slate-500 font-medium">نظرة عامة شاملة على أداء نظام إدارة مركز الإعلام</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2">
            <Input 
              type="date" 
              className="w-40 h-10 py-0 text-xs bg-slate-50 border-slate-200 text-slate-800" 
              value={filters.from}
              onChange={(e) => setFilters(f => ({ ...f, from: e.target.value }))}
            />
            <span className="text-slate-400 text-xs font-bold">إلى</span>
            <Input 
              type="date" 
              className="w-40 h-10 py-0 text-xs bg-slate-50 border-slate-200 text-slate-800" 
              value={filters.to}
              onChange={(e) => setFilters(f => ({ ...f, to: e.target.value }))}
            />
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div className="flex items-center gap-1">
            <PresetBtn onClick={() => setPreset('week')}>هذا الأسبوع</PresetBtn>
            <PresetBtn onClick={() => setPreset('month')}>هذا الشهر</PresetBtn>
            <PresetBtn onClick={() => setPreset('quarter')}>آخر ٣ شهور</PresetBtn>
            <PresetBtn onClick={() => setPreset('all')}>الكل</PresetBtn>
          </div>
        </div>
      </div>

      {/* Primary Oversight: Tasks & Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enhanced Tasks Table (Overdue + Ongoing + Upcoming) */}
        <div className="bg-white rounded-3xl overflow-hidden flex flex-col border border-slate-100 shadow-xl shadow-slate-200/40">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-bold text-lg text-slate-900">متابعة الأداء التشغيلي</h3>
              <p className="text-xs text-slate-400">مراقبة حية للمهام ذات الأولوية</p>
            </div>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-red-50 text-red-600 text-[10px] font-bold rounded-lg border border-red-100">متأخر</span>
              <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg border border-blue-100">جاري</span>
              <span className="px-2 py-1 bg-slate-50 text-slate-500 text-[10px] font-bold rounded-lg border border-slate-100">قادم</span>
            </div>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-slate-50/50 text-[11px] text-slate-500 uppercase font-bold border-b border-slate-100">
                  <th className="px-6 py-4">المهمة</th>
                  <th className="px-6 py-4">المسؤول</th>
                  <th className="px-6 py-4">الحالة</th>
                  <th className="px-6 py-4">الموعد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Overdue Tasks First */}
                {overdueTasks.map((task, idx) => (
                  <tr key={`overdue-${idx}`} className="hover:bg-red-50/20 transition-all group">
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-900 block truncate max-w-[200px] group-hover:text-red-600 transition-colors">{task.title}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-600 font-bold">{task.user_name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                        <span className="text-xs font-bold text-red-600">متأخر ({task.delay_days} يوم)</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-red-500 font-bold">{task.deadline}</td>
                  </tr>
                ))}
                
                {/* In Progress Tasks */}
                {inProgressTasks.map((task, idx) => (
                  <tr key={`progress-${idx}`} className="hover:bg-blue-50/20 transition-all group">
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-900 block truncate max-w-[200px] group-hover:text-blue-600 transition-colors">{task.title}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-600 font-bold">{task.assigned_to_name || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                        <span className="text-xs font-bold text-blue-600">جاري</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-blue-500 font-bold">{task.deadline || '-'}</td>
                  </tr>
                ))}

                {/* Upcoming Tasks */}
                {upcomingTasks.map((task, idx) => (
                  <tr key={`upcoming-${idx}`} className="hover:bg-slate-50 transition-all group">
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-900 block truncate max-w-[200px]">{task.title}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-600 font-bold">{task.assigned_to_name || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        <span className="text-xs font-bold text-slate-500">قادم</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400 font-bold">{task.deadline || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {overdueTasks.length === 0 && inProgressTasks.length === 0 && upcomingTasks.length === 0 && (
              <div className="p-16 text-center">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="text-green-500" size={24} />
                </div>
                <p className="text-slate-400 text-sm">لا توجد مهام حاسمة للمتابعة حالياً</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-white rounded-3xl overflow-hidden flex flex-col border border-slate-100 shadow-xl shadow-slate-200/40">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-bold text-lg text-slate-900">أفضل الموظفين أداءً</h3>
              <p className="text-xs text-slate-400">المتميزون في الإنجاز والالتزام</p>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg">
              <TrendingUp className="text-amber-500" size={18} />
            </div>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-slate-50/50 text-[11px] text-slate-500 uppercase font-bold border-b border-slate-100">
                  <th className="px-6 py-4">الموظف</th>
                  <th className="px-6 py-4">المهام</th>
                  <th className="px-6 py-4">الالتزام</th>
                  <th className="px-6 py-4">معدل الإنجاز</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.top_performers.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-all group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-blue-600/20">
                          {p.name.substring(0, 2)}
                        </div>
                        <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-slate-700 font-bold">{p.completed_tasks}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-xs font-mono font-bold px-2 py-1 rounded-md",
                          p.on_time_percentage >= 90 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                        )}>{p.on_time_percentage}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${p.on_time_percentage}%` }}
                          className="h-full bg-blue-600 rounded-full" 
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Secondary Statistics: Summary Cards */}
      <h2 className="text-xl font-bold text-slate-900 pt-6 flex items-center gap-3">
        <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
        ملخص المؤشرات الحيوية
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard 
          title="الطلبات"
          total={data?.orders.total || 0}
          icon={<ClipboardList className="text-blue-600" />}
          stats={[
            { label: 'مكتملة', value: data?.orders.completed, color: 'text-green-600' },
            { label: 'جارية', value: data?.orders.in_progress, color: 'text-blue-600' },
            { label: 'متأخرة', value: data?.orders.overdue, color: 'text-red-600' }
          ]}
          progress={data?.orders.completion_rate}
        />
        <SummaryCard 
          title="المهام التنفيذية"
          total={data?.tasks.total || 0}
          icon={<CheckSquare className="text-emerald-600" />}
          stats={[
            { label: 'مكتملة', value: data?.tasks.completed, color: 'text-green-600' },
            { label: 'جارية', value: data?.tasks.in_progress, color: 'text-blue-600' },
            { label: 'معلقة', value: data?.tasks.pending, color: 'text-slate-400 font-bold' }
          ]}
          progress={data?.tasks.completion_rate}
        />
        <SummaryCard 
          title="المحتوى والأرشيف"
          total={data?.content.total || 0}
          icon={<Database className="text-amber-600" />}
          stats={[
            { label: 'المساحة', value: `${data?.content.total_size_mb} MB`, color: 'text-amber-600 font-mono font-bold' },
            { label: 'المؤرشف', value: data?.content.archived, color: 'text-slate-400 font-bold' }
          ]}
        />
        <SummaryCard 
          title="كفاءة الإنجاز"
          total={data?.performance.on_time_percentage + '%'}
          icon={<TrendingUp className="text-purple-600" />}
          stats={[
            { label: 'وقت التنفيذ (د)', value: `${data?.performance.avg_task_duration_minutes}`, color: 'text-purple-600 font-mono font-bold' },
            { label: 'نسبة الالتزام', value: `${data?.performance.on_time_percentage}%`, color: 'text-green-600 font-mono font-bold' }
          ]}
          isRadial
        />
      </div>

      {/* Analytical Charts Block */}
      <h2 className="text-xl font-bold text-slate-900 pt-6 flex items-center gap-3">
        <div className="w-1.5 h-6 bg-emerald-600 rounded-full" />
        التحليل الزمني والنمو التراكمي
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
            <div className="space-y-1">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <BarChart3 className="text-blue-600" size={20} />
                تحليل التوجهات الإنتاجية
              </h3>
              <p className="text-xs text-slate-400">تتبع حجم العمل والإنتاج على مدار الأشهر</p>
            </div>
            <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50 px-4 py-2 rounded-full">
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-blue-600" /> طلبات</div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> مهام</div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-600" /> محتوى</div>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600, fontAttributes: 'font-mono' }} 
                />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="orders" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorOrders)" />
                <Area type="monotone" dataKey="tasks" stroke="#10b981" strokeWidth={3} fill="transparent" />
                <Area type="monotone" dataKey="content" stroke="#f59e0b" strokeWidth={3} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 flex flex-col border border-slate-100 shadow-xl shadow-slate-200/40">
          <div className="mb-8">
            <h3 className="font-bold text-lg mb-1 flex items-center gap-2 text-slate-900">
              <RefreshCcw className="text-blue-600" size={20} />
              إعادة الاستخدام
            </h3>
            <p className="text-xs text-slate-400">تحليل استهلاك المحتوى المؤرشف</p>
          </div>
          <div className="mb-10 p-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl text-center shadow-lg shadow-blue-600/20">
            <p className="text-blue-100 text-[10px] mb-1 font-bold uppercase tracking-widest">إجمالي مرات التكرار</p>
            <div className="text-5xl font-mono font-bold text-white tracking-tighter">{data?.reuse.total_reuses}</div>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto pr-1">
            <p className="text-sm font-bold text-slate-800 px-1 border-r-4 border-blue-600 mr-2">المحتوى الأكثر استخداماً</p>
            {data?.reuse.top_reused.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-blue-400 hover:bg-white hover:shadow-lg transition-all cursor-default">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-900 shadow-sm">{idx + 1}</div>
                  <span className="text-sm text-slate-700 font-bold truncate max-w-[140px] group-hover:text-slate-900">{item.title}</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-blue-600 font-bold">
                  <span className="text-lg">{item.reuse_count}</span>
                  <span className="text-[10px] text-slate-400 mt-1 uppercase">مرة</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, total, icon, stats, progress, isRadial }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/30 space-y-6">
      <div className="flex items-center justify-between">
        <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100">{icon}</div>
        <div className="text-2xl font-mono font-bold text-slate-900 tracking-tight">{total}</div>
      </div>
      <div>
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">{title}</h4>
        <div className="space-y-3">
          {stats.map((s: any, i: number) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">{s.label}</span>
              <span className={cn("font-bold", s.color)}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>
      {progress !== undefined && (
        <div className="pt-2">
          <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5 uppercase">
            <span>نسبة الإنجاز</span>
            <span className="text-slate-800">{progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: `${progress}%` }}
              className="h-full bg-blue-600 rounded-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function PresetBtn({ children, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className="px-4 py-2 text-[11px] font-bold text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-100"
    >
      {children}
    </button>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-2xl border border-slate-100 ring-1 ring-black/5">
        <p className="text-xs font-bold text-slate-500 mb-3">{label}</p>
        <div className="space-y-2">
          {payload.map((p: any, i: number) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.stroke }} />
              <span className="text-xs text-slate-700 font-medium">{p.name === 'orders' ? 'الطلبات' : p.name === 'tasks' ? 'المهام' : 'المحتوى'}:</span>
              <span className="text-xs font-mono font-bold mr-auto text-slate-900">{p.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse pb-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="h-12 w-64 bg-slate-100 rounded-xl" />
        <div className="h-16 w-full lg:w-96 bg-slate-100 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-slate-100 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-[450px] bg-slate-100 rounded-2xl" />
        <div className="h-[450px] bg-slate-100 rounded-2xl" />
      </div>
    </div>
  );
}
