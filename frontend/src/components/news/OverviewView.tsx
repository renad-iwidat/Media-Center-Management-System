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

  // دالة لتحميل البيانات
  const loadData = () => {
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
  };

  // تحميل البيانات عند التحميل الأول أو تغيير unitId
  useEffect(() => {
    loadData();
  }, [unitId]);

  // الاستماع لحدث الريفريش التلقائي
  useEffect(() => {
    const handleDataRefresh = () => {
      console.log('🔄 [OverviewView] تحديث البيانات بناءً على حدث الريفريش');
      loadData();
    };

    window.addEventListener('dataRefresh', handleDataRefresh);
    return () => window.removeEventListener('dataRefresh', handleDataRefresh);
  }, []);

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
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-4 sm:p-6 border border-gray-200 shadow-lg">
          <h3 className="text-sm sm:text-base font-bold mb-4 sm:mb-5 flex items-center gap-2 text-gray-900">
            <TrendingUp size={16} className="text-blue-600 shrink-0" />
            <span className="truncate">إحصائيات جميع الوحدات الإعلامية</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
            {queueStats.map((unit: any) => {
              const unitPublished = publishedStats?.by_media_unit?.find(
                (u: any) => u.media_unit === unit.name
              );
              return (
                <div key={unit.id} className="bg-gray-50 border border-gray-200 rounded-2xl p-3 sm:p-4 space-y-3">
                  <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">{unit.name}</p>
                  <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-[11px]">
                    <div className="bg-amber-100 border border-amber-300 rounded-xl p-2 text-center">
                      <p className="text-amber-700 font-bold text-base sm:text-lg">
                        {(Number(unit.pending_count || 0) + Number(unit.incomplete_count || 0))}
                      </p>
                      <p className="text-gray-600 text-xs">انتظار</p>
                    </div>
                    <div className="bg-emerald-100 border border-emerald-300 rounded-xl p-2 text-center">
                      <p className="text-emerald-700 font-bold text-base sm:text-lg">{unitPublished?.count || 0}</p>
                      <p className="text-gray-600 text-xs">منشور</p>
                    </div>
                    <div className="bg-rose-100 border border-rose-300 rounded-xl p-2 text-center">
                      <p className="text-rose-700 font-bold text-base sm:text-lg">{unit.rejected_count || 0}</p>
                      <p className="text-gray-600 text-xs">مرفوض</p>
                    </div>
                  </div>
                </div>
              );
            })}
            {queueStats.length === 0 && (
              <p className="text-gray-600 text-sm col-span-full">لا توجد بيانات</p>
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
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-4 sm:p-6 border border-gray-200 shadow-lg">
            <h3 className="text-sm sm:text-base font-bold mb-4 sm:mb-5 flex items-center gap-2 text-gray-900">
              <TrendingUp size={16} className="text-blue-600 shrink-0" />
              <span className="truncate">إحصائيات {selectedUnit.name}</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-amber-100 border border-amber-300 rounded-2xl p-3 sm:p-4 text-center">
                <p className="text-amber-700 font-bold text-xl sm:text-2xl">
                  {(Number(selectedUnit.pending_count || 0) + Number(selectedUnit.incomplete_count || 0))}
                </p>
                <p className="text-gray-600 text-xs sm:text-xs mt-1">في الانتظار</p>
              </div>
              <div className="bg-emerald-100 border border-emerald-300 rounded-2xl p-3 sm:p-4 text-center">
                <p className="text-emerald-700 font-bold text-xl sm:text-2xl">{unitPublished?.count || 0}</p>
                <p className="text-gray-600 text-xs sm:text-xs mt-1">منشور</p>
              </div>
              <div className="bg-rose-100 border border-rose-300 rounded-2xl p-3 sm:p-4 text-center">
                <p className="text-rose-700 font-bold text-xl sm:text-2xl">{selectedUnit.rejected_count || 0}</p>
                <p className="text-gray-600 text-xs sm:text-xs mt-1">مرفوض</p>
              </div>
              <div className="bg-sky-100 border border-sky-300 rounded-2xl p-3 sm:p-4 text-center">
                <p className="text-sky-700 font-bold text-xl sm:text-2xl">{stats?.activeSources ?? "—"}</p>
                <p className="text-gray-600 text-xs sm:text-xs mt-1">مصادر نشطة</p>
              </div>
            </div>
          </div>
        ) : null;
      })()}

      {/* رسم بياني للنشر اليومي */}
      {unitId && dailyStats.length > 0 && (
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-4 sm:p-6 border border-gray-200 shadow-lg overflow-hidden">
          <h3 className="text-sm sm:text-base font-bold mb-4 sm:mb-6 flex items-center gap-2 text-gray-900">
            <TrendingUp size={16} className="text-blue-600 shrink-0" />
            <span className="truncate">إحصائيات النشر والرفض اليومية</span>
          </h3>
          
          {/* جدول الإحصائيات */}
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-right py-2 sm:py-3 px-3 sm:px-4 text-gray-700 font-semibold">التاريخ</th>
                  <th className="text-right py-2 sm:py-3 px-3 sm:px-4 text-gray-700 font-semibold hidden sm:table-cell">اليوم</th>
                  <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-emerald-700 font-semibold">منشور</th>
                  <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-blue-700 font-semibold hidden sm:table-cell">تحريري</th>
                  <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-sky-700 font-semibold hidden sm:table-cell">أوتوماتيكي</th>
                  <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-rose-700 font-semibold">مرفوض</th>
                </tr>
              </thead>
              <tbody>
                {dailyStats.slice(0, 30).map((day: any, idx: number) => {
                  const dateObj = new Date(day.date);
                  const dayName = dateObj.toLocaleDateString('ar-SA', { weekday: 'long' });
                  const formattedDate = dateObj.toLocaleDateString('ar-SA');
                  
                  return (
                    <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="py-2 sm:py-3 px-3 sm:px-4 text-gray-700 font-mono text-xs">{formattedDate}</td>
                      <td className="py-2 sm:py-3 px-3 sm:px-4 text-gray-600 hidden sm:table-cell text-xs">{dayName}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                        <span className="bg-emerald-100 text-emerald-700 px-2 sm:px-3 py-0.5 rounded-lg font-bold text-xs">
                          {day.published_count || 0}
                        </span>
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-center hidden sm:table-cell">
                        <span className="bg-blue-100 text-blue-700 px-2 sm:px-3 py-0.5 rounded-lg font-bold text-xs">
                          {day.editorial_count || 0}
                        </span>
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-center hidden sm:table-cell">
                        <span className="bg-sky-100 text-sky-700 px-2 sm:px-3 py-0.5 rounded-lg font-bold text-xs">
                          {day.automated_count || 0}
                        </span>
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                        <span className="bg-rose-100 text-rose-700 px-2 sm:px-3 py-0.5 rounded-lg font-bold text-xs">
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
            <h4 className="text-xs font-bold text-gray-700 uppercase">توزيع النشر</h4>
            {dailyStats.slice(0, 14).map((day: any, idx: number) => {
              const maxCount = Math.max(...dailyStats.map((d: any) => d.published_count || 0), 1);
              const publishedWidth = ((day.published_count || 0) / maxCount) * 100;
              const dateObj = new Date(day.date);
              const formattedDate = dateObj.toLocaleDateString('ar-SA');
              
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600 font-mono">{formattedDate}</span>
                    <span className="text-gray-900 font-bold">{day.published_count || 0} منشور</span>
                  </div>
                  <div className="flex gap-0.5 h-5 bg-gray-100 rounded-lg overflow-hidden">
                    {day.editorial_count > 0 && (
                      <div 
                        className="bg-blue-500 transition-all" 
                        style={{ width: `${(day.editorial_count / (day.published_count || 1)) * 100}%` }}
                        title={`تحريري: ${day.editorial_count}`}
                      />
                    )}
                    {day.automated_count > 0 && (
                      <div 
                        className="bg-sky-500 transition-all" 
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
          <div className="flex flex-wrap gap-6 mt-6 pt-4 border-t border-gray-300 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded" />
              <span className="text-gray-700">منشور</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded" />
              <span className="text-gray-700">تحريري</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-sky-500 rounded" />
              <span className="text-gray-700">أوتوماتيكي</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-rose-500 rounded" />
              <span className="text-gray-700">مرفوض</span>
            </div>
          </div>
        </div>
      )}

      {/* الصف الثاني: آخر الأخبار المنتظرة + آخر المنشورات */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-4 sm:p-6 border border-gray-200 shadow-lg">
          <h3 className="text-sm sm:text-base font-bold mb-3 sm:mb-4 flex items-center gap-2 text-gray-900">
            <Clock size={16} className="text-amber-600 shrink-0" />
            <span className="truncate">آخر الأخبار في الانتظار</span>
          </h3>
          {pendingItems.length === 0 ? (
            <p className="text-gray-600 text-xs sm:text-sm">لا توجد أخبار منتظرة</p>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {pendingItems.map((item: any) => (
                <div key={item.id} className="flex items-start justify-between gap-2 sm:gap-3 py-2 border-b border-gray-200 last:border-0">
                  <p className="text-xs sm:text-sm text-gray-900 line-clamp-1 flex-1">{item.title || "بدون عنوان"}</p>
                  <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md shrink-0 whitespace-nowrap border border-amber-300">{item.media_unit_name || "—"}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-4 sm:p-6 border border-gray-200 shadow-lg">
          <h3 className="text-sm sm:text-base font-bold mb-3 sm:mb-4 flex items-center gap-2 text-gray-900">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span className="truncate">آخر المنشورات</span>
          </h3>
          {publishedItems.length === 0 ? (
            <p className="text-gray-600 text-xs sm:text-sm">لا توجد منشورات بعد</p>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {publishedItems.map((item: any) => (
                <div key={item.id} className="flex items-start justify-between gap-2 sm:gap-3 py-2 border-b border-gray-200 last:border-0">
                  <p className="text-xs sm:text-sm text-gray-900 line-clamp-1 flex-1">{item.title || "بدون عنوان"}</p>
                  <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md shrink-0 whitespace-nowrap border border-emerald-300">
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
