import React, { createContext, useContext, useMemo, useState } from 'react'
import type { Note, Task } from '@/shared/schema'
import { useNotes as useExtensionNotes } from '../hooks/use-extension-notes'
import { useExtensionStorage } from '../hooks/use-extension-storage'

// Extension context for tasks
interface ExtensionTaskModalContextValue {
  setActiveTaskId: (id: string | null) => void
  setNewTaskText: (text: string | null) => void
  activeTask: Task | undefined | null
}

const ExtensionTaskModalContext = createContext<ExtensionTaskModalContextValue | undefined>(undefined)

// Extension provider that replaces the web app contexts with extension-compatible versions
export const ExtensionProvidersWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: tasks } = useExtensionStorage<Task[]>('tasks', [])
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [newTaskText, setNewTaskText] = useState<string | null>(null)

  const activeTask = useMemo(() => {
    if (activeTaskId && tasks) {
      return tasks.find(task => task.id === activeTaskId)
    }
    return null
  }, [activeTaskId, tasks])

  const taskModalValue = useMemo(() => ({
    setActiveTaskId,
    setNewTaskText,
    activeTask,
  }), [setActiveTaskId, setNewTaskText, activeTask])

  return (
    <ExtensionTaskModalContext.Provider value={taskModalValue}>
      {children}
    </ExtensionTaskModalContext.Provider>
  )
}

// Extension-compatible useTaskModal hook
export function useTaskModal() {
  const context = useContext(ExtensionTaskModalContext)
  if (context === undefined) {
    throw new Error('useTaskModal must be used within an ExtensionProvidersWrapper')
  }
  return context
}