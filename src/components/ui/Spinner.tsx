export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-c-purple/30 border-t-c-purple animate-spin" />
      <p className="text-[12px] text-c-faint font-mono">{label}</p>
    </div>
  )
}
