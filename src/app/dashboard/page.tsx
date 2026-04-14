import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/db/auth'
import { getLearnerProfile, getAllSkillStates, getReviewSchedules } from '@/lib/db/queries'
import { getAllNodes, getAllEdges } from '@/lib/graph'
import { Navbar } from '@/components/layout/Navbar'
import type { LearnerSkillState, SkillNode } from '@/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const PHASE_ORDER = [
  'phase_1_computer_basics',
  'phase_2_cs_data',
  'phase_3_intro_ai',
  'phase_4_machine_learning',
  'phase_5_deep_learning',
  'phase_6_modern_ai',
  'phase_7_real_world',
  'phase_8_mastery',
]

const PHASE_LABELS: Record<string, string> = {
  phase_1_computer_basics:  'Phase 1 — Computer & Python Basics',
  phase_2_cs_data:          'Phase 2 — CS & Data Thinking',
  phase_3_intro_ai:         'Phase 3 — Intro to AI',
  phase_4_machine_learning: 'Phase 4 — Machine Learning',
  phase_5_deep_learning:    'Phase 5 — Deep Learning',
  phase_6_modern_ai:        'Phase 6 — Modern AI Systems',
  phase_7_real_world:       'Phase 7 — Real-World AI Products',
  phase_8_mastery:          'Phase 8 — Mastery & System Design',
}

const PHASE_SHORT: Record<string, string> = {
  phase_1_computer_basics:  'Basics',
  phase_2_cs_data:          'CS & Data',
  phase_3_intro_ai:         'Intro AI',
  phase_4_machine_learning: 'ML',
  phase_5_deep_learning:    'Deep Learning',
  phase_6_modern_ai:        'Modern AI',
  phase_7_real_world:       'Real-World',
  phase_8_mastery:          'Mastery',
}

const MASTERY_COLOUR: Record<string, string> = {
  mastered: '#34d399',
  fragile:  '#fbbf24',
  learning: '#7c6eff',
  ready:    '#5a8a9f',
  blocked:  '#3a3a52',
}

const MASTERY_RING: Record<string, string> = {
  mastered: 'ring-2 ring-[#34d399]/50',
  fragile:  'ring-2 ring-[#fbbf24]/50',
  learning: 'ring-2 ring-[#7c6eff]/50',
  ready:    'ring-1 ring-[#5a8a9f]/40',
  blocked:  'ring-1 ring-[#3a3a52]/30',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function phaseStats(nodes: SkillNode[], stateMap: Map<string, LearnerSkillState>) {
  const total     = nodes.length
  const mastered  = nodes.filter(n => stateMap.get(n.id)?.mastery_state === 'mastered').length
  const learning  = nodes.filter(n => ['learning','fragile'].includes(stateMap.get(n.id)?.mastery_state ?? '')).length
  const pct       = total > 0 ? Math.round((mastered / total) * 100) : 0
  const hasContent = nodes.some(n => n.question_ids.length > 0)
  return { total, mastered, learning, pct, hasContent }
}

/** Counts how many skills in the current set are NOT yet mastered but have questions. */
function skillsLeft(nodes: SkillNode[], stateMap: Map<string, LearnerSkillState>): number {
  return nodes.filter(n =>
    n.question_ids.length > 0 &&
    stateMap.get(n.id)?.mastery_state !== 'mastered',
  ).length
}

/** Find the first phase that isn't 100% mastered and has learnable skills. */
function findActivePhase(
  phaseGroups: Record<string, SkillNode[]>,
  stateMap: Map<string, LearnerSkillState>,
): string {
  for (const phase of PHASE_ORDER) {
    const nodes = phaseGroups[phase] ?? []
    if (nodes.length === 0) continue
    const stats = phaseStats(nodes, stateMap)
    if (stats.hasContent && stats.mastered < stats.total) return phase
  }
  // All content phases complete — return last active
  return PHASE_ORDER[PHASE_ORDER.length - 1]
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function Dashboard() {
  const cookieStore = cookies()
  const token = cookieStore.get('synaptic_token')?.value
  if (!token) redirect('/login')
  const user = verifyToken(token)
  if (!user) redirect('/login')

  const profile = getLearnerProfile(user.id)
  if (!profile) redirect('/login')
  if (!profile.diagnostic_done) redirect('/learn/diagnostic')

  const allStates = getAllSkillStates(user.id)
  const schedules = getReviewSchedules(user.id)
  const allNodes  = getAllNodes()
  const allEdges  = getAllEdges()

  const stateMap   = new Map(allStates.map(s => [s.skill_id, s]))
  const now        = new Date()
  const dueSchedules = schedules.filter(s => new Date(s.due_at) <= now && s.repetitions > 0)
  const dueReviews = dueSchedules.length

  // Top-5 most overdue skills for the widget
  const top5DueSkills = dueSchedules
    .sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime())
    .slice(0, 5)
    .map(s => {
      const node = allNodes.find(n => n.id === s.skill_id)
      const daysOverdue = Math.floor((now.getTime() - new Date(s.due_at).getTime()) / 86400000)
      return { id: s.skill_id, label: node?.label ?? s.skill_id, daysOverdue: Math.max(0, daysOverdue) }
    })
  const totalMastered  = allStates.filter(s => s.mastery_state === 'mastered').length
  const totalLearning  = allStates.filter(s => ['learning','fragile'].includes(s.mastery_state)).length

  const phaseGroups = allNodes.reduce<Record<string, SkillNode[]>>((acc, node) => {
    if (!acc[node.phase]) acc[node.phase] = []
    acc[node.phase].push(node)
    return acc
  }, {})

  const activePhase = findActivePhase(phaseGroups, stateMap)
  const activeNodes = phaseGroups[activePhase] ?? []
  const activeStats = phaseStats(activeNodes, stateMap)

  // Next phase label for the "X skills to unlock" banner
  const activePhaseIdx  = PHASE_ORDER.indexOf(activePhase)
  const nextPhaseKey    = PHASE_ORDER[activePhaseIdx + 1]
  const nextPhaseLabel  = nextPhaseKey ? PHASE_SHORT[nextPhaseKey] : null
  const skillsRemaining = skillsLeft(activeNodes, stateMap)

  // Hard-prereq edges: skill → skills it unlocks
  const unlocksMap = new Map<string, string[]>()
  for (const edge of allEdges) {
    if (edge.strength === 'hard') {
      const arr = unlocksMap.get(edge.from) ?? []
      arr.push(edge.to)
      unlocksMap.set(edge.from, arr)
    }
  }

  return (
    <div className="min-h-screen bg-c-bg">
      <Navbar />
      <div className="max-w-4xl mx-auto px-8 py-10">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-8 animate-slide-up">
          <div>
            <h1 className="font-serif italic text-[30px] text-c-text leading-none mb-2">
              {profile.display_name ? `Hi, ${profile.display_name}` : 'Your Journey'}
            </h1>
            <p className="text-[13px] text-c-faint font-mono">
              {dueReviews > 0
                ? `${dueReviews} review${dueReviews !== 1 ? 's' : ''} due`
                : 'No reviews due today'}{' '}
              · 🔥 {profile.streak_days} day streak
            </p>
          </div>
          <div className="flex items-center gap-2">
            {dueReviews > 0 && (
              <Link
                href="/learn?mode=review"
                className="px-5 py-2.5 rounded-xl border border-[#fbbf24]/40 text-[#fbbf24] hover:bg-[#fbbf24]/10 text-[13px] font-medium transition-all"
              >
                Review {dueReviews} due →
              </Link>
            )}
            <Link
              href="/learn"
              className="px-5 py-2.5 rounded-xl bg-c-purple hover:bg-[var(--purple-hover)] text-white text-[13px] font-medium transition-all hover:scale-[1.02] shadow-sm"
            >
              Study now →
            </Link>
          </div>
        </div>

        {/* ── Stats row ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { val: totalMastered, lbl: 'Skills mastered',   col: '#34d399' },
            { val: totalLearning, lbl: 'Actively learning',  col: '#7c6eff' },
            { val: dueReviews,    lbl: 'Reviews due',        col: dueReviews > 0 ? '#fbbf24' : 'var(--text-faint)' },
          ].map((s, i) => (
            <div key={i} className="p-5 rounded-xl border border-[var(--border)] bg-c-bg2">
              <p className="font-serif text-[30px] leading-none mb-1.5" style={{ color: s.col }}>
                {s.val}
              </p>
              <p className="text-[11px] text-c-muted uppercase tracking-[0.1em] font-mono">{s.lbl}</p>
            </div>
          ))}
        </div>

        {/* ── Due Reviews Widget ──────────────────────────────────────────── */}
        {dueReviews > 0 && (
          <div className="rounded-2xl border border-[#fbbf24]/30 bg-c-bg2 overflow-hidden mb-6 animate-slide-up">
            <div className="px-6 pt-4 pb-3 flex items-center justify-between">
              <p className="text-[13px] font-semibold text-c-text">
                {dueReviews} review{dueReviews !== 1 ? 's' : ''} due
              </p>
              <Link
                href="/learn?mode=review"
                className="text-[12px] font-mono text-[#fbbf24] hover:underline transition-colors"
              >
                Review all →
              </Link>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {top5DueSkills.map(skill => (
                <div key={skill.id} className="px-6 py-2.5 flex items-center justify-between">
                  <span className="text-[13px] text-c-text truncate mr-4">{skill.label}</span>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="text-[11px] font-mono text-[#fbbf24]">
                      {skill.daysOverdue === 0 ? 'due today' : `${skill.daysOverdue}d overdue`}
                    </span>
                    <Link
                      href={`/learn/skill/${skill.id}`}
                      className="px-2.5 py-0.5 rounded text-[10px] font-mono text-[#fbbf24] bg-[#fbbf24]/10 hover:bg-[#fbbf24]/20 border border-[#fbbf24]/20 transition-all"
                    >
                      Study →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Active Phase Journey ────────────────────────────────────────── */}
        <div className="rounded-2xl border border-[var(--border)] bg-c-bg2 overflow-hidden mb-6 animate-slide-up">

          {/* Phase header */}
          <div className="px-6 pt-5 pb-4">
            <div className="flex items-center justify-between mb-1">
              <p className="font-mono text-[10px] text-c-purple uppercase tracking-[0.16em]">
                Active phase
              </p>
              <span className="font-mono text-[11px] text-c-muted">
                {activeStats.mastered}/{activeStats.total} mastered
              </span>
            </div>
            <h2 className="text-[17px] font-semibold text-c-text mb-3">
              {PHASE_LABELS[activePhase]}
            </h2>

            {/* Phase progress bar */}
            <div className="h-1.5 rounded-full bg-c-bg3 overflow-hidden mb-3">
              <div
                className="h-full rounded-full bg-c-purple transition-all duration-700"
                style={{ width: `${activeStats.pct}%` }}
              />
            </div>

            {/* "X skills left" hint */}
            {skillsRemaining > 0 && nextPhaseLabel && (
              <p className="text-[11px] text-c-faint font-mono">
                {skillsRemaining} skill{skillsRemaining !== 1 ? 's' : ''} left to unlock <span className="text-c-muted">{nextPhaseLabel}</span>
              </p>
            )}
            {skillsRemaining === 0 && nextPhaseLabel && (
              <p className="text-[11px] text-c-green font-mono">
                Phase complete — {nextPhaseLabel} is unlocked! →
              </p>
            )}
          </div>

          {/* ── Skill path row ──────────────────────────────────────────── */}
          <div className="px-4 pb-5 overflow-x-auto">
            <div className="flex items-start gap-0 min-w-max">
              {activeNodes.map((node, idx) => {
                const state   = stateMap.get(node.id)
                const mastery = state?.mastery_state ?? 'blocked'
                const pKnow   = state?.p_know ?? 0
                const pct     = Math.round(pKnow * 100)
                const colour  = MASTERY_COLOUR[mastery] ?? '#3a3a52'
                const ring    = MASTERY_RING[mastery] ?? ''
                const isLast  = idx === activeNodes.length - 1
                const isStudiable = ['ready','learning','fragile','mastered'].includes(mastery) && node.question_ids.length > 0

                return (
                  <div key={node.id} className="flex items-center">
                    {/* Node */}
                    <div className="flex flex-col items-center w-[88px]">
                      {/* Circle */}
                      <Link
                        href={isStudiable ? `/learn/skill/${node.id}` : '#'}
                        className={`relative w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${ring} ${
                          isStudiable
                            ? 'hover:scale-110 cursor-pointer'
                            : 'opacity-50 cursor-default'
                        }`}
                        style={{ background: colour + '22', border: `2px solid ${colour}` }}
                        title={isStudiable ? `Study: ${node.label}` : `Blocked: prerequisites needed`}
                      >
                        {mastery === 'mastered' ? (
                          <span className="text-[16px]">✓</span>
                        ) : (
                          <span className="font-mono text-[11px] font-bold" style={{ color: colour }}>
                            {pct}%
                          </span>
                        )}
                      </Link>

                      {/* Label */}
                      <p
                        className="text-[10px] text-center leading-tight font-mono px-1"
                        style={{ color: mastery === 'blocked' ? 'var(--text-ghost)' : 'var(--text-muted)' }}
                      >
                        {node.label}
                      </p>

                      {/* Mastery dot */}
                      <div
                        className="w-1.5 h-1.5 rounded-full mt-1.5"
                        style={{ background: colour }}
                      />
                    </div>

                    {/* Connector line */}
                    {!isLast && (
                      <div className="w-6 h-px flex-shrink-0 mt-[-28px]" style={{ background: 'var(--border)' }} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* CTA bar */}
          <div className="px-6 py-3 border-t border-[var(--border)] bg-c-bg3 flex items-center justify-between">
            <p className="text-[12px] text-c-faint font-mono">
              Click any skill to dive in, or let the engine pick for you
            </p>
            <Link
              href="/learn"
              className="px-4 py-1.5 rounded-lg bg-c-purple hover:bg-[var(--purple-hover)] text-white text-[12px] font-medium transition-all"
            >
              Continue →
            </Link>
          </div>
        </div>

        {/* ── All Phases Summary ──────────────────────────────────────────── */}
        <div className="space-y-2">
          <p className="font-mono text-[10px] text-c-ghost uppercase tracking-[0.16em] mb-3 px-1">
            Full curriculum
          </p>
          {PHASE_ORDER.map(phaseKey => {
            const nodes = phaseGroups[phaseKey] ?? []
            if (nodes.length === 0) return null
            const stats     = phaseStats(nodes, stateMap)
            const isActive  = phaseKey === activePhase
            const isLocked  = !stats.hasContent
            const isDone    = stats.hasContent && stats.mastered === stats.total

            return (
              <div
                key={phaseKey}
                className={`rounded-xl border overflow-hidden transition-all ${
                  isActive
                    ? 'border-c-purple/40 bg-c-bg2'
                    : isLocked
                    ? 'border-[var(--border)] opacity-35'
                    : 'border-[var(--border)] bg-c-bg4'
                }`}
              >
                {/* Phase row */}
                <div className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Phase status icon */}
                    <span className="text-[14px] flex-shrink-0">
                      {isLocked ? '🔒' : isDone ? '✅' : isActive ? '▶' : '○'}
                    </span>
                    <p className={`text-[13px] font-medium truncate ${isActive ? 'text-c-text' : 'text-c-muted'}`}>
                      {PHASE_LABELS[phaseKey]}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    {/* Mini progress bar */}
                    {stats.hasContent && (
                      <div className="w-24 h-1 rounded-full bg-c-bg3 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${stats.pct}%`, background: isDone ? '#34d399' : isActive ? '#7c6eff' : '#5a8a9f' }}
                        />
                      </div>
                    )}
                    <span className="font-mono text-[11px] text-c-ghost w-14 text-right">
                      {isLocked ? 'Soon' : `${stats.mastered}/${stats.total}`}
                    </span>
                    {isActive && (
                      <Link
                        href="/learn"
                        className="px-3 py-1 rounded-lg text-[11px] font-mono bg-c-purple/10 text-c-purple hover:bg-c-purple/20 transition-all border border-c-purple/20"
                      >
                        Study
                      </Link>
                    )}
                  </div>
                </div>

                {/* Expanded skill list for active phase — inline */}
                {isActive && (
                  <div className="border-t border-[var(--border)] divide-y divide-[var(--border)]">
                    {nodes.map(node => {
                      const state   = stateMap.get(node.id)
                      const mastery = state?.mastery_state ?? 'blocked'
                      const pKnow   = state?.p_know ?? 0
                      const colour  = MASTERY_COLOUR[mastery] ?? '#3a3a52'
                      const isStudiable = ['ready','learning','fragile','mastered'].includes(mastery) && node.question_ids.length > 0

                      return (
                        <div
                          key={node.id}
                          className="px-5 py-2.5 flex items-center justify-between bg-c-bg4 hover:bg-c-bg3 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: colour }} />
                            <span className="text-[13px] text-c-text truncate">{node.label}</span>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                            <span className="font-mono text-[11px] capitalize" style={{ color: colour }}>
                              {mastery}
                            </span>
                            <span className="font-mono text-[11px] text-c-ghost">
                              {Math.round(pKnow * 100)}%
                            </span>
                            {isStudiable && (
                              <Link
                                href={`/learn/skill/${node.id}`}
                                className="px-2.5 py-0.5 rounded text-[10px] font-mono text-c-purple bg-c-purple/10 hover:bg-c-purple/20 border border-c-purple/20 transition-all"
                              >
                                Study
                              </Link>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ── Graph shortcut ──────────────────────────────────────────────── */}
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
