"use client"

import { IS_EXTENSION } from "@/lib/platform"
import { ExtensionAuthProvider } from "./extension-auth-provider"
import { WebAuthProvider } from "./web-auth-provider"

export { useAuth } from "./auth-context"
export type { AuthContextType } from "./auth-context"

// The website signs in with NextAuth's cookie session; the Chrome extension with a bearer token
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return IS_EXTENSION ? (
    <ExtensionAuthProvider>{children}</ExtensionAuthProvider>
  ) : (
    <WebAuthProvider>{children}</WebAuthProvider>
  )
}
