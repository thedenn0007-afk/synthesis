import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/session'
import { initMotivationState } from '@/lib/motivation'
import { upsertMotivationState, getLearnerProfile } from '@/lib/db/queries'

export async function POST() {
  const user = getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const existing = getLearnerProfile(user.id)
  if (!existing) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  // Ensure motivation state exists
  upsertMotivationState(initMotivationState(user.id))

  return NextResponse.json({ ok: true, profile: existing })
}
