import Link from 'next/link'
export default function NotFound() {
  return (
    <div className="min-h-screen bg-c-bg flex flex-col items-center justify-center gap-4">
      <p className="font-mono text-[11px] text-c-faint uppercase tracking-[0.14em]">404</p>
      <h1 className="text-2xl font-serif italic text-c-text">Page not found</h1>
      <Link href="/dashboard" className="text-c-purple text-[13px] hover:underline">
        Go to dashboard →
      </Link>
    </div>
  )
}
