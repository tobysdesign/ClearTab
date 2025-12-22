'use client'

// Icons replaced with ASCII placeholders
import React, { useEffect, useState, useTransition } from 'react'
import type { Task } from '@/shared/schema'
import { useDebounce } from '@/hooks/use-debounce'
import dynamic from 'next/dynamic'
import { EMPTY_QUILL_CONTENT, type QuillDelta } from '@/shared/schema'

// Module-level Set to track forms that are creating tasks (survives React StrictMode remounts)
const creatingForms = new Set<string>();

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

  // Ref-based state for robust auto-saving like Notes
  const isSavingRef = React.useRef<boolean>(false);
  const ongoingSaveRef = React.useRef<Promise<void> | null>(null);
  const createdTaskIdRef = React.useRef<string | null>(null);
  const hasInitializedRef = React.useRef<boolean>(false);
  const backgroundSaveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Initialize content with either the task content or the selected text from editor
  const initialContent = React.useMemo(() => {
    return task?.content ||
      (initialDescription ? { ops: [{ insert: initialDescription }, { insert: '\n' }] } : EMPTY_QUILL_CONTENT);
  }, [task?.id, initialDescription]);

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

  // The true source of truth for background saves
  const taskDataRef = React.useRef({
    title: task?.title || '',
    content: JSON.parse(JSON.stringify(initialContent)),
    isCompleted: task?.isCompleted || false,
    isHighPriority: task?.isHighPriority || false,
    dueDate: task?.dueDate ? (typeof task.dueDate === 'string' ? new Date(task.dueDate) : task.dueDate) : null,
  });

  // Keep form in sync for UI purposes
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: taskDataRef.current,
  })

  // Use a ref to track if we've already initialized this task
  const initializedTaskId = React.useRef<string | null>(null);

  useEffect(() => {
    // Only reset form if we haven't initialized this task yet
    // AND it's not the task we just created (prevents reset after initial save)
    if (task && task.id !== initializedTaskId.current && task.id !== createdTaskIdRef.current) {
      console.log('EditTaskForm: Adopting truly NEW task:', task.id)

      initializedTaskId.current = task.id;

      // Convert string dates to Date objects if needed
      const taskDueDate = task.dueDate ? (typeof task.dueDate === 'string' ? new Date(task.dueDate) : task.dueDate) : null;

      const newData = {
        title: task.title || '',
        content: task.content || EMPTY_QUILL_CONTENT,
        isCompleted: task.isCompleted || false,
        isHighPriority: task.isHighPriority || false,
        dueDate: taskDueDate,
      };

      // CRITICAL: Flush any pending changes to the PREVIOUS task before switching
      if (backgroundSaveTimeoutRef.current) {
        console.log('🔧 EditTaskForm - Flushing pending save before task switch');
        clearTimeout(backgroundSaveTimeoutRef.current);
        onSubmit();
      }

      form.reset(newData)
      setLocalTitle(task.title || '')
      setCurrentContent(JSON.parse(JSON.stringify(task.content || EMPTY_QUILL_CONTENT)))
      taskDataRef.current = JSON.parse(JSON.stringify(newData));
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

  // Create task immediately when form opens for new task
  useEffect(() => {
    // Use a stable key for new task forms
    const formKey = 'new-task-form';

    // Only create if this is a new task (no task.id) and we haven't created one yet
    if (!task?.id && !createdTaskIdRef.current && isCreating && !creatingForms.has(formKey)) {
      console.log('🆕 Creating initial task immediately');

      // Mark this form as creating (survives StrictMode remount)
      creatingForms.add(formKey);
      hasInitializedRef.current = true;
      const tempId = 'creating-' + Date.now();
      createdTaskIdRef.current = tempId;

      const initialData = {
        title: taskDataRef.current.title || 'Untitled Task',
        content: taskDataRef.current.content,
        isCompleted: taskDataRef.current.isCompleted,
        isHighPriority: taskDataRef.current.isHighPriority,
        dueDate: taskDataRef.current.dueDate,
        order: null,
      };

      createTaskAPI(initialData)
        .then((result) => {
          createdTaskIdRef.current = result.id;
          console.log('✅ Initial task created with ID:', result.id);

          // Clean up the form key from the Set
          creatingForms.delete(formKey);

          // Notify parent
          if (onSave) {
            onSave(result, 'create');
          }

          // Execute any queued save
          onSubmit();
        })
        .catch((error) => {
          console.error('Failed to create initial task:', error);
          // Reset on error so user can try again
          createdTaskIdRef.current = null;
          creatingForms.delete(formKey);
        });
    }
  }, []); // Only run once on mount

  // Reset the initialized task ref when the component unmounts or task changes
  useEffect(() => {
    // Reset created task ID when switching tasks
    if (task?.id) {
      createdTaskIdRef.current = null;
    }

    return () => {
      initializedTaskId.current = null;
      createdTaskIdRef.current = null;
      hasInitializedRef.current = false;

      // CRITICAL: Flush any pending changes on unmount
      if (backgroundSaveTimeoutRef.current) {
        console.log('🔧 EditTaskForm - Flushing pending save on unmount');
        clearTimeout(backgroundSaveTimeoutRef.current);
        onSubmit();
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


  const onSubmit = async (values?: TaskFormValues) => {
    // Capture the target ID for this snapshot immediately
    const targetId = task?.id || createdTaskIdRef.current;

    // Capture snapshot of the current state from Ref
    const snapshot = {
      id: targetId, // Include ID in snapshot to ensure we save to the correct task
      title: taskDataRef.current.title || 'Untitled Task',
      content: JSON.parse(JSON.stringify(taskDataRef.current.content)),
      isCompleted: taskDataRef.current.isCompleted,
      isHighPriority: taskDataRef.current.isHighPriority,
      dueDate: taskDataRef.current.dueDate,
      order: task?.order || null,
    };

    console.log('🔧 EditTaskForm chaining save for:', snapshot.title);

    const runSave = async () => {
      const idToUpdate = snapshot.id;

      if (!idToUpdate) {
        console.log('🔧 EditTaskForm - No target ID in snapshot, skipping save');
        return;
      }

      // If we're still creating with a temp ID, we shouldn't really be here 
      // but let's be safe and wait or skip if it's 'creating-'
      if (typeof idToUpdate === 'string' && idToUpdate.startsWith('creating-')) {
        console.log('🔧 EditTaskForm - Waiting for initial creation to finish...');
        return;
      }

      isSavingRef.current = true;
      try {
        let result;
        // Check if it's a "real" ID or if we're technically in create mode still 
        // (though in this new system, tasks are created on mount usually)
        if (idToUpdate && !idToUpdate.startsWith('creating-')) {
          console.log('Updating task in snapshot:', idToUpdate);
          result = await updateTaskAPI({ ...snapshot, id: idToUpdate });
        } else {
          console.log('Creating new task from snapshot');
          result = await createTaskAPI(snapshot);
          createdTaskIdRef.current = result.id;
          initializedTaskId.current = result.id;
        }

        console.log('Save successful:', result.id);

        // Update tracking ref with the saved state to prevent unnecessary re-saves if needed
        // (though we usually want to trust the server result)

        if (onSave) {
          onSave(result, existingTaskId ? 'update' : 'create');
        }

        setLastSaveResult({ data: { success: true, data: result } });
      } catch (error) {
        console.error('Failed to save task:', error);
        setLastSaveResult({ data: { success: false, error: (error as Error).message } });
      } finally {
        isSavingRef.current = false;
      }
    };

    // Chain the save operation like NotesWidget
    const previous = ongoingSaveRef.current ?? Promise.resolve();
    const chainedSave = previous
      .catch(() => undefined) // ensure chain continues
      .then(() => runSave());

    ongoingSaveRef.current = chainedSave.finally(() => {
      if (ongoingSaveRef.current === chainedSave) {
        ongoingSaveRef.current = null;
      }
    });

    return chainedSave;
  };

  // Define scheduleBackgroundSave AFTER onSubmit to avoid circular dependency
  const scheduleBackgroundSave = React.useCallback(() => {
    // Clear any existing timeout
    if (backgroundSaveTimeoutRef.current) {
      clearTimeout(backgroundSaveTimeoutRef.current);
    }

    // Check if we have a real ID (not temp 'creating-...' ID)
    const hasRealId = task?.id || (createdTaskIdRef.current && !createdTaskIdRef.current.startsWith('creating-'));
    const delay = 500; // PARITY WITH NOTES: always use 500ms

    // Schedule save for later (longer delay for new tasks)
    backgroundSaveTimeoutRef.current = setTimeout(() => {
      console.log('🔧 EditTaskForm - Background save triggered');
      onSubmit();
    }, delay);
  }, [onSubmit, task?.id]);

  // Define handleFormChange after all dependencies are available
  const handleFormChange = React.useCallback((forceSubmit = false) => {
    console.log('🔧 EditTaskForm handleFormChange - forceSubmit:', forceSubmit);

    if (forceSubmit) {
      // Cancel background save and save immediately for critical actions
      if (backgroundSaveTimeoutRef.current) {
        clearTimeout(backgroundSaveTimeoutRef.current);
      }
      console.log('🔧 EditTaskForm - Force submit, saving immediately');
      onSubmit();
    } else {
      // Schedule background save for all changes
      console.log('🔧 EditTaskForm - Scheduling background save');
      scheduleBackgroundSave();
    }
  }, [onSubmit, scheduleBackgroundSave]);

  // Use onChange for editor, with background save like notes widget
  const handleEditorChange = (content: QuillDelta) => {
    console.log('🔧 EditTaskForm Editor content changed');

    // Update ref first - this is our source of truth
    taskDataRef.current.content = content;

    // Update state for UI and schedule background save
    setCurrentContent(content);
    form.setValue('content', content, { shouldDirty: true });
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
                  const newTitle = e.target.value;
                  setLocalTitle(newTitle);
                  taskDataRef.current.title = newTitle;
                  form.setValue('title', newTitle, { shouldDirty: false });
                  handleFormChange(); // Schedule background save
                }}
                onBlur={() => {
                  // Save immediately on blur
                  if (backgroundSaveTimeoutRef.current) {
                    clearTimeout(backgroundSaveTimeoutRef.current);
                  }
                  form.setValue('title', localTitle, { shouldDirty: true });
                  onSubmit();
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
                    const newDate = date || null;
                    taskDataRef.current.dueDate = newDate;
                    form.setValue('dueDate', newDate, { shouldDirty: true });
                    handleFormChange(true);
                  }}
                  placeholder="Select"
                  className={styles.datePicker}
                />
              </FormField>

              <PriorityToggle
                checked={form.watch('isHighPriority')}
                onChange={(checked) => {
                  taskDataRef.current.isHighPriority = checked;
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
                  // Save immediately on blur only for existing tasks
                  if (backgroundSaveTimeoutRef.current) {
                    clearTimeout(backgroundSaveTimeoutRef.current);
                  }
                  // Only save on blur if task exists, otherwise let background save handle it
                  if (task?.id || createdTaskIdRef.current) {
                    onSubmit();
                  }
                }}
                placeholder="Describe the task..."
                className={styles.taskEditor}
              />
            </FormField>

            <CheckboxField
              checked={form.watch('isCompleted')}
              onChange={(checked) => {
                taskDataRef.current.isCompleted = checked;
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
