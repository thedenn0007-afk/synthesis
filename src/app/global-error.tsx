'use client'
export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html><body className="bg-[#0a0a0f] text-[#e8e8f0]">
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="font-mono text-[11px] text-[#f87171] uppercase tracking-[0.14em]">Error</p>
        <h2 className="text-xl text-[#e8e8f0]">{error.message}</h2>
        <button onClick={reset} className="px-4 py-2 rounded-lg bg-[#7c6eff]/10 border border-[#7c6eff]/20 text-[#7c6eff] text-[12px]">Try again</button>
      </div>
    </body></html>
  )
}
