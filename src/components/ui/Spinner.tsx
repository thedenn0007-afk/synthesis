export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-[#7c6eff]/30 border-t-[#7c6eff] animate-spin" />
      <p className="text-[12px] text-[#5a5a72] font-mono">{label}</p>
    </div>
  )
}
