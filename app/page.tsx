'use client'

import { DashboardClient } from '@/components/dashboard/dashboard-client'
import { NotesWidget } from '@/components/widgets/notes-widget'
import { TasksWidget } from '@/components/widgets/tasks-widget'
import { SkipOnboardingHandler } from '@/components/skip-onboarding-handler'
import { useAuth } from '@/components/auth/supabase-auth-provider'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BrandedLoader } from '@/components/ui/branded-loader'

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

  useEffect(() => {
    // Only redirect if we're not loading and there's no user
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Show loading while auth state is being determined
  if (loading) {
    return <BrandedLoader />
  }

  // Show loading while redirect is happening
  if (!user) {
    return <BrandedLoader />
  }

  // User is authenticated, show dashboard
  return <AuthenticatedDashboard />
}