export function StatCard({ label, value, icon: Icon, trend, variant = "default" }: {
  label: string; value: string | number; icon: any; trend?: string; variant?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-e2e8f0 shadow-md relative overflow-hidden group hover:shadow-lg hover:border-cbd5e1 transition-all">
      <div className="absolute top-0 right-0 w-24 h-24 bg-[#4A7C9E]/5 blur-3xl rounded-full -mr-12 -mt-12 group-hover:bg-[#4A7C9E]/10 transition-all" />
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-[#64748b] font-bold mb-2">{label}</p>
          <p className="text-3xl font-black text-[#1e293b]">{value}</p>
          {trend && <span className="text-[10px] text-emerald-700 font-bold mt-1 block">{trend}</span>}
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
          variant === "warning" ? "bg-amber-100 text-amber-600" :
          variant === "success" ? "bg-emerald-100 text-emerald-600" :
          "bg-[#f0f4f8] text-[#4A7C9E]"
        }`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}
