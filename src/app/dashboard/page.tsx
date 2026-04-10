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

const MASTERY_COLOUR: Record<string, string> = {
  mastered:  '#34d399',
  fragile:   '#fbbf24',
  learning:  '#7c6eff',
  ready:     '#5a5a72',
  blocked:   '#3a3a50',
}

export default async function Dashboard() {
  const cookieStore = cookies()
  const token = cookieStore.get('synaptic_token')?.value
  if (!token) redirect('/login')
  const user = verifyToken(token)
  if (!user) redirect('/login')

  const profile     = getLearnerProfile(user.id)
  if (!profile) redirect('/login')

  if (!profile.diagnostic_done) redirect('/learn/diagnostic')

  const allStates   = getAllSkillStates(user.id)
  const schedules   = getReviewSchedules(user.id)
  const allNodes    = getAllNodes()

  const stateMap    = new Map(allStates.map(s => [s.skill_id, s]))
  const dueReviews  = schedules.filter(s => new Date(s.due_at) <= new Date()).length
  const mastered    = allStates.filter(s => s.mastery_state === 'mastered').length
  const learning    = allStates.filter(s => ['learning', 'fragile'].includes(s.mastery_state)).length

  const phaseGroups = allNodes.reduce<Record<string, typeof allNodes>>((acc, node) => {
    if (!acc[node.phase]) acc[node.phase] = []
    acc[node.phase].push(node)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-8 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-10 animate-slide-up">
          <div>
            <h1 className="font-serif italic text-[32px] text-[#e8e8f0] leading-none mb-2">
              {profile.display_name ? `Hi, ${profile.display_name}` : 'Dashboard'}
            </h1>
            <p className="text-[13px] text-[#5a5a72] font-mono">
              {dueReviews > 0 ? `${dueReviews} review${dueReviews !== 1 ? 's' : ''} due` : 'No reviews due today'} · 🔥 {profile.streak_days} day streak
            </p>
          </div>
          <Link href="/learn" className="px-5 py-2.5 rounded-xl bg-[#7c6eff] hover:bg-[#6a5cdd] text-white text-[13px] font-medium transition-all hover:scale-[1.02]">
            Study now →
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { val: mastered, lbl: 'Skills mastered', col: '#34d399' },
            { val: learning, lbl: 'Actively learning', col: '#7c6eff' },
            { val: dueReviews, lbl: 'Reviews due', col: dueReviews > 0 ? '#fbbf24' : '#5a5a72' },
          ].map((s, i) => (
            <div key={i} className="p-5 rounded-xl border border-white/[0.07] bg-[#111118]">
              <p className="font-serif text-[32px] leading-none mb-1" style={{ color: s.col }}>{s.val}</p>
              <p className="font-mono text-[10px] text-[#5a5a72] uppercase tracking-[0.1em]">{s.lbl}</p>
            </div>
          ))}
        </div>

        {/* Knowledge graph by phase */}
        <div className="space-y-6">
          {Object.entries(PHASE_LABELS).map(([phaseKey, phaseLabel]) => {
            const nodes = phaseGroups[phaseKey] ?? []
            if (nodes.length === 0) return null
            const hasContent = nodes.some(n => n.question_ids.length > 0)
            return (
              <div key={phaseKey} className={`rounded-xl border overflow-hidden ${hasContent ? 'border-white/[0.07]' : 'border-white/[0.04] opacity-50'}`}>
                <div className="px-5 py-3 bg-[#111118] border-b border-white/[0.05] flex items-center justify-between">
                  <p className="text-[13px] font-medium text-[#e8e8f0]">{phaseLabel}</p>
                  {!hasContent && <span className="font-mono text-[10px] text-[#5a5a72]">Coming soon</span>}
                </div>
                <div className="divide-y divide-white/[0.03]">
                  {nodes.map(node => {
                    const state: LearnerSkillState | undefined = stateMap.get(node.id)
                    const pKnow  = state?.p_know ?? 0
                    const mastery = state?.mastery_state ?? 'blocked'
                    const colour = MASTERY_COLOUR[mastery] ?? '#3a3a50'
                    return (
                      <div key={node.id} className="px-5 py-3 bg-[#0d0d13]">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full" style={{ background: colour }} />
                            <span className="text-[13px] text-[#9898b0]">{node.label}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-[11px]" style={{ color: colour }}>{mastery}</span>
                            <span className="font-mono text-[11px] text-[#5a5a72]">{Math.round(pKnow * 100)}%</span>
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
      </div>
    </div>
  )
}
