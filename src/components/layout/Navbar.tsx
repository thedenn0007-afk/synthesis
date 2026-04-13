'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function Navbar() {
  const pathname = usePathname()
  const router   = useRouter()
  const [isLight, setIsLight] = useState(false)

  // Sync with html class on mount
  useEffect(() => {
    setIsLight(document.documentElement.classList.contains('light'))
  }, [])

  function toggleTheme() {
    const next = !isLight
    setIsLight(next)
    if (next) {
      document.documentElement.classList.add('light')
      localStorage.setItem('synaptic-theme', 'light')
    } else {
      document.documentElement.classList.remove('light')
      localStorage.setItem('synaptic-theme', 'dark')
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const links = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/graph',     label: 'Graph' },
    { href: '/learn',     label: 'Study' },
    { href: '/profile',   label: 'Profile' },
  ]

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-8 py-4 border-b border-[var(--border)] bg-[var(--bg)]/90 backdrop-blur-xl transition-colors">
      <Link href="/dashboard" className="font-serif italic text-lg text-c-text hover:text-c-purple transition-colors">
        Synaptic<span className="text-c-purple">.</span>
      </Link>

      <nav className="flex items-center gap-1">
        {links.map(l => (
          <Link key={l.href} href={l.href}
            className={`px-3 py-1.5 rounded-lg text-[12px] transition-colors ${
              pathname.startsWith(l.href)
                ? 'text-c-text bg-[var(--border)]'
                : 'text-c-faint hover:text-c-muted'
            }`}>
            {l.label}
          </Link>
        ))}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
          className="ml-1 px-2.5 py-1.5 rounded-lg text-[13px] text-c-faint hover:text-c-muted transition-colors"
          title={isLight ? 'Dark mode' : 'Light mode'}
        >
          {isLight ? '○' : '◑'}
        </button>

        <button
          onClick={logout}
          className="ml-1 px-3 py-1.5 rounded-lg text-[12px] text-c-faint hover:text-c-muted transition-colors"
        >
          Logout
        </button>
      </nav>
    </header>
  )
}
