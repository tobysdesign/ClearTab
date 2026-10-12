"use client"

import { createContext, useContext } from "react"
import type { Session } from "next-auth"

// One interface for both sign-in implementations: the website's NextAuth session
// (web-auth-provider) and the Chrome extension's bearer token (extension-auth-provider)
export interface AuthContextType {
  user: Session["user"] | null
  session: Session | null
  // fresh: go through Google again even if already signed in (switch account, reauthorise)
  signIn: (provider: "google", options?: { fresh?: boolean }) => Promise<void>
  signOut: () => Promise<void>
  loading: boolean
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
