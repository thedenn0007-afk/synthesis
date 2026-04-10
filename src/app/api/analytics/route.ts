import { NextRequest, NextResponse } from 'next/server'
// Simple analytics receiver — extend to write to SQLite or external service
export async function POST(req: NextRequest) {
  try {
    const events = await req.json()
    // console.log('[analytics]', events) // uncomment to debug
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
