import { useState, useEffect, useCallback } from "react";
import { TrendingUp, Clock, CheckCircle2, AlertTriangle, Rss, BarChart3, ArrowUpRight } from "lucide-react";
import { api } from "../../services/api";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { StatCard } from "../shared/StatCard";

export function OverviewView({ unitId }: { unitId: number | null }) {
  const [stats, setStats] = useState<any>(null);
  const [queueStats, setQueueStats] = useState<any[]>([]);
  const [publishedStats, setPublishedStats] = useState<any>(null);
  const [dailyStats, setDailyStats] = useState<any[]>([]);
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [publishedItems, setPublishedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllDays, setShowAllDays] = useState(false);

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.getStatistics().catch(() => null),
      api.getQueueStats().catch(() => null),
      api.getPublishedStats().catch(() => null),
      api.getEditorialStudio(unitId).catch(() => null),
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

  useEffect(() => { loadData(); }, [loadData]);

  const totalPending = queueStats.reduce(
    (sum, u) => sum + Number(u.pending_count || 0) + Number(u.incomplete_count || 0), 0
  );

  const totalPublished = publishedStats?.total || publishedStats?.by_media_unit?.reduce(
    (sum: number, u: any) => sum + (u.count || 0), 0
  ) || 0;

  const totalRejected = queueStats.reduce(
    (sum, u) => sum + Number(u.rejected_count || 0), 0
  );

  if (loading) return <LoadingSpinner />;

  const selectedUnit = unitId ? queueStats.find(u => Number(u.id) === Number(unitId)) : null;
  const unitPublished = selectedUnit
    ? publishedStats?.by_media_unit?.find((u: any) => u.media_unit === selectedUnit?.name)
    : null;

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      {!unitId ? null : selectedUnit ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="في الانتظار"
            value={Number(selectedUnit.pending_count || 0) + Number(selectedUnit.incomplete_count || 0)}
            icon={Clock}
            variant="warning"
          />
          <StatCard label="منشور" value={unitPublished?.count || 0} icon={CheckCircle2} variant="success" />
          <StatCard label="مرفوض" value={selectedUnit.rejected_count || 0} icon={AlertTriangle} variant="error" />
          <StatCard label="المصادر النشطة" value={stats?.activeSources ?? "—"} icon={Rss} variant="info" />
        </div>
      ) : null}

      {/* All Units Stats Cards */}
      {!unitId && queueStats.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#e2e8f0] flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#3d6a8a]/10 rounded-lg flex items-center justify-center">
              <ArrowUpRight size={16} className="text-[#3d6a8a]" />
            </div>
            <h3 className="text-sm font-bold text-[#1e293b]">إحصائيات جميع الوحدات الإعلامية</h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {queueStats.map((unit: any) => {
                const unitPub = publishedStats?.by_media_unit?.find(
                  (u: any) => u.media_unit === unit.name
                );
                const pending = Number(unit.pending_count || 0) + Number(unit.incomplete_count || 0);
                const published = unitPub?.count || 0;
                const rejected = Number(unit.rejected_count || 0);
                return (
                  <div key={unit.id} className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4 flex flex-col gap-3">
                    <p className="text-sm font-bold text-[#1e293b] text-right">{unit.name}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col items-center gap-1 bg-white rounded-lg border border-emerald-200 py-2.5 px-2">
                        <span className="text-xl font-extrabold text-emerald-600">{published}</span>
                        <span className="text-[10px] text-emerald-600 font-medium">منشور</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 bg-white rounded-lg border border-amber-200 py-2.5 px-2">
                        <span className="text-xl font-extrabold text-amber-500">{pending}</span>
                        <span className="text-[10px] text-amber-500 font-medium">انتظار</span>
                      </div>
                      <div className="col-span-2 flex flex-col items-center gap-1 bg-white rounded-lg border border-rose-200 py-2.5 px-2">
                        <span className="text-xl font-extrabold text-rose-500">{rejected}</span>
                        <span className="text-[10px] text-rose-500 font-medium">مرفوض</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Daily Stats Chart */}
      {unitId && dailyStats.length > 0 && (() => {
        const last14 = dailyStats.slice(0, 14);
        const maxVal = Math.max(...last14.map((d: any) => d.published_count || 0), 1);
        const totalPublishedSum = dailyStats.reduce((s: number, d: any) => s + (d.published_count || 0), 0);
        const totalEditorialSum = dailyStats.reduce((s: number, d: any) => s + (d.editorial_count || 0), 0);
        const totalAutoSum = dailyStats.reduce((s: number, d: any) => s + (d.automated_count || 0), 0);
        const totalRejectedSum = dailyStats.reduce((s: number, d: any) => s + (d.rejected_count || 0), 0);
        const tableRows = showAllDays ? dailyStats : dailyStats.slice(0, 7);
        // تحديد تاريخ اليوم بتوقيت فلسطين للمقارنة
        const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Hebron' });

        return (
          <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#e2e8f0] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-[#3d6a8a]/10 rounded-lg flex items-center justify-center">
                  <TrendingUp size={16} className="text-[#3d6a8a]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1e293b]">إحصائيات النشر اليومية</h3>
                  <p className="text-[10px] text-[#94a3b8]">آخر {dailyStats.length} يوم</p>
                </div>
              </div>
            </div>

            {/* Bar Chart - Enhanced Design */}
            <div className="px-5 pt-5 pb-4">
              {/* Chart Container with Grid Background */}
              <div className="relative">
                {/* Grid Lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="border-t border-dashed border-[#e2e8f0]" />
                  ))}
                </div>
                
                {/* Y-axis Labels */}
                <div className="absolute right-full mr-2 inset-y-0 flex flex-col justify-between text-[10px] text-[#94a3b8] font-medium">
                  <span>{maxVal}</span>
                  <span>{Math.round(maxVal * 0.75)}</span>
                  <span>{Math.round(maxVal * 0.5)}</span>
                  <span>{Math.round(maxVal * 0.25)}</span>
                  <span>0</span>
                </div>

                {/* Bars */}
                <div className="flex items-end gap-2 h-48 relative">
                  {last14.map((day: any, idx: number) => {
                    const pubCount = day.published_count || 0;
                    const pubH = (pubCount / maxVal) * 100;
                    const dateObj = new Date(day.date);
                    const dayLabel = dateObj.toLocaleDateString('ar-SA', { day: 'numeric', month: 'numeric', timeZone: 'Asia/Hebron' });
                    const weekDay = dateObj.toLocaleDateString('ar-SA', { weekday: 'short', timeZone: 'Asia/Hebron' });
                    const dayDateStr = dateObj.toLocaleDateString('en-CA', { timeZone: 'Asia/Hebron' });
                    const isToday = dayDateStr === todayStr;
                    
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                        {/* Enhanced Tooltip */}
                        <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-gradient-to-br from-[#1e293b] to-[#334155] text-white text-[10px] rounded-xl px-3 py-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 z-20 pointer-events-none shadow-2xl border border-white/10">
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1e293b] rotate-45 border-r border-b border-white/10" />
                          <p className="font-bold mb-1 text-white">{dayLabel} · {weekDay}</p>
                          <div className="space-y-0.5">
                            <p className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-400" />
                              <span className="text-emerald-300">منشور: {pubCount}</span>
                            </p>
                            {(day.editorial_count || 0) > 0 && (
                              <p className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#93c5fd]" />
                                <span className="text-[#93c5fd]">تحريري: {day.editorial_count}</span>
                              </p>
                            )}
                            {(day.automated_count || 0) > 0 && (
                              <p className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-sky-300" />
                                <span className="text-sky-300">آلي: {day.automated_count}</span>
                              </p>
                            )}
                            {(day.rejected_count || 0) > 0 && (
                              <p className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-rose-300" />
                                <span className="text-rose-300">مرفوض: {day.rejected_count}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Bar Column */}
                        <div className="w-full flex flex-col justify-end relative" style={{ height: '100%' }}>
                          {/* Bar with Shadow */}
                          <div
                            className={`relative w-full rounded-t-xl transition-all duration-300 group-hover:scale-105 ${
                              isToday ? 'shadow-lg shadow-orange-200' : 'shadow-md shadow-blue-100'
                            }`}
                            style={{
                              height: `${Math.max(pubH, 5)}%`,
                              background: isToday
                                ? 'linear-gradient(180deg, #FF9F4A 0%, #FF8C2E 100%)'
                                : 'linear-gradient(180deg, #4A7C9E 0%, #2d5570 100%)',
                            }}
                          >
                            {/* Value Label on Top of Bar */}
                            {pubCount > 0 && (
                              <div className="absolute -top-6 inset-x-0 text-center">
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                  isToday 
                                    ? 'bg-orange-100 text-orange-700 border border-orange-200' 
                                    : 'bg-blue-50 text-[#2d5570] border border-blue-200'
                                }`}>
                                  {pubCount}
                                </span>
                              </div>
                            )}
                            
                            {/* Shine Effect */}
                            <div className="absolute inset-0 rounded-t-xl bg-gradient-to-b from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>

                        {/* Day Label */}
                        <div className="text-center">
                          <span className={`block text-[10px] font-bold ${isToday ? 'text-[#FF8C2E]' : 'text-[#64748b]'}`}>
                            {dayLabel}
                          </span>
                          <span className="block text-[9px] text-[#94a3b8] mt-0.5">
                            {weekDay}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Enhanced Legend */}
              <div className="flex items-center justify-center gap-6 pt-4 mt-4 border-t border-[#e2e8f0]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded shadow-sm" style={{ background: 'linear-gradient(135deg, #4A7C9E 0%, #2d5570 100%)' }} />
                  <span className="text-xs text-[#64748b] font-medium">الأيام السابقة</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded shadow-sm" style={{ background: 'linear-gradient(135deg, #FF9F4A 0%, #FF8C2E 100%)' }} />
                  <span className="text-xs text-[#FF8C2E] font-bold">اليوم</span>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="border-t border-[#e2e8f0] overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                    <th className="text-right py-2.5 px-5 text-xs font-semibold text-[#64748b]">التاريخ</th>
                    <th className="text-right py-2.5 px-4 text-xs font-semibold text-[#64748b] hidden sm:table-cell">اليوم</th>
                    <th className="text-center py-2.5 px-4 text-xs font-semibold text-emerald-600">منشور</th>
                    <th className="text-center py-2.5 px-4 text-xs font-semibold text-[#4A7C9E] hidden sm:table-cell">تحريري</th>
                    <th className="text-center py-2.5 px-4 text-xs font-semibold text-sky-600 hidden sm:table-cell">آلي</th>
                    <th className="text-center py-2.5 px-4 text-xs font-semibold text-rose-600">مرفوض</th>
                    <th className="text-right py-2.5 px-4 text-xs font-semibold text-[#94a3b8] hidden md:table-cell">التوزيع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f8fafc]">
                  {tableRows.map((day: any, idx: number) => {
                    const dateObj = new Date(day.date);
                    const dayName = dateObj.toLocaleDateString('ar-SA', { weekday: 'long', timeZone: 'Asia/Hebron' });
                    const formattedDate = dateObj.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Hebron' });
                    const pub = day.published_count || 0;
                    const ed = day.editorial_count || 0;
                    const auto = day.automated_count || 0;
                    const rej = day.rejected_count || 0;
                    const total = pub + rej;
                    const pubPct = total > 0 ? Math.round((pub / total) * 100) : 0;
                    const dayDateStr = dateObj.toLocaleDateString('en-CA', { timeZone: 'Asia/Hebron' });
                    const isFirst = dayDateStr === todayStr;
                    return (
                      <tr key={idx} className={`transition-colors hover:bg-[#f8fafc] ${isFirst ? 'bg-[#fffbf5]' : ''}`}>
                        <td className="py-2.5 px-5">
                          <div className="flex items-center gap-2">
                            {isFirst && <span className="text-[9px] text-[#FF9F4A] font-bold bg-[#FF9F4A]/10 px-1.5 py-0.5 rounded-md border border-[#FF9F4A]/30">اليوم</span>}
                            <span className="text-xs text-[#1e293b] font-medium">{formattedDate}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-xs text-[#64748b] hidden sm:table-cell">{dayName}</td>
                        <td className="py-2.5 px-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-bold ${pub > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>{pub}</span>
                        </td>
                        <td className="py-2.5 px-4 text-center hidden sm:table-cell">
                          <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-bold ${ed > 0 ? 'bg-[#f0f4f8] text-[#4A7C9E]' : 'bg-gray-100 text-gray-400'}`}>{ed}</span>
                        </td>
                        <td className="py-2.5 px-4 text-center hidden sm:table-cell">
                          <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-bold ${auto > 0 ? 'bg-sky-100 text-sky-700' : 'bg-gray-100 text-gray-400'}`}>{auto}</span>
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-bold ${rej > 0 ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-400'}`}>{rej}</span>
                        </td>
                        <td className="py-2.5 px-4 hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${pubPct}%` }} />
                            </div>
                            <span className="text-[10px] text-[#94a3b8] w-7 text-left">{pubPct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Show more / less */}
              {dailyStats.length > 7 && (
                <div className="border-t border-[#f1f5f9] px-5 py-3 text-center">
                  <button
                    onClick={() => setShowAllDays(v => !v)}
                    className="text-xs font-medium text-[#4A7C9E] hover:text-[#2d5570] transition-colors"
                  >
                    {showAllDays ? `▲ عرض أقل` : `▼ عرض كل الأيام (${dailyStats.length})`}
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Recent Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pending */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#e2e8f0] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock size={16} className="text-amber-600" />
              </div>
              <h3 className="text-sm font-bold text-[#1e293b]">آخر الأخبار في الانتظار</h3>
            </div>
            {pendingItems.length > 0 && (
              <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-200">
                {pendingItems.length}
              </span>
            )}
          </div>
          <div className="divide-y divide-[#f1f5f9]">
            {pendingItems.length === 0 ? (
              <div className="py-10 text-center">
                <CheckCircle2 size={28} className="text-emerald-400 mx-auto mb-2" />
                <p className="text-sm text-[#64748b]">لا توجد أخبار منتظرة</p>
              </div>
            ) : (
              pendingItems.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-[#f8fafc] transition-colors">
                  <p className="text-sm text-[#1e293b] line-clamp-1 flex-1">{item.title || "بدون عنوان"}</p>
                  <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-lg shrink-0 border border-amber-200 font-medium">
                    {item.media_unit_name || "—"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Published */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#e2e8f0] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 size={16} className="text-emerald-600" />
              </div>
              <h3 className="text-sm font-bold text-[#1e293b]">آخر المنشورات</h3>
            </div>
            {publishedItems.length > 0 && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200">
                {publishedItems.length}
              </span>
            )}
          </div>
          <div className="divide-y divide-[#f1f5f9]">
            {publishedItems.length === 0 ? (
              <div className="py-10 text-center">
                <Clock size={28} className="text-[#94a3b8] mx-auto mb-2" />
                <p className="text-sm text-[#64748b]">لا توجد منشورات بعد</p>
              </div>
            ) : (
              publishedItems.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-[#f8fafc] transition-colors">
                  <p className="text-sm text-[#1e293b] line-clamp-1 flex-1">{item.title || "بدون عنوان"}</p>
                  <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg shrink-0 border border-emerald-200 font-medium">
                    {item.published_at ? new Date(item.published_at).toLocaleDateString("ar") : "—"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
