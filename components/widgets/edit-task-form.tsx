'use client'

import { useEffect, useState } from 'react'
import type { Task } from '@/shared/schema'
import { useDebouncedCallback } from 'use-debounce'
import { Input } from '@/components/ui/input'
import dynamic from 'next/dynamic'
import { YooptaContentValue, EMPTY_CONTENT } from '@/types/yoopta'

import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { motion } from 'framer-motion'
import { Editor } from '@/components/ui/editor'
import { useActionState } from 'react'
import { updateTask, createTask } from '@/lib/actions/tasks'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { StatusDropdown } from '@/components/ui/status-dropdown'
import type { ActionResponse } from '@/types/actions'

const EditorComponent = dynamic(
  () => import('@/components/ui/editor').then(mod => mod.Editor),
  {
    ssr: false,
    loading: () => <p>Loading editor...</p>,
  },
)

interface EditTaskFormProps {
  task?: Task | null
  onClose?: () => void
  onSave?: () => void
  initialDescription?: string; // Add prop for initial description from editor selection
}

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.any().optional(),
  status: z.enum(['pending', 'completed', 'important']),
  dueDate: z.date().optional().nullable(),
})

type TaskFormValues = z.infer<typeof taskSchema>

// Helper function to convert plain text to Yoopta format
function textToYooptaContent(text: string): YooptaContentValue {
  try {
    // Try to parse if it's already in JSON format
    const parsed = JSON.parse(text);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed;
    }
  } catch (e) {
    // Not JSON, continue with text conversion
  }

  // Create a simple paragraph content structure
  const content = {
    'paragraph-1': {
      id: 'paragraph-1',
      type: 'paragraph',
      value: [{
        id: 'paragraph-1-element',
        type: 'paragraph',
        children: [{ text }],
        props: { nodeType: 'block' },
      }],
      meta: { order: 0, depth: 0 },
    },
  };

  return content;
}

export function EditTaskForm({
  task,
  onClose,
  onSave,
  initialDescription = ''
}: EditTaskFormProps) {
  const [formState, formAction] = useActionState<ActionResponse<Task | null>, TaskFormValues & { id?: string }>(task ? updateTask : createTask, null)
  
  // Initialize description with either the task description or the selected text from editor
  const initialDescriptionContent = task?.description || 
    (initialDescription ? textToYooptaContent(initialDescription) : EMPTY_CONTENT);
  
  const [currentDescription, setCurrentDescription] = useState<YooptaContentValue>(
    JSON.parse(JSON.stringify(initialDescriptionContent))
  );

  // Generate initial title from the first line of the description if available
  const getInitialTitle = () => {
    if (task?.title) return task.title;
    if (initialDescription) {
      // Extract first line or first 50 chars for title
      const firstLine = initialDescription.split('\n')[0];
      return firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;
    }
    return '';
  };

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: getInitialTitle(),
      description: initialDescriptionContent,
      status: task?.status || 'pending',
      dueDate: task?.dueDate || null,
    },
  })

  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title,
        description: task.description,
        status: task.status,
        dueDate: task.dueDate || null,
      })
      setCurrentDescription(JSON.parse(JSON.stringify(task.description || EMPTY_CONTENT)))
    } else if (initialDescription) {
      // For new tasks with initial description from editor selection
      form.reset({
        title: getInitialTitle(),
        description: initialDescriptionContent,
        status: 'pending',
        dueDate: null,
      });
    }
  }, [task, initialDescription, form, initialDescriptionContent])

  useEffect(() => {
    if (formState?.success) {
      onSave?.()
    } else if (formState?.error) {
      console.error('Server error:', formState.error)
    }
  }, [formState, onSave])

  const onSubmit = (values: TaskFormValues) => {
    const dataToSend = {
      ...values,
      id: task?.id,
      description: currentDescription,
    }
    formAction(dataToSend)
  }

  const handleDescriptionChange = (value: YooptaContentValue) => {
    setCurrentDescription(value)
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="p-4">
      <h2 className="text-xl font-bold mb-4">{task ? 'Edit Task' : 'Create Task'}</h2>
      <div className="mb-4">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
        <Input
          id="title"
          {...form.register('title')}
          className="mt-1 block w-full"
        />
        {form.formState.errors.title && (
          <p className="text-red-500 text-xs mt-1">{form.formState.errors.title.message}</p>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
        <Editor
          value={currentDescription}
          onChange={handleDescriptionChange}
          className="mt-1 block w-full border rounded-md min-h-[150px]"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
        <StatusDropdown
          currentStatus={form.watch('status')}
          onSelectStatus={(status: TaskFormValues['status']) => form.setValue('status', status)}
        />
      </div>

      <div className="mb-4">
        <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Due Date</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={
                `w-[240px] justify-start text-left font-normal ${!form.watch('dueDate') && "text-muted-foreground"}`
              }
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {form.watch('dueDate') ? format(form.watch('dueDate')!, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={form.watch('dueDate') || undefined}
              onSelect={(date) => form.setValue('dueDate', date || null)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {task ? 'Save Changes' : 'Create Task'}
        </Button>
      </div>
    </form>
  )
} 