'use client'

import { DashboardClient } from '@/components/dashboard/dashboard-client'
import { NotesWidget } from '@/components/widgets/notes-widget'
import { TasksWidget } from '@/components/widgets/tasks-widget'
import { SkipOnboardingHandler } from '@/components/skip-onboarding-handler'
import { useAuth } from '@/components/auth/auth-provider'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BrandedLoader } from '@cleartab/ui'

function AuthenticatedDashboard() {
  return (
    <>
      <SkipOnboardingHandler />
      <main>
        <DashboardClient
          notes={<NotesWidget />}
          tasks={<TasksWidget searchQuery="" />}
        />
      </main>
    </>
  )
}


export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [hasLoaded, setHasLoaded] = useState(false)

  useEffect(() => {
    // Only redirect if we're not loading and there's no user
    if (!loading && !user) {
      router.push('/login')
    } else if (!loading && user) {
      // Mark as loaded once auth is confirmed
      setHasLoaded(true)
    }
  }, [user, loading, router])

  // Only show full-screen loader on initial load
  if (loading && !hasLoaded) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999,
        }}
      >
        <BrandedLoader size="medium" />
      </div>
    )
  }

  // Show loading while redirect is happening (only on initial load)
  if (!user && !hasLoaded) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999,
        }}
      >
        <BrandedLoader size="medium" />
      </div>
    )
  }

  // User is authenticated, show dashboard (stays mounted after initial load)
  if (user) {
    return <AuthenticatedDashboard />
  }

  // Fallback (shouldn't reach here)
  return null
}
