export function EmptyState({ icon: Icon, title, description, action }: {
  icon: any;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] p-12 text-center shadow-sm">
      <div className="w-20 h-20 bg-gradient-to-br from-[#f0f4f8] to-[#e2e8f0] rounded-2xl flex items-center justify-center mx-auto mb-5">
        <Icon size={36} className="text-[#94a3b8]" />
      </div>
      <h3 className="text-lg font-bold text-[#1e293b] mb-2">{title}</h3>
      <p className="text-[#64748b] text-sm max-w-sm mx-auto leading-relaxed">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-5 px-5 py-2.5 bg-gradient-to-r from-[#3d6a8a] to-[#2d5570] text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-[#3d6a8a]/20 transition-all hover:-translate-y-0.5"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
