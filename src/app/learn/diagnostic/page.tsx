'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Spinner } from '@/components/ui/Spinner'

interface DiagQuestion {
  id: string; skill_id: string; format: string
  stem?: string; prompt?: string
  options?: { id: string; text: string }[]
  graph_placement_weight?: Record<string, number>
}

export default function DiagnosticPage() {
  const router = useRouter()
  const [questions, setQuestions] = useState<DiagQuestion[]>([])
  const [idx,       setIdx]       = useState(0)
  const [selected,  setSelected]  = useState<string | null>(null)
  const [fillAns,   setFillAns]   = useState('')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [results,   setResults]   = useState<any[]>([])
  const [started,   setStarted]   = useState(false)
  const [done,      setDone]      = useState(false)
  const startTime = useState(() => Date.now())[0]

  useEffect(() => {
    fetch('/api/diagnostic/questions')
      .then(r => r.json())
      .then(d => setQuestions(d.questions ?? []))
  }, [])

  function submit() {
    const q      = questions[idx]
    const answer = q.format === 'mcq' ? selected : fillAns
    const newResults = [...results, {
      question_id: q.id, skill_id: q.skill_id, answer,
      latency_ms: Date.now() - startTime,
      graph_placement_weight: q.graph_placement_weight,
    }]
    setResults(newResults)
    setSelected(null); setFillAns('')
    if (idx + 1 >= questions.length) finishDiagnostic(newResults)
    else setIdx(i => i + 1)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function finishDiagnostic(finalResults: any[]) {
    setDone(true)
    await fetch('/api/diagnostic', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ results: finalResults }),
    })
    router.push('/dashboard')
  }

  if (questions.length === 0) return <Spinner label="Loading placement test…" />

  // ── Intro screen ─────────────────────────────────────────────────────────
  if (!started) return (
    <div className="min-h-screen bg-c-bg flex items-center justify-center p-8">
      <div className="max-w-lg w-full text-center animate-slide-up">
        <p className="font-mono text-[11px] text-c-faint uppercase tracking-[0.14em] mb-4">
          Placement test
        </p>
        <h1 className="font-serif italic text-[32px] text-c-text mb-4">
          Let's find your starting point
        </h1>
        <p className="text-[14px] text-c-muted mb-8 leading-[1.7]">
          {questions.length} quick questions to calibrate where you are.
          No pressure — just answer honestly.
        </p>
        <button
          onClick={() => setStarted(true)}
          className="px-8 py-3 rounded-xl bg-c-purple hover:bg-[var(--purple-hover)] text-white text-[14px] font-medium transition-all hover:scale-[1.02]"
        >
          Begin →
        </button>
      </div>
    </div>
  )

  if (done) return <Spinner label="Building your personalised curriculum…" />

  const q        = questions[idx]
  const progress = (idx / questions.length) * 100

  // ── Question screen ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-c-bg flex items-center justify-center p-8">
      <div className="max-w-xl w-full animate-slide-up">

        {/* Progress bar */}
        <div className="flex items-center justify-between mb-6">
          <span className="font-mono text-[11px] text-c-faint">
            {idx + 1} of {questions.length}
          </span>
          <div className="flex-1 mx-4 h-1 bg-c-bg3 rounded-full overflow-hidden">
            <div
              className="h-full bg-c-purple rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <button
            onClick={() => finishDiagnostic(results)}
            className="font-mono text-[11px] text-c-faint hover:text-c-muted transition-colors"
          >
            Skip all
          </button>
        </div>

        {/* Question card */}
        <div className="p-6 rounded-2xl bg-c-bg2 border border-[var(--border)] mb-4">
          <p className="text-[15px] text-c-text leading-[1.65] mb-5">{q.stem || q.prompt}</p>

          {q.format === 'mcq' && q.options && (
            <div className="space-y-2.5">
              {q.options.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setSelected(opt.id)}
                  className={`w-full text-left px-5 py-3.5 rounded-xl border transition-all text-[13px] ${
                    selected === opt.id
                      ? 'border-c-purple/50 bg-c-purple/10 text-c-purple'
                      : 'border-[var(--border)] bg-c-bg3 text-c-muted hover:border-[var(--border-hi)] hover:text-c-text'
                  }`}
                >
                  <span className="font-mono text-[11px] mr-3 opacity-60">
                    {opt.id.toUpperCase()}
                  </span>
                  {opt.text}
                </button>
              ))}
            </div>
          )}

          {q.format === 'fill' && (
            <input
              type="text"
              value={fillAns}
              onChange={e => setFillAns(e.target.value)}
              placeholder="Your answer…"
              autoFocus
              className="w-full px-4 py-3 rounded-xl bg-c-bg3 border border-[var(--border)] text-c-text placeholder:text-c-ghost text-[14px] focus:border-c-purple/50 focus:outline-none transition-colors"
            />
          )}
        </div>

        <button
          onClick={submit}
          disabled={!selected && !fillAns.trim()}
          className="w-full py-3 rounded-xl bg-c-purple hover:bg-[var(--purple-hover)] text-white text-[14px] font-medium transition-all hover:scale-[1.01] disabled:opacity-40"
        >
          {idx + 1 < questions.length ? 'Next →' : 'Finish →'}
        </button>

      </div>
    </div>
  )
}
