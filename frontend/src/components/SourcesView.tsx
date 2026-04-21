import { useState, useEffect } from "react";
import { Rss } from "lucide-react";
import { api } from "../services/api";
import { LoadingSpinner } from "./LoadingSpinner";
import { EmptyState } from "./EmptyState";

export function SourcesView({ autoEnabled }: { autoEnabled: boolean }) {
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSourcesWithFetchInfo()
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
                  <div className="flex items-center gap-2">
                    {source.is_recently_fetched && (
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    )}
                    <span className="text-gray-300 font-mono text-right">
                      {source.last_fetched_formatted}
                    </span>
                  </div>
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
