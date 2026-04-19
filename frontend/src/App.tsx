/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Rss, 
  AlertTriangle, 
  FileEdit, 
  Settings, 
  CheckCircle,
  Menu,
  X,
  ChevronRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Sparkles,
  ArrowRight,
  Trash2,
  Save,
  PenTool,
  Plus
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { api } from "./services/api.ts";

// --- Types ---
export type ViewType = "overview" | "sources" | "incomplete" | "queue" | "policies" | "published";

interface MediaUnit {
  id: number;
  name: string;
  is_active: boolean;
}

// --- Icons Mapping ---
const ViewIcons = {
  overview: LayoutDashboard,
  sources: Rss,
  incomplete: AlertTriangle,
  queue: FileEdit,
  policies: PenTool,
  published: CheckCircle
};

const ViewLabels = {
  overview: "نظرة عامة",
  sources: "مصادر المحتوى",
  incomplete: "أخبار غير مكتملة",
  queue: "ستوديو التحرير",
  policies: "السياسات التحريرية",
  published: "الأرشيف المنشور"
};

export default function App() {
  const [activeView, setActiveView] = useState<ViewType>("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mediaUnits, setMediaUnits] = useState<MediaUnit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [isSystemOnline, setIsSystemOnline] = useState(false);

  useEffect(() => {
    api.getMediaUnits()
      .then((res) => setMediaUnits(res.data || []))
      .catch(() => setMediaUnits([]));
  }, []);

  const ActiveIcon = ViewIcons[activeView];

  return (
    <div className="flex h-screen bg-[#020617] text-gray-100 font-sans overflow-hidden" dir="rtl">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="relative bg-[#0b1224] border-l border-white/5 flex flex-col z-50 overflow-hidden"
      >
        <div className="p-6 flex items-center gap-3 border-b border-white/5">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <TrendingUp size={24} className="text-white" />
          </div>
          {isSidebarOpen && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-bold text-xl tracking-tight text-white">
              Media<span className="text-blue-400">Pro</span>
            </motion.span>
          )}
        </div>

        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          {(Object.keys(ViewIcons) as ViewType[]).map((view) => {
            const Icon = ViewIcons[view];
            const isActive = activeView === view;
            return (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200
                  ${isActive ? "bg-blue-600/10 text-blue-400 border border-blue-400/20" : "text-gray-400 hover:bg-white/5 hover:text-white border border-transparent"}`}
              >
                <Icon size={22} className={isActive ? "text-blue-400" : ""} />
                {isSidebarOpen && (
                  <motion.span initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="font-medium whitespace-nowrap">
                    {ViewLabels[view]}
                  </motion.span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-4">
          {isSidebarOpen && (
            <div className="px-2 space-y-4">
              <button 
                onClick={() => setIsSystemOnline(!isSystemOnline)}
                className={`w-full p-4 rounded-2xl border transition-all duration-300 flex flex-col gap-3 group
                  ${isSystemOnline ? "bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-500/5" : "bg-white/5 border-white/5 hover:border-white/20"}`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isSystemOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-600'}`} />
                    <span className="text-[11px] font-bold uppercase tracking-wider">النظام الآلي</span>
                  </div>
                  <div className={`w-8 h-4 rounded-full relative transition-colors ${isSystemOnline ? 'bg-emerald-500' : 'bg-white/10'}`}>
                    <motion.div animate={{ x: isSystemOnline ? 16 : 2 }} className="absolute top-0.5 left-0 w-3 h-3 bg-white rounded-full shadow-sm" />
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-medium ${isSystemOnline ? 'text-emerald-400' : 'text-gray-500'}`}>
                    {isSystemOnline ? "النظام يعمل حالياً بصورة مستقلة" : "النظام متوقف (بانتظار التشغيل)"}
                  </span>
                </div>
              </button>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 block font-semibold">وحدة الإعلام</label>
                <select 
                  value={selectedUnitId || ""} 
                  onChange={(e) => setSelectedUnitId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full bg-[#020617] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
                >
                  <option value="">كل الوحدات</option>
                  {mediaUnits.map(unit => (
                    <option key={unit.id} value={unit.id}>{unit.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
          >
            {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <div className="text-gray-500 text-sm flex items-center gap-2">
              <span>الرئيسية</span>
              <ChevronRight size={14} />
              <span className="text-white font-medium">{ViewLabels[activeView]}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={16} />
              <input type="text" placeholder="بحث سريع..." className="bg-[#0b1224] border border-white/5 rounded-full pl-4 pr-10 py-1.5 text-xs focus:outline-none focus:border-blue-500/50 focus:w-64 transition-all w-48" />
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 shrink-0 border border-white/10 shadow-lg shadow-blue-500/20" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div key={activeView} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="max-w-7xl mx-auto">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                  <ActiveIcon size={24} className="text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white">{ViewLabels[activeView]}</h2>
                  <p className="text-gray-500 text-sm">أهلاً بك في نظام الإدارة الموحد لمركز الإعلام</p>
                </div>
              </div>

              {activeView === "overview" && <OverviewView unitId={selectedUnitId} />}
              {activeView === "sources" && <SourcesView autoEnabled={isSystemOnline} />}
              {activeView === "incomplete" && <IncompleteView unitId={selectedUnitId} />}
              {activeView === "queue" && <QueueView unitId={selectedUnitId} />}
              {activeView === "policies" && <PoliciesView unitId={selectedUnitId} />}
              {activeView === "published" && <PublishedView unitId={selectedUnitId} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
}

// --- OverviewView ---
function OverviewView({ unitId }: { unitId: number | null }) {
  const [stats, setStats] = useState<any>(null);
  const [queueStats, setQueueStats] = useState<any[]>([]);
  const [publishedStats, setPublishedStats] = useState<any>(null);
  const [dailyStats, setDailyStats] = useState<any[]>([]);
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [publishedItems, setPublishedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getStatistics().catch(() => null),
      api.getQueueStats().catch(() => null),
      api.getPublishedStats().catch(() => null),
      api.getPendingQueue(unitId).catch(() => null),
      api.getPublished(unitId).catch(() => null),
      api.getDailyStats(unitId, 30).catch(() => null),
    ]).then(([s, q, p, pending, published, daily]) => {
      setStats(s?.data || null);
      const qRows = q?.data || [];
      setQueueStats(Array.isArray(qRows) ? qRows : []);
      setPublishedStats(p?.data || null);
      setPendingItems((pending?.data || []).slice(0, 5));
      setPublishedItems((published?.data || []).slice(0, 5));
      setDailyStats(daily?.data || []);
      setLoading(false);
    });
  }, [unitId]);

  // إجمالي في الانتظار
  const totalPending = queueStats.reduce((sum, u) => sum + Number(u.pending_count || 0), 0);

  if (loading) return <LoadingSpinner />;

  // pending_count للوحدة المختارة
  const selectedUnitPending = unitId
    ? queueStats.find(u => Number(u.id) === Number(unitId))?.pending_count ?? "—"
    : null;

  return (
    <div className="space-y-6">
      {/* إحصائيات الوحدات الإعلامية - تظهر فقط عند "كل الوحدات" */}
      {!unitId && (
        <div className="bg-[#0b1224] rounded-3xl p-6 border border-white/5 shadow-2xl">
          <h3 className="text-base font-bold mb-5 flex items-center gap-2 text-white">
            <TrendingUp size={16} className="text-blue-400" />
            إحصائيات جميع الوحدات الإعلامية
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {queueStats.map((unit: any) => {
              const unitPublished = publishedStats?.by_media_unit?.find(
                (u: any) => u.media_unit === unit.name
              );
              return (
                <div key={unit.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3">
                  <p className="text-sm font-bold text-white truncate">{unit.name}</p>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-amber-400/5 border border-amber-400/10 rounded-xl p-2 text-center">
                      <p className="text-amber-400 font-bold text-lg">{unit.pending_count || 0}</p>
                      <p className="text-gray-500">انتظار</p>
                    </div>
                    <div className="bg-emerald-400/5 border border-emerald-400/10 rounded-xl p-2 text-center">
                      <p className="text-emerald-400 font-bold text-lg">{unitPublished?.count || 0}</p>
                      <p className="text-gray-500">منشور</p>
                    </div>
                    <div className="bg-rose-400/5 border border-rose-400/10 rounded-xl p-2 text-center">
                      <p className="text-rose-400 font-bold text-lg">{unit.rejected_count || 0}</p>
                      <p className="text-gray-500">مرفوض</p>
                    </div>
                  </div>
                </div>
              );
            })}
            {queueStats.length === 0 && (
              <p className="text-gray-500 text-sm col-span-full">لا توجد بيانات</p>
            )}
          </div>
        </div>
      )}

      {/* إحصائيات الوحدة المختارة */}
      {unitId && (() => {
        const selectedUnit = queueStats.find(u => Number(u.id) === Number(unitId));
        const unitPublished = publishedStats?.by_media_unit?.find(
          (u: any) => u.media_unit === selectedUnit?.name
        );
        return selectedUnit ? (
          <div className="bg-[#0b1224] rounded-3xl p-6 border border-white/5 shadow-2xl">
            <h3 className="text-base font-bold mb-5 flex items-center gap-2 text-white">
              <TrendingUp size={16} className="text-blue-400" />
              إحصائيات {selectedUnit.name}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-amber-400/5 border border-amber-400/10 rounded-2xl p-4 text-center">
                <p className="text-amber-400 font-bold text-2xl">{selectedUnit.pending_count || 0}</p>
                <p className="text-gray-500 text-xs mt-1">في الانتظار</p>
              </div>
              <div className="bg-emerald-400/5 border border-emerald-400/10 rounded-2xl p-4 text-center">
                <p className="text-emerald-400 font-bold text-2xl">{unitPublished?.count || 0}</p>
                <p className="text-gray-500 text-xs mt-1">منشور</p>
              </div>
              <div className="bg-rose-400/5 border border-rose-400/10 rounded-2xl p-4 text-center">
                <p className="text-rose-400 font-bold text-2xl">{selectedUnit.rejected_count || 0}</p>
                <p className="text-gray-500 text-xs mt-1">مرفوض</p>
              </div>
              <div className="bg-indigo-400/5 border border-indigo-400/10 rounded-2xl p-4 text-center">
                <p className="text-indigo-400 font-bold text-2xl">{stats?.activeSources ?? "—"}</p>
                <p className="text-gray-500 text-xs mt-1">مصادر نشطة</p>
              </div>
            </div>
          </div>
        ) : null;
      })()}

      {/* رسم بياني للنشر اليومي */}
      {unitId && dailyStats.length > 0 && (
        <div className="bg-[#0b1224] rounded-3xl p-6 border border-white/5 shadow-2xl">
          <h3 className="text-base font-bold mb-6 flex items-center gap-2 text-white">
            <TrendingUp size={16} className="text-blue-400" />
            إحصائيات النشر والرفض اليومية
          </h3>
          
          {/* جدول الإحصائيات */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-right py-3 px-4 text-gray-400 font-semibold">التاريخ</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-semibold">اليوم</th>
                  <th className="text-center py-3 px-4 text-emerald-400 font-semibold">منشور</th>
                  <th className="text-center py-3 px-4 text-blue-400 font-semibold">تحريري</th>
                  <th className="text-center py-3 px-4 text-purple-400 font-semibold">أوتوماتيكي</th>
                  <th className="text-center py-3 px-4 text-rose-400 font-semibold">مرفوض</th>
                </tr>
              </thead>
              <tbody>
                {dailyStats.slice(0, 30).map((day: any, idx: number) => {
                  const dateObj = new Date(day.date);
                  const dayName = dateObj.toLocaleDateString('ar-SA', { weekday: 'long' });
                  const formattedDate = dateObj.toLocaleDateString('ar-SA');
                  
                  return (
                    <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 text-gray-300 font-mono">{formattedDate}</td>
                      <td className="py-3 px-4 text-gray-400">{dayName}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-lg font-bold">
                          {day.published_count || 0}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-lg font-bold">
                          {day.editorial_count || 0}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="bg-purple-500/10 text-purple-400 px-3 py-1 rounded-lg font-bold">
                          {day.automated_count || 0}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="bg-rose-500/10 text-rose-400 px-3 py-1 rounded-lg font-bold">
                          {day.rejected_count || 0}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* رسم بياني بسيط */}
          <div className="mt-8 space-y-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase">توزيع النشر</h4>
            {dailyStats.slice(0, 14).map((day: any, idx: number) => {
              const maxCount = Math.max(...dailyStats.map((d: any) => d.published_count || 0), 1);
              const publishedWidth = ((day.published_count || 0) / maxCount) * 100;
              const dateObj = new Date(day.date);
              const formattedDate = dateObj.toLocaleDateString('ar-SA');
              
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400 font-mono">{formattedDate}</span>
                    <span className="text-gray-300 font-bold">{day.published_count || 0} منشور</span>
                  </div>
                  <div className="flex gap-0.5 h-5 bg-white/5 rounded-lg overflow-hidden">
                    {day.editorial_count > 0 && (
                      <div 
                        className="bg-blue-500 transition-all" 
                        style={{ width: `${(day.editorial_count / (day.published_count || 1)) * 100}%` }}
                        title={`تحريري: ${day.editorial_count}`}
                      />
                    )}
                    {day.automated_count > 0 && (
                      <div 
                        className="bg-purple-500 transition-all" 
                        style={{ width: `${(day.automated_count / (day.published_count || 1)) * 100}%` }}
                        title={`أوتوماتيكي: ${day.automated_count}`}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* المفتاح */}
          <div className="flex flex-wrap gap-6 mt-6 pt-4 border-t border-white/5 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded" />
              <span className="text-gray-400">منشور</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded" />
              <span className="text-gray-400">تحريري</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded" />
              <span className="text-gray-400">أوتوماتيكي</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-rose-500 rounded" />
              <span className="text-gray-400">مرفوض</span>
            </div>
          </div>
        </div>
      )}

      {/* الصف الثاني: آخر الأخبار المنتظرة + آخر المنشورات */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0b1224] rounded-3xl p-6 border border-white/5 shadow-2xl">
          <h3 className="text-base font-bold mb-4 flex items-center gap-2 text-white">
            <Clock size={16} className="text-amber-400" />
            آخر الأخبار في الانتظار
          </h3>
          {pendingItems.length === 0 ? (
            <p className="text-gray-500 text-sm">لا توجد أخبار منتظرة</p>
          ) : (
            <div className="space-y-3">
              {pendingItems.map((item: any) => (
                <div key={item.id} className="flex items-start justify-between gap-3 py-2 border-b border-white/5 last:border-0">
                  <p className="text-sm text-gray-200 line-clamp-1 flex-1">{item.title || "بدون عنوان"}</p>
                  <span className="text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md shrink-0">{item.media_unit_name || "—"}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#0b1224] rounded-3xl p-6 border border-white/5 shadow-2xl">
          <h3 className="text-base font-bold mb-4 flex items-center gap-2 text-white">
            <CheckCircle2 size={16} className="text-emerald-400" />
            آخر المنشورات
          </h3>
          {publishedItems.length === 0 ? (
            <p className="text-gray-500 text-sm">لا توجد منشورات بعد</p>
          ) : (
            <div className="space-y-3">
              {publishedItems.map((item: any) => (
                <div key={item.id} className="flex items-start justify-between gap-3 py-2 border-b border-white/5 last:border-0">
                  <p className="text-sm text-gray-200 line-clamp-1 flex-1">{item.title || "بدون عنوان"}</p>
                  <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md shrink-0">
                    {item.published_at ? new Date(item.published_at).toLocaleDateString("ar") : "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- SourcesView ---
function SourcesView({ autoEnabled }: { autoEnabled: boolean }) {
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSources()
      .then((res) => setSources(res.data || []))
      .catch(() => setSources([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h3 className="text-xl font-bold mb-1">إدارة مصادر المحتوى</h3>
          <p className="text-gray-500 text-sm">مراقبة وإدارة قنوات جلب الأخبار المفعلة في النظام.</p>
        </div>
      </div>

      {sources.length === 0 ? (
        <EmptyState icon={Rss} title="لا توجد مصادر" description="لم يتم العثور على أي مصادر محتوى." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sources.map((source: any) => (
            <div key={source.id} className="bg-[#0b1224] rounded-3xl p-6 border border-white/5 hover:border-white/10 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-blue-600/10 transition-all" />
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-blue-400">
                  <Rss size={20} />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide ${source.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-500'}`}>
                  {source.is_active ? 'نشط' : 'متوقف'}
                </span>
              </div>
              <h4 className="font-bold text-gray-100 mb-1 group-hover:text-blue-400 transition-colors">{source.name}</h4>
              <p className="text-[10px] text-gray-500 font-mono mb-4 truncate italic">{source.url || source.rss_url || '—'}</p>
              <div className="space-y-3 pt-4 border-t border-white/5 relative z-10">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-gray-500">نوع المصدر</span>
                  <span className="text-gray-300 font-bold">{source.type || 'RSS'}</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-gray-500">آخر سحب</span>
                  <span className="text-gray-300 font-mono">{source.last_fetched_at ? new Date(source.last_fetched_at).toLocaleString('ar') : '—'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {autoEnabled && (
        <div className="bg-blue-600/5 border border-blue-600/10 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping" />
          <span className="text-xs text-blue-400 font-bold">النظام الآلي يقوم حالياً بمراقبة جميع المصادر وسحب المحتوى دورياً.</span>
        </div>
      )}
    </div>
  );
}

// --- IncompleteView ---
function IncompleteView({ unitId }: { unitId: number | null }) {
  const [articles, setArticles] = useState<any[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingArticle, setEditingArticle] = useState<any>(null);
  const [editedContent, setEditedContent] = useState("");
  const [editedTitle, setEditedTitle] = useState("");
  const [editedImageUrl, setEditedImageUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; articleId: number | null }>({ show: false, articleId: null });
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Filter states
  const [searchTitle, setSearchTitle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [selectedDate, setSelectedDate] = useState<string>("");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    api.getIncompleteArticles(unitId)
      .then((res) => {
        setArticles(res.data || []);
      })
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, [unitId]);

  // Apply filters
  useEffect(() => {
    let filtered = [...articles];

    // Search by title
    if (searchTitle.trim()) {
      filtered = filtered.filter(a => 
        a.title?.toLowerCase().includes(searchTitle.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(a => a.category_name === selectedCategory);
    }

    // Filter by date
    if (selectedDate) {
      filtered = filtered.filter(a => {
        const articleDate = new Date(a.fetched_at).toLocaleDateString('ar-SA');
        const filterDate = new Date(selectedDate).toLocaleDateString('ar-SA');
        return articleDate === filterDate;
      });
    }

    // Sort
    if (sortBy === "newest") {
      filtered.sort((a, b) => new Date(b.fetched_at).getTime() - new Date(a.fetched_at).getTime());
    } else {
      filtered.sort((a, b) => new Date(a.fetched_at).getTime() - new Date(b.fetched_at).getTime());
    }

    setFilteredArticles(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [articles, searchTitle, selectedCategory, sortBy, selectedDate]);

  const handleEdit = (article: any) => {
    setEditingArticle(article);
    setEditedContent(article.content || "");
    setEditedTitle(article.title || "");
    setEditedImageUrl(article.image_url || "");
  };

  const handleSave = async () => {
    if (!editingArticle || !editedContent.trim()) return;
    
    setIsSaving(true);
    try {
      await api.updateArticleContent(editingArticle.id, {
        content: editedContent,
        title: editedTitle,
        imageUrl: editedImageUrl
      });
      
      // إزالة الخبر من القائمة
      setArticles(prev => prev.filter(a => a.id !== editingArticle.id));
      setEditingArticle(null);
      
      // إظهار رسالة نجاح
      setNotification({ type: 'success', message: 'تم حفظ الخبر وإرساله لستوديو التحرير' });
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      setNotification({ type: 'error', message: 'حدث خطأ أثناء الحفظ' });
      console.error(err);
    }
    setIsSaving(false);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.articleId) return;
    
    setIsDeleting(true);
    try {
      await api.deleteArticle(deleteConfirm.articleId);
      setArticles(prev => prev.filter(a => a.id !== deleteConfirm.articleId));
      setNotification({ type: 'success', message: 'تم حذف الخبر بنجاح' });
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error('خطأ في الحذف:', err);
      setNotification({ type: 'error', message: 'حدث خطأ أثناء الحذف' });
      setTimeout(() => setNotification(null), 3000);
    }
    setIsDeleting(false);
    setDeleteConfirm({ show: false, articleId: null });
  };

  if (loading) return <LoadingSpinner />;

  // Delete Confirmation Modal
  if (deleteConfirm.show) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#0b1224] rounded-3xl border border-white/10 shadow-2xl max-w-sm w-full p-8 space-y-6"
        >
          <div className="flex items-center justify-center w-12 h-12 bg-rose-500/10 rounded-full mx-auto">
            <Trash2 size={24} className="text-rose-400" />
          </div>
          
          <div className="text-center space-y-2">
            <h3 className="text-lg font-bold text-white">حذف الخبر</h3>
            <p className="text-sm text-gray-400">هل أنت متأكد من حذف هذا الخبر؟ لا يمكن التراجع عن هذا الإجراء.</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setDeleteConfirm({ show: false, articleId: null })}
              disabled={isDeleting}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              onClick={confirmDelete}
              disabled={isDeleting}
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><Trash2 size={16} /> حذف</>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // وضع التحرير
  if (editingArticle) {
    return (
      <div className="space-y-6">
        {/* Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-4 right-4 px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-lg z-50 ${
                notification.type === 'success'
                  ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400'
                  : 'bg-rose-500/20 border border-rose-500/50 text-rose-400'
              }`}
            >
              {notification.type === 'success' ? (
                <CheckCircle2 size={18} />
              ) : (
                <XCircle size={18} />
              )}
              {notification.message}
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={() => setEditingArticle(null)}
          className="text-gray-400 hover:text-white text-sm flex items-center gap-2"
        >
          <ArrowRight size={16} /> العودة للقائمة
        </button>

        <div className="bg-[#0b1224] rounded-3xl p-8 border border-white/5 shadow-2xl space-y-6">
          <h3 className="text-lg font-bold text-white">تكملة الخبر</h3>
          
          {/* رابط الخبر */}
          {editingArticle?.url && (
            <div className="space-y-2">
              <label className="text-xs text-gray-400 font-bold uppercase">رابط الخبر الأصلي</label>
              <a 
                href={editingArticle.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block w-full bg-[#020617]/50 border border-blue-500/30 hover:border-blue-500/50 rounded-2xl px-4 py-3 text-sm text-blue-400 hover:text-blue-300 transition-all truncate"
              >
                {editingArticle.url}
              </a>
            </div>
          )}
          
          {/* الصورة */}
          {editedImageUrl && (
            <div className="space-y-2">
              <label className="text-xs text-gray-400 font-bold uppercase">صورة الخبر</label>
              <div className="relative w-full h-48 bg-black/50 rounded-2xl overflow-hidden border border-white/10">
                <img 
                  src={editedImageUrl} 
                  alt="صورة الخبر"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23333" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="20" fill="%23999" text-anchor="middle" dy=".3em"%3Eلا يمكن تحميل الصورة%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>
              <p className="text-[10px] text-gray-500 font-mono truncate">{editedImageUrl}</p>
            </div>
          )}
          
          {/* العنوان */}
          <div className="space-y-2">
            <label className="text-xs text-gray-400 font-bold uppercase">العنوان</label>
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="w-full bg-[#020617]/50 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600/50 text-white placeholder:text-gray-600"
              placeholder="عنوان الخبر"
            />
          </div>

          {/* المحتوى */}
          <div className="space-y-2">
            <label className="text-xs text-gray-400 font-bold uppercase">المحتوى</label>
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full h-64 bg-[#020617]/50 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-blue-600/50 resize-none text-white placeholder:text-gray-600"
              placeholder="محتوى الخبر..."
            />
            <p className="text-[10px] text-gray-500">{editedContent.length} حرف</p>
          </div>

          {/* الأزرار */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={isSaving || !editedContent.trim()}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><Save size={16} /> حفظ وإرسال لستوديو التحرير</>
              )}
            </button>
            <button
              onClick={() => setEditingArticle(null)}
              className="bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all"
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <EmptyState icon={AlertTriangle} title="لا توجد أخبار غير مكتملة حالياً" description="سيظهر هنا أي محتوى يحتاج إلى تكملة (محتوى قصير جداً أو بدون عنوان)." />
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-8 py-4 rounded-2xl font-bold text-base flex items-center gap-3 shadow-2xl z-50 ${
              notification.type === 'success'
                ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400'
                : 'bg-rose-500/20 border border-rose-500/50 text-rose-400'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 size={24} />
            ) : (
              <XCircle size={24} />
            )}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="bg-[#0b1224] rounded-3xl p-6 border border-white/5 shadow-2xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Search size={16} className="text-blue-400" />
          البحث والفلترة
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search by title */}
          <div className="space-y-2">
            <label className="text-xs text-gray-400 font-bold uppercase">البحث عن عنوان</label>
            <input
              type="text"
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
              placeholder="ابحث عن عنوان..."
              className="w-full bg-[#020617]/50 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-600/50 text-white placeholder:text-gray-600"
            />
          </div>

          {/* Filter by category */}
          <div className="space-y-2">
            <label className="text-xs text-gray-400 font-bold uppercase">التصنيف</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-[#020617]/50 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-600/50 text-white"
            >
              <option value="">كل التصنيفات</option>
              {[...new Set(articles.map(a => a.category_name))].map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Filter by date */}
          <div className="space-y-2">
            <label className="text-xs text-gray-400 font-bold uppercase">التاريخ</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-[#020617]/50 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-600/50 text-white"
            />
          </div>

          {/* Sort */}
          <div className="space-y-2">
            <label className="text-xs text-gray-400 font-bold uppercase">الترتيب</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "newest" | "oldest")}
              className="w-full bg-[#020617]/50 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-600/50 text-white"
            >
              <option value="newest">الأحدث أولاً</option>
              <option value="oldest">الأقدم أولاً</option>
            </select>
          </div>
        </div>

        {/* Clear filters */}
        {(searchTitle || selectedCategory || selectedDate || sortBy !== "newest") && (
          <button
            onClick={() => {
              setSearchTitle("");
              setSelectedCategory("");
              setSelectedDate("");
              setSortBy("newest");
            }}
            className="text-xs text-blue-400 hover:text-blue-300 font-bold"
          >
            مسح الفلاتر
          </button>
        )}
      </div>

      {/* Results count and pagination info */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">
          عدد النتائج: <span className="text-white font-bold">{filteredArticles.length}</span> من <span className="text-white font-bold">{articles.length}</span>
        </div>
        {filteredArticles.length > 0 && (
          <div className="text-sm text-gray-400">
            الصفحة <span className="text-white font-bold">{currentPage}</span> من <span className="text-white font-bold">{Math.ceil(filteredArticles.length / itemsPerPage)}</span>
          </div>
        )}
      </div>

      {filteredArticles.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="لا توجد أخبار غير مكتملة" description="لم يتم العثور على أخبار تطابق معايير البحث." />
      ) : (
        <div className="space-y-4">
          {/* Table */}
          <div className="bg-[#0b1224] rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    <th className="text-right py-4 px-6 text-gray-400 font-semibold">#</th>
                    <th className="text-right py-4 px-6 text-gray-400 font-semibold">العنوان</th>
                    <th className="text-right py-4 px-6 text-gray-400 font-semibold">التصنيف</th>
                    <th className="text-right py-4 px-6 text-gray-400 font-semibold">المصدر</th>
                    <th className="text-center py-4 px-6 text-gray-400 font-semibold">الطول</th>
                    <th className="text-center py-4 px-6 text-gray-400 font-semibold">التاريخ</th>
                    <th className="text-center py-4 px-6 text-gray-400 font-semibold">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredArticles
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((article: any, idx: number) => (
                      <tr key={article.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-6 text-gray-400 font-mono text-xs">
                          {(currentPage - 1) * itemsPerPage + idx + 1}
                        </td>
                        <td className="py-4 px-6 text-gray-200 max-w-xs truncate">
                          {article.title || 'بدون عنوان'}
                        </td>
                        <td className="py-4 px-6 text-gray-400">
                          <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded text-xs font-bold">
                            {article.category_name || '—'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-gray-400 text-xs">
                          {article.source_name || '—'}
                        </td>
                        <td className="py-4 px-6 text-center text-gray-400 text-xs">
                          <span className="bg-amber-500/10 text-amber-400 px-2 py-1 rounded font-bold">
                            {article.content?.length || 0}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center text-gray-400 text-xs font-mono">
                          {new Date(article.fetched_at).toLocaleDateString('ar-SA')}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleEdit(article)}
                              className="bg-amber-600/10 hover:bg-amber-600/20 text-amber-400 px-3 py-1.5 rounded text-xs font-bold transition-all"
                              title="تكملة الخبر"
                            >
                              تكملة
                            </button>
                            <button
                              onClick={() => setDeleteConfirm({ show: true, articleId: article.id })}
                              className="bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 px-3 py-1.5 rounded text-xs font-bold transition-all"
                              title="حذف الخبر"
                            >
                              حذف
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {Math.ceil(filteredArticles.length / itemsPerPage) > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-bold text-sm transition-all"
              >
                السابق
              </button>

              <div className="flex gap-1">
                {Array.from({ length: Math.ceil(filteredArticles.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredArticles.length / itemsPerPage), prev + 1))}
                disabled={currentPage === Math.ceil(filteredArticles.length / itemsPerPage)}
                className="bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-bold text-sm transition-all"
              >
                التالي
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- PoliciesView ---
function PoliciesView({ unitId }: { unitId: number | null }) {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [testText, setTestText] = useState("");
  const [modifiedText, setModifiedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPolicyId, setSelectedPolicyId] = useState<number | null>(null);

  // إنشاء سياسة جديدة
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    editorInstructions: "",
    injectedVarsRaw: "",
    isModifying: true,
  });
  const [createError, setCreateError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    setLoading(true);
    const url = unitId ? `/news/editorial-policies?media_unit_id=${unitId}` : undefined;
    api.getPolicies()
      .then((res) => setPolicies(res.policies || []))
      .catch(() => setPolicies([]))
      .finally(() => setLoading(false));
  }, [unitId]);

  const handleApply = async () => {
    if (!testText || !selectedPolicyId) return;
    const policy = policies.find((p: any) => p.id === selectedPolicyId);
    if (!policy) return;

    setIsProcessing(true);
    try {
      const result = await api.applyPolicy({ text: testText, policyName: policy.name });
      setModifiedText(result.modifiedText || JSON.stringify(result.inspection || result.result, null, 2));
    } catch (err) {
      setModifiedText("حدث خطأ أثناء تطبيق السياسة");
    }
    setIsProcessing(false);
  };

  const handleCreate = async () => {
    setCreateError("");
    if (!createForm.name.trim()) { setCreateError("الاسم مطلوب"); return; }
    if (!createForm.editorInstructions.trim()) { setCreateError("تعليمات المحرر مطلوبة"); return; }

    let injectedVars = undefined;
    if (createForm.injectedVarsRaw.trim()) {
      try {
        injectedVars = JSON.parse(createForm.injectedVarsRaw);
        if (typeof injectedVars !== "object" || Array.isArray(injectedVars)) throw new Error();
      } catch {
        setCreateError("المتغيرات المحقونة يجب أن تكون JSON object صحيح");
        return;
      }
    }

    setIsCreating(true);
    try {
      await api.createPolicy({
        name: createForm.name.trim(),
        description: createForm.description.trim() || undefined,
        editorInstructions: createForm.editorInstructions.trim(),
        injectedVars,
        isModifying: createForm.isModifying,
        mediaUnitId: unitId || undefined,
      });
      // إعادة تحميل السياسات
      const res = await api.getPolicies();
      setPolicies(res.policies || []);
      setShowCreateForm(false);
      setCreateForm({ name: "", description: "", editorInstructions: "", injectedVarsRaw: "", isModifying: true });
    } catch (err: any) {
      setCreateError(err?.message || "حدث خطأ أثناء الإنشاء");
    }
    setIsCreating(false);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0b1224] rounded-3xl p-8 border border-white/5 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2 text-white">
              <Settings size={20} className="text-blue-400" />
              السياسات النشطة
            </h3>
            <button
              onClick={() => { setShowCreateForm(v => !v); setCreateError(""); }}
              className="flex items-center gap-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-blue-600/20"
            >
              <Plus size={14} /> إضافة سياسة
            </button>
          </div>
          <div className="space-y-4">
            {policies.length === 0 && <p className="text-gray-500 text-sm">لا توجد سياسات مفعّلة</p>}
            {policies.map((p: any) => (
              <div 
                key={p.id} 
                onClick={() => setSelectedPolicyId(p.id)}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group
                  ${selectedPolicyId === p.id ? "bg-blue-600/10 border-blue-600/50" : "bg-white/[0.02] border-white/5 hover:border-blue-500/30"}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-blue-600/10 transition-colors">
                    {p.isModifying ? <FileEdit size={18} className="text-blue-400" /> : <Search size={18} className="text-amber-400" />}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{p.name}</div>
                    <div className="text-[10px] text-gray-500">{p.description || (p.isModifying ? 'سياسة تعديل' : 'سياسة فحص')}</div>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 bg-white/10 rounded-md text-gray-300">
                  {p.isModifying ? "تعديل" : "فحص"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0b1224] rounded-3xl p-8 border border-white/5 shadow-2xl space-y-6">
          <h3 className="text-lg font-bold flex items-center gap-2 text-white">
            <Sparkles size={20} className="text-blue-400" />
            مختبر تجربة السياسات
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-gray-500 font-bold">النص للتجربة</label>
              <textarea 
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="الصق النص هنا لاختبار السياسات..."
                className="w-full h-32 bg-[#020617]/50 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-blue-600/50 resize-none font-sans text-white placeholder:text-gray-600"
              />
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={handleApply}
                disabled={isProcessing || !selectedPolicyId || !testText}
                className={`flex-1 py-3 rounded-2xl font-bold text-sm shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2
                  ${isProcessing ? "bg-white/5 text-gray-500" : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20"}
                  disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isProcessing ? (
                  <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><Sparkles size={16} /> تطبيق السياسة المختارة</>
                )}
              </button>
              <button 
                onClick={() => { setTestText(""); setModifiedText(""); }}
                className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl transition-all border border-white/5"
              >
                <Trash2 size={18} />
              </button>
            </div>

            {modifiedText && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                <label className="text-xs text-emerald-400 font-bold">النتيجة</label>
                <div className="w-full min-h-[8rem] bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 text-sm whitespace-pre-wrap overflow-y-auto custom-scrollbar">
                  {modifiedText}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Modal إنشاء سياسة جديدة */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0b1224] rounded-3xl p-8 border border-blue-600/20 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                <Plus size={20} className="text-blue-400" />
                إضافة سياسة تحريرية جديدة
              </h3>
              <button onClick={() => { setShowCreateForm(false); setCreateError(""); }} className="text-gray-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-gray-400 font-bold">الاسم <span className="text-rose-400">*</span></label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="مثال: تنظيف النص"
                  className="w-full bg-[#020617]/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-600/50 text-white placeholder:text-gray-600"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-gray-400 font-bold">الوصف</label>
                <input
                  type="text"
                  value={createForm.description}
                  onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="وصف مختصر للسياسة"
                  className="w-full bg-[#020617]/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-600/50 text-white placeholder:text-gray-600"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-400 font-bold">نوع السياسة <span className="text-rose-400">*</span></label>
              <div className="flex gap-3">
                <button
                  onClick={() => setCreateForm(f => ({ ...f, isModifying: true }))}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-bold transition-all
                    ${createForm.isModifying ? "bg-blue-600/20 border-blue-600/50 text-blue-400" : "bg-white/[0.02] border-white/10 text-gray-400 hover:border-white/20"}`}
                >
                  <FileEdit size={16} /> سياسة تعديل
                </button>
                <button
                  onClick={() => setCreateForm(f => ({ ...f, isModifying: false }))}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-bold transition-all
                    ${!createForm.isModifying ? "bg-amber-600/20 border-amber-600/50 text-amber-400" : "bg-white/[0.02] border-white/10 text-gray-400 hover:border-white/20"}`}
                >
                  <Search size={16} /> سياسة فحص
                </button>
              </div>
              <p className="text-[10px] text-gray-500">
                {createForm.isModifying ? "تعدّل النص وترجع النص المعدّل" : "تفحص النص وترجع تقرير بالمخالفات"}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-400 font-bold">تعليمات المحرر <span className="text-rose-400">*</span></label>
              <textarea
                value={createForm.editorInstructions}
                onChange={e => setCreateForm(f => ({ ...f, editorInstructions: e.target.value }))}
                placeholder="اكتب التعليمات التفصيلية للـ AI..."
                rows={5}
                className="w-full bg-[#020617]/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600/50 resize-none text-white placeholder:text-gray-600"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-400 font-bold">المتغيرات المحقونة <span className="text-gray-600">(اختياري — JSON)</span></label>
              <textarea
                value={createForm.injectedVarsRaw}
                onChange={e => setCreateForm(f => ({ ...f, injectedVarsRaw: e.target.value }))}
                placeholder={'{"banned_words": ["كلمة1"], "replace_map": {"قديم": "جديد"}}'}
                rows={3}
                className="w-full bg-[#020617]/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600/50 resize-none text-white placeholder:text-gray-600 font-mono"
              />
            </div>

            {createError && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 text-sm text-rose-400">
                {createError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleCreate}
                disabled={isCreating}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
              >
                {isCreating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Plus size={16} /> إنشاء السياسة</>}
              </button>
              <button
                onClick={() => { setShowCreateForm(false); setCreateError(""); }}
                className="bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all"
              >
                إلغاء
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// --- PublishedView ---
function PublishedView({ unitId }: { unitId: number | null }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getPublished(unitId)
      .then((res) => setItems(res.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [unitId]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="bg-[#0b1224] rounded-3xl border border-white/5 shadow-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold">أرشيف المحتوى المنشور</h3>
        </div>
        
        {items.length === 0 ? (
          <EmptyState icon={CheckCircle} title="لا يوجد محتوى منشور" description="سيظهر هنا المحتوى بعد الموافقة عليه من ستوديو التحرير." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item: any) => (
              <div key={item.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:border-blue-500/30 transition-all group cursor-pointer">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[9px] uppercase font-bold text-gray-500 tracking-widest">
                    {item.publish_type || (item.policy_id ? "تحريري" : "أوتوماتيكي")}
                  </span>
                  <CheckCircle size={14} className="text-blue-400" />
                </div>
                <h4 className="font-bold text-sm mb-3 line-clamp-2 leading-relaxed text-blue-50">{item.title || 'بدون عنوان'}</h4>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                  <span className="text-[10px] text-gray-500 font-mono">{item.published_at ? new Date(item.published_at).toLocaleDateString('ar') : '—'}</span>
                  <span className="text-[10px] text-blue-400 font-bold bg-blue-400/10 px-2 py-0.5 rounded-md">{item.category_name || item.category || '—'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- QueueView ---
function QueueView({ unitId }: { unitId: number | null }) {
  const [queue, setQueue] = useState<any[]>([]);
  const [filteredQueue, setFilteredQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editedContent, setEditedContent] = useState("");
  const [policies, setPolicies] = useState<any[]>([]);
  const [selectedPolicies, setSelectedPolicies] = useState<number[]>([]);
  const [isProcessingAI, setIsProcessingAI] = useState(false);

  // Filter states
  const [searchTitle, setSearchTitle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getPendingQueue(unitId).catch(() => ({ data: [] })),
      api.getPolicies().catch(() => ({ policies: [] })),
    ]).then(([q, p]) => {
      setQueue(q.data || []);
      setPolicies((p.policies || []).filter((pol: any) => pol.isModifying));
      setLoading(false);
    });
  }, [unitId]);

  // Apply filters
  useEffect(() => {
    let filtered = [...queue];

    // Search by title
    if (searchTitle.trim()) {
      filtered = filtered.filter(item =>
        item.title?.toLowerCase().includes(searchTitle.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(item => item.category_name === selectedCategory);
    }

    // Filter by date
    if (selectedDate) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.created_at).toLocaleDateString('ar-SA');
        const filterDate = new Date(selectedDate).toLocaleDateString('ar-SA');
        return itemDate === filterDate;
      });
    }

    // Sort
    if (sortBy === "newest") {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }

    setFilteredQueue(filtered);
    setCurrentPage(1);
  }, [queue, searchTitle, selectedCategory, selectedDate, sortBy]);

  const handleOpenEditor = (item: any) => {
    setEditingItem(item);
    setEditedContent(item.content || "");
    setSelectedPolicies([]);
  };

  const togglePolicy = (id: number) => {
    setSelectedPolicies(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const applySequentially = async () => {
    if (selectedPolicies.length === 0 || !editingItem) return;
    setIsProcessingAI(true);
    try {
      // الباكند يقبل policyIds (array of numbers)
      const res = await fetch("/api/news/editorial-policies/sequential", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: editedContent, queueId: editingItem.id, policyIds: selectedPolicies }),
      }).then(r => r.json());
      
      if (res.finalText) {
        setEditedContent(res.finalText);
      }
    } catch (err) {
      console.error("Sequential apply error:", err);
    }
    setIsProcessingAI(false);
    setSelectedPolicies([]);
  };

  const handleApprove = async (id: number) => {
    try {
      await api.approveQueueItem(id);
      setQueue(prev => prev.filter(item => item.id !== id));
      setEditingItem(null);
    } catch (err) {
      console.error("Approve error:", err);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await api.rejectQueueItem(id);
      setQueue(prev => prev.filter(item => item.id !== id));
      setEditingItem(null);
    } catch (err) {
      console.error("Reject error:", err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الخبر؟')) return;
    try {
      await api.deleteArticle(id);
      setQueue(prev => prev.filter(item => item.id !== id));
      setEditingItem(null);
      alert('تم حذف الخبر بنجاح');
    } catch (err) {
      alert('حدث خطأ أثناء الحذف');
      console.error(err);
    }
  };

  if (loading) return <LoadingSpinner />;

  // Editor mode
  if (editingItem) {
    return (
      <div className="space-y-6">
        <button onClick={() => setEditingItem(null)} className="text-gray-400 hover:text-white text-sm flex items-center gap-2">
          <ArrowRight size={16} /> العودة للطابور
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#0b1224] rounded-3xl p-8 border border-white/5 shadow-2xl space-y-4">
            <h3 className="font-bold text-white text-lg">{editingItem.title || 'بدون عنوان'}</h3>
            <div className="flex gap-2 text-[10px] text-gray-500">
              <span>{editingItem.category_name || '—'}</span>
              <span>•</span>
              <span>{editingItem.media_unit_name || '—'}</span>
            </div>
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full h-64 bg-[#020617]/50 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-blue-600/50 resize-none text-white"
            />
            <div className="flex gap-3">
              <button onClick={() => handleApprove(editingItem.id)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2">
                <CheckCircle2 size={16} /> موافقة ونشر
              </button>
              <button onClick={() => handleReject(editingItem.id)} className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2">
                <XCircle size={16} /> رفض
              </button>
              <button onClick={() => handleDelete(editingItem.id)} className="bg-red-600/20 hover:bg-red-600/30 text-red-400 px-4 py-3 rounded-2xl font-bold text-sm flex items-center gap-2">
                <Trash2 size={16} /> حذف
              </button>
            </div>
          </div>

          <div className="bg-[#0b1224] rounded-3xl p-6 border border-white/5 shadow-2xl space-y-4">
            <h4 className="font-bold text-white text-sm">تطبيق سياسات تحريرية</h4>
            <div className="space-y-2">
              {policies.map((p: any) => (
                <label key={p.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                  ${selectedPolicies.includes(p.id) ? "bg-blue-600/10 border-blue-600/50" : "bg-white/[0.02] border-white/5 hover:border-white/10"}`}>
                  <input type="checkbox" checked={selectedPolicies.includes(p.id)} onChange={() => togglePolicy(p.id)} className="accent-blue-500" />
                  <div>
                    <span className="text-xs font-bold text-white">{p.name}</span>
                    <p className="text-[10px] text-gray-500">{p.description || ''}</p>
                  </div>
                </label>
              ))}
            </div>
            <button
              onClick={applySequentially}
              disabled={isProcessingAI || selectedPolicies.length === 0}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessingAI ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Sparkles size={16} /> تطبيق متسلسل</>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h3 className="text-xl font-bold mb-1">ستوديو التحرير</h3>
          <p className="text-gray-500 text-sm">الأخبار المعلقة بانتظار مراجعة المحرر.</p>
        </div>
        <button onClick={() => api.processNewArticles().then(() => window.location.reload())} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all active:scale-95">
          معالجة أخبار جديدة
        </button>
      </div>

      {queue.length === 0 ? (
        <EmptyState icon={FileEdit} title="لا توجد أخبار في الطابور" description="سيظهر هنا الأخبار التي تحتاج مراجعة تحريرية." />
      ) : (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-[#0b1224] rounded-3xl p-6 border border-white/5 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Search size={16} className="text-blue-400" />
              البحث والفلترة
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search by title */}
              <div className="space-y-2">
                <label className="text-xs text-gray-400 font-bold uppercase">البحث عن عنوان</label>
                <input
                  type="text"
                  value={searchTitle}
                  onChange={(e) => setSearchTitle(e.target.value)}
                  placeholder="ابحث عن عنوان..."
                  className="w-full bg-[#020617]/50 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-600/50 text-white placeholder:text-gray-600"
                />
              </div>

              {/* Filter by category */}
              <div className="space-y-2">
                <label className="text-xs text-gray-400 font-bold uppercase">التصنيف</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-[#020617]/50 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-600/50 text-white"
                >
                  <option value="">كل التصنيفات</option>
                  {[...new Set(queue.map(item => item.category_name))].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Filter by date */}
              <div className="space-y-2">
                <label className="text-xs text-gray-400 font-bold uppercase">التاريخ</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-[#020617]/50 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-600/50 text-white"
                />
              </div>

              {/* Sort */}
              <div className="space-y-2">
                <label className="text-xs text-gray-400 font-bold uppercase">الترتيب</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "newest" | "oldest")}
                  className="w-full bg-[#020617]/50 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-600/50 text-white"
                >
                  <option value="newest">الأحدث أولاً</option>
                  <option value="oldest">الأقدم أولاً</option>
                </select>
              </div>
            </div>

            {/* Clear filters */}
            {(searchTitle || selectedCategory || selectedDate || sortBy !== "newest") && (
              <button
                onClick={() => {
                  setSearchTitle("");
                  setSelectedCategory("");
                  setSelectedDate("");
                  setSortBy("newest");
                }}
                className="text-xs text-blue-400 hover:text-blue-300 font-bold"
              >
                مسح الفلاتر
              </button>
            )}
          </div>

          {/* Results count and pagination info */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              عدد النتائج: <span className="text-white font-bold">{filteredQueue.length}</span> من <span className="text-white font-bold">{queue.length}</span>
            </div>
            {filteredQueue.length > 0 && (
              <div className="text-sm text-gray-400">
                الصفحة <span className="text-white font-bold">{currentPage}</span> من <span className="text-white font-bold">{Math.ceil(filteredQueue.length / itemsPerPage)}</span>
              </div>
            )}
          </div>

          {filteredQueue.length === 0 ? (
            <EmptyState icon={AlertTriangle} title="لا توجد أخبار" description="لم يتم العثور على أخبار تطابق معايير البحث." />
          ) : (
            <div className="space-y-4">
              {/* Table */}
              <div className="bg-[#0b1224] rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.02]">
                        <th className="text-right py-4 px-6 text-gray-400 font-semibold">#</th>
                        <th className="text-right py-4 px-6 text-gray-400 font-semibold">العنوان</th>
                        <th className="text-right py-4 px-6 text-gray-400 font-semibold">التصنيف</th>
                        <th className="text-right py-4 px-6 text-gray-400 font-semibold">المصدر</th>
                        <th className="text-right py-4 px-6 text-gray-400 font-semibold">الحالة</th>
                        <th className="text-center py-4 px-6 text-gray-400 font-semibold">التاريخ</th>
                        <th className="text-center py-4 px-6 text-gray-400 font-semibold">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredQueue
                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                        .map((item: any, idx: number) => (
                          <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                            <td className="py-4 px-6 text-gray-400 font-mono text-xs">
                              {(currentPage - 1) * itemsPerPage + idx + 1}
                            </td>
                            <td className="py-4 px-6 text-gray-200 max-w-xs truncate">
                              {item.title || 'بدون عنوان'}
                            </td>
                            <td className="py-4 px-6 text-gray-400">
                              <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded text-xs font-bold">
                                {item.category_name || '—'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-gray-400 text-xs">
                              {item.source_name || '—'}
                            </td>
                            <td className="py-4 px-6 text-gray-400">
                              <span className="bg-amber-500/10 text-amber-400 px-2 py-1 rounded text-xs font-bold">
                                {item.status || 'pending'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-center text-gray-400 text-xs font-mono">
                              {new Date(item.created_at).toLocaleDateString('ar-SA')}
                            </td>
                            <td className="py-4 px-6 text-center">
                              <div className="flex gap-2 justify-center">
                                <button
                                  onClick={() => handleOpenEditor(item)}
                                  className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 px-3 py-1.5 rounded text-xs font-bold transition-all"
                                  title="فتح المحرر"
                                >
                                  تحرير
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 px-3 py-1.5 rounded text-xs font-bold transition-all"
                                  title="حذف الخبر"
                                >
                                  حذف
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination Controls */}
              {Math.ceil(filteredQueue.length / itemsPerPage) > 1 && (() => {
                const totalPages = Math.ceil(filteredQueue.length / itemsPerPage);
                const pagesPerGroup = 10;
                const currentGroup = Math.floor((currentPage - 1) / pagesPerGroup);
                const startPage = currentGroup * pagesPerGroup + 1;
                const endPage = Math.min(startPage + pagesPerGroup - 1, totalPages);
                const visiblePages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

                return (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-bold text-sm transition-all"
                    >
                      السابق
                    </button>

                    <div className="flex gap-1">
                      {visiblePages.map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    {endPage < totalPages && (
                      <button
                        onClick={() => setCurrentPage(endPage + 1)}
                        className="bg-white/5 hover:bg-white/10 text-white px-3 py-2 rounded-lg font-bold text-sm transition-all"
                      >
                        ...
                      </button>
                    )}

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-bold text-sm transition-all"
                    >
                      التالي
                    </button>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Shared Components ---
function StatCard({ label, value, icon: Icon, trend, variant = "default" }: {
  label: string; value: string | number; icon: any; trend?: string; variant?: string;
}) {
  return (
    <div className="bg-[#0b1224] rounded-3xl p-6 border border-white/5 shadow-2xl relative overflow-hidden group hover:border-white/10 transition-all">
      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 blur-3xl rounded-full -mr-12 -mt-12 group-hover:bg-blue-600/10 transition-all" />
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">{label}</p>
          <p className="text-3xl font-black text-white">{value}</p>
          {trend && <span className="text-[10px] text-emerald-400 font-bold mt-1 block">{trend}</span>}
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
          variant === "warning" ? "bg-amber-500/10 text-amber-400" :
          variant === "success" ? "bg-emerald-500/10 text-emerald-400" :
          "bg-blue-600/10 text-blue-400"
        }`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="bg-[#0b1224] rounded-3xl border border-white/5 shadow-2xl p-8 text-center py-20">
      <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
        <Icon size={40} className="text-gray-500" />
      </div>
      <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
      <p className="text-gray-500 max-w-sm mx-auto">{description}</p>
    </div>
  );
}
