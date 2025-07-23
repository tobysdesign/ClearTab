"use client"

import { SessionProvider } from "next-auth/react"
import type { Session } from "next-auth"
import React, { useState, useMemo, createContext, useContext } from 'react'
import { ExpandingModal } from '@/components/ui/expanding-modal'
import { EditTaskForm } from '@/components/widgets/edit-task-form'
import type { Task } from '@/shared/schema'
import { useQueryClient } from '@tanstack/react-query'
import { AnimatePresence } from 'framer-motion'

interface ClientProvidersProps {
  children: React.ReactNode
  session?: (Session & { expires: string }) | null // Add expires property to Session
}

interface TaskModalContextValue {
  setActiveTaskId: (id: string | null) => void
  setNewTaskText: (text: string | null) => void
  activeTask: Task | undefined | null
}

const TaskModalContext = createContext<TaskModalContextValue | undefined>(undefined)

export function useTaskModal() {
  const context = useContext(TaskModalContext)
  if (context === undefined) {
    throw new Error('useTaskModal must be used within a TaskModalProvider')
  }
  return context
}

export default function ClientProviders({ children, session }: ClientProvidersProps) {
  const queryClient = useQueryClient();
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [newTaskText, setNewTaskText] = useState<string | null>(null)

  // This assumes tasks are available in a global query cache or can be fetched here
  // For simplicity, we'll try to get it from the query cache for now.
  const tasks = queryClient.getQueryData<Task[]>(['tasks']);
  const activeTask = useMemo(() => {
    if (activeTaskId && tasks) {
      return tasks.find(task => task.id === activeTaskId)
    }
    return null
  }, [activeTaskId, tasks])

  const handleModalClose = () => {
    setActiveTaskId(null);
    setNewTaskText(null);
  };

  const handleModalSave = () => {
    handleModalClose();
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };

  const contextValue = useMemo(() => ({
    setActiveTaskId,
    setNewTaskText,
    activeTask,
  }), [setActiveTaskId, setNewTaskText, activeTask]);

  return (
    <SessionProvider session={session}>
      <TaskModalContext.Provider value={contextValue}>
        {children}
        <AnimatePresence>
          {(activeTaskId || newTaskText) && (
            <ExpandingModal
              key="task-modal"
              layoutId={activeTaskId ? `card-${activeTaskId}` : "new-task-modal"}
              isOpen={!!(activeTaskId || newTaskText)}
              setIsOpen={(open) => {
                if (!open) {
                  handleModalClose();
                }
              }}
              onClose={handleModalClose}
            >
              <EditTaskForm 
                task={activeTask}
                onClose={handleModalClose}
                onSave={handleModalSave}
                initialDescription={newTaskText || undefined}
              />
            </ExpandingModal>
          )}
        </AnimatePresence>
      </TaskModalContext.Provider>
    </SessionProvider>
  )
} 