"use client"

import { SessionProvider, useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "next-auth/react"
import { useMemo } from "react"
import { clearPreferencesCache } from "@/hooks/use-preferences"
import { AuthContext, type AuthContextType } from "./auth-context"

function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()

  const value = useMemo<AuthContextType>(() => ({
    user: session?.user || null,
    session: session || null,
    signIn: async (provider: "google") => {
      await nextAuthSignIn(provider, { callbackUrl: "/tab" })
    },
    signOut: async () => {
      clearPreferencesCache()
      await nextAuthSignOut({ callbackUrl: "/login" })
    },
    loading: status === "loading",
  }), [session, status])

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
