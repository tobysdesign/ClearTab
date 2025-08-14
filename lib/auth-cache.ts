// Simple in-memory auth cache to avoid repeated Supabase calls
interface CachedAuth {
  userId: string
  timestamp: number
  ttl: number // Time to live in milliseconds
}

const authCache = new Map<string, CachedAuth>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export function getCachedUserId(sessionKey: string): string | null {
  const cached = authCache.get(sessionKey)
  
  if (!cached) return null
  
  // Check if cache is still valid
  if (Date.now() - cached.timestamp > cached.ttl) {
    authCache.delete(sessionKey)
    return null
  }
  
  return cached.userId
}

export function setCachedUserId(sessionKey: string, userId: string): void {
  authCache.set(sessionKey, {
    userId,
    timestamp: Date.now(),
    ttl: CACHE_TTL
  })
}

export function clearAuthCache(): void {
  authCache.clear()
}