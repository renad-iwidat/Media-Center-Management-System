export function EmptyState({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="bg-white rounded-2xl border border-e2e8f0 shadow-md p-8 text-center py-20">
      <div className="w-20 h-20 bg-f1f5f9 rounded-full flex items-center justify-center mx-auto mb-6">
        <Icon size={40} className="text-[#64748b]" />
      </div>
      <h3 className="text-xl font-bold mb-2 text-[#1e293b]">{title}</h3>
      <p className="text-[#64748b] max-w-sm mx-auto">{description}</p>
    </div>
  );
}
