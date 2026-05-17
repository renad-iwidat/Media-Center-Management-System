export function StatCard({ label, value, icon: Icon, trend, variant = "default", subtitle }: {
  label: string;
  value: string | number;
  icon: any;
  trend?: string;
  variant?: "default" | "warning" | "success" | "error" | "info";
  subtitle?: string;
}) {
  const variantStyles = {
    default: { icon: 'bg-[#3d6a8a]/10 text-[#3d6a8a]', accent: 'bg-[#3d6a8a]', light: 'from-[#f0f4f8]' },
    warning: { icon: 'bg-amber-100 text-amber-600',    accent: 'bg-amber-500',  light: 'from-amber-50' },
    success: { icon: 'bg-emerald-100 text-emerald-600', accent: 'bg-emerald-500', light: 'from-emerald-50' },
    error:   { icon: 'bg-rose-100 text-rose-600',      accent: 'bg-rose-500',   light: 'from-rose-50' },
    info:    { icon: 'bg-sky-100 text-sky-600',         accent: 'bg-sky-500',    light: 'from-sky-50' },
  };

  const styles = variantStyles[variant] || variantStyles.default;

  return (
    <div className={`bg-gradient-to-br ${styles.light} to-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm hover:shadow-md transition-all group relative overflow-hidden`}>
      <div className="absolute bottom-0 left-0 w-20 h-20 bg-current opacity-[0.03] rounded-full -translate-x-8 translate-y-8 group-hover:opacity-[0.05] transition-opacity" />
      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-widest text-[#94a3b8] font-bold mb-2">{label}</p>
          <p className="text-3xl font-black text-[#1e293b] leading-none mb-1">{value}</p>
          {subtitle && <p className="text-xs text-[#64748b] mt-1">{subtitle}</p>}
          {trend && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg mt-2">
              {trend}
            </span>
          )}
        </div>
        <div className={`w-11 h-11 ${styles.icon} rounded-xl flex items-center justify-center shrink-0 shadow-sm`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}
