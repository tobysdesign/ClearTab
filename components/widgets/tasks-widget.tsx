'use client'

import { useState, useCallback, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { AddButton } from '@/components/ui/add-button'
import type { Task } from '@/shared/schema'
import { WidgetHeader } from '@/components/ui/widget-header'
import { WidgetContainer, WidgetContent } from '@/components/ui/widget-container'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { EditTaskForm } from './edit-task-form'
import { motion, AnimatePresence } from 'framer-motion'
import { ActionsMenu } from '@/components/ui/actions-menu'
import { WidgetLoader } from './widget-loader'
import { EmptyState } from '@/components/ui/empty-state'
import { useTaskModal } from '@/app/client-providers'
import { EMPTY_BLOCKNOTE_CONTENT } from '@/shared/schema' // Corrected import path
import styles from './widget.module.css'

import { ClientOnly } from '@/components/ui/safe-motion'
import X from 'lucide-react/dist/esm/icons/x'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api-client'

interface TasksWidgetProps {
  searchQuery?: string
}

// API functions (these should now use isCompleted and priority for updates)
async function fetchTasks(): Promise<Task[]> {
  const res = await api.get('/api/tasks')
  if (!res.ok) throw new Error('Failed to fetch tasks')
  const response = await res.json()
  return response.data || []
}

async function updateTask(task: Partial<Task> & { id: string }): Promise<Task> {
  const res = await api.patch(`/api/tasks/${task.id}`, task)
  if (!res.ok) throw new Error('Failed to update task')
  const response = await res.json()
  return response.data
}

async function deleteTask(taskId: string): Promise<void> {
  const res = await api.delete(`/api/tasks/${taskId}`)
  if (!res.ok) throw new Error('Failed to delete task')
}

async function createTask(title: string, isCompleted: boolean, isHighPriority: boolean, content: any): Promise<Task> {
  const res = await api.post('/api/tasks', {
    title,
    isCompleted, // Use passed isCompleted
    isHighPriority, // Use passed high priority flag
    content, // Use passed content
  })
  if (!res.ok) {
    const errorBody = await res.json();
    throw new Error(errorBody.error || 'Failed to create task')
  }
  const response = await res.json()
  return response.data
}

// Function to create a task from editor text
export async function createTaskFromText(text: string): Promise<Task | null> {
  try {
    if (!text) return null;

    // Extract title from first line or use truncated text
    const lines = text.split('\n');
    const title = lines[0].length > 50
      ? lines[0].substring(0, 50) + '...'
      : lines[0];


    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        isCompleted: false, // Default for new tasks from text
        priority: 'none', // Default for new tasks from text
        // We'll handle the description formatting in the edit form
      }),
    });

    if (!res.ok) {
      const errorBody = await res.json();
      throw new Error(errorBody.error || 'Failed to create task');
    }

    const response = await res.json();
    return response.data;
  } catch (error) {
    return null;
  }
}

export function TasksWidget({ searchQuery }: TasksWidgetProps) {
  const { setActiveTaskId, setNewTaskText, activeTask } = useTaskModal()
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  // Load tasks on mount
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setIsLoading(true)
        const data = await fetchTasks()
        setTasks(data)
        setIsError(false)
      } catch (error) {
        setIsError(true)
      } finally {
        setIsLoading(false)
      }
    }
    loadTasks()
  }, [])


  const updateTaskLocal = useCallback(async (updatedTask: Partial<Task> & { id: string }) => {
    try {
      // Optimistically update UI
      setTasks(prev => prev.map(task =>
        task.id === updatedTask.id ? { ...task, ...updatedTask } : task
      ))

      // Update on server
      await updateTask(updatedTask)
    } catch (error) {
      // Rollback on error and reload
      const data = await fetchTasks()
      setTasks(data)
      throw error
    }
  }, [])

  const deleteTaskLocal = useCallback(async (taskId: string) => {
    try {
      // Optimistically update UI
      setTasks(prev => prev.filter(task => task.id !== taskId))

      // Delete from server
      await deleteTask(taskId)
    } catch (error) {
      // Rollback on error and reload
      const data = await fetchTasks()
      setTasks(data)
      throw error
    }
  }, [])

  const createTaskLocal = useCallback(async (newTaskData: { title: string; isCompleted: boolean; isHighPriority: boolean; content: any }) => {
    try {
      // Create task on server
      const newTask = await createTask(newTaskData.title, newTaskData.isCompleted, newTaskData.isHighPriority, newTaskData.content)

      // Add to local state
      setTasks(prev => [newTask, ...prev])

      // Open the new task in the modal
      setActiveTaskId(newTask.id)

      return newTask
    } catch (error) {
      throw error
    }
  }, [setActiveTaskId])

  const handleTaskStatusChange = useCallback((taskId: string, isCompleted: boolean) => {
    updateTaskLocal({ id: taskId, isCompleted })
  }, [updateTaskLocal])

  function handleTaskSave(updatedTask: Partial<Task>) {
    // Removed activeTask check and direct mutation - now handled by EditTaskForm's onSave
    // The EditTaskForm now directly calls updateTask server action
  }

  function handleTaskDelete(taskId: string) {
    deleteTaskLocal(taskId)
  }

  function handleAddTask() {
    createTaskLocal({
      title: 'New Task',
      isCompleted: false,
      isHighPriority: false,
      content: EMPTY_BLOCKNOTE_CONTENT, // Use BlockNote's empty content structure
    });
  }

  // Function to handle creating a task from editor text
  function handleCreateTaskFromEditorText(text: string) {
    // We now just set the initial text, the modal open and form creation is handled by ClientProviders
    setNewTaskText(text);
    // Create a basic task to get an ID, then rely on the modal to open it with description
    createTaskLocal({
      title: text.split('\n')[0] || 'New Task',
      isCompleted: false,
      isHighPriority: false,
      content: {
        'paragraph-1': {
          id: 'paragraph-1',
          type: 'paragraph',
          value: [{
            id: 'paragraph-1-element',
            type: 'paragraph',
            children: [{ text: text || '' }], // Use the full text as content
            props: {
              nodeType: 'block',
            },
          }],
          meta: {
            order: 0,
            depth: 0,
          },
        },
      },
    });
  }

  // Removed activeTask calculation from here, it's now handled by the context

  if (isLoading) {
    return <WidgetLoader minHeight="h-[280px]" />
  }

  if (isError) {
    return (
      <Card className="rounded-lg border border-border bg-card text-card-foreground shadow-sm h-full">
        <div className="flex items-center justify-center h-full text-destructive">
          Failed to load tasks. Please try again later.
        </div>
      </Card>
    )
  }

  return (
    <WidgetContainer>
      <WidgetHeader title="Tasks" className="!justify-start">
        <AddButton onClick={handleAddTask} />
      </WidgetHeader>
      <WidgetContent>
        <div className="widget-full-height overflow-y-auto custom-scrollbar">
          <div className="widget-list-content">
          <div className="taskEmpty">
            {tasks.length === 0 ? (
              <EmptyState
                renderIcon={() => <X className="h-6 w-6 text-white/40" />}
                title="Not a care"
                description="Could your first task be to add a task?"
                action={{
                  label: "Add Task",
                  onClick: handleAddTask
                }}
                className="widget-full-height"
              />
            ) : (
              <ClientOnly>
                <motion.div
                  className="widget-tasks-content"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: { staggerChildren: 0.1 },
                    },
                  }}
                >
                  <AnimatePresence>
                    {tasks.map((task) => {
                      const isActive = activeTask?.id === task.id
                      return (
                        <motion.div
                          key={task.id}
                          layoutId={`card-${task.id}`}
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ x: -50, opacity: 0 }}
                          onClick={() => setActiveTaskId(task.id)}
                          className={cn(
                            "group widget-list-item widget-list-item--tasks relative",
                            isActive ? "bg-[#5c5c5c] border-[#5c5c5c]" : "bg-[#222222] border-[#222222] hover:bg-[#2a2a2a] hover:border-[#2a2a2a]"
                          )}
                        >
                          {/* Pink dot for active item */}
                          {isActive && (
                            <div className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-rose-400" />
                          )}

                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <Checkbox
                                id={`task-${task.id}`}
                                checked={task.isCompleted}
                                onCheckedChange={(checked) =>
                                  handleTaskStatusChange(task.id, checked as boolean)
                                }
                                onClick={(e) => e.stopPropagation()}
                              />
                              <h3
                                className={`text-sm font-normal truncate ${
                                  task.isCompleted
                                    ? 'line-through opacity-50'
                                    : ''
                                }`}
                                style={{color: task.isCompleted ? '#5A5A5A' : '#E6E6E6'}}
                              >
                                {task.title}
                              </h3>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              {task.dueDate && (
                                <span className="text-xs" style={{color: '#5A5A5A'}}>
                                  {format(new Date(task.dueDate), 'd MMM')}
                                </span>
                              )}
                              {task.isHighPriority && (
                                <span className="text-pink-500 text-base font-medium">!</span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </motion.div>
              </ClientOnly>
            )}
          </div>
          </div>
        </div>
      </WidgetContent>
    </WidgetContainer>
  )
}
