'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { AddButton } from '@/components/ui/add-button'
import type { Task } from '@/shared/schema'
import { ListHeader } from '@/components/ui/list-header'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { EditTaskForm } from './edit-task-form'
import { motion, AnimatePresence } from 'framer-motion'
import { ActionsMenu } from '@/components/ui/actions-menu'
import { ExpandingModal } from '@/components/ui/expanding-modal'
import { WidgetLoader } from './widget-loader'

interface TasksWidgetProps {
  searchQuery?: string
}

// API functions
async function fetchTasks(): Promise<Task[]> {
  const res = await fetch('/api/tasks')
  if (!res.ok) throw new Error('Failed to fetch tasks')
  const response = await res.json()
  return response.data || []
}

async function updateTask(task: Partial<Task> & { id: string }): Promise<Task> {
  const res = await fetch(`/api/tasks/${task.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  })
  if (!res.ok) throw new Error('Failed to update task')
  const response = await res.json()
  return response.data
}

async function deleteTask(taskId: string): Promise<void> {
  const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete task')
}

async function createTask(title: string): Promise<Task> {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, status: 'pending' }),
  })
  if (!res.ok) throw new Error('Failed to create task')
  const response = await res.json()
  return response.data
}

export function TasksWidget({ searchQuery }: TasksWidgetProps) {
  const queryClient = useQueryClient()
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)

  const { data, isLoading, isError } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  })

  // Ensure tasks is always an array
  const tasks = Array.isArray(data) ? data : []

  const updateTaskMutation = useMutation({
    mutationFn: updateTask,
    onMutate: async (updatedTask) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      
      // Snapshot previous value
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks'])
      
      // Optimistically update
      queryClient.setQueryData<Task[]>(['tasks'], (old = []) =>
        old.map(task => task.id === updatedTask.id ? { ...task, ...updatedTask } : task)
      )
      
      return { previousTasks }
    },
    onError: (err, updatedTask, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks)
      }
    },
    onSettled: () => {
      // Always refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTask,
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks'])
      
      queryClient.setQueryData<Task[]>(['tasks'], (old = []) =>
        old.filter(task => task.id !== taskId)
      )
      
      return { previousTasks }
    },
    onError: (err, taskId, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks)
      }
    },
    onSuccess: () => {
      setActiveTaskId(null)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const createTaskMutation = useMutation({
    mutationFn: createTask,
    onMutate: async (title) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks'])
      
      // Create temporary task for optimistic update
      const tempTask: Task = {
        id: `temp-${Date.now()}`,
        title,
        status: 'pending' as const,
        description: null,
        dueDate: null,
        order: null,
        userId: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      queryClient.setQueryData<Task[]>(['tasks'], (old = []) => [...old, tempTask])
      
      return { previousTasks, tempTask }
    },
    onError: (err, title, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks)
      }
    },
    onSuccess: (newTask, title, context) => {
      // Replace temp task with real task
      queryClient.setQueryData<Task[]>(['tasks'], (old = []) =>
        old.map(task => task.id === context?.tempTask.id ? newTask : task)
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const handleTaskStatusChange = useCallback((taskId: string, status: Task['status']) => {
    // Prevent multiple rapid calls for the same task
    if (updateTaskMutation.isPending) return
    updateTaskMutation.mutate({ id: taskId, status })
  }, [updateTaskMutation])

  function handleTaskSave(updatedTask: Partial<Task>) {
    if (!activeTask) return
    updateTaskMutation.mutate({ id: activeTask.id, ...updatedTask })
  }

  function handleTaskDelete(taskId: string) {
    deleteTaskMutation.mutate(taskId)
  }

  function handleAddTask() {
    createTaskMutation.mutate('New Task')
  }

  const activeTask = tasks.find(task => task.id === activeTaskId)

  if (isLoading) {
    return <WidgetLoader minHeight="h-[280px]" />
  }

  if (isError) {
    return (
      <Card className="dashCard h-full">
        <div className="flex items-center justify-center h-full text-destructive">
          Failed to load tasks. Please try again later.
        </div>
      </Card>
    )
  }

  return (
    <Card className="dashCard h-full">
      <ListHeader title="Tasks" className="p-[var(--widget-padding)] flex-shrink-0">
        <AddButton onClick={handleAddTask} />
      </ListHeader>
      <ScrollArea className="h-[calc(100%-var(--widget-header-height))]">
        <div className="p-[var(--widget-padding)]">
          {tasks.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No tasks yet. Click + to add one.
            </div>
          ) : (
    <motion.div 
              className="space-y-[var(--widget-list-spacing)]"
      initial="hidden"
      animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1 }
                }
              }}
    >
      <AnimatePresence>
        {tasks.map(task => (
          <motion.div
            key={task.id}
            layoutId={`card-${task.id}`}
                    variants={{
                      hidden: { y: 20, opacity: 0 },
                      visible: { y: 0, opacity: 1 },
                      exit: { x: -50, opacity: 0 }
                    }}
            onClick={() => setActiveTaskId(task.id)}
                    className="group listItem"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Checkbox
                id={`task-${task.id}`}
                checked={task.status === 'completed'}
                onCheckedChange={checked =>
                          handleTaskStatusChange(task.id, checked ? 'completed' : 'pending')
                }
                onClick={e => e.stopPropagation()}
              />
              <motion.h3
                layoutId={`title-${task.id}`}
                className="font-medium text-foreground flex-1 line-clamp-1"
              >
                {task.title}
              </motion.h3>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {activeTask && (
        <ExpandingModal
          isOpen={!!activeTask}
          setIsOpen={() => setActiveTaskId(null)}
          layoutId={`card-${activeTask.id}`}
          className="backdrop-blur-sm bg-black/20"
        >
          <div className="relative h-full p-6">
            <div className="absolute top-6 right-6 z-10">
              <ActionsMenu onDelete={() => handleTaskDelete(activeTask.id)} />
            </div>
            <EditTaskForm task={activeTask} onSave={handleTaskSave} />
          </div>
        </ExpandingModal>
      )}
    </Card>
  )
}