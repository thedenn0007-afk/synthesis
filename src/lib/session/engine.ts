import type { LearnerSkillState, ReviewSchedule, MotivationState, Question, SessionTask, DifficultyTier } from '@/types'
import { getNodeById } from '@/lib/graph'

interface Candidate { skill_id: string; priority: number }

interface SelectTaskParams {
  skillStates: Map<string, LearnerSkillState>
  reviewSchedules: Map<string, ReviewSchedule>
  motivationState: MotivationState
  seenSkillsThisSession: string[]
  seenQuestionIdsThisSession: Set<string>
  questionsCache: Map<string, Question[]>
}

export function selectNextTask(p: SelectTaskParams): SessionTask | null {
  const { skillStates, reviewSchedules, motivationState, seenSkillsThisSession, seenQuestionIdsThisSession, questionsCache } = p
  const now = new Date()
  const candidates: Candidate[] = []

  // Priority 1: overdue SM-2 reviews
  for (const [skillId, schedule] of Array.from(reviewSchedules)) {
    const state = skillStates.get(skillId)
    if (!state || state.mastery_state === 'blocked') continue
    if (new Date(schedule.due_at) <= now) candidates.push({ skill_id: skillId, priority: 100 })
  }

  // Priority 2: frustrated → easy win
  if (motivationState.state === 'frustrated') {
    const easyWin = findEasyWin(skillStates, seenSkillsThisSession)
    if (easyWin) {
      const q = pickQuestion(easyWin, 'review', seenQuestionIdsThisSession, questionsCache)
      if (q) return buildTask(easyWin, q, 'review', skillStates)
    }
  }

  // Priority 3: interleaving — penalise over-represented skills
  const recentWindow = seenSkillsThisSession.slice(-5)
  const overRep = new Set(
    Object.entries(recentWindow.reduce<Record<string, number>>((a, id) => { a[id] = (a[id] ?? 0) + 1; return a }, {}))
      .filter(([, c]) => c >= 2).map(([id]) => id)
  )

  // Priority 4: lowest p_know learnable
  const learnable = Array.from(skillStates.values())
    .filter(s => ['ready', 'learning'].includes(s.mastery_state))
    .filter(s => !overRep.has(s.skill_id))
    .sort((a, b) => a.p_know - b.p_know).slice(0, 5)
  for (const s of learnable) candidates.push({ skill_id: s.skill_id, priority: 50 })

  if (candidates.length === 0) return null
  candidates.sort((a, b) => b.priority - a.priority)
  const best  = candidates[0]
  const state = skillStates.get(best.skill_id)
  if (!state) return null

  let tier: DifficultyTier = 'same'
  if (motivationState.state === 'bored')   tier = 'harder'
  if (state.consecutive_correct >= 3)       tier = 'harder'
  if (state.consecutive_wrong >= 2)         tier = 'review'
  if (state.mastery_state === 'blocked')    tier = 'prerequisite'

  const q = pickQuestion(best.skill_id, tier, seenQuestionIdsThisSession, questionsCache)
  if (!q) return null
  return buildTask(best.skill_id, q, tier, skillStates)
}

function buildTask(skill_id: string, question: Question, tier: DifficultyTier, _states: Map<string, LearnerSkillState>): SessionTask | null {
  const node = getNodeById(skill_id)
  if (!node) return null
  return { skill_id, skill_label: node.label, skill_intuition: node.intuition, skill_analogy: node.analogy, question, difficulty_tier: tier, source: 'learning' }
}

function pickQuestion(skill_id: string, tier: DifficultyTier, seen: Set<string>, cache: Map<string, Question[]>): Question | null {
  const qs = cache.get(skill_id) ?? []
  const tiered = qs.filter(q => q.difficulty_tier === tier && !seen.has(q.id))
  if (tiered.length > 0) return tiered[Math.floor(Math.random() * tiered.length)]
  const unseen = qs.filter(q => !seen.has(q.id))
  if (unseen.length > 0) return unseen[Math.floor(Math.random() * unseen.length)]
  return qs[Math.floor(Math.random() * qs.length)] ?? null
}

function findEasyWin(skillStates: Map<string, LearnerSkillState>, recent: string[]): string | null {
  const r = new Set(recent.slice(-3))
  return Array.from(skillStates.values())
    .filter(s => s.p_know > 0.70 && s.mastery_state !== 'blocked' && !r.has(s.skill_id))
    .sort((a, b) => b.p_know - a.p_know)[0]?.skill_id ?? null
}
