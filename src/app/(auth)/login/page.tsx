'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true)
    const res = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || 'Login failed'); return }
    router.push('/dashboard')
  }

  const inputCls = 'w-full px-4 py-3 rounded-xl bg-c-bg2 border border-[var(--border)] text-c-text text-[14px] focus:border-c-purple/50 focus:outline-none focus:ring-1 focus:ring-c-purple/30 transition-colors'

  return (
    <div className="animate-slide-up">
      <div className="mb-8">
        <Link href="/" className="font-serif italic text-[20px] text-c-text">
          Synaptic<span className="text-c-purple">.</span>
        </Link>
        <p className="text-c-muted text-[13px] mt-2">Sign in to continue learning</p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        {error && (
          <p className="text-[12px] text-c-red bg-c-red/10 border border-c-red/20 rounded-lg px-4 py-3">
            {error}
          </p>
        )}
        {[
          { label: 'Email',    type: 'email',    val: email,    set: setEmail },
          { label: 'Password', type: 'password', val: password, set: setPassword },
        ].map(f => (
          <div key={f.label}>
            <label className="block text-[11px] font-mono text-c-faint uppercase tracking-[0.12em] mb-2">
              {f.label}
            </label>
            <input
              type={f.type} value={f.val} onChange={e => f.set(e.target.value)}
              required className={inputCls}
            />
          </div>
        ))}
        <button
          type="submit" disabled={loading}
          className="w-full py-3 rounded-xl bg-c-purple hover:bg-[var(--purple-hover)] text-white text-[14px] font-medium transition-all hover:scale-[1.01] disabled:opacity-60 mt-2"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-5 text-center text-[12px] text-c-faint">
        No account?{' '}
        <Link href="/signup" className="text-c-purple hover:underline">Create one →</Link>
      </p>
    </div>
  )
}
