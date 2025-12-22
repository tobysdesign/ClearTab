"use client"

import { SessionProvider, useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "next-auth/react"
import { createContext, useContext, useMemo } from "react"
import type { Session } from "next-auth"

interface AuthContextType {
  user: Session["user"] | null
  session: Session | null
  signIn: (provider: "google") => Promise<void>
  signOut: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()

  const value = useMemo<AuthContextType>(() => ({
    user: session?.user || null,
    session: session || null,
    signIn: async (provider: "google") => {
      await nextAuthSignIn(provider, { callbackUrl: "/" })
    },
    signOut: async () => {
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthContextProvider>{children}</AuthContextProvider>
    </SessionProvider>
  )
}
