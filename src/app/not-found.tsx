import Link from 'next/link'
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="font-mono text-[11px] text-[#5a5a72] uppercase tracking-[0.14em]">404</p>
      <h1 className="text-2xl font-serif italic text-[#e8e8f0]">Page not found</h1>
      <Link href="/dashboard" className="text-[#7c6eff] text-[13px] hover:underline">Go to dashboard →</Link>
    </div>
  )
}
