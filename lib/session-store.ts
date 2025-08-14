import { User, Session } from '@supabase/supabase-js'

interface StoredSession {
  user: User
  session: Session
  expiresAt: number
}

// In-memory session store (in production, use Redis or database)
const sessionStore = new Map<string, StoredSession>()

export function storeSession(sessionId: string, user: User, session: Session): void {
  const expiresAt = Date.now() + (session.expires_in * 1000) // Convert to milliseconds
  
  sessionStore.set(sessionId, {
    user,
    session,
    expiresAt
  })
}

export function getStoredSession(sessionId: string): { user: User; session: Session } | null {
  const stored = sessionStore.get(sessionId)
  
  if (!stored) return null
  
  // Check if session has expired
  if (Date.now() > stored.expiresAt) {
    sessionStore.delete(sessionId)
    return null
  }
  
  return {
    user: stored.user,
    session: stored.session
  }
}

export function removeSession(sessionId: string): void {
  sessionStore.delete(sessionId)
}

export function clearAllSessions(): void {
  sessionStore.clear()
}

// Extract session ID from request (from cookie or header)
export function getSessionId(request: Request): string | null {
  // Try to get from Authorization header first
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  // Try to get from cookies
  const cookieHeader = request.headers.get('cookie')
  if (cookieHeader) {
    const sessionCookie = cookieHeader
      .split(';')
      .find(c => c.trim().startsWith('session_id='))
    
    if (sessionCookie) {
      return sessionCookie.split('=')[1]
    }
  }
  
  return null
}