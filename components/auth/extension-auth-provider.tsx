"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { clearPreferencesCache } from "@/hooks/use-preferences"
import {
  getStoredAuth,
  readLocalStoredAuth,
  onStoredAuthChange,
  signInWithBrowser,
  signOutExtension,
  SignInCancelled,
  verifyStoredAuth,
  type StoredAuth,
} from "@/lib/extension/auth"
import { AuthContext, type AuthContextType } from "./auth-context"

// Sign-in for the Chrome extension build (see lib/extension/auth.ts)
export function ExtensionAuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<StoredAuth | null>(readLocalStoredAuth)
  const [loading, setLoading] = useState(() => auth === null)
  const userIdRef = useRef<string | null>(auth?.user.id ?? null)
  const hadUserRef = useRef(auth !== null)

  useEffect(() => {
    let active = true

    const apply = (next: StoredAuth | null) => {
      if (!active) return
      const nextId = next?.user.id ?? null
      // A different account signed in (here or in another tab) after this page showed one:
      // reload rather than show the previous account's cached data
      if (nextId && hadUserRef.current && nextId !== userIdRef.current) {
        window.location.reload()
        return
      }
      if (nextId) hadUserRef.current = true
      userIdRef.current = nextId
      setAuth(next)
      setLoading(false)
    }

    // Show the stored user straight away and check the token in the background, so a new
    // tab doesn't wait on the network before drawing the dashboard
    getStoredAuth().then((stored) => {
      apply(stored)
      if (stored) {
        verifyStoredAuth().catch((error) => console.warn("ClearTab: couldn't check sign-in", error))
      }
    })

    const unsubscribe = onStoredAuthChange(apply)
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (_provider: "google", options?: { fresh?: boolean }) => {
    try {
      // Signing in again while signed in is reauthorising: go through Google
      await signInWithBrowser({ fresh: options?.fresh ?? userIdRef.current !== null })
    } catch (error) {
      // Closing the sign-in window isn't an error worth showing
      if (error instanceof SignInCancelled) return
      throw error
    }
  }, [])

  const signOut = useCallback(async () => {
    clearPreferencesCache()
    await signOutExtension()
  }, [])

  const value = useMemo<AuthContextType>(
    () => ({
      user: auth?.user ?? null,
      session: auth ? { user: auth.user, expires: auth.expiresAt } : null,
      signIn,
      signOut,
      loading,
    }),
    [auth, loading, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
