import { useState, useEffect, useCallback } from "react";
import { Rss, Clock, CheckCircle2, Wifi, Globe, ExternalLink } from "lucide-react";
import { api } from "../../services/api";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { EmptyState } from "../shared/EmptyState";

export function SourcesView({ autoEnabled }: { autoEnabled: boolean }) {
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // دالة لتنسيق التاريخ
  const formatLastFetched = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    
    try {
      const date = new Date(dateString);
      // التحقق من صحة التاريخ
      if (isNaN(date.getTime())) return null;
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'الآن';
      if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
      if (diffHours < 24) return `منذ ${diffHours} ساعة`;
      if (diffDays < 7) return `منذ ${diffDays} يوم`;
      return date.toLocaleDateString('ar-SA', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return null;
    }
  };

  // دالة للتحقق من أن السحب حديث (آخر ساعة)
  const isRecentlyFetched = (dateString: string | null | undefined) => {
    if (!dateString) return false;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return false;
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = diffMs / 3600000;
      return diffHours < 1;
    } catch {
      return false;
    }
  };

  const loadData = useCallback(() => {
    setLoading(true);
    api.getSources()
      .then((res) => {
        const sourcesWithFormatted = (res.data || []).map((source: any) => ({
          ...source,
          last_fetched_formatted: formatLastFetched(source.last_fetched_at),
          is_recently_fetched: isRecentlyFetched(source.last_fetched_at),
        }));
        // عرض المصادر النشطة فقط
        setSources(sourcesWithFormatted.filter((s: any) => s.is_active));
      })
      .catch(() => setSources([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header with count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <CheckCircle2 size={20} className="text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1e293b]">المصادر النشطة</h2>
            <p className="text-xs text-[#64748b]">{sources.length} مصدر يعمل حالياً</p>
          </div>
        </div>

        {autoEnabled && (
          <div className="flex items-center gap-2 bg-[#3d6a8a]/8 border border-[#3d6a8a]/20 rounded-xl px-3.5 py-2">
            <div className="w-2 h-2 bg-[#3d6a8a] rounded-full animate-pulse" />
            <Wifi size={14} className="text-[#3d6a8a]" />
            <span className="text-xs text-[#2d5570] font-semibold">مراقبة تلقائية</span>
          </div>
        )}
      </div>

      {/* Sources Table */}
      {sources.length === 0 ? (
        <EmptyState icon={Rss} title="لا توجد مصادر نشطة" description="لا يوجد أي مصدر نشط حالياً في النظام." />
      ) : (
        <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden shadow-sm">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_120px_140px] gap-4 px-6 py-3.5 bg-[#f8fafc] border-b border-[#e2e8f0]">
            <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">المصدر</span>
            <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider text-center">النوع</span>
            <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider text-center">آخر سحب</span>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-[#f1f5f9]">
            {sources.map((source: any) => (
              <div
                key={source.id}
                className="grid grid-cols-[1fr_120px_140px] gap-4 px-6 py-4 hover:bg-[#f8fafc]/60 transition-colors group"
              >
                {/* Source Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 bg-[#3d6a8a]/8 rounded-lg flex items-center justify-center shrink-0">
                    <Globe size={16} className="text-[#3d6a8a]" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm text-[#1e293b] group-hover:text-[#3d6a8a] transition-colors truncate">
                      {source.name}
                    </h4>
                    <p className="text-[11px] text-[#94a3b8] font-mono truncate flex items-center gap-1">
                      {source.url ? (
                        <>
                          <ExternalLink size={9} className="shrink-0" />
                          <span className="truncate">{source.url}</span>
                        </>
                      ) : '—'}
                    </p>
                  </div>
                </div>

                {/* Type */}
                <div className="flex items-center justify-center">
                  <span className="text-[11px] font-bold text-[#64748b] bg-[#f1f5f9] px-2.5 py-1 rounded-lg border border-[#e2e8f0]">
                    {source.source_type_name || 'RSS'}
                  </span>
                </div>

                {/* Last Fetched */}
                <div className="flex items-center justify-center gap-1.5" title={source.last_fetched_at ? new Date(source.last_fetched_at).toLocaleString('ar-SA') : ''}>
                  {source.is_recently_fetched && (
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  )}
                  <Clock size={11} className="text-[#94a3b8]" />
                  <span className={`text-[11px] font-mono ${
                    source.last_fetched_at ? 'text-[#64748b]' : 'text-[#94a3b8] italic'
                  }`}>
                    {source.last_fetched_formatted || 'لم يسحب بعد'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
