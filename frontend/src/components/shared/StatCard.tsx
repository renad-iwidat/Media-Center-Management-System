export function StatCard({ label, value, icon: Icon, trend, variant = "default", subtitle }: {
  label: string;
  value: string | number;
  icon: any;
  trend?: string;
  variant?: "default" | "warning" | "success" | "error" | "info";
  subtitle?: string;
}) {
  const variantStyles = {
    default: { icon: 'bg-[#3d6a8a]/10 text-[#3d6a8a]', accent: 'bg-[#3d6a8a]', border: 'border-[#3d6a8a]/20' },
    warning: { icon: 'bg-amber-100 text-amber-600',    accent: 'bg-amber-500',  border: 'border-amber-200' },
    success: { icon: 'bg-emerald-100 text-emerald-600', accent: 'bg-emerald-500', border: 'border-emerald-200' },
    error:   { icon: 'bg-rose-100 text-rose-600',      accent: 'bg-rose-500',   border: 'border-rose-200' },
    info:    { icon: 'bg-sky-100 text-sky-600',         accent: 'bg-sky-500',    border: 'border-sky-200' },
  };

  const styles = variantStyles[variant] || variantStyles.default;

  return (
    <div className={`bg-white rounded-2xl p-6 border-2 ${styles.border} shadow-sm hover:shadow-md transition-all`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-[#64748b] mb-3">{label}</p>
          <p className="text-4xl font-black text-[#1e293b] leading-none mb-2">{value}</p>
          {subtitle && <p className="text-base text-[#64748b] mt-2">{subtitle}</p>}
          {trend && (
            <span className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 bg-emerald-50 border-2 border-emerald-200 px-3 py-1.5 rounded-xl mt-3">
              {trend}
            </span>
          )}
        </div>
        <div className={`w-14 h-14 ${styles.icon} rounded-2xl flex items-center justify-center shrink-0`}>
          <Icon size={28} />
        </div>
      </div>
    </div>
  );
}
