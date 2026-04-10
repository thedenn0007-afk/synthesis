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
  const [idx, setIdx]             = useState(0)
  const [selected, setSelected]   = useState<string | null>(null)
  const [fillAns, setFillAns]     = useState('')
  const [results, setResults]     = useState<any[]>([])
  const [started, setStarted]     = useState(false)
  const [done, setDone]           = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const startTime = useState(() => Date.now())[0]

  useEffect(() => {
    fetch('/api/diagnostic/questions').then(r => r.json()).then(d => setQuestions(d.questions ?? []))
  }, [])

  function submit() {
    const q       = questions[idx]
    const latency = Date.now() - startTime
    const answer  = q.format === 'mcq' ? selected : fillAns
    const newResults = [...results, {
      question_id: q.id, skill_id: q.skill_id, answer,
      latency_ms: latency, graph_placement_weight: q.graph_placement_weight,
    }]
    setResults(newResults)
    setSelected(null); setFillAns('')

    if (idx + 1 >= questions.length) {
      finishDiagnostic(newResults)
    } else {
      setIdx(i => i + 1)
    }
  }

  async function finishDiagnostic(finalResults: any[]) {
    setDone(true); setSubmitting(true)
    await fetch('/api/diagnostic', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ results: finalResults }),
    })
    setSubmitting(false)
    router.push('/dashboard')
  }

  if (questions.length === 0) return <Spinner label="Loading placement test…" />

  if (!started) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-8">
      <div className="max-w-lg w-full text-center animate-slide-up">
        <p className="font-mono text-[11px] text-[#5a5a72] uppercase tracking-[0.14em] mb-4">Placement test</p>
        <h1 className="font-serif italic text-[32px] text-[#e8e8f0] mb-4">Let's find your starting point</h1>
        <p className="text-[14px] text-[#9898b0] mb-8 leading-[1.7]">
          {questions.length} quick questions to calibrate where you are. No pressure — just answer honestly.
        </p>
        <button onClick={() => setStarted(true)} className="px-8 py-3 rounded-xl bg-[#7c6eff] hover:bg-[#6a5cdd] text-white text-[14px] font-medium transition-all hover:scale-[1.02]">
          Begin →
        </button>
      </div>
    </div>
  )

  if (done) return <Spinner label="Building your personalised curriculum…" />

  const q = questions[idx]
  const progress = ((idx) / questions.length) * 100

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-8">
      <div className="max-w-xl w-full animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <span className="font-mono text-[11px] text-[#5a5a72]">{idx + 1} of {questions.length}</span>
          <div className="flex-1 mx-4 h-1 bg-[#17171f] rounded-full overflow-hidden">
            <div className="h-full bg-[#7c6eff] rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <button onClick={() => finishDiagnostic(results)} className="font-mono text-[11px] text-[#5a5a72] hover:text-[#9898b0]">Skip all</button>
        </div>

        <div className="p-6 rounded-2xl bg-[#111118] border border-white/[0.07] mb-4">
          <p className="text-[15px] text-[#e8e8f0] leading-[1.65] mb-5">{q.stem || q.prompt}</p>

          {q.format === 'mcq' && q.options && (
            <div className="space-y-2.5">
              {q.options.map(opt => (
                <button key={opt.id} onClick={() => setSelected(opt.id)}
                  className={`w-full text-left px-5 py-3.5 rounded-xl border transition-all text-[13px] ${selected === opt.id ? 'border-[#7c6eff]/50 bg-[#7c6eff]/10 text-[#7c6eff]' : 'border-white/[0.08] bg-[#17171f] text-[#9898b0] hover:border-white/[0.16] hover:text-[#e8e8f0]'}`}>
                  <span className="font-mono text-[11px] mr-3 opacity-60">{opt.id.toUpperCase()}</span>{opt.text}
                </button>
              ))}
            </div>
          )}

          {q.format === 'fill' && (
            <input type="text" value={fillAns} onChange={e => setFillAns(e.target.value)}
              placeholder="Your answer…" autoFocus
              className="w-full px-4 py-3 rounded-xl bg-[#17171f] border border-white/[0.08] text-[#e8e8f0] text-[14px] focus:border-[#7c6eff]/50 focus:outline-none transition-colors" />
          )}
        </div>

        <button onClick={submit} disabled={!selected && !fillAns.trim()}
          className="w-full py-3 rounded-xl bg-[#7c6eff] hover:bg-[#6a5cdd] text-white text-[14px] font-medium transition-all hover:scale-[1.01] disabled:opacity-40">
          {idx + 1 < questions.length ? 'Next →' : 'Finish →'}
        </button>
      </div>
    </div>
  )
}
