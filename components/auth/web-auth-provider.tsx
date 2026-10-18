"use client"

import { SessionProvider, useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "next-auth/react"
import { useEffect, useMemo, useState } from "react"
import { clearPreferencesCache } from "@/hooks/use-preferences"
import { AuthContext, type AuthContextType } from "./auth-context"

const WEB_SESSION_CACHE_KEY = "cleartab_web_session_v1"

function getCachedWebUser() {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(WEB_SESSION_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed.id === "string" ? parsed : null
  } catch {
    return null
  }
}

function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [cachedUser, setCachedUser] = useState<any>(null)

  useEffect(() => {
    const cached = getCachedWebUser()
    if (cached) {
      setCachedUser(cached)
    }
  }, [])

  useEffect(() => {
    if (session?.user) {
      setCachedUser(session.user)
      try {
        window.localStorage.setItem(WEB_SESSION_CACHE_KEY, JSON.stringify(session.user))
      } catch {}
    } else if (status === "unauthenticated") {
      setCachedUser(null)
      try {
        window.localStorage.removeItem(WEB_SESSION_CACHE_KEY)
      } catch {}
    }
  }, [session, status])

  const effectiveUser = session?.user || cachedUser || null
  const isLoading = status === "loading" && !cachedUser

  const value = useMemo<AuthContextType>(() => ({
    user: effectiveUser,
    session: session || (cachedUser ? { user: cachedUser, expires: "" } : null),
    signIn: async (provider: "google") => {
      await nextAuthSignIn(provider, { callbackUrl: "/tab" })
    },
    signOut: async () => {
      clearPreferencesCache()
      // Clear the session without relying on NextAuth's own redirect (unreliable in the
      // app router on v5 beta), then hard-navigate so all client state is dropped.
      try {
        await nextAuthSignOut({ redirect: false })
      } catch (error) {
        console.error("signOut failed, forcing navigation to /", error)
      }
      // Remove the cached user AFTER signout: doing it before races the caching
      // effect, which re-writes the cache while the session is still briefly
      // non-null during the await — leaving a stale user that makes the landing
      // page look signed-in after logout.
      try {
        window.localStorage.removeItem(WEB_SESSION_CACHE_KEY)
      } catch {}
      // The landing page at "/" is the sign-in surface now.
      window.location.href = "/"
    },
    loading: isLoading,
  }), [effectiveUser, session, cachedUser, isLoading])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function WebAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthContextProvider>{children}</AuthContextProvider>
    </SessionProvider>
  )
}
