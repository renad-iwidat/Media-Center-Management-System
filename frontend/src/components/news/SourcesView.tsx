import { useState, useEffect, useCallback } from "react";
import { Rss, Clock, CheckCircle2, XCircle, Wifi } from "lucide-react";
import { api } from "../../services/api";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { EmptyState } from "../shared/EmptyState";

export function SourcesView({ autoEnabled }: { autoEnabled: boolean }) {
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(() => {
    setLoading(true);
    api.getSources()
      .then((res) => setSources(res.data || []))
      .catch(() => setSources([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <LoadingSpinner />;

  const activeSources = sources.filter(s => s.is_active).length;
  const inactiveSources = sources.filter(s => !s.is_active).length;

  return (
    <div className="space-y-5">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-[#e2e8f0] rounded-2xl px-5 py-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 bg-[#3d6a8a]/10 rounded-xl flex items-center justify-center shrink-0">
            <Rss size={18} className="text-[#3d6a8a]" />
          </div>
          <div>
            <p className="text-2xl font-black text-[#1e293b]">{sources.length}</p>
            <p className="text-xs text-[#64748b] font-medium">إجمالي المصادر</p>
          </div>
        </div>
        <div className="bg-white border border-[#e2e8f0] rounded-2xl px-5 py-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle2 size={18} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-black text-[#1e293b]">{activeSources}</p>
            <p className="text-xs text-[#64748b] font-medium">نشطة</p>
          </div>
        </div>
        <div className="bg-white border border-[#e2e8f0] rounded-2xl px-5 py-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
            <XCircle size={18} className="text-gray-400" />
          </div>
          <div>
            <p className="text-2xl font-black text-[#1e293b]">{inactiveSources}</p>
            <p className="text-xs text-[#64748b] font-medium">متوقفة</p>
          </div>
        </div>
      </div>

      {/* Auto System Banner */}
      {autoEnabled && (
        <div className="bg-gradient-to-r from-[#3d6a8a]/8 to-[#4A7C9E]/8 border border-[#3d6a8a]/20 rounded-2xl px-5 py-3.5 flex items-center gap-3">
          <div className="w-2 h-2 bg-[#3d6a8a] rounded-full animate-pulse shrink-0" />
          <Wifi size={15} className="text-[#3d6a8a] shrink-0" />
          <span className="text-sm text-[#2d5570] font-semibold">النظام الآلي يراقب جميع المصادر ويسحب المحتوى دورياً</span>
        </div>
      )}

      {/* Sources Grid */}
      {sources.length === 0 ? (
        <EmptyState icon={Rss} title="لا توجد مصادر" description="لم يتم العثور على أي مصادر محتوى في النظام." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sources.map((source: any) => (
            <div
              key={source.id}
              className="bg-white rounded-2xl p-5 border border-[#e2e8f0] hover:border-[#4A7C9E]/30 hover:shadow-md transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-28 h-28 bg-[#4A7C9E]/4 blur-2xl rounded-full -mr-14 -mt-14" />

              <div className="flex items-start justify-between mb-4 relative z-10">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  source.is_active ? 'bg-[#3d6a8a]/10' : 'bg-gray-100'
                }`}>
                  <Rss size={18} className={source.is_active ? 'text-[#3d6a8a]' : 'text-gray-400'} />
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                  source.is_active
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-gray-100 text-gray-500 border-gray-200'
                }`}>
                  {source.is_active ? 'نشط' : 'متوقف'}
                </span>
              </div>

              <h4 className={`font-bold text-sm mb-1 transition-colors ${
                source.is_active ? 'text-[#1e293b] group-hover:text-[#3d6a8a]' : 'text-[#94a3b8]'
              }`}>
                {source.name}
              </h4>
              <p className="text-[11px] text-[#94a3b8] font-mono mb-4 truncate">{source.url || source.rss_url || '—'}</p>

              <div className="space-y-2.5 pt-4 border-t border-[#f1f5f9]">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-[#94a3b8]">النوع</span>
                  <span className="text-[11px] font-bold text-[#64748b] bg-[#f8fafc] px-2 py-0.5 rounded-lg border border-[#e2e8f0]">
                    {source.type || 'RSS'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-[#94a3b8] flex items-center gap-1">
                    <Clock size={10} />
                    آخر سحب
                  </span>
                  <div className="flex items-center gap-1.5">
                    {source.is_recently_fetched && (
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    )}
                    <span className={`text-[11px] font-mono ${
                      source.last_fetched_at ? 'text-[#64748b]' : 'text-[#94a3b8] italic'
                    }`}>
                      {source.last_fetched_formatted || 'لم يسحب بعد'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
