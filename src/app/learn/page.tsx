'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { SessionTask, Explanation, SessionPhase, TaskReason } from '@/types'
import { QuestionCard }     from '@/components/learning/QuestionCard'
import { FeedbackBanner }   from '@/components/learning/FeedbackBanner'
import { ExplanationPanel } from '@/components/learning/ExplanationPanel'
import { MotivationBanner } from '@/components/learning/MotivationBanner'
import { Spinner }          from '@/components/ui/Spinner'
import { Navbar }           from '@/components/layout/Navbar'
import { useAnalytics }     from '@/hooks/useAnalytics'

// ─── Reason pill config ───────────────────────────────────────────────────────

const REASON_CONFIG: Record<TaskReason, { label: string; icon: string; color: string }> = {
  review_due:       { label: 'Review due',        icon: '↻', color: 'var(--yellow)' },
  confidence_boost: { label: 'Confidence boost',  icon: '↑', color: 'var(--blue)' },
  weak_area:        { label: 'Weak area',          icon: '⬡', color: 'var(--purple)' },
  varied_practice:  { label: 'Varied practice',   icon: '⇄', color: 'var(--green)' },
}

function ReasonPill({ reason, pKnow }: { reason: TaskReason; pKnow: number }) {
  const cfg = REASON_CONFIG[reason]
  if (!cfg) return null
  const pct = Math.round(pKnow * 100)
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border"
      style={{ color: cfg.color, borderColor: cfg.color + '35', background: cfg.color + '12' }}
      title={`Why this? ${cfg.label}${reason === 'weak_area' ? ` (${pct}% mastered)` : ''}`}
    >
      <span>{cfg.icon}</span>
      <span>{cfg.label}{reason === 'weak_area' ? ` · ${pct}%` : ''}</span>
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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
  const [showReason,    setShowReason]    = useState(false)

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load next question
  const loadNext = useCallback(async (sid: string) => {
    setPhase('loading')
    setShowReason(false)
    const r = await fetch('/api/session', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'next', session_id: sid,
        seen_skills: seenSkills, seen_question_ids: seenQuestions,
      }),
    })
    const d = await r.json()
    if (d.done || !d.task) {
      setPhase('summary'); track({ name: 'session_end' }); return
    }
    setTask(d.task); setPhase('question')
    setSelected(null); setFillAnswer(''); setFeedback(null); setExplanation(null)
  }, [seenSkills, seenQuestions, track])

  useEffect(() => {
    if (sessionId) loadNext(sessionId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

    setPhase('revealing')

    if (d.correct) {
      try {
        const er = await fetch(`/api/explanation?skill_id=${task.skill_id}&attempt_id=${d.attempt_id}`)
        const ed = await er.json()
        if (ed.explanation) setExplanation(ed.explanation)
      } catch { /* explanation not required */ }
    }
  }

  async function nextQuestion() {
    if (sessionId) loadNext(sessionId)
  }

  const isRevealed = ['revealing','explanation','build_task','explain_back'].includes(phase)

  // ── Summary screen ────────────────────────────────────────────────────────
  if (phase === 'summary') {
    const accuracy = sessionStats.total > 0
      ? Math.round(sessionStats.correct / sessionStats.total * 100) : 0
    return (
      <div className="min-h-screen bg-c-bg">
        <Navbar />
        <div className="max-w-lg mx-auto px-8 py-20 text-center animate-slide-up">
          <p className="font-mono text-[11px] text-c-faint uppercase tracking-[0.14em] mb-4">
            Session complete
          </p>
          <h1 className="font-serif italic text-[44px] text-c-text mb-2">{accuracy}%</h1>
          <p className="text-[14px] text-c-muted mb-8">
            {sessionStats.correct} of {sessionStats.total} correct
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setSessionStats({ correct: 0, total: 0 })
                setSeenSkills([]); setSeenQuestions([])
                fetch('/api/session', {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'start' }),
                }).then(r => r.json()).then(d => {
                  if (d.session_id) { setSessionId(d.session_id); loadNext(d.session_id) }
                })
              }}
              className="px-6 py-3 rounded-xl bg-c-purple hover:bg-[var(--purple-hover)] text-white text-[14px] font-medium transition-all"
            >
              Keep studying →
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 rounded-xl border border-[var(--border)] text-c-muted hover:text-c-text text-[14px] transition-all"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'loading' || !task) return (
    <div className="min-h-screen bg-c-bg"><Navbar /><Spinner label="Selecting next skill…" /></div>
  )

  // ── Active question screen ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-c-bg">
      <Navbar />
      <div className="max-w-2xl mx-auto px-8 py-10">

        {/* ── Skill context bar ───────────────────────────────────────── */}
        <div className="mb-6 animate-slide-up">
          <div className="flex items-center flex-wrap gap-2 mb-2">
            {/* Skill name */}
            <span className="font-mono text-[11px] text-c-muted uppercase tracking-[0.12em]">
              {task.skill_label}
            </span>
            <span className="text-c-ghost text-[10px]">·</span>
            {/* Difficulty tier */}
            <span className="font-mono text-[10px] text-c-faint uppercase tracking-[0.08em]">
              {task.difficulty_tier}
            </span>
            {/* Why this question pill */}
            {task.reason && (
              <ReasonPill reason={task.reason} pKnow={task.p_know} />
            )}
          </div>

          {/* Motivation banner */}
          {motivation !== 'neutral' && <MotivationBanner state={motivation} />}

          {/* Skill intuition */}
          <p className="text-[11px] text-c-faint italic leading-relaxed">{task.skill_intuition}</p>
        </div>

        {/* ── Question card ───────────────────────────────────────────── */}
        <div className="p-6 rounded-2xl bg-c-bg2 border border-[var(--border)] mb-4 animate-slide-up">
          <QuestionCard
            question={task.question}
            selected={selected}
            fillAnswer={fillAnswer}
            revealed={isRevealed}
            onSelect={setSelected}
            onFillChange={setFillAnswer}
          />
        </div>

        {/* ── Feedback banner ─────────────────────────────────────────── */}
        {feedback && isRevealed && (
          <div className="mb-4 animate-slide-up">
            <FeedbackBanner correct={feedback.correct} explanation_after={feedback.explanation_after} />
          </div>
        )}

        {/* ── Explanation panel ────────────────────────────────────────── */}
        {(phase === 'explanation' || phase === 'build_task' || phase === 'explain_back') && explanation && (
          <div className="mb-4 animate-slide-up">
            <ExplanationPanel
              explanation={explanation}
              onExplainBack={(text) => {
                fetch('/api/attempt', {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    question_id: `${task.question.id}_explain_back`, skill_id: task.skill_id,
                    session_id: sessionId, latency_ms: 5000, client_answer: text,
                    correct: true, difficulty_tier: 'same', question_format: 'explain',
                  }),
                })
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

        {/* ── Action buttons ──────────────────────────────────────────── */}
        <div className="animate-slide-up">
          {phase === 'question' && (
            <button
              onClick={submit}
              disabled={!selected && !fillAnswer.trim() && task.question.format !== 'explain'}
              className="w-full py-3.5 rounded-xl bg-c-purple hover:bg-[var(--purple-hover)] text-white text-[14px] font-medium transition-all hover:scale-[1.01] disabled:opacity-40"
            >
              Submit
            </button>
          )}
          {isRevealed && (
            <div className="space-y-2">
              {feedback?.correct && phase === 'revealing' && explanation && (
                <button
                  onClick={() => setPhase('explanation')}
                  className="w-full py-3 rounded-xl border border-c-purple/30 bg-c-purple/[0.06] text-c-purple text-[13px] hover:bg-c-purple/10 transition-all"
                >
                  See explanation →
                </button>
              )}
              <button
                onClick={nextQuestion}
                className="w-full py-3.5 rounded-xl bg-c-bg3 border border-[var(--border)] text-c-muted hover:text-c-text text-[14px] transition-all"
              >
                Next question →
              </button>
            </div>
          )}
        </div>

        {/* Session counter */}
        <p className="text-center text-[11px] text-c-ghost mt-4 font-mono">
          {sessionStats.correct}/{sessionStats.total} correct this session
          {' · '}
          <button
            className="underline underline-offset-2 hover:text-c-faint transition-colors"
            onClick={() => router.push('/dashboard')}
          >
            end session
          </button>
        </p>
      </div>
    </div>
  )
}
