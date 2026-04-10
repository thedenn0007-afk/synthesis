'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

export function Navbar() {
  const pathname = usePathname()
  const router   = useRouter()

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const links = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/learn',     label: 'Study' },
    { href: '/profile',   label: 'Profile' },
  ]

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-8 py-4 border-b border-white/[0.06] bg-[#0a0a0f]/90 backdrop-blur-xl">
      <Link href="/dashboard" className="font-serif italic text-lg text-[#e8e8f0] hover:text-[#7c6eff] transition-colors">
        Synaptic<span className="text-[#7c6eff]">.</span>
      </Link>
      <nav className="flex items-center gap-1">
        {links.map(l => (
          <Link key={l.href} href={l.href}
            className={`px-3 py-1.5 rounded-lg text-[12px] transition-colors ${pathname.startsWith(l.href) ? 'text-[#e8e8f0] bg-white/[0.06]' : 'text-[#5a5a72] hover:text-[#9898b0]'}`}>
            {l.label}
          </Link>
        ))}
        <button onClick={logout} className="ml-2 px-3 py-1.5 rounded-lg text-[12px] text-[#5a5a72] hover:text-[#9898b0] transition-colors">
          Logout
        </button>
      </nav>
    </header>
  )
}
