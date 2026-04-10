import { NextRequest, NextResponse } from 'next/server'
import { registerUser } from '@/lib/db/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password, display_name } = await req.json()
    if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    if (password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })

    const result = await registerUser(email, password, display_name)
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: 400 })

    const res = NextResponse.json({ ok: true, user: result.user })
    res.cookies.set('synaptic_token', result.token, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', maxAge: 30 * 24 * 60 * 60, path: '/',
    })
    return res
  } catch (err: any) {
    console.error('[register]', err)
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: 500 })
  }
}
