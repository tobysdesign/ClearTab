import { DashboardClient } from '@/components/dashboard/dashboard-client'
import { NotesWidget } from '@/components/widgets/notes-widget'
import { TasksWidget } from '@/components/widgets/tasks-widget'
import { LayoutProvider } from '@/hooks/use-layout'
import { SkipOnboardingHandler } from '@/components/skip-onboarding-handler'

export default function Home() {
  return (
    <LayoutProvider>
      <SkipOnboardingHandler />
      <main>
        <DashboardClient
          notes={<NotesWidget />}
          tasks={<TasksWidget searchQuery="" />}
        />
      </main>
    </LayoutProvider>
  )
}