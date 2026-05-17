export function EmptyState({ icon: Icon, title, description, action }: {
  icon: any;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="bg-white rounded-3xl border-2 border-[#e2e8f0] p-12 text-center shadow-sm">
      <div className="w-24 h-24 bg-[#f0f4f8] rounded-3xl flex items-center justify-center mx-auto mb-6">
        <Icon size={44} className="text-[#94a3b8]" />
      </div>
      <h3 className="text-2xl font-bold text-[#1e293b] mb-3">{title}</h3>
      <p className="text-[#64748b] text-lg max-w-md mx-auto leading-relaxed">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="btn-primary mt-8"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
