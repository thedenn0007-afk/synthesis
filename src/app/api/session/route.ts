import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/session'
import { selectNextTask } from '@/lib/session/engine'
import { getMotivationState, getAllSkillStates, getReviewSchedules,
         createSession, getSession, endSession } from '@/lib/db/queries'
import type { LearnerSkillState, ReviewSchedule, Question } from '@/types'

export async function POST(req: NextRequest) {
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { action, session_id, seen_skills = [], seen_question_ids = [] } = await req.json()

  if (action === 'start') {
    const session = createSession(user.id)
    return NextResponse.json({ session_id: session.id })
  }

  if (action === 'next') {
    if (!session_id) return NextResponse.json({ error: 'session_id required' }, { status: 400 })
    const session = getSession(session_id)
    if (!session || session.learner_id !== user.id) return NextResponse.json({ error: 'Invalid session' }, { status: 403 })

    const [allStates, allSchedules, motivation] = [
      getAllSkillStates(user.id),
      getReviewSchedules(user.id),
      getMotivationState(user.id),
    ]

    if (!motivation) return NextResponse.json({ error: 'Motivation state missing — run /api/onboard first' }, { status: 400 })

    const skillStates    = new Map(allStates.map(s => [s.skill_id, s]))
    const reviewSchedules = new Map(allSchedules.map(s => [s.skill_id, s]))

    // Load question files into cache (only active skills)
    const questionsCache = new Map<string, Question[]>()
    for (const [sid] of Array.from(skillStates)) {
      try {
        const qs = require(`@/../content/questions/by-skill/${sid}.json`) as Question[]
        questionsCache.set(sid, qs)
      } catch { /* stub skill — no questions yet */ }
    }

    const task = selectNextTask({
      skillStates, reviewSchedules, motivationState: motivation,
      seenSkillsThisSession:    seen_skills,
      seenQuestionIdsThisSession: new Set(seen_question_ids),
      questionsCache,
    })

    if (!task) return NextResponse.json({ task: null, done: true })
    return NextResponse.json({ task, done: false })
  }

  if (action === 'end') {
    if (session_id) endSession(session_id)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
