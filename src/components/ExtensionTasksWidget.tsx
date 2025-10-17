import React from 'react'
import { TasksWidget } from '@/components/widgets/tasks-widget'

// Extension-compatible wrapper for TasksWidget
// This component will be adapted to work with Chrome Storage instead of API calls
export const ExtensionTasksWidget: React.FC = () => {
  return <TasksWidget />
}