import { useState, useEffect } from "react";
import { CheckCircle } from "lucide-react";
import { api } from "../services/api";
import { LoadingSpinner } from "./LoadingSpinner";
import { EmptyState } from "./EmptyState";

export function PublishedView({ unitId }: { unitId: number | null }) {
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
