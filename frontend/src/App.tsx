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
  CheckCircle,
  Menu,
  X,
  ChevronRight,
  TrendingUp,
  Search,
  PenTool
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { api } from "./services/api.ts";
import { OverviewView } from "./components/OverviewView";
import { SourcesView } from "./components/SourcesView";
import { IncompleteView } from "./components/IncompleteView";
import { PoliciesView } from "./components/PoliciesView";
import { PublishedView } from "./components/PublishedView";
import { QueueView } from "./components/QueueView";

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
  const [activeView, setActiveView] = useState<ViewType>(() => {
    const saved = localStorage.getItem("activeView");
    return (saved as ViewType) || "overview";
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mediaUnits, setMediaUnits] = useState<MediaUnit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(() => {
    const saved = localStorage.getItem("selectedUnitId");
    return saved ? Number(saved) : null;
  });
  const [isSystemOnline, setIsSystemOnline] = useState(false);

  useEffect(() => {
    api.getMediaUnits()
      .then((res) => setMediaUnits(res.data || []))
      .catch(() => setMediaUnits([]));
  }, []);

  // حفظ الصفحة الحالية
  useEffect(() => {
    localStorage.setItem("activeView", activeView);
  }, [activeView]);

  // حفظ وحدة الإعلام المختارة
  useEffect(() => {
    if (selectedUnitId) {
      localStorage.setItem("selectedUnitId", String(selectedUnitId));
    } else {
      localStorage.removeItem("selectedUnitId");
    }
  }, [selectedUnitId]);

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
