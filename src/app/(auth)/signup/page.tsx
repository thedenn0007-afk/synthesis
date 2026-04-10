'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true)
    const res = await fetch('/api/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, display_name: name }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || 'Registration failed'); return }
    router.push('/learn/diagnostic')
  }

  return (
    <div className="animate-slide-up">
      <div className="mb-8">
        <Link href="/" className="font-serif italic text-[20px] text-[#e8e8f0]">
          Synaptic<span className="text-[#7c6eff]">.</span>
        </Link>
        <p className="text-[#9898b0] text-[13px] mt-2">Create your learning account</p>
      </div>
      <form onSubmit={submit} className="space-y-4">
        {error && <p className="text-[12px] text-[#f87171] bg-[#f87171]/10 border border-[#f87171]/20 rounded-lg px-4 py-3">{error}</p>}
        {[
          { label: 'Name', type: 'text', value: name, set: setName },
          { label: 'Email', type: 'email', value: email, set: setEmail },
          { label: 'Password (min 6 chars)', type: 'password', value: password, set: setPassword },
        ].map(f => (
          <div key={f.label}>
            <label className="block text-[11px] font-mono text-[#5a5a72] uppercase tracking-[0.12em] mb-2">{f.label}</label>
            <input type={f.type} value={f.value} onChange={e => f.set(e.target.value)} required
              className="w-full px-4 py-3 rounded-xl bg-[#111118] border border-white/[0.08] text-[#e8e8f0] text-[14px] focus:border-[#7c6eff]/50 focus:outline-none focus:ring-1 focus:ring-[#7c6eff]/30 transition-colors" />
          </div>
        ))}
        <button type="submit" disabled={loading}
          className="w-full py-3 rounded-xl bg-[#7c6eff] hover:bg-[#6a5cdd] text-white text-[14px] font-medium transition-all hover:scale-[1.01] disabled:opacity-60 mt-2">
          {loading ? 'Creating account…' : 'Start learning →'}
        </button>
      </form>
      <p className="mt-5 text-center text-[12px] text-[#5a5a72]">
        Have an account? <Link href="/login" className="text-[#7c6eff] hover:underline">Sign in →</Link>
      </p>
    </div>
  )
}
