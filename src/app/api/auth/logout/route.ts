import { NextResponse } from 'next/server'
import { getCurrentUserAndToken } from '@/lib/db/session'
import { logoutUser } from '@/lib/db/auth'

export async function POST() {
  const result = getCurrentUserAndToken()
  if (result) logoutUser(result.token)
  const res = NextResponse.json({ ok: true })
  res.cookies.set('synaptic_token', '', { maxAge: 0, path: '/' })
  return res
}
