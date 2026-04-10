/**
 * Local authentication using bcryptjs + JWT
 * Replaces Supabase Auth entirely for local mode
 */

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getDb, generateId } from '@/lib/db'

const JWT_SECRET = process.env.JWT_SECRET || 'synaptic-local-dev-secret-change-in-production'
const JWT_EXPIRES_IN = '30d'

export interface AuthUser {
  id: string
  email: string
  display_name: string | null
}

// ── Register
export async function registerUser(
  email: string,
  password: string,
  displayName?: string,
): Promise<{ user: AuthUser; token: string } | { error: string }> {
  const db = getDb()

  const existing = db.prepare('SELECT id FROM learner_profiles WHERE email = ?').get(email)
  if (existing) return { error: 'Email already registered' }

  const hash = await bcrypt.hash(password, 10)
  const id   = generateId()
  const name = displayName || email.split('@')[0]

  db.prepare(`
    INSERT INTO learner_profiles (id, email, password_hash, display_name)
    VALUES (?, ?, ?, ?)
  `).run(id, email.toLowerCase().trim(), hash, name)

  db.prepare(`
    INSERT INTO motivation_states (learner_id) VALUES (?)
  `).run(id)

  const token = signToken(id)
  saveSession(id, token)

  return { user: { id, email, display_name: name }, token }
}

// ── Login
export async function loginUser(
  email: string,
  password: string,
): Promise<{ user: AuthUser; token: string } | { error: string }> {
  const db = getDb()

  const row = db.prepare(`
    SELECT id, email, display_name, password_hash FROM learner_profiles WHERE email = ?
  `).get(email.toLowerCase().trim()) as any

  if (!row) return { error: 'Invalid email or password' }

  const valid = await bcrypt.compare(password, row.password_hash)
  if (!valid) return { error: 'Invalid email or password' }

  const token = signToken(row.id)
  saveSession(row.id, token)

  return {
    user: { id: row.id, email: row.email, display_name: row.display_name },
    token,
  }
}

// ── Verify token (called from API routes)
export function verifyToken(token: string): AuthUser | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any
    const db = getDb()

    // Check session is still valid
    const session = db.prepare(`
      SELECT learner_id FROM auth_sessions
      WHERE token = ? AND expires_at > datetime('now')
    `).get(token) as any

    if (!session) return null

    const user = db.prepare(`
      SELECT id, email, display_name FROM learner_profiles WHERE id = ?
    `).get(payload.sub) as any

    if (!user) return null
    return { id: user.id, email: user.email, display_name: user.display_name }
  } catch {
    return null
  }
}

// ── Get user from request cookies/headers
export function getUserFromRequest(req: Request): AuthUser | null {
  const auth = req.headers.get('authorization') || ''
  const token = auth.replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token)
}

// ── Logout
export function logoutUser(token: string) {
  getDb().prepare('DELETE FROM auth_sessions WHERE token = ?').run(token)
}

// ── Helpers
function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

function saveSession(learnerId: string, token: string) {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  getDb().prepare(`
    INSERT OR REPLACE INTO auth_sessions (token, learner_id, expires_at)
    VALUES (?, ?, ?)
  `).run(token, learnerId, expiresAt)
}
