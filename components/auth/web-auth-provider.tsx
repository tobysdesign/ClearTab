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
      try {
        window.localStorage.removeItem(WEB_SESSION_CACHE_KEY)
      } catch {}
      await nextAuthSignOut({ callbackUrl: "/login" })
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
