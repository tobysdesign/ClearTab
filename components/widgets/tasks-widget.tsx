'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
import { ScrollShadows } from '@/components/ui/scroll-shadows'
import { ClientOnly } from '@/components/ui/safe-motion'
import X from 'lucide-react/dist/esm/icons/x'

interface TasksWidgetProps {
  searchQuery?: string
}

// API functions (these should now use isCompleted and priority for updates)
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

async function createTask(title: string, isCompleted: boolean, isHighPriority: boolean, content: any): Promise<Task> {
  console.log("API: Creating task with title:", title);
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      title, 
      isCompleted, // Use passed isCompleted
      isHighPriority, // Use passed high priority flag
      content, // Use passed content
    }),
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
        isCompleted: false, // Default for new tasks from text
        priority: 'none', // Default for new tasks from text
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
  const { setActiveTaskId, setNewTaskText, activeTask } = useTaskModal() // Ensure activeTask is destructured

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
      // Removed setActiveTaskId(null) - now handled by context's onClose
    },
    onSettled: () => {
      console.log("Mutation: deleteTask - onSettled");
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const createTaskMutation = useMutation({
    mutationFn: (newTaskData: { title: string; isCompleted: boolean; isHighPriority: boolean; content: any }) => createTask(newTaskData.title, newTaskData.isCompleted, newTaskData.isHighPriority, newTaskData.content), // Update mutationFn to accept high priority flag
    onMutate: async (newTaskData) => {
      console.log("Mutation: createTask - onMutate, newTaskData:", newTaskData);
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks'])
      
      // Create temporary task for optimistic update
      const tempTask: Task = {
        id: `temp-${Date.now()}`,
        title: newTaskData.title, // Use newTaskData.title
        isCompleted: newTaskData.isCompleted, // Use newTaskData.isCompleted
        isHighPriority: newTaskData.isHighPriority, // Use newTaskData.isHighPriority
        content: newTaskData.content, // Use newTaskData.content
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
      setActiveTaskId(newTask.id); // Open the new task in the modal
    },
    onSettled: () => {
      console.log("Mutation: createTask - onSettled");
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const handleTaskStatusChange = useCallback((taskId: string, isCompleted: boolean) => {
    // Prevent multiple rapid calls for the same task
    if (updateTaskMutation.isPending) return
    console.log("handleTaskStatusChange: Updating task completion for ID:", taskId, "to:", isCompleted);
    updateTaskMutation.mutate({ id: taskId, isCompleted }) // Update isCompleted field
  }, [updateTaskMutation])

  function handleTaskSave(updatedTask: Partial<Task>) {
    // Removed activeTask check and direct mutation - now handled by EditTaskForm's onSave
    // The EditTaskForm now directly calls updateTask server action
  }

  function handleTaskDelete(taskId: string) {
    console.log("handleTaskDelete: Deleting task ID:", taskId);
    deleteTaskMutation.mutate(taskId)
  }

  function handleAddTask() {
    console.log("handleAddTask: Creating new task");
    createTaskMutation.mutate({
      title: 'New Task',
      isCompleted: false,
      isHighPriority: false,
      content: EMPTY_BLOCKNOTE_CONTENT, // Use BlockNote's empty content structure
    });
  }
  
  // Function to handle creating a task from editor text
  function handleCreateTaskFromEditorText(text: string) {
    console.log("Creating task from editor text:", text);
    // We now just set the initial text, the modal open and form creation is handled by ClientProviders
    setNewTaskText(text);
    // Create a basic task to get an ID, then rely on the modal to open it with description
    createTaskMutation.mutate({
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
      <WidgetHeader title="Tasks">
        <AddButton onClick={handleAddTask} />
      </WidgetHeader>
      <WidgetContent>
        <ScrollShadows className="widget-full-height custom-scrollbar">
          <div className="taskEmpty">
            {tasks.length === 0 ? (
              <EmptyState
                renderIcon={() => <X className="h-6 w-6 text-gray-400" />}
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
                  className="widget-list-content"
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
                    {tasks.map((task) => (
                      <motion.div
                        key={task.id}
                        layoutId={`card-${task.id}`}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ x: -50, opacity: 0 }}
                        onClick={() => setActiveTaskId(task.id)}
                        className="group widget-list-item widget-list-item--tasks"
                      >
                        <div className="widget-flex widget-gap-3 widget-flex-1 widget-min-w-0">
                          <Checkbox
                            id={`task-${task.id}`}
                            checked={task.isCompleted}
                            onCheckedChange={(checked) =>
                              handleTaskStatusChange(task.id, checked as boolean)
                            }
                            onClick={(e) => e.stopPropagation()}
                          />
                          <h3
                            className={`item-title widget-flex-1 ${
                              task.isCompleted
                                ? 'line-through text-muted-foreground'
                                : ''
                            }`}
                          >
                            {task.title}
                          </h3>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              </ClientOnly>
            )}
          </div>
        </ScrollShadows>
      </WidgetContent>
    </WidgetContainer>
  )
}