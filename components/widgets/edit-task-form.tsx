'use client'

// Icons replaced with ASCII placeholders
import { useEffect, useState, useTransition } from 'react'
import type { Task } from '@/shared/schema'
// Removed useDebouncedCallback as optimistic updates will trigger direct saves
import { Input } from '@/components/ui/input'
import dynamic from 'next/dynamic'
import { Block } from '@blocknote/core'
import { EMPTY_BLOCKNOTE_CONTENT, BlockNoteContentSchema } from '@/shared/schema'

import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
// Removed CalendarIcon as it's not used directly in JSX
import { format } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { motion } from 'framer-motion'
import { TaskEditor } from '@/components/ui/task-editor'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
// API functions for tasks
async function updateTaskAPI(task: Partial<Task> & { id: string }): Promise<Task> {
  console.log('updateTaskAPI called with:', task);
  const res = await fetch(`/api/tasks/${task.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  })
  
  console.log('Update API response status:', res.status);
  
  if (!res.ok) {
    const errorBody = await res.json();
    console.error('Update API error response:', errorBody);
    throw new Error('Failed to update task')
  }
  const response = await res.json()
  console.log('Update API success response:', response);
  return response.data
}

async function createTaskAPI(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<Task> {
  console.log('createTaskAPI called with:', taskData);
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskData),
  })
  
  console.log('API response status:', res.status);
  
  if (!res.ok) {
    const errorBody = await res.json();
    console.error('API error response:', errorBody);
    throw new Error(errorBody.error || 'Failed to create task')
  }
  const response = await res.json()
  console.log('API success response:', response);
  return response.data
}
// Removed StatusDropdown and Select/SelectItem as priority is now a boolean
// import { StatusDropdown } from '@/components/ui/status-dropdown'
// import { Select, SelectItem } from '@/components/ui/select'

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
  content: BlockNoteContentSchema.optional(), // Use BlockNoteContentSchema for content
  isCompleted: z.boolean().default(false),
  isHighPriority: z.boolean().default(false), // Use isHighPriority instead of priority
  dueDate: z.date().optional().nullable(),
})

type TaskFormValues = z.infer<typeof taskSchema>

export function EditTaskForm({
  task,
  onClose,
  onSave,
  initialDescription = ''
}: EditTaskFormProps) {
  const [isPending, startTransition] = useTransition();
  const [lastSaveResult, setLastSaveResult] = useState<any>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Initialize content with either the task content or the selected text from editor
  const initialContent = task?.content || 
    (initialDescription ? [{ type: 'paragraph', content: [{ type: 'text', text: initialDescription }] }] as Block[] : EMPTY_BLOCKNOTE_CONTENT);
  
  const [currentContent, setCurrentContent] = useState<Block[]>(
    JSON.parse(JSON.stringify(initialContent))
  );

  // Generate initial title from the first line of the content if available
  const getInitialTitle = () => {
    if (task?.title) return task.title;
    if (initialDescription) {
      const firstLine = initialDescription.split('\n')[0];
      return firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;
    }
    return '';
  };

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: getInitialTitle(),
      content: initialContent, // Use initialContent for default value
      isCompleted: task?.isCompleted || false,
      isHighPriority: task?.isHighPriority || false, // Default to false
      dueDate: task?.dueDate || null, // Optional - no default date
    },
  })

  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title,
        content: task.content || EMPTY_BLOCKNOTE_CONTENT,
        isCompleted: task.isCompleted,
        isHighPriority: task.isHighPriority, // Set from task
        dueDate: task.dueDate || null,
      })
      setCurrentContent(JSON.parse(JSON.stringify(task.content || EMPTY_BLOCKNOTE_CONTENT)))
    } else if (initialDescription) {
      form.reset({
        title: getInitialTitle(),
        content: initialContent,
        isCompleted: false,
        isHighPriority: false, // Default for new tasks
        dueDate: null, // Optional - no default date for new tasks
      });
    }
  }, [task, initialDescription, form, initialContent])

  useEffect(() => {
    // Only call onSave for new task creation, not for updates
    if (lastSaveResult?.data?.success && !task) {
      onSave?.()
    } else if (lastSaveResult?.data?.error) {
      console.error('Server error:', lastSaveResult.data.error)
    }
  }, [lastSaveResult, onSave, task])

  // Submit form directly on change for optimistic updates
  const handleFormChange = () => {
    // Only submit if there are actual changes
    if (form.formState.isDirty) {
      console.log('Form is dirty, submitting:', form.getValues());
      onSubmit(form.getValues());
    } else {
      console.log('Form not dirty, skipping submit');
    }
  };

  const onSubmit = async (values: TaskFormValues) => {
    console.log('onSubmit called with values:', values);
    console.log('currentContent:', currentContent);
    
    const dataToSend = {
      title: values.title || '', // Ensure title is always provided
      content: currentContent, // Use currentContent for description
      isCompleted: values.isCompleted || false,
      isHighPriority: values.isHighPriority || false, // Ensure default
      dueDate: values.dueDate || null,
      order: task?.order || null, // Include order field, use existing or null for new tasks
    }
    
    console.log('dataToSend:', dataToSend);

    startTransition(async () => {
      try {
        let result;
        if (task?.id) {
          console.log('Updating existing task:', task.id);
          result = await updateTaskAPI({ id: task.id, ...dataToSend });
        } else {
          console.log('Creating new task');
          result = await createTaskAPI(dataToSend);
        }
        console.log('Save result:', result);
        setLastSaveResult({ data: { success: true, data: result } });
      } catch (error) {
        console.error('Failed to save task:', error);
        setLastSaveResult({ data: { success: false, error: (error as Error).message } });
      }
    });
  }

  // Use onChange for editor, which also triggers form submission
  const handleEditorChange = (content: Block[]) => {
    console.log('Editor content changed:', content);
    setCurrentContent(content);
    // Mark form as dirty since editor content changed
    form.setValue('content', content, { shouldDirty: true });
    handleFormChange(); // Trigger form submission on editor change
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-6">
        <form className="space-y-4">
      <div className="md3-text-field md3-text-field--with-label">
        <div className="md3-text-field__container">
          <input
            id="title"
            {...form.register('title')}
            placeholder=" "
            className="md3-text-field__input"
            onBlur={handleFormChange}
          />
          <label htmlFor="title" className="md3-text-field__label">
            Task Title
          </label>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="md3-text-field md3-text-field--with-label flex-shrink-0" style={{width: '120px'}}>
          <div className="md3-text-field__container relative">
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <input
                  readOnly
                  value={form.watch('dueDate') ? format(form.watch('dueDate') as Date, 'dd/MM/yyyy') : ''}
                  className="md3-text-field__input cursor-pointer pr-8"
                  placeholder=" "
                />
              </PopoverTrigger>
              <PopoverContent 
                className="w-auto p-0 rounded-lg md3-elevation-3" 
                style={{
                  backgroundColor: 'var(--md-sys-color-surface-container-high)',
                  border: '1px solid var(--md-sys-color-outline)'
                }}
                onOpenAutoFocus={(e) => e.preventDefault()}
                onClick={(e) => e.stopPropagation()}
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
              >
                <Calendar
                  mode="single"
                  selected={form.watch('dueDate') || undefined}
                  onSelect={(date) => {
                    form.setValue('dueDate', date || null, { shouldDirty: true });
                    handleFormChange();
                    setDatePickerOpen(false);
                  }}
                  className="rounded-md"
                  initialFocus
                />
                {form.watch('dueDate') && (
                  <div className="p-2 border-t border-[var(--md-sys-color-outline)]">
                    <button
                      type="button"
                      onClick={() => {
                        form.setValue('dueDate', null, { shouldDirty: true });
                        handleFormChange();
                        setDatePickerOpen(false);
                      }}
                      className="w-full text-sm text-red-400 hover:text-red-300 py-1"
                    >
                      Remove date
                    </button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
            {form.watch('dueDate') && (
              <button
                type="button"
                onClick={() => {
                  form.setValue('dueDate', null, { shouldDirty: true });
                  handleFormChange();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/40 p-1"
              >
                <span size={16}>×</span>
              </button>
            )}
            <label htmlFor="dueDate" className="md3-text-field__label">
              Due by (optional)
            </label>
          </div>
        </div>
        <div className="flex items-center space-x-3 flex-shrink-0" style={{width: 'fit-content'}}>
          <div 
            className={`md3-switch ${form.watch('isHighPriority') ? 'md3-switch--checked' : ''}`}
            onClick={() => {
              const newValue = !form.watch('isHighPriority');
              form.setValue('isHighPriority', newValue, { shouldDirty: true });
              handleFormChange();
            }}
          >
            <div className="md3-switch__thumb"></div>
          </div>
          <label className="md3-on-surface-variant cursor-pointer whitespace-nowrap text-sm" onClick={() => {
            const newValue = !form.watch('isHighPriority');
            form.setValue('isHighPriority', newValue, { shouldDirty: true });
            handleFormChange();
          }}>
            High Priority
          </label>
        </div>
      </div>

      <div className="md3-text-field md3-text-field--with-label">
        <div className="md3-text-field__container relative">
          <TaskEditor
            initialContent={currentContent}
            onChange={handleEditorChange}
            placeholder="Describe the task..."
            className="task-description-editor md3-text-field__input"
            style={{
              border: '1px solid var(--md-sys-color-outline)',
              borderRadius: 'var(--md-sys-shape-corner-extra-small)',
              minHeight: '80px',
              padding: '0'
            }}
          />
          <label className="md3-text-field__label">
            Description
          </label>
        </div>
      </div>

      <div className="flex items-center space-x-3 pb-4">
        <div 
          className={`md3-checkbox ${form.watch('isCompleted') ? 'md3-checkbox--checked' : ''}`}
          onClick={() => {
            const newValue = !form.watch('isCompleted');
            form.setValue('isCompleted', newValue, { shouldDirty: true });
            handleFormChange();
          }}
        >
          {form.watch('isCompleted') && (
            <svg className="md3-checkbox__checkmark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20,6 9,17 4,12"></polyline>
            </svg>
          )}
        </div>
        <label className="md3-on-surface-variant cursor-pointer text-sm" onClick={() => {
          const newValue = !form.watch('isCompleted');
          form.setValue('isCompleted', newValue, { shouldDirty: true });
          handleFormChange();
        }}>
          Mark as Complete
        </label>
      </div>
        </form>
      </div>
      <div className="p-4 border-t border-[var(--md-sys-color-outline)]">
        <button
          type="button"
          onClick={onClose}
          className="md3-button md3-button--filled w-full"
        >
          Done
        </button>
      </div>
    </div>
  );
} 