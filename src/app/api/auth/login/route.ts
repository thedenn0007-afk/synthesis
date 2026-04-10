import { NextRequest, NextResponse } from 'next/server'
import { loginUser } from '@/lib/db/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 })

    const result = await loginUser(email, password)
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: 401 })

    const res = NextResponse.json({ ok: true, user: result.user })
    res.cookies.set('synaptic_token', result.token, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', maxAge: 30 * 24 * 60 * 60, path: '/',
    })
    return res
  } catch (err: any) {
    console.error('[login]', err)
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: 500 })
  }
}
