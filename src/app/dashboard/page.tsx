import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/db/auth'
import { getLearnerProfile, getAllSkillStates, getReviewSchedules } from '@/lib/db/queries'
import { getAllNodes } from '@/lib/graph'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Navbar } from '@/components/layout/Navbar'
import type { LearnerSkillState } from '@/types'

const PHASE_LABELS: Record<string, string> = {
  phase_1_computer_basics:   'Phase 1 — Computer & Python Basics',
  phase_2_cs_data:           'Phase 2 — CS & Data Thinking',
  phase_3_intro_ai:          'Phase 3 — Intro to AI',
  phase_4_machine_learning:  'Phase 4 — Machine Learning',
  phase_5_deep_learning:     'Phase 5 — Deep Learning',
  phase_6_modern_ai:         'Phase 6 — Modern AI Systems',
  phase_7_real_world:        'Phase 7 — Real-World AI Products',
  phase_8_mastery:           'Phase 8 — Mastery & System Design',
}

// Semantic mastery colors — constant across light/dark (they are meaning-coded)
const MASTERY_COLOUR: Record<string, string> = {
  mastered: '#34d399',
  fragile:  '#fbbf24',
  learning: '#7c6eff',
  ready:    '#5a8a9f',
  blocked:  '#5a5a72',
}

export default async function Dashboard() {
  const cookieStore = cookies()
  const token = cookieStore.get('synaptic_token')?.value
  if (!token) redirect('/login')
  const user = verifyToken(token)
  if (!user) redirect('/login')

  const profile = getLearnerProfile(user.id)
  if (!profile) redirect('/login')
  if (!profile.diagnostic_done) redirect('/learn/diagnostic')

  const allStates  = getAllSkillStates(user.id)
  const schedules  = getReviewSchedules(user.id)
  const allNodes   = getAllNodes()

  const stateMap   = new Map(allStates.map(s => [s.skill_id, s]))
  const dueReviews = schedules.filter(s => new Date(s.due_at) <= new Date()).length
  const mastered   = allStates.filter(s => s.mastery_state === 'mastered').length
  const learning   = allStates.filter(s => ['learning', 'fragile'].includes(s.mastery_state)).length

  const phaseGroups = allNodes.reduce<Record<string, typeof allNodes>>((acc, node) => {
    if (!acc[node.phase]) acc[node.phase] = []
    acc[node.phase].push(node)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-c-bg">
      <Navbar />
      <div className="max-w-4xl mx-auto px-8 py-10">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-10 animate-slide-up">
          <div>
            <h1 className="font-serif italic text-[30px] text-c-text leading-none mb-2">
              {profile.display_name ? `Hi, ${profile.display_name}` : 'Dashboard'}
            </h1>
            <p className="text-[13px] text-c-faint font-mono">
              {dueReviews > 0
                ? `${dueReviews} review${dueReviews !== 1 ? 's' : ''} due`
                : 'No reviews due today'
              }{' '}
              · 🔥 {profile.streak_days} day streak
            </p>
          </div>
          <Link
            href="/learn"
            className="px-5 py-2.5 rounded-xl bg-c-purple hover:bg-[var(--purple-hover)] text-white text-[13px] font-medium transition-all hover:scale-[1.02] shadow-sm"
          >
            Study now →
          </Link>
        </div>

        {/* ── Stats ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { val: mastered,   lbl: 'Skills mastered',  col: '#34d399' },
            { val: learning,   lbl: 'Actively learning', col: '#7c6eff' },
            { val: dueReviews, lbl: 'Reviews due',       col: dueReviews > 0 ? '#fbbf24' : 'var(--text-faint)' },
          ].map((s, i) => (
            <div key={i} className="p-5 rounded-xl border border-[var(--border)] bg-c-bg2">
              <p className="font-serif text-[30px] leading-none mb-1.5" style={{ color: s.col }}>
                {s.val}
              </p>
              <p className="text-[11px] text-c-muted uppercase tracking-[0.1em] font-mono">{s.lbl}</p>
            </div>
          ))}
        </div>

        {/* ── Skills by phase ────────────────────────────────────────── */}
        <div className="space-y-5">
          {Object.entries(PHASE_LABELS).map(([phaseKey, phaseLabel]) => {
            const nodes = phaseGroups[phaseKey] ?? []
            if (nodes.length === 0) return null
            const hasContent = nodes.some(n => n.question_ids.length > 0)

            // Phase-level progress
            const phaseStates = nodes.map(n => stateMap.get(n.id))
            const phaseMastered = phaseStates.filter(s => s?.mastery_state === 'mastered').length
            const phasePct = nodes.length > 0 ? Math.round((phaseMastered / nodes.length) * 100) : 0

            return (
              <div
                key={phaseKey}
                className={`rounded-xl border overflow-hidden transition-opacity ${
                  hasContent ? 'border-[var(--border)]' : 'border-[var(--border)] opacity-40'
                }`}
              >
                {/* Phase header */}
                <div className="px-5 py-3 bg-c-bg2 border-b border-[var(--border)] flex items-center justify-between gap-4">
                  <p className="text-[13px] font-semibold text-c-text">{phaseLabel}</p>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {hasContent && (
                      <span className="text-[11px] font-mono text-c-muted">
                        {phaseMastered}/{nodes.length} mastered
                      </span>
                    )}
                    {!hasContent && (
                      <span className="font-mono text-[10px] text-c-faint">Coming soon</span>
                    )}
                  </div>
                </div>

                {/* Phase progress bar */}
                {hasContent && phasePct > 0 && (
                  <div className="h-0.5 bg-c-bg3">
                    <div
                      className="h-full bg-c-green transition-all duration-700"
                      style={{ width: `${phasePct}%` }}
                    />
                  </div>
                )}

                {/* Skills list */}
                <div className="divide-y divide-[var(--border)]">
                  {nodes.map(node => {
                    const state: LearnerSkillState | undefined = stateMap.get(node.id)
                    const pKnow   = state?.p_know ?? 0
                    const mastery = state?.mastery_state ?? 'blocked'
                    const colour  = MASTERY_COLOUR[mastery] ?? 'var(--text-ghost)'

                    return (
                      <div key={node.id} className="px-5 py-3 bg-c-bg4 hover:bg-c-bg3 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ background: colour }}
                            />
                            {/* Skill label — was #9898b0, now c-text for real readability */}
                            <span className="text-[13px] text-c-text font-medium truncate">
                              {node.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                            <span
                              className="font-mono text-[11px] capitalize"
                              style={{ color: colour }}
                            >
                              {mastery}
                            </span>
                            <span className="font-mono text-[11px] text-c-muted">
                              {Math.round(pKnow * 100)}%
                            </span>
                          </div>
                        </div>
                        <ProgressBar value={pKnow} max={1} color={colour} />
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Graph shortcut */}
        <div className="mt-8 text-center animate-fade-in">
          <Link
            href="/graph"
            className="inline-flex items-center gap-2 text-[12px] font-mono text-c-faint hover:text-c-muted transition-colors underline underline-offset-4"
          >
            View full skill graph →
          </Link>
        </div>

      </div>
    </div>
  )
}
