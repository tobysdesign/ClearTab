'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/auth-provider'
import { ExtensionSignIn } from '@/components/auth/extension-sign-in'
import { NotesWidget } from '@/components/widgets/notes-widget'
import { TasksWidget } from '@/components/widgets/tasks-widget'
import { SkipOnboardingHandler } from '@/components/skip-onboarding-handler'
import { BetaDashboardClient } from '@/components/dashboard/beta/beta-dashboard-client'
import { BrandedLoader } from '@cleartab/ui'
import { IS_EXTENSION } from '@/lib/platform'

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
  const [mounted, setMounted] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      // The extension has no /login page: it shows its own sign-in screen below
      if (!IS_EXTENSION) {
        router.replace('/login')
      }
    } else if (!loading && user) {
      setHasLoaded(true)
    }
  }, [user, loading, router])

  if (!mounted || (loading && !hasLoaded)) {
    return (
      <div className={styles.loadingContainer}>
        <BrandedLoader size="medium" />
      </div>
    )
  }

  if (!user && IS_EXTENSION) {
    return <ExtensionSignIn />
  }

  if (!user && !hasLoaded) {
    return (
      <div className={styles.loadingContainer}>
        <BrandedLoader size="medium" />
        {!IS_EXTENSION && !loading && (
          <p style={{ marginTop: 16, fontSize: 13, color: '#94a3b8' }}>
            Redirecting to sign in...{' '}
            <a href="/login" style={{ color: '#38bdf8', textDecoration: 'underline' }}>
              Click here if you are not redirected
            </a>
          </p>
        )}
      </div>
    )
  }

  if (user) {
    return <AuthenticatedBetaDashboard />
  }

  return null
}
