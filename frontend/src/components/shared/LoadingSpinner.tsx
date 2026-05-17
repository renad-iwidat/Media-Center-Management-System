export function LoadingSpinner({ text }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-[#e2e8f0]" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#FF9F4A] animate-spin" />
        <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-[#3d6a8a] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
      </div>
      <p className="text-sm text-[#94a3b8] font-medium">{text || 'جاري التحميل...'}</p>
    </div>
  );
}
