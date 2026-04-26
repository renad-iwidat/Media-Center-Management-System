export function EmptyState({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="bg-[#0b1224] rounded-3xl border border-white/5 shadow-2xl p-8 text-center py-20">
      <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
        <Icon size={40} className="text-gray-500" />
      </div>
      <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
      <p className="text-gray-500 max-w-sm mx-auto">{description}</p>
    </div>
  );
}
