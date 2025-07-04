"use client"

import { SessionProvider } from "next-auth/react"
import type { Session } from "next-auth"

interface ClientProvidersProps {
  children: React.ReactNode
  session?: Session | null
}

export default function ClientProviders({ children, session }: ClientProvidersProps) {
  return <SessionProvider session={session}>{children}</SessionProvider>
} 