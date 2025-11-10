'use client'

// Icons replaced with ASCII placeholders
import React, { useEffect, useState, useTransition } from 'react'
import type { Task } from '@/shared/schema'
// Removed useDebouncedCallback as optimistic updates will trigger direct saves
import dynamic from 'next/dynamic'
import { EMPTY_QUILL_CONTENT, type QuillDelta } from '@/shared/schema'

// Removed Popover components and formatDateSmart as they're no longer needed
import { DatePicker } from '@/components/ui/date-picker'
import { TaskEditor } from '@/components/ui/task-editor'
import { FormField, FormRow, PriorityToggle } from '@/components/ui/form-field'
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
  initialText?: string; // Add prop for initial description from editor selection
  isCreating?: boolean;
  isLoadingTask?: boolean; // Add loading state prop
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
  initialText = '',
  isCreating = false,
  isLoadingTask = false
}: EditTaskFormProps) {
  const initialDescription = initialText;
  const [isPending, startTransition] = useTransition();
  const [lastSaveResult, setLastSaveResult] = useState<any>(null);
  const [localTitle, setLocalTitle] = useState<string>('');


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

  // Use a ref to track if we've already initialized this task
  const initializedTaskId = React.useRef<string | null>(null);

  useEffect(() => {
    // Only reset form if we haven't initialized this task yet
    if (task && task.id !== initializedTaskId.current) {
      console.log('EditTaskForm: Setting up form for NEW task:', task.id)
      console.log('Task content:', task.content)

      initializedTaskId.current = task.id;

      // Convert string dates to Date objects if needed
      const taskDueDate = task.dueDate ? (typeof task.dueDate === 'string' ? new Date(task.dueDate) : task.dueDate) : null;

      form.reset({
        title: task.title,
        content: task.content || EMPTY_QUILL_CONTENT,
        isCompleted: task.isCompleted,
        isHighPriority: task.isHighPriority, // Set from task
        dueDate: taskDueDate,
      })
      setLocalTitle(task.title || '')
      setCurrentContent(JSON.parse(JSON.stringify(task.content || EMPTY_QUILL_CONTENT)))
    } else if (initialDescription && initializedTaskId.current === null) {
      console.log('EditTaskForm: Setting up form for new task from description')
      initializedTaskId.current = 'new-task';

      form.reset({
        title: getInitialTitle(),
        content: initialContent,
        isCompleted: false,
        isHighPriority: false, // Default for new tasks
        dueDate: null, // Optional - no default date for new tasks
      });
      setLocalTitle(getInitialTitle());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id, initialDescription]) // Only run when task ID or initialDescription changes

  // Reset the initialized task ref when the component unmounts or task changes
  useEffect(() => {
    return () => {
      initializedTaskId.current = null;
      // Clean up background save timeout
      if (backgroundSaveTimeoutRef.current) {
        clearTimeout(backgroundSaveTimeoutRef.current);
      }
    };
  }, [task?.id]);

  useEffect(() => {
    // Only call onSave for new task creation, not for updates
    if (lastSaveResult?.data?.success && !task && lastSaveResult.data.task) {
      onSave?.(lastSaveResult.data.task, 'create')
    } else if (lastSaveResult?.data?.error) {
      console.error('Server error:', lastSaveResult.data.error)
    }
  }, [lastSaveResult, onSave, task])

  // Background save system like notes widget
  const backgroundSaveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);


  const onSubmit = async (values: TaskFormValues) => {
    console.log('🔧 EditTaskForm onSubmit - values:', values);
    console.log('🔧 EditTaskForm onSubmit - currentContent:', currentContent);
    console.log('🔧 EditTaskForm onSubmit - task:', task);
    console.log('🔧 EditTaskForm onSubmit - isCreating:', !task?.id);
    
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

  // Define scheduleBackgroundSave AFTER onSubmit to avoid circular dependency
  const scheduleBackgroundSave = React.useCallback(() => {
    // Clear any existing timeout
    if (backgroundSaveTimeoutRef.current) {
      clearTimeout(backgroundSaveTimeoutRef.current);
    }

    // Schedule save for 1 second from now (faster than notes for better UX)
    backgroundSaveTimeoutRef.current = setTimeout(() => {
      console.log('🔧 EditTaskForm - Background save triggered');
      onSubmit(form.getValues());
    }, 1000);
  }, [form, onSubmit]);

  // Define handleFormChange after all dependencies are available
  const handleFormChange = React.useCallback((forceSubmit = false) => {
    console.log('🔧 EditTaskForm handleFormChange - forceSubmit:', forceSubmit);

    if (forceSubmit) {
      // Cancel background save and save immediately for critical actions
      if (backgroundSaveTimeoutRef.current) {
        clearTimeout(backgroundSaveTimeoutRef.current);
      }
      console.log('🔧 EditTaskForm - Force submit, saving immediately');
      onSubmit(form.getValues());
    } else {
      // Schedule background save for text changes
      console.log('🔧 EditTaskForm - Scheduling background save');
      scheduleBackgroundSave();
    }
  }, [form, onSubmit, scheduleBackgroundSave]);

  // Use onChange for editor, with background save like notes widget
  const handleEditorChange = (content: QuillDelta) => {
    console.log('🔧 EditTaskForm Editor content changed:', content);
    setCurrentContent(content);
    // Update form value without marking as dirty to avoid triggering saves
    form.setValue('content', content, { shouldDirty: false });
    // Schedule background save (won't interrupt typing)
    scheduleBackgroundSave();
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
        {isLoadingTask ? (
          <div className={styles.formFields}>
            <FormField label="TITLE">
              <div className={styles.skeletonField}></div>
            </FormField>
            <div className={styles.skeletonDateRow}>
              <FormField label="DUE BY">
                <div className={styles.skeletonDateField}></div>
              </FormField>
              <div className={styles.skeletonPriorityField}></div>
            </div>
            <FormField label="DESCRIPTION">
              <div className={styles.skeletonEditor}></div>
            </FormField>
          </div>
        ) : (
          <form className={styles.formFields}>
            <FormField label="TITLE">
              <input
                type="text"
                value={localTitle}
                onChange={(e) => {
                  setLocalTitle(e.target.value);
                  form.setValue('title', e.target.value, { shouldDirty: false });
                  handleFormChange(); // This will now schedule background save, not immediate
                }}
                onBlur={() => {
                  // Save immediately on blur
                  if (backgroundSaveTimeoutRef.current) {
                    clearTimeout(backgroundSaveTimeoutRef.current);
                  }
                  form.setValue('title', localTitle, { shouldDirty: true });
                  onSubmit(form.getValues());
                }}
                placeholder="Enter task title"
                className={styles.textInput}
              />
            </FormField>

          <FormRow>
            <FormField label="DUE BY">
              <DatePicker
                date={form.watch('dueDate') || undefined}
                onSelect={(date) => {
                  form.setValue('dueDate', date || null, { shouldDirty: true });
                  handleFormChange(true);
                }}
                placeholder="28/07/25"
                className={styles.datePicker}
              />
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
                // Save immediately on blur
                if (backgroundSaveTimeoutRef.current) {
                  clearTimeout(backgroundSaveTimeoutRef.current);
                }
                form.setValue('content', currentContent, { shouldDirty: true });
                onSubmit(form.getValues());
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
        )}
      </div>
      {isLoadingTask ? (
        <div className={styles.buttonSkeleton}>
          <div className={styles.skeletonButton}></div>
          <div className={styles.skeletonButton}></div>
        </div>
      ) : (
        <FormButtons
          mode={task ? 'edit' : 'create'}
          onPrimary={onClose}
          onSecondary={onCancel || onClose}
        />
      )}
    </div>
  );
} 
