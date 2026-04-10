import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/db/auth'
import type { AuthUser } from '@/lib/db/auth'

/**
 * Get the authenticated user from the request cookies.
 * Call this at the top of every API route handler.
 * Returns null if not authenticated.
 */
export function getCurrentUser(): AuthUser | null {
  const cookieStore = cookies()
  const token = cookieStore.get('synaptic_token')?.value
  if (!token) return null
  return verifyToken(token)
}

/**
 * Same as above but also returns the raw token (needed for logout)
 */
export function getCurrentUserAndToken(): { user: AuthUser; token: string } | null {
  const cookieStore = cookies()
  const token = cookieStore.get('synaptic_token')?.value
  if (!token) return null
  const user = verifyToken(token)
  if (!user) return null
  return { user, token }
}
