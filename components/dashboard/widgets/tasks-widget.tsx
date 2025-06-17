'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AddButton } from '@/components/ui/add-button'
import { ExpandableCard } from '@/components/ui/expandable-card'
import type { Task } from '@/shared/schema'

const initialTasks: Task[] = [
  {
    id: 1,
    userId: 1,
    title: 'Finalize the Q3 report',
    description: 'The report needs to be finalized by the end of the week.',
    completed: false,
    isImportant: true,
    dueDate: new Date(new Date().setDate(new Date().getDate() + 3)),
    createdAt: new Date(),
  },
  {
    id: 2,
    userId: 1,
    title: 'Implement the new authentication flow',
    description: null,
    completed: false,
    isImportant: false,
    dueDate: new Date(new Date().setDate(new Date().getDate() + 5)),
    createdAt: new Date(),
  },
  {
    id: 3,
    userId: 1,
    title: 'Write documentation for the API',
    description: 'Cover all endpoints and provide examples.',
    completed: true,
    isImportant: false,
    dueDate: null,
    createdAt: new Date(),
  },
  {
    id: 4,
    userId: 1,
    title: 'Deploy the latest changes to production',
    description: "Don't forget to run the migrations.",
    completed: false,
    isImportant: true,
    dueDate: new Date(),
    createdAt: new Date(),
  },
]

export function TasksWidget() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)

  function handleTaskCompletionChange(taskId: number, completed: boolean) {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, completed } : task
      )
    )
  }

  return (
    <Card className="h-full flex flex-col border border-border">
      <CardHeader className="flex flex-row items-center justify-between flex-shrink-0 px-6 pt-6 pb-1.5">
        <CardTitle>Tasks</CardTitle>
        <AddButton tooltip="Add New Task" />
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden relative">
        <div className="h-full overflow-y-auto">
          <ExpandableCard
            tasks={tasks}
            onTaskCompletionChange={handleTaskCompletionChange}
          />
        </div>
      </CardContent>
    </Card>
  )
}