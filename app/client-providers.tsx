"use client"

import React, { useState, useMemo, createContext, useContext } from 'react'
import { Drawer, DrawerContent, DrawerClose } from '@/components/ui/drawer'
import { EditTaskForm } from '@/components/widgets/edit-task-form'
import type { Task } from '@/shared/schema'
import { useQueryClient } from '@tanstack/react-query'
import { AnimatePresence } from 'framer-motion'
import X from 'lucide-react/dist/esm/icons/x'

interface ClientProvidersProps {
  children: React.ReactNode
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

export default function ClientProviders({ children }: ClientProvidersProps) {
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
    <TaskModalContext.Provider value={contextValue}>
      {children}
      <Drawer 
        open={!!(activeTaskId || newTaskText)} 
        onOpenChange={(open) => {
          if (!open) {
            handleModalClose();
          }
        }}
        direction="right"
      >
        <DrawerContent direction="right" className="overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold">
              {activeTask?.id ? 'Edit Task' : 'Create Task'}
            </h2>
            <DrawerClose asChild>
              <button 
                className="md3-icon-button"
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
            </DrawerClose>
          </div>
          <EditTaskForm 
            task={activeTask}
            onClose={handleModalClose}
            onSave={handleModalSave}
            initialDescription={newTaskText || undefined}
          />
        </DrawerContent>
      </Drawer>
    </TaskModalContext.Provider>
  )
} 