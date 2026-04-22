import { useState, useEffect } from "react";
import { TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { api } from "../../services/api";
import { LoadingSpinner } from "../shared/LoadingSpinner";

export function OverviewView({ unitId }: { unitId: number | null }) {
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

  // إجمالي في الانتظار (pending + incomplete)
  const totalPending = queueStats.reduce(
    (sum, u) => sum + Number(u.pending_count || 0) + Number(u.incomplete_count || 0),
    0
  );

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
                      <p className="text-amber-400 font-bold text-lg">
                        {(Number(unit.pending_count || 0) + Number(unit.incomplete_count || 0))}
                      </p>
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
                <p className="text-amber-400 font-bold text-2xl">
                  {(Number(selectedUnit.pending_count || 0) + Number(selectedUnit.incomplete_count || 0))}
                </p>
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
