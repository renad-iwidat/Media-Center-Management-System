export function LoadingSpinner({ text }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6" role="status" aria-live="polite">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-[#e2e8f0]" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#FF9F4A] animate-spin" />
        <div className="absolute inset-3 rounded-full border-4 border-transparent border-t-[#3d6a8a] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
      </div>
      <p className="text-lg text-[#1e293b] font-bold">{text || 'جاري التحميل...'}</p>
    </div>
  );
}
