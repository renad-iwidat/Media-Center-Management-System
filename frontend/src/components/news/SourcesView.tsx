import { useState, useEffect, useCallback } from "react";
import { Rss, Clock, CheckCircle2, Wifi, Globe, ExternalLink, RefreshCw, Building2, ChevronDown, ChevronRight, AlertTriangle, Loader2, Link2 } from "lucide-react";
import { api } from "../../services/api";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { EmptyState } from "../shared/EmptyState";
import { Notification, NotificationData } from "../shared/Notification";

// ─── Types ────────────────────────────────────────────────────────────────────
interface NewsDeskSource {
  id: number;
  slug: string;
  name: string;
  base_url: string;
  source_type_slug: string;
  is_active: boolean;
  schedule_cron: string;
  country: string;
  language: string;
}

interface NewsDeskMediaUnit {
  id: number;
  slug: string;
  name: string;
  description?: string;
  logo_url?: string;
  country?: string;
  language?: string;
  is_active: boolean;
  sources_count?: number;
  sources?: Array<{
    source_slug: string;
    source_name: string;
    source_url: string;
    source_is_active: boolean;
    priority: number;
  }>;
}

interface LocalSource {
  id: number;
  name: string;
  slug?: string;
  url: string;
  source_type_name?: string;
  is_active: boolean;
  last_fetched_at?: string | null;
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function formatLastFetched(dateString: string | null | undefined): string | null {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
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
    return date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return null; }
}

function isRecentlyFetched(dateString: string | null | undefined): boolean {
  if (!dateString) return false;
  try {
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && (new Date().getTime() - date.getTime()) < 3600000;
  } catch { return false; }
}

// ─── Component ────────────────────────────────────────────────────────────────
export function SourcesView({ autoEnabled }: { autoEnabled: boolean }) {
  const [activeTab, setActiveTab] = useState<'media-units' | 'sources'>('media-units');

  // بيانات من الـ API الخارجي
  const [newsDeskMediaUnits, setNewsDeskMediaUnits] = useState<NewsDeskMediaUnit[]>([]);
  const [newsDeskSources, setNewsDeskSources] = useState<NewsDeskSource[]>([]);
  const [loadingExternal, setLoadingExternal] = useState(true);

  // بيانات من الداتابيس المحلي
  const [localSources, setLocalSources] = useState<LocalSource[]>([]);
  const [loadingLocal, setLoadingLocal] = useState(true);

  // حالة المزامنة
  const [isSyncing, setIsSyncing] = useState(false);
  const [notification, setNotification] = useState<NotificationData | null>(null);

  // توسيع/طي الوحدات الإعلامية
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());

  // إحصائيات الـ NewsDesk
  const [newsDeskStats, setNewsDeskStats] = useState<any>(null);

  // تحميل البيانات من الـ API الخارجي
  const loadExternalData = useCallback(async () => {
    setLoadingExternal(true);
    try {
      const [unitsRes, sourcesRes, statsRes] = await Promise.allSettled([
        api.getNewsDeskMediaUnits(false),
        api.getNewsDeskSources(false),
        api.getNewsDeskAdminStats().catch(() => null),
      ]);

      if (unitsRes.status === 'fulfilled') {
        const units = unitsRes.value?.data || unitsRes.value || [];
        setNewsDeskMediaUnits(Array.isArray(units) ? units : []);
      }
      if (sourcesRes.status === 'fulfilled') {
        const sources = sourcesRes.value?.data || sourcesRes.value || [];
        setNewsDeskSources(Array.isArray(sources) ? sources : []);
      }
      if (statsRes.status === 'fulfilled' && statsRes.value) {
        setNewsDeskStats(statsRes.value?.data || null);
      }
    } catch (err) {
      console.error('فشل تحميل بيانات NewsDesk:', err);
    } finally {
      setLoadingExternal(false);
    }
  }, []);

  // تحميل المصادر المحلية
  const loadLocalSources = useCallback(async () => {
    setLoadingLocal(true);
    try {
      const res = await api.getSources();
      const sources = (res.data || []).map((s: any) => ({
        ...s,
        last_fetched_formatted: formatLastFetched(s.last_fetched_at),
        is_recently_fetched: isRecentlyFetched(s.last_fetched_at),
      }));
      setLocalSources(sources.filter((s: any) => s.is_active));
    } catch { setLocalSources([]); }
    finally { setLoadingLocal(false); }
  }, []);

  useEffect(() => {
    loadExternalData();
    loadLocalSources();
  }, [loadExternalData, loadLocalSources]);

  // مزامنة من الـ API الخارجي إلى الداتابيس المحلي
  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      const res = await api.syncAllFromNewsDesk();
      setNotification({
        type: 'success',
        message: `✅ ${res.message || 'تمت المزامنة بنجاح'}`,
      });
      await loadLocalSources();
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: `❌ ${err?.message || 'فشلت المزامنة'}`,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleUnit = (slug: string) => {
    setExpandedUnits(prev => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const loading = loadingExternal && loadingLocal;
  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Notification notification={notification} onClose={() => setNotification(null)} position="center" />

      <div className="space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Rss size={20} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1e293b]">مصادر المحتوى</h2>
              <p className="text-xs text-[#64748b]">
                {newsDeskMediaUnits.length} وحدة إعلامية · {newsDeskSources.length} مصدر خارجي · {localSources.length} مصدر محلي
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
              onClick={() => { loadExternalData(); loadLocalSources(); }}
              disabled={loadingExternal}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#e2e8f0] rounded-xl text-xs font-semibold text-[#64748b] transition-all"
            >
              <RefreshCw size={13} className={loadingExternal ? 'animate-spin' : ''} />
              تحديث
            </button>
            <button
              onClick={handleSyncAll}
              disabled={isSyncing}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#3d6a8a] hover:bg-[#2d5570] text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
            >
              {isSyncing ? <Loader2 size={13} className="animate-spin" /> : <Link2 size={13} />}
              مزامنة مع الداتابيس
            </button>
          </div>
        </div>

        {/* NewsDesk Stats Bar */}
        {newsDeskStats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'المصادر الكلية', value: newsDeskStats.sources?.total ?? '—', color: 'text-[#3d6a8a]', bg: 'bg-[#f0f4f8]' },
              { label: 'المصادر النشطة', value: newsDeskStats.sources?.active ?? '—', color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'المقالات المعالجة', value: newsDeskStats.articles?.processed ?? '—', color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'في انتظار التصنيف', value: newsDeskStats.articles?.pending_classification ?? '—', color: 'text-amber-600', bg: 'bg-amber-50' },
            ].map(stat => (
              <div key={stat.label} className={`${stat.bg} rounded-xl border border-[#e2e8f0] p-3 text-center`}>
                <p className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
                <p className="text-[10px] text-[#64748b] mt-0.5 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-1 w-fit">
          {[
            { id: 'media-units' as const, label: 'الوحدات الإعلامية', icon: Building2, count: newsDeskMediaUnits.length },
            { id: 'sources' as const, label: 'المصادر', icon: Rss, count: newsDeskSources.length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-[#1e293b] shadow-sm border border-[#e2e8f0]'
                  : 'text-[#64748b] hover:text-[#1e293b]'
              }`}
            >
              <tab.icon size={13} />
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                activeTab === tab.id ? 'bg-[#3d6a8a] text-white' : 'bg-[#e2e8f0] text-[#64748b]'
              }`}>{tab.count}</span>
            </button>
          ))}
        </div>

        {/* ══ Tab: Media Units ══ */}
        {activeTab === 'media-units' && (
          <div className="space-y-3">
            {loadingExternal ? (
              <LoadingSpinner />
            ) : newsDeskMediaUnits.length === 0 ? (
              <EmptyState icon={Building2} title="لا توجد وحدات إعلامية" description="تعذر الاتصال بـ NewsDesk API أو لا توجد وحدات." />
            ) : (
              newsDeskMediaUnits.map((unit) => {
                const isExpanded = expandedUnits.has(unit.slug);
                const unitSources = unit.sources || [];
                const activeSources = unitSources.filter(s => s.source_is_active);

                return (
                  <div key={unit.slug} className="bg-white border border-[#e2e8f0] rounded-2xl shadow-sm overflow-hidden">
                    {/* Unit Header */}
                    <button
                      onClick={() => toggleUnit(unit.slug)}
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#f8fafc] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 bg-[#3d6a8a]/10 rounded-xl flex items-center justify-center shrink-0">
                          <Building2 size={16} className="text-[#3d6a8a]" />
                        </div>
                        <div className="text-right min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-[#1e293b] truncate">{unit.name}</h3>
                            {!unit.is_active && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-600 border border-rose-200 shrink-0">
                                متوقف
                              </span>
                            )}
                            {unit.is_active && (
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0 animate-pulse" />
                            )}
                          </div>
                          <p className="text-[10px] text-[#94a3b8] font-mono">{unit.slug}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[#64748b] font-medium">
                            {activeSources.length}/{unitSources.length} مصدر
                          </span>
                          <div className="flex gap-1">
                            {unitSources.slice(0, 4).map((_, i) => (
                              <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < activeSources.length ? 'bg-emerald-400' : 'bg-[#e2e8f0]'}`} />
                            ))}
                          </div>
                        </div>
                        {isExpanded ? <ChevronDown size={16} className="text-[#94a3b8]" /> : <ChevronRight size={16} className="text-[#94a3b8]" />}
                      </div>
                    </button>

                    {/* Unit Sources (expanded) */}
                    {isExpanded && (
                      <div className="border-t border-[#f1f5f9]">
                        {unitSources.length === 0 ? (
                          <div className="px-5 py-4 text-center text-xs text-[#94a3b8]">
                            لا توجد مصادر مرتبطة بهذه الوحدة
                          </div>
                        ) : (
                          <div className="divide-y divide-[#f8fafc]">
                            {unitSources.map((source, idx) => (
                              <div key={idx} className="flex items-center gap-3 px-5 py-3 hover:bg-[#f8fafc] transition-colors">
                                <div className={`w-2 h-2 rounded-full shrink-0 ${source.source_is_active ? 'bg-emerald-400' : 'bg-[#e2e8f0]'}`} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-[#1e293b] truncate">{source.source_name}</p>
                                  <p className="text-[10px] text-[#94a3b8] font-mono truncate flex items-center gap-1">
                                    <ExternalLink size={9} className="shrink-0" />
                                    {source.source_url || source.source_slug}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-[9px] font-medium text-[#94a3b8]">أولوية: {source.priority}</span>
                                  {!source.source_is_active && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-500 border border-rose-100">متوقف</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ══ Tab: Sources ══ */}
        {activeTab === 'sources' && (
          <div className="space-y-4">
            {/* NewsDesk External Sources */}
            {loadingExternal ? (
              <LoadingSpinner />
            ) : newsDeskSources.length === 0 ? (
              <EmptyState icon={Rss} title="لا توجد مصادر" description="تعذر الاتصال بـ NewsDesk API." />
            ) : (
              <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 py-3 border-b border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1e293b]">مصادر NewsDesk API</span>
                  <span className="text-[10px] text-[#94a3b8]">{newsDeskSources.filter(s => s.is_active).length} نشط من {newsDeskSources.length}</span>
                </div>
                <div className="divide-y divide-[#f1f5f9]">
                  {newsDeskSources.map((source) => (
                    <div key={source.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#f8fafc] transition-colors group">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${source.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-[#e2e8f0]'}`} />
                      <div className="w-8 h-8 bg-[#3d6a8a]/8 rounded-lg flex items-center justify-center shrink-0">
                        <Globe size={14} className="text-[#3d6a8a]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-[#1e293b] truncate">{source.name}</h4>
                          {source.language && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#f0f4f8] text-[#3d6a8a] border border-[#e2e8f0] shrink-0">
                              {source.language.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[#94a3b8] font-mono truncate flex items-center gap-1">
                          <ExternalLink size={9} className="shrink-0" />
                          {source.base_url}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 text-[10px] text-[#94a3b8]">
                        {source.schedule_cron && (
                          <span className="font-mono bg-[#f8fafc] border border-[#e2e8f0] px-2 py-0.5 rounded">{source.schedule_cron}</span>
                        )}
                        {source.country && <span>{source.country}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Local DB Sources */}
            {!loadingLocal && (
              <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 py-3 border-b border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#1e293b]">المصادر المحلية (الداتابيس)</span>
                    {localSources.length === 0 && (
                      <span className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                        <AlertTriangle size={10} />
                        يحتاج مزامنة
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#94a3b8]">{localSources.length} مصدر</span>
                </div>

                {localSources.length === 0 ? (
                  <div className="px-5 py-8 text-center space-y-3">
                    <AlertTriangle size={28} className="text-amber-400 mx-auto" />
                    <p className="text-sm font-semibold text-[#1e293b]">لا توجد مصادر في الداتابيس المحلي</p>
                    <p className="text-xs text-[#64748b]">اضغط "مزامنة مع الداتابيس" لاستيراد المصادر من NewsDesk API</p>
                    <button
                      onClick={handleSyncAll}
                      disabled={isSyncing}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#3d6a8a] hover:bg-[#2d5570] text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                    >
                      {isSyncing ? <Loader2 size={13} className="animate-spin" /> : <Link2 size={13} />}
                      مزامنة الآن
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-[#f1f5f9]">
                    {localSources.map((source) => (
                      <div key={source.id} className="grid grid-cols-[1fr_100px_130px] gap-4 px-5 py-3.5 hover:bg-[#f8fafc]/60 transition-colors group">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                            <CheckCircle2 size={14} className="text-emerald-500" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-semibold text-[#1e293b] truncate">{source.name}</h4>
                            {source.url && (
                              <p className="text-[10px] text-[#94a3b8] font-mono truncate flex items-center gap-1">
                                <ExternalLink size={9} className="shrink-0" />
                                {source.url}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-center">
                          <span className="text-[10px] font-medium text-[#64748b] bg-[#f1f5f9] px-2 py-0.5 rounded border border-[#e2e8f0]">
                            {(source as any).source_type_name || 'API'}
                          </span>
                        </div>
                        <div className="flex items-center justify-center gap-1">
                          {(source as any).is_recently_fetched && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />}
                          <Clock size={10} className="text-[#94a3b8]" />
                          <span className="text-[10px] text-[#64748b] font-mono">
                            {(source as any).last_fetched_formatted || 'لم يسحب'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </>
  );
}
