import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/session'
import { bktUpdate } from '@/lib/bkt'
import { bktToQuality, reconcileBktSm2 } from '@/lib/sm2'
import { updateMotivationState } from '@/lib/motivation'
import { computeUnblocked } from '@/lib/graph'
import {
  getSkillState, upsertSkillState, getReviewSchedule, upsertReviewSchedule,
  getMotivationState, upsertMotivationState, insertAttempt,
  incrementSessionCounts, getSession, getAllSkillStates,
} from '@/lib/db/queries'
import type { Question, DifficultyTier, QuestionFormat } from '@/types'

const MIN_LATENCY = 100
const MAX_LATENCY = 5 * 60 * 1000

export async function POST(req: NextRequest) {
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()
  const { question_id, skill_id, session_id, latency_ms, client_answer,
          difficulty_tier, question_format } = body

  if (!question_id || !skill_id) return NextResponse.json({ error: 'question_id and skill_id required' }, { status: 400 })

  // ── Server-side answer verification
  let correct = false
  try {
    const questions: Question[] = require(`@/../content/questions/by-skill/${skill_id}.json`)
    const q = questions.find(q => q.id === question_id)
    if (!q) return NextResponse.json({ error: 'Unknown question_id' }, { status: 400 })

    if (q.format === 'mcq') correct = client_answer === q.correct_option_id
    else if (q.format === 'fill') {
      const ans = (client_answer || '').toString().trim().toLowerCase()
      correct = ans === (q.correct_answer || '').trim().toLowerCase() ||
                (q.keywords || []).some((kw: string) => ans.includes(kw.toLowerCase()))
    } else {
      // explain / code: self-reported for now
      correct = typeof body.correct === 'boolean' ? body.correct : false
    }
  } catch {
    // Stub phase — no questions file yet
    correct = typeof body.correct === 'boolean' ? body.correct : false
  }

  // ── Validate session ownership
  if (session_id) {
    const session = getSession(session_id)
    if (!session || session.learner_id !== user.id)
      return NextResponse.json({ error: 'Invalid session' }, { status: 403 })
    incrementSessionCounts(session_id, correct)
  }

  const safe_latency = Math.min(MAX_LATENCY, Math.max(MIN_LATENCY, latency_ms || 3000))

  // ── Load current state
  const [skillState, motivation] = [
    getSkillState(user.id, skill_id),
    getMotivationState(user.id),
  ]

  if (!skillState) return NextResponse.json({ error: 'Skill state not initialised — run /api/diagnostic first' }, { status: 400 })
  if (!motivation) return NextResponse.json({ error: 'Motivation state missing' }, { status: 400 })

  const wasMastered = skillState.mastery_state === 'mastered'
  const schedule    = getReviewSchedule(user.id, skill_id)

  // ── Update BKT
  const updatedState = bktUpdate(skillState, correct, schedule?.repetitions ?? 0)

  // ── Update SM-2
  if (schedule) {
    const quality        = bktToQuality(correct, safe_latency)
    const updatedSchedule = reconcileBktSm2(updatedState.p_know, wasMastered, schedule, quality)
    upsertReviewSchedule(updatedSchedule)
  }

  // ── Update motivation
  const updatedMotivation = updateMotivationState(motivation, correct, safe_latency, updatedState)
  upsertMotivationState(updatedMotivation)

  // ── Update skill state and check if graph needs recalculating
  upsertSkillState(updatedState)

  // ── Unlock prerequisites if mastered
  if (updatedState.mastery_state === 'mastered' && !wasMastered) {
    const allStates = getAllSkillStates(user.id)
    const stateMap  = new Map(allStates.map(s => [s.skill_id, s]))
    stateMap.set(skill_id, updatedState)
    const unblocked = computeUnblocked(stateMap)
    for (const [sid, s] of Array.from(stateMap)) {
      if (s.mastery_state === 'blocked' && unblocked.has(sid)) {
        upsertSkillState({ ...s, mastery_state: 'ready' })
      }
    }
  }

  // ── Record attempt
  const attempt_id = insertAttempt({
    learner_id: user.id, skill_id, question_id, session_id: session_id ?? null,
    correct, latency_ms: safe_latency, revision_count: 0, error_type: null,
    difficulty_tier: difficulty_tier as DifficultyTier,
    question_format: question_format as QuestionFormat,
  })

  return NextResponse.json({
    correct, attempt_id,
    new_p_know: updatedState.p_know,
    mastery_state: updatedState.mastery_state,
    explanation_unlocked: correct,
    motivation: updatedMotivation.state,
  })
}
