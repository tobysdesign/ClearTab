'use client'

// Icons replaced with ASCII placeholders
import React, { useEffect, useState, useTransition } from 'react'
import type { Task } from '@/shared/schema'
// Removed useDebouncedCallback as optimistic updates will trigger direct saves
import dynamic from 'next/dynamic'
import { EMPTY_QUILL_CONTENT, type QuillDelta } from '@/shared/schema'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
// Removed CalendarIcon as it's not used directly in JSX
import { formatDateSmart } from '@/lib/date-utils'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { TaskEditor } from '@/components/ui/task-editor'
import { FormField, FormRow, TextInput, DateInput, PriorityToggle } from '@/components/ui/form-field'
import { FormButtons, CheckboxField } from '@/components/ui/form-buttons'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import styles from './edit-task-form.module.css'
// API functions for tasks
async function updateTaskAPI(task: Partial<Task> & { id: string }): Promise<Task> {
  console.log('updateTaskAPI called with:', task);
  const res = await fetch(`/api/tasks`, {
    method: 'PUT',
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
  onSave?: (updatedTask: Task, operation: 'update' | 'create' | 'delete') => void
  onCancel?: () => void // Add cancel handler for deleting draft tasks
  initialDescription?: string; // Add prop for initial description from editor selection
}

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.any().optional(), // Use QuillDelta for content
  isCompleted: z.boolean().default(false),
  isHighPriority: z.boolean().default(false), // Use isHighPriority instead of priority
  dueDate: z.date().optional().nullable(),
})

type TaskFormValues = z.infer<typeof taskSchema>

export function EditTaskForm({
  task,
  onClose,
  onSave,
  onCancel,
  initialDescription = ''
}: EditTaskFormProps) {
  const [isPending, startTransition] = useTransition();
  const [lastSaveResult, setLastSaveResult] = useState<any>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Initialize content with either the task content or the selected text from editor
  // Use useMemo to prevent recreating on every render
  const initialContent = React.useMemo(() => {
    return task?.content || 
      (initialDescription ? { ops: [{ insert: initialDescription }, { insert: '\n' }] } : EMPTY_QUILL_CONTENT);
  }, [task?.id, initialDescription]); // Only recreate if task ID or initialDescription changes
  
  const [currentContent, setCurrentContent] = useState<QuillDelta>(
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
      title: task?.title || '',
      content: initialContent, // Use initialContent for default value
      isCompleted: task?.isCompleted || false,
      isHighPriority: task?.isHighPriority || false, // Default to false
      dueDate: task?.dueDate ? (typeof task.dueDate === 'string' ? new Date(task.dueDate) : task.dueDate) : null,
    },
  })

  useEffect(() => {
    if (task) {
      console.log('EditTaskForm: Setting up form for task:', task)
      console.log('Task content:', task.content)
      // Convert string dates to Date objects if needed
      const taskDueDate = task.dueDate ? (typeof task.dueDate === 'string' ? new Date(task.dueDate) : task.dueDate) : null;
      
      form.reset({
        title: task.title,
        content: task.content || EMPTY_QUILL_CONTENT,
        isCompleted: task.isCompleted,
        isHighPriority: task.isHighPriority, // Set from task
        dueDate: taskDueDate,
      })
      setCurrentContent(JSON.parse(JSON.stringify(task.content || EMPTY_QUILL_CONTENT)))
    } else if (initialDescription) {
      form.reset({
        title: getInitialTitle(),
        content: initialContent,
        isCompleted: false,
        isHighPriority: false, // Default for new tasks
        dueDate: null, // Optional - no default date for new tasks
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id, initialDescription]) // Only run when task ID or initialDescription changes

  useEffect(() => {
    // Only call onSave for new task creation, not for updates
    if (lastSaveResult?.data?.success && !task && lastSaveResult.data.task) {
      onSave?.(lastSaveResult.data.task, 'create')
    } else if (lastSaveResult?.data?.error) {
      console.error('Server error:', lastSaveResult.data.error)
    }
  }, [lastSaveResult, onSave, task])

  // Submit form directly on change for optimistic updates
  const handleFormChange = (forceSubmit = false) => {
    // Submit if there are actual changes OR if forced (for switches/checkboxes)
    if (form.formState.isDirty || forceSubmit) {
      console.log('Form is dirty or forced, submitting:', form.getValues());
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

        // Call onSave callback with specific task data and operation
        if (onSave) {
          const operation = task?.id ? 'update' : 'create';
          onSave(result, operation);
        }
      } catch (error) {
        console.error('Failed to save task:', error);
        setLastSaveResult({ data: { success: false, error: (error as Error).message } });

        // Show user-friendly error message
        alert(`Failed to save task: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  }

  // Use onChange for editor, with debounced save
  const handleEditorChange = (content: QuillDelta) => {
    console.log('Editor content changed:', content);
    setCurrentContent(content);
    // Update form value without marking as dirty to avoid triggering saves
    form.setValue('content', content, { shouldDirty: false });
    // The form will be saved on blur when user finishes editing
  };

  // Check if the due date is in the past
  const isDateInPast = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.formContent}>
        <form className={styles.formFields}>
          <FormField label="TITLE">
            <TextInput
              value={form.watch('title')}
              onChange={(value) => {
                form.setValue('title', value, { shouldDirty: true });
                handleFormChange();
              }}
              placeholder="Enter task title"
            />
          </FormField>

          <FormRow>
            <FormField label="DUE BY">
              <div className="relative">
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <DateInput
                      value={form.watch('dueDate') ? formatDateSmart(form.watch('dueDate') as Date) : ''}
                      onClick={() => setDatePickerOpen(true)}
                      placeholder="28/07/25"
                    />
                  </PopoverTrigger>
                  <PopoverContent
                    className={cn(styles.datePickerPopover, "md3-elevation-3")}
                    style={{
                      backgroundColor: 'var(--md-sys-color-surface-container-high)',
                      border: '1px solid var(--md-sys-color-outline)'
                    }}
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Calendar
                      mode="single"
                      selected={form.watch('dueDate') || undefined}
                      onSelect={(date) => {
                        form.setValue('dueDate', date || null, { shouldDirty: true });
                        handleFormChange(true);
                        setDatePickerOpen(false);
                      }}
                      className="rounded-md"
                      initialFocus
                    />
                    {form.watch('dueDate') && (
                      <div className={styles.datePickerClearButton}>
                        <button
                          type="button"
                          onClick={() => {
                            form.setValue('dueDate', null, { shouldDirty: true });
                            handleFormChange(true);
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
              </div>
            </FormField>

            <PriorityToggle
              checked={form.watch('isHighPriority')}
              onChange={(checked) => {
                form.setValue('isHighPriority', checked, { shouldDirty: true });
                handleFormChange(true);
              }}
            />
          </FormRow>

          <FormField label="DESCRIPTION">
            <TaskEditor
              key={`task-editor-${task?.id || 'new'}`}
              initialContent={currentContent}
              onChange={handleEditorChange}
              onBlur={() => {
                form.setValue('content', currentContent, { shouldDirty: true });
                handleFormChange();
              }}
              placeholder="Describe the task..."
              className={styles.taskEditor}
            />
          </FormField>

          <CheckboxField
            checked={form.watch('isCompleted')}
            onChange={(checked) => {
              form.setValue('isCompleted', checked, { shouldDirty: true });
              handleFormChange(true);
            }}
            label="Mark complete"
          />
        </form>
      </div>
      <FormButtons
        mode={task ? 'edit' : 'create'}
        onPrimary={onClose}
        onSecondary={onCancel || onClose}
      />
    </div>
  );
} 