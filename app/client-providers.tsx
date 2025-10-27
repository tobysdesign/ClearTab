"use client"

import React, { useState, useMemo, createContext, useContext, useEffect, useCallback } from 'react'
import { Drawer, DrawerContent, DrawerClose, DrawerTitle, DrawerDescription } from '@/components/ui/drawer'
import type { Task } from '@/shared/schema'
import { EditTaskForm } from '@/components/widgets/edit-task-form'
import { CloseIcon } from '@/components/icons'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import styles from './client-providers.module.css'

interface ClientProvidersProps {
  children: React.ReactNode
}

interface TaskModalContextValue {
  setActiveTaskId: (id: string | null) => void
  setNewTaskText: (text: string | null) => void
  activeTask: Task | undefined | null
  registerTaskUpdateCallback: (callback: (updatedTask: Task, operation: 'update' | 'create' | 'delete') => void) => void
  unregisterTaskUpdateCallback: (callback: (updatedTask: Task, operation: 'update' | 'create' | 'delete') => void) => void
}

const TaskModalContext = createContext<TaskModalContextValue | undefined>(undefined)

export function useTaskModal() {
  const context = useContext(TaskModalContext)
  if (context === undefined) {
    throw new Error('useTaskModal must be used within a TaskModalProvider')
  }
  return context
}

// Main ClientProviders component
export default function ClientProviders({ children }: ClientProvidersProps) {
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [newTaskText, setNewTaskText] = useState<string | null>(null)
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [taskUpdateCallbacks, setTaskUpdateCallbacks] = useState<Set<(updatedTask: Task, operation: 'update' | 'create' | 'delete') => void>>(new Set())

  // Fetch individual task data when activeTaskId changes
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [isLoadingTask, setIsLoadingTask] = useState(false)

  useEffect(() => {
    const fetchTask = async (taskId: string) => {
      setIsLoadingTask(true)
      try {
        console.log('Fetching task with ID:', taskId)
        // Fetch single task instead of all tasks for better performance
        const response = await fetch(`/api/tasks?id=${taskId}`)
        if (response.ok) {
          const data = await response.json()
          console.log('Task from API:', data.data)
          setActiveTask(data.data || null)
        } else {
          console.error('Failed to fetch task')
          setActiveTask(null)
        }
      } catch (error) {
        console.error('Error fetching task:', error)
        setActiveTask(null)
      } finally {
        setIsLoadingTask(false)
      }
    }

    if (activeTaskId) {
      fetchTask(activeTaskId)
    } else if (newTaskText !== null) {
      // For new tasks, set activeTask to null immediately to open drawer
      setActiveTask(null)
      setIsCreatingNew(true)
    } else {
      setActiveTask(null)
      setIsCreatingNew(false)
    }
  }, [activeTaskId, newTaskText])

  const registerTaskUpdateCallback = useCallback((callback: (updatedTask: Task, operation: 'update' | 'create' | 'delete') => void) => {
    setTaskUpdateCallbacks(prev => {
      const next = new Set(prev);
      next.add(callback);
      return next;
    });
  }, []);

  const unregisterTaskUpdateCallback = useCallback((callback: (updatedTask: Task, operation: 'update' | 'create' | 'delete') => void) => {
    setTaskUpdateCallbacks(prev => {
      const next = new Set(prev);
      next.delete(callback);
      return next;
    });
  }, []);

  const handleModalSave = useCallback((updatedTask: Task, operation: 'update' | 'create' | 'delete') => {
    // Call all registered task update callbacks with specific task data
    taskUpdateCallbacks.forEach(callback => {
      try {
        callback(updatedTask, operation);
      } catch (error) {
        console.error('Error calling task update callback:', error);
      }
    });

    // Close modal after delete
    if (operation === 'delete') {
      handleModalClose();
    }
  }, [taskUpdateCallbacks]);

  const handleDeleteTask = async () => {
    if (!activeTask?.id) return;

    // Optimistically close modal and update UI immediately
    const taskToDelete = activeTask;
    handleModalSave(taskToDelete, 'delete');

    // Delete in background
    try {
      const res = await fetch(`/api/tasks?id=${taskToDelete.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        console.error('Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleCancelTask = async () => {
    // For create mode - if it's a draft task, delete it
    if (activeTask?.id && activeTask.id.startsWith('draft-')) {
      try {
        const res = await fetch(`/api/tasks?id=${activeTask.id}`, {
          method: 'DELETE',
        });

        if (res.ok) {
          handleModalSave(activeTask, 'delete');
        }
      } catch (error) {
        console.error('Error deleting draft task:', error);
      }
    }

    handleModalClose();
  };

  const handleModalClose = () => {
    setActiveTaskId(null)
    setNewTaskText(null)
    setActiveTask(null)
    setIsCreatingNew(false)
    setIsLoadingTask(false)
  }

  const contextValue = useMemo(() => ({
    setActiveTaskId,
    setNewTaskText,
    activeTask: isCreatingNew ? null : activeTask,
    registerTaskUpdateCallback,
    unregisterTaskUpdateCallback
  }), [activeTask, isCreatingNew, registerTaskUpdateCallback, unregisterTaskUpdateCallback])

  return (
    <TaskModalContext.Provider value={contextValue}>
      {children}

      <div className={styles.drawerContainer}>
        <Drawer
          open={!!(activeTaskId || newTaskText !== null || isCreatingNew)}
          onOpenChange={(open) => {
            if (!open) {
              handleModalClose();
            }
          }}
        >
        <DrawerContent direction="right" overlayVariant="settings">
          <div className={styles.header}>
            <DrawerTitle className={styles.title}>
              {(activeTask?.id && !activeTask.id.startsWith('draft-')) || (activeTaskId && !activeTaskId.startsWith('draft-')) ? 'EDIT TASK' : 'CREATE TASK'}
            </DrawerTitle>
            <DrawerDescription className="sr-only">
              {(activeTask?.id && !activeTask.id.startsWith('draft-')) || (activeTaskId && !activeTaskId.startsWith('draft-')) ? 'Edit the selected task details' : 'Create a new task with title, description, and due date'}
            </DrawerDescription>

            {/* Show actions menu for edit mode, X button for create mode */}
            {(activeTask?.id && !activeTask.id.startsWith('draft-')) || (activeTaskId && !activeTaskId.startsWith('draft-')) ? (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost-icon"
                    size="icon"
                  >
                    ⋮
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={handleDeleteTask}
                    className="text-red-400 focus:text-red-300"
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <DrawerClose asChild>
                <button
                  className="md3-icon-button"
                  aria-label="Close dialog"
                >
                  <CloseIcon size={20} />
                </button>
              </DrawerClose>
            )}
          </div>
          <EditTaskForm
            key={activeTask?.id || newTaskText || 'new-task'}
            task={activeTask}
            onClose={handleModalClose}
            onSave={handleModalSave}
            onCancel={handleCancelTask}
            initialText={newTaskText || undefined}
            isCreating={isCreatingNew}
            isLoadingTask={isLoadingTask}
          />
        </DrawerContent>
        </Drawer>
      </div>
    </TaskModalContext.Provider>
  )
}