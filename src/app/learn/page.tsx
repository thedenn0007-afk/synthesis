'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { SessionTask, Explanation, SessionPhase } from '@/types'
import { QuestionCard }      from '@/components/learning/QuestionCard'
import { FeedbackBanner }    from '@/components/learning/FeedbackBanner'
import { ExplanationPanel }  from '@/components/learning/ExplanationPanel'
import { MotivationBanner }  from '@/components/learning/MotivationBanner'
import { Spinner }           from '@/components/ui/Spinner'
import { Navbar }            from '@/components/layout/Navbar'
import { useAnalytics }      from '@/hooks/useAnalytics'

export default function LearnPage() {
  const router = useRouter()
  const { track } = useAnalytics()

  const [sessionId,     setSessionId]     = useState<string | null>(null)
  const [task,          setTask]          = useState<SessionTask | null>(null)
  const [phase,         setPhase]         = useState<SessionPhase>('loading')
  const [selected,      setSelected]      = useState<string | null>(null)
  const [fillAnswer,    setFillAnswer]    = useState('')
  const [feedback,      setFeedback]      = useState<{ correct: boolean; explanation_after?: string } | null>(null)
  const [explanation,   setExplanation]   = useState<Explanation | null>(null)
  const [motivation,    setMotivation]    = useState<string>('neutral')
  const [seenSkills,    setSeenSkills]    = useState<string[]>([])
  const [seenQuestions, setSeenQuestions] = useState<string[]>([])
  const [sessionStats,  setSessionStats]  = useState({ correct: 0, total: 0 })

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (phase === 'question' && task?.question.format === 'mcq') {
        const idx = ['1','2','3','4'].indexOf(e.key)
        if (idx >= 0) { const opt = task.question.options?.[idx]; if (opt) setSelected(opt.id) }
      }
      if ((phase === 'revealing' || phase === 'explanation') && e.key === 'Enter') nextQuestion()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, task])

  // Start session
  useEffect(() => {
    async function start() {
      const r = await fetch('/api/session', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      })
      const d = await r.json()
      if (d.session_id) { setSessionId(d.session_id); track({ name: 'session_start' }) }
    }
    start()
  }, [])

  // Load next question
  const loadNext = useCallback(async (sid: string) => {
    setPhase('loading')
    const r = await fetch('/api/session', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'next', session_id: sid, seen_skills: seenSkills, seen_question_ids: seenQuestions }),
    })
    const d = await r.json()
    if (d.done || !d.task) {
      setPhase('summary'); track({ name: 'session_end' }); return
    }
    setTask(d.task); setPhase('question')
    setSelected(null); setFillAnswer(''); setFeedback(null); setExplanation(null)
  }, [seenSkills, seenQuestions])

  useEffect(() => {
    if (sessionId) loadNext(sessionId)
  }, [sessionId])

  async function submit() {
    if (!task || !sessionId) return
    const answer = task.question.format === 'mcq' ? selected : fillAnswer
    if (!answer && task.question.format !== 'explain') return

    const start = Date.now()
    const r = await fetch('/api/attempt', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question_id: task.question.id, skill_id: task.skill_id, session_id: sessionId,
        latency_ms: Date.now() - start, client_answer: answer,
        difficulty_tier: task.difficulty_tier, question_format: task.question.format,
      }),
    })
    const d = await r.json()
    setFeedback({ correct: d.correct, explanation_after: task.question.explanation_after })
    setMotivation(d.motivation ?? 'neutral')
    setSessionStats(s => ({ correct: s.correct + (d.correct ? 1 : 0), total: s.total + 1 }))
    setSeenSkills(s => [...s, task.skill_id])
    setSeenQuestions(s => [...s, task.question.id])
    track({ name: 'attempt_submit', props: { correct: d.correct, skill_id: task.skill_id } })

    if (d.correct) {
      setPhase('revealing')
      // Load explanation
      try {
        const er = await fetch(`/api/explanation?skill_id=${task.skill_id}&attempt_id=${d.attempt_id}`)
        const ed = await er.json()
        if (ed.explanation) setExplanation(ed.explanation)
      } catch { /* explanation not required */ }
    } else {
      setPhase('revealing')
    }
  }

  async function nextQuestion() {
    if (sessionId) loadNext(sessionId)
  }

  const isRevealed = ['revealing','explanation','build_task','explain_back'].includes(phase)

  // Summary
  if (phase === 'summary') {
    const accuracy = sessionStats.total > 0 ? Math.round(sessionStats.correct / sessionStats.total * 100) : 0
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        <Navbar />
        <div className="max-w-lg mx-auto px-8 py-20 text-center animate-slide-up">
          <p className="font-mono text-[11px] text-[#5a5a72] uppercase tracking-[0.14em] mb-4">Session complete</p>
          <h1 className="font-serif italic text-[40px] text-[#e8e8f0] mb-2">{accuracy}%</h1>
          <p className="text-[14px] text-[#9898b0] mb-8">{sessionStats.correct} of {sessionStats.total} correct</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setSessionStats({ correct: 0, total: 0 }); setSeenSkills([]); setSeenQuestions([]); fetch('/api/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'start'})}).then(r=>r.json()).then(d=>{if(d.session_id){setSessionId(d.session_id);loadNext(d.session_id)}}) }}
              className="px-6 py-3 rounded-xl bg-[#7c6eff] hover:bg-[#6a5cdd] text-white text-[14px] font-medium transition-all">
              Keep studying →
            </button>
            <button onClick={() => router.push('/dashboard')} className="px-6 py-3 rounded-xl border border-white/[0.1] text-[#9898b0] text-[14px] hover:text-[#e8e8f0] transition-all">
              Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'loading' || !task) return (
    <div className="min-h-screen bg-[#0a0a0f]"><Navbar /><Spinner label="Selecting next skill…" /></div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />
      <div className="max-w-2xl mx-auto px-8 py-10">
        {/* Skill context */}
        <div className="mb-6 animate-slide-up">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] text-[#5a5a72] uppercase tracking-[0.14em]">{task.skill_label}</span>
            <span className="font-mono text-[10px] text-[#3a3a50]">·</span>
            <span className="font-mono text-[10px] text-[#3a3a50] uppercase">{task.difficulty_tier}</span>
          </div>
          {motivation !== 'neutral' && <MotivationBanner state={motivation} />}
          <p className="text-[11px] text-[#5a5a72] italic">{task.skill_intuition}</p>
        </div>

        {/* Question */}
        <div className="p-6 rounded-2xl bg-[#111118] border border-white/[0.07] mb-4 animate-slide-up">
          <QuestionCard
            question={task.question} selected={selected} fillAnswer={fillAnswer}
            revealed={isRevealed} onSelect={setSelected} onFillChange={setFillAnswer}
          />
        </div>

        {/* Feedback */}
        {feedback && isRevealed && (
          <div className="mb-4 animate-slide-up">
            <FeedbackBanner correct={feedback.correct} explanation_after={feedback.explanation_after} />
          </div>
        )}

        {/* Explanation panel */}
        {(phase === 'explanation' || phase === 'build_task' || phase === 'explain_back') && explanation && (
          <div className="mb-4 animate-slide-up">
            <ExplanationPanel
              explanation={explanation}
              onExplainBack={(text) => {
                // Wire to DB — POST attempt with format=explain
                fetch('/api/attempt', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ question_id: `${task.question.id}_explain_back`, skill_id: task.skill_id, session_id: sessionId, latency_ms: 5000, client_answer: text, correct: true, difficulty_tier: 'same', question_format: 'explain' }) })
                track({ name: 'explanation_viewed', props: { skill_id: task.skill_id, depth: 'explain_back' } })
                setPhase('explain_back')
              }}
              onBuildTaskDone={() => {
                track({ name: 'explanation_viewed', props: { skill_id: task.skill_id, depth: 'build_task' } })
                setPhase('build_task')
              }}
            />
          </div>
        )}

        {/* Action buttons */}
        <div className="animate-slide-up">
          {phase === 'question' && (
            <button onClick={submit} disabled={!selected && !fillAnswer.trim() && task.question.format !== 'explain'}
              className="w-full py-3.5 rounded-xl bg-[#7c6eff] hover:bg-[#6a5cdd] text-white text-[14px] font-medium transition-all hover:scale-[1.01] disabled:opacity-40">
              Submit
            </button>
          )}
          {isRevealed && (
            <div className="space-y-2">
              {feedback?.correct && phase === 'revealing' && explanation && (
                <button onClick={() => setPhase('explanation')}
                  className="w-full py-3 rounded-xl border border-[#7c6eff]/30 bg-[#7c6eff]/[0.06] text-[#7c6eff] text-[13px] hover:bg-[#7c6eff]/10 transition-all">
                  See explanation →
                </button>
              )}
              <button onClick={nextQuestion}
                className="w-full py-3.5 rounded-xl bg-[#17171f] border border-white/[0.08] text-[#9898b0] hover:text-[#e8e8f0] text-[14px] transition-all">
                Next question →
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-[11px] text-[#3a3a50] mt-4 font-mono">
          {sessionStats.correct}/{sessionStats.total} correct this session
        </p>
      </div>
    </div>
  )
}
