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
import { EmptyState } from '@/components/ui/empty-state'
import { CheckSquare } from 'lucide-react'

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
  console.log("API: Creating task with title:", title);
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, status: 'pending' }),
  })
  if (!res.ok) {
    const errorBody = await res.json();
    console.error("API: Failed to create task, error:", errorBody);
    throw new Error(errorBody.error || 'Failed to create task')
  }
  const response = await res.json()
  console.log("API: Task created successfully:", response.data);
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
    
    console.log("Creating task from editor text, title:", title);
    
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        title, 
        status: 'pending',
        // We'll handle the description formatting in the edit form
      }),
    });
    
    if (!res.ok) {
      const errorBody = await res.json();
      console.error("Failed to create task from text, error:", errorBody);
      throw new Error(errorBody.error || 'Failed to create task');
    }
    
    const response = await res.json();
    return response.data;
  } catch (error) {
    console.error("Error creating task from text:", error);
    return null;
  }
}

export function TasksWidget({ searchQuery }: TasksWidgetProps) {
  const queryClient = useQueryClient()
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [newTaskText, setNewTaskText] = useState<string | null>(null)

  const { data, isLoading, isError } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  })

  // Ensure tasks is always an array
  const tasks = Array.isArray(data) ? data : []

  const updateTaskMutation = useMutation({
    mutationFn: updateTask,
    onMutate: async (updatedTask) => {
      console.log("Mutation: updateTask - onMutate, updating:", updatedTask);
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
      console.error("Mutation: updateTask - onError:", err, updatedTask);
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks)
      }
    },
    onSettled: () => {
      console.log("Mutation: updateTask - onSettled");
      // Always refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTask,
    onMutate: async (taskId) => {
      console.log("Mutation: deleteTask - onMutate, deleting ID:", taskId);
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks'])
      
      queryClient.setQueryData<Task[]>(['tasks'], (old = []) =>
        old.filter(task => task.id !== taskId)
      )
      
      return { previousTasks }
    },
    onError: (err, taskId, context) => {
      console.error("Mutation: deleteTask - onError:", err, taskId);
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks)
      }
    },
    onSuccess: () => {
      console.log("Mutation: deleteTask - onSuccess");
      setActiveTaskId(null)
    },
    onSettled: () => {
      console.log("Mutation: deleteTask - onSettled");
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const createTaskMutation = useMutation({
    mutationFn: createTask,
    onMutate: async (title) => {
      console.log("Mutation: createTask - onMutate, title:", title);
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
      
      console.log("Mutation: createTask - onMutate, added tempTask:", tempTask);
      return { previousTasks, tempTask }
    },
    onError: (err, title, context) => {
      console.error("Mutation: createTask - onError:", err, title);
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks)
      }
    },
    onSuccess: (newTask, title, context) => {
      console.log("Mutation: createTask - onSuccess, newTask:", newTask, "tempTask:", context?.tempTask);
      // Replace temp task with real task
      queryClient.setQueryData<Task[]>(['tasks'], (old = []) =>
        old.map(task => task.id === context?.tempTask.id ? newTask : task)
      )
      console.log("Mutation: createTask - onSuccess, replaced tempTask with real task");
    },
    onSettled: () => {
      console.log("Mutation: createTask - onSettled");
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const handleTaskStatusChange = useCallback((taskId: string, status: Task['status']) => {
    // Prevent multiple rapid calls for the same task
    if (updateTaskMutation.isPending) return
    console.log("handleTaskStatusChange: Updating task status for ID:", taskId, "to:", status);
    updateTaskMutation.mutate({ id: taskId, status })
  }, [updateTaskMutation])

  function handleTaskSave(updatedTask: Partial<Task>) {
    if (!activeTask) return
    console.log("handleTaskSave: Saving task:", updatedTask);
    updateTaskMutation.mutate({ id: activeTask.id, ...updatedTask })
  }

  function handleTaskDelete(taskId: string) {
    console.log("handleTaskDelete: Deleting task ID:", taskId);
    deleteTaskMutation.mutate(taskId)
  }

  function handleAddTask() {
    console.log("handleAddTask: Creating new task");
    createTaskMutation.mutate('New Task')
  }
  
  // Function to handle creating a task from editor text
  function handleCreateTaskFromEditorText(text: string) {
    console.log("Creating task from editor text:", text);
    setNewTaskText(text);
    // Create a basic task and then open the edit form
    createTaskMutation.mutate(text.split('\n')[0] || 'New Task');
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
            <EmptyState
              icon={CheckSquare}
              title="No tasks yet"
              description="Stay organized and boost your productivity by creating your first task."
              action={{
                label: "Create Task",
                onClick: handleAddTask
              }}
              className="h-full"
            />
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
              {/* Task items would be here */}
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
                        onCheckedChange={(checked) =>
                          handleTaskStatusChange(task.id, checked ? 'completed' : 'pending')
                        }
                        onClick={e => e.stopPropagation()}
                      />
                      <motion.h3
                        className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {task.title}
                      </motion.h3>
                      <ActionsMenu onDelete={() => handleTaskDelete(task.id)} />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </ScrollArea>
    </Card>
  )
}