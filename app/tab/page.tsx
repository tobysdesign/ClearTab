'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/auth-provider'
import { NotesWidget } from '@/components/widgets/notes-widget'
import { TasksWidget } from '@/components/widgets/tasks-widget'
import { SkipOnboardingHandler } from '@/components/skip-onboarding-handler'
import { BetaDashboardClient } from '@/components/dashboard/beta/beta-dashboard-client'
import { BrandedLoader } from '@cleartab/ui'

import styles from '@/components/dashboard/dashboard-client.module.css'

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

export default function TabPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [hasLoaded, setHasLoaded] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (!loading && user) {
      setHasLoaded(true)
    }
  }, [user, loading, router])

  if (loading && !hasLoaded) {
    return (
      <div className={styles.loadingContainer}>
        <BrandedLoader size="medium" />
      </div>
    )
  }

  if (!user && !hasLoaded) {
    return (
      <div className={styles.loadingContainer}>
        <BrandedLoader size="medium" />
      </div>
    )
  }

  if (user) {
    return <AuthenticatedBetaDashboard />
  }

  return null
}
