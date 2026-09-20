'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/auth-provider'
import { NotesWidget } from '@/components/widgets/notes-widget'
import { TasksWidget } from '@/components/widgets/tasks-widget'
import { SkipOnboardingHandler } from '@/components/skip-onboarding-handler'
import { BetaDashboardClient } from '@/components/dashboard/beta/beta-dashboard-client'
import { BrandedLoader } from '@cleartab/ui'

function AuthenticatedBetaDashboard() {
  return (
    <>
      <SkipOnboardingHandler />
      <main>
        <BetaDashboardClient
          notes={<NotesWidget />}
          tasks={<TasksWidget searchQuery="" />}
        />
      </main>
    </>
  )
}

export default function BetaDashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [hasLoaded, setHasLoaded] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?callbackUrl=/beta')
    } else if (!loading && user) {
      setHasLoaded(true)
    }
  }, [user, loading, router])

  if (loading && !hasLoaded) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
        }}
      >
        <BrandedLoader size="medium" />
      </div>
    )
  }

  if (!user && !hasLoaded) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
        }}
      >
        <BrandedLoader size="medium" />
      </div>
    )
  }

  if (user) {
    return <AuthenticatedBetaDashboard />
  }

  return null
}
