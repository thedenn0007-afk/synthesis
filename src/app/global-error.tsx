'use client'
export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body className="bg-c-bg text-c-text">
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <p className="font-mono text-[11px] text-c-red uppercase tracking-[0.14em]">Error</p>
          <h2 className="text-xl text-c-text">{error.message}</h2>
          <button
            onClick={reset}
            className="px-4 py-2 rounded-lg bg-c-purple/10 border border-c-purple/20 text-c-purple text-[12px]"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
