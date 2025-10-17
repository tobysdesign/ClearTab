import { useCallback } from 'react'
import { useExtensionStorage } from './use-extension-storage'

export interface ExtensionTask {
  id: string
  title: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  dueDate?: string
  createdAt: string
  updatedAt: string
}

export function useExtensionTasks() {
  const { data: tasks, setData: setTasks, loading, error } = useExtensionStorage<ExtensionTask[]>('tasks', [])

  const addTask = useCallback(async (title: string, priority: 'low' | 'medium' | 'high' = 'medium') => {
    const newTask: ExtensionTask = {
      id: Date.now().toString(),
      title,
      completed: false,
      priority,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const updatedTasks = [newTask, ...tasks]
    await setTasks(updatedTasks)
    return newTask
  }, [tasks, setTasks])

  const updateTask = useCallback(async (id: string, updates: Partial<ExtensionTask>) => {
    const updatedTasks = tasks.map(task =>
      task.id === id
        ? { ...task, ...updates, updatedAt: new Date().toISOString() }
        : task
    )
    await setTasks(updatedTasks)
  }, [tasks, setTasks])

  const toggleTask = useCallback(async (id: string) => {
    await updateTask(id, { completed: !tasks.find(t => t.id === id)?.completed })
  }, [tasks, updateTask])

  const deleteTask = useCallback(async (id: string) => {
    const updatedTasks = tasks.filter(task => task.id !== id)
    await setTasks(updatedTasks)
  }, [tasks, setTasks])

  const getTask = useCallback((id: string) => {
    return tasks.find(task => task.id === id)
  }, [tasks])

  // Helper getters
  const completedTasks = tasks.filter(task => task.completed)
  const incompleteTasks = tasks.filter(task => !task.completed)
  const priorityTasks = tasks.filter(task => task.priority === 'high' && !task.completed)

  return {
    tasks,
    completedTasks,
    incompleteTasks,
    priorityTasks,
    loading,
    error,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    getTask
  }
}