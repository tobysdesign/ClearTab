"use client"

import React, { useState, useMemo, createContext, useContext, useEffect, useCallback } from 'react'
import { Drawer, DrawerContent, DrawerClose, DrawerTitle, DrawerDescription } from '@/components/ui/drawer'
import dynamic from 'next/dynamic'
import type { Task } from '@/shared/schema'

const EditTaskForm = dynamic(
  () => import('@/components/widgets/edit-task-form').then(mod => ({ default: mod.EditTaskForm })),
  {
    ssr: false,
    loading: () => (
      <div style={{ padding: '2rem', color: 'white' }}>
        Loading form...
      </div>
    )
  }
)
import { useQueryClient } from '@tanstack/react-query'
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

export default function ClientProviders({ children }: ClientProvidersProps) {
  const queryClient = useQueryClient();
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [newTaskText, setNewTaskText] = useState<string | null>(null)
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [taskUpdateCallbacks, setTaskUpdateCallbacks] = useState<Set<(updatedTask: Task, operation: 'update' | 'create' | 'delete') => void>>(new Set())

  // Fetch individual task data when activeTaskId changes
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  useEffect(() => {
    const fetchTask = async (taskId: string) => {
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
      }
    }

    if (activeTaskId) {
      fetchTask(activeTaskId)
    } else if (newTaskText !== null) {
      // For new tasks, set activeTask to null immediately to open drawer
      setActiveTask(null)
    }
  }, [activeTaskId, newTaskText])

  const handleModalClose = () => {
    setActiveTaskId(null);
    setNewTaskText(null);
    setIsCreatingNew(false);
    // Clear task data immediately to prevent stale data flash
    setActiveTask(null);
  };

  const registerTaskUpdateCallback = useCallback((callback: (updatedTask: Task, operation: 'update' | 'create' | 'delete') => void) => {
    setTaskUpdateCallbacks(prev => new Set(prev).add(callback));
  }, []);

  const unregisterTaskUpdateCallback = useCallback((callback: (updatedTask: Task, operation: 'update' | 'create' | 'delete') => void) => {
    setTaskUpdateCallbacks(prev => {
      const next = new Set(prev);
      next.delete(callback);
      return next;
    });
  }, []);

  const handleModalSave = useCallback((updatedTask: Task, operation: 'update' | 'create' | 'delete') => {
    // Don't close the modal on save - let user close it manually
    // Just invalidate queries to refresh the task list
    queryClient.invalidateQueries({ queryKey: ['tasks'] });

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
  }, [queryClient, taskUpdateCallbacks]);

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
        // If delete fails, refresh the task list
        console.error('Failed to delete task');
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      // Refresh task list on error
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
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
    // Close the modal
    handleModalClose();
  };

  const contextValue = useMemo(() => ({
    setActiveTaskId,
    setNewTaskText,
    activeTask,
    registerTaskUpdateCallback,
    unregisterTaskUpdateCallback,
  }), [activeTask, registerTaskUpdateCallback, unregisterTaskUpdateCallback]);


  return (
    <TaskModalContext.Provider value={contextValue}>
      {children}
      <div className={styles.modalContainer}>
        <Drawer
          open={!!(activeTaskId || newTaskText !== null || isCreatingNew)}
          onOpenChange={(open) => {
            if (!open) {
              handleModalClose();
            }
          }}
          direction="right"
        >
        <DrawerContent direction="right" overlayVariant="settings" className="overflow-hidden">
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
            initialDescription={newTaskText || undefined}
          />
        </DrawerContent>
        </Drawer>
      </div>
    </TaskModalContext.Provider>
  )
} 