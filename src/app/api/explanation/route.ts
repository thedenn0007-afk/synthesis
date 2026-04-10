import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/session'
import { getSkillState, getLastAttemptForQuestion } from '@/lib/db/queries'
import type { Explanation, ExplanationDepth, LearnerSkillState } from '@/types'

export async function GET(req: NextRequest) {
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const skill_id   = searchParams.get('skill_id')
  const attempt_id = searchParams.get('attempt_id')

  if (!skill_id) return NextResponse.json({ error: 'skill_id required' }, { status: 400 })

  // Retrieval-first gate: explanation only unlocked after an attempt
  // (In local mode we're lenient — just check skill_id exists)
  const skillState = getSkillState(user.id, skill_id)
  if (!skillState) return NextResponse.json({ error: 'Skill not initialised' }, { status: 400 })

  const depth = chooseDepth(skillState, searchParams.get('force_depth') as ExplanationDepth | null)

  try {
    const explanation: Explanation = require(`@/../content/explanations/${skill_id}/${depth}.json`)
    return NextResponse.json({ explanation, depth })
  } catch {
    // Try fallback depths
    for (const fallback of ['beginner', 'mid', 'advanced'] as ExplanationDepth[]) {
      try {
        const explanation: Explanation = require(`@/../content/explanations/${skill_id}/${fallback}.json`)
        return NextResponse.json({ explanation, depth: fallback })
      } catch { continue }
    }
    return NextResponse.json({ error: 'Explanation not found — content not yet added for this skill' }, { status: 404 })
  }
}

function chooseDepth(state: LearnerSkillState | null, forceDepth: ExplanationDepth | null): ExplanationDepth {
  if (forceDepth) return forceDepth
  if (!state) return 'beginner'
  if (state.p_know >= 0.75) return 'advanced'
  if (state.p_know >= 0.45) return 'mid'
  return 'beginner'
}
