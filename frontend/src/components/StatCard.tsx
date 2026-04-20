export function StatCard({ label, value, icon: Icon, trend, variant = "default" }: {
  label: string; value: string | number; icon: any; trend?: string; variant?: string;
}) {
  return (
    <div className="bg-[#0b1224] rounded-3xl p-6 border border-white/5 shadow-2xl relative overflow-hidden group hover:border-white/10 transition-all">
      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 blur-3xl rounded-full -mr-12 -mt-12 group-hover:bg-blue-600/10 transition-all" />
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">{label}</p>
          <p className="text-3xl font-black text-white">{value}</p>
          {trend && <span className="text-[10px] text-emerald-400 font-bold mt-1 block">{trend}</span>}
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
          variant === "warning" ? "bg-amber-500/10 text-amber-400" :
          variant === "success" ? "bg-emerald-500/10 text-emerald-400" :
          "bg-blue-600/10 text-blue-400"
        }`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}
