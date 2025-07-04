import { DashboardClient } from '@/components/dashboard/dashboard-client'
import { NotesWidget } from '@/components/widgets/notes-widget'
import { TasksWidget } from '@/components/widgets/tasks-widget'

export default function Home() {
  return (
    <main>
      <DashboardClient 
        notes={<NotesWidget />}
        tasks={<TasksWidget searchQuery="" />} 
      />
    </main>
  )
}