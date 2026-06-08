import { useState, useEffect, useCallback } from "react";
import { Rss, Wifi, Globe, ExternalLink, RefreshCw, Building2 } from "lucide-react";
import { api } from "../../services/api";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { EmptyState } from "../shared/EmptyState";

// ─── Types ────────────────────────────────────────────────────────────────────
interface UnitSource {
  id: number;
  source_id: number;
  source_name: string;
  source_slug: string;
  source_url: string;
  priority: number;
  is_active: boolean;
}

interface MediaUnitWithSources {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  sources: UnitSource[];
}

// ─── Component ────────────────────────────────────────────────────────────────
export function SourcesView({ autoEnabled, unitId }: { autoEnabled: boolean; unitId: number | null }) {
  const [allUnits, setAllUnits] = useState<MediaUnitWithSources[]>([]);
  const [loading, setLoading] = useState(true);

  // تحميل الوحدات مع مصادرها من الداتابيس المحلي
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getMediaUnitsWithSources();
      const units = res?.data || res || [];
      setAllUnits(Array.isArray(units) ? units : []);
    } catch (err) {
      console.error('فشل تحميل بيانات الوحدات والمصادر:', err);
      setAllUnits([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // الوحدة المختارة من الفلتر بالهدر
  const selectedUnit = unitId
    ? allUnits.find(u => u.id === unitId)
    : null;

  const displaySources = selectedUnit?.sources || [];
  const activeSources = displaySources.filter(s => s.is_active);

  if (loading) return <LoadingSpinner />;

  // إذا لم يتم اختيار وحدة إعلامية
  if (!unitId || !selectedUnit) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Rss size={20} className="text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1e293b]">مصادر المحتوى</h2>
            <p className="text-xs text-[#64748b]">اختر وحدة إعلامية من الأعلى لعرض مصادرها</p>
          </div>
        </div>
        <EmptyState
          icon={Building2}
          title="لم يتم اختيار وحدة إعلامية"
          description="يرجى اختيار وحدة إعلامية من شريط التصفية في الأعلى لعرض المصادر المرتبطة بها."
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Rss size={20} className="text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1e293b]">مصادر — {selectedUnit.name}</h2>
            <p className="text-xs text-[#64748b]">
              {activeSources.length} مصدر نشط من أصل {displaySources.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {autoEnabled && (
            <div className="flex items-center gap-2 bg-[#3d6a8a]/8 border border-[#3d6a8a]/20 rounded-xl px-3 py-1.5">
              <div className="w-2 h-2 bg-[#3d6a8a] rounded-full animate-pulse" />
              <Wifi size={13} className="text-[#3d6a8a]" />
              <span className="text-xs text-[#2d5570] font-semibold">مراقبة تلقائية</span>
            </div>
          )}
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#e2e8f0] rounded-xl text-xs font-semibold text-[#64748b] transition-all"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            تحديث
          </button>
        </div>
      </div>

      {/* Sources List */}
      {displaySources.length === 0 ? (
        <EmptyState icon={Rss} title="لا توجد مصادر" description="لا توجد مصادر مرتبطة بهذه الوحدة الإعلامية." />
      ) : (
        <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 size={14} className="text-[#3d6a8a]" />
              <span className="text-xs font-bold text-[#1e293b]">مصادر {selectedUnit.name}</span>
            </div>
            <span className="text-[10px] text-[#94a3b8]">{activeSources.length} نشط من {displaySources.length}</span>
          </div>
          <div className="divide-y divide-[#f1f5f9]">
            {displaySources.map((source) => (
              <div key={source.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#f8fafc] transition-colors group">
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${source.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-[#e2e8f0]'}`} />
                <div className="w-8 h-8 bg-[#3d6a8a]/8 rounded-lg flex items-center justify-center shrink-0">
                  <Globe size={14} className="text-[#3d6a8a]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-[#1e293b] truncate">{source.source_name}</h4>
                    {!source.is_active && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-500 border border-rose-100 shrink-0">
                        متوقف
                      </span>
                    )}
                  </div>
                  {source.source_url && (
                    <p className="text-[10px] text-[#94a3b8] font-mono truncate flex items-center gap-1">
                      <ExternalLink size={9} className="shrink-0" />
                      {source.source_url}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-medium text-[#64748b] bg-[#f1f5f9] px-2 py-0.5 rounded border border-[#e2e8f0]">
                    أولوية: {source.priority}
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
