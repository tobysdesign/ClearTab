import { DashboardClient } from '@/components/dashboard/dashboard-client'
import { NotesWidget } from '@/components/widgets/notes-widget'
import { TasksWidget } from '@/components/widgets/tasks-widget'
import { LayoutProvider } from '@/hooks/use-layout'

export default function Home() {
  return (
    <LayoutProvider>
      <main>
        <DashboardClient 
          notes={<NotesWidget />}
          tasks={<TasksWidget searchQuery="" />} 
        />
      </main>
    </LayoutProvider>
  )
}