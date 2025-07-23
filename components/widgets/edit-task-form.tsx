'use client'

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
import { Editor } from '@/components/ui/editor'
import { updateTask, createTask } from '@/lib/actions/tasks'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
      dueDate: task?.dueDate || null,
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
        dueDate: null,
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
      onSubmit(form.getValues());
    }
  };

  const onSubmit = async (values: TaskFormValues) => {
    const dataToSend = {
      ...values,
      content: currentContent, // Use currentContent for description
      isCompleted: values.isCompleted || false,
      isHighPriority: values.isHighPriority || false, // Ensure default
    }

    startTransition(async () => {
      try {
        let result;
        if (task?.id) {
          result = await updateTask({ id: task.id, ...dataToSend });
        } else {
          result = await createTask(dataToSend);
        }
        setLastSaveResult(result);
      } catch (error) {
        console.error('Failed to save task:', error);
      }
    });
  }

  // Use onChange for editor, which also triggers form submission
  const handleEditorChange = (content: Block[]) => {
    setCurrentContent(content);
    handleFormChange(); // Trigger form submission on editor change
  };

  return (
    <form className="p-6 space-y-6 bg-gradient-to-b from-[#151515] to-[#121212] rounded-3xl">
      <div className="relative">
        <Label htmlFor="title" className="absolute -top-2 left-3 bg-[#141414] px-1 text-xs uppercase text-[#555454] tracking-[1.2px] font-medium font-mono">Title</Label>
        <Input
          id="title"
          {...form.register('title')}
          placeholder="New Task"
          className="bg-transparent border-[#3d3d3d] h-11"
          onBlur={handleFormChange}
        />
      </div>

      <div className="flex items-center space-x-6">
        <div className="relative">
          <Label htmlFor="dueDate" className="absolute -top-2 left-3 bg-[#141414] px-1 text-xs uppercase text-[#555454] tracking-[1.2px] font-medium font-mono">Due By</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-[130px] justify-start text-left font-normal bg-transparent border-[#3d3d3d] h-11',
                  !form.watch('dueDate') && 'text-muted-foreground',
                )}
              >
                {form.watch('dueDate') ? format(form.watch('dueDate') as Date, 'dd/MM/yy') : '22/07/25'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-[#111111] border-[#3d3d3d]">
              <Calendar
                mode="single"
                selected={form.watch('dueDate') || undefined}
                onSelect={(date) => {
                  form.setValue('dueDate', date || null, { shouldDirty: true });
                  handleFormChange();
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex items-center space-x-2 pt-2">
          <Switch
            id="isHighPriority"
            className="task-important-switch"
            checked={!!form.watch('isHighPriority')}
            onCheckedChange={(checked) => {
              form.setValue('isHighPriority', checked, { shouldDirty: true });
              handleFormChange();
            }}
          />
          <Label htmlFor="isHighPriority" className="text-sm text-[#555454]">Toggle important</Label>
        </div>
      </div>

      <div className="relative">
        <Label htmlFor="content" className="absolute -top-2 left-3 bg-[#141414] px-1 text-xs uppercase text-[#555454] tracking-[1.2px] font-medium font-mono">Description</Label>
        <Editor
          value={currentContent}
          onChange={handleEditorChange}
          placeholder="Describe the task..."
          className="bg-transparent border-[#313131] min-h-[120px] p-3 task-editor-description"
        />
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
           <Checkbox
            id="isCompleted"
            className="task-complete-checkbox"
            checked={!!form.watch('isCompleted')}
            onCheckedChange={(checked) => {
              form.setValue('isCompleted', checked as boolean, { shouldDirty: true });
              handleFormChange();
            }}
          />
          <Label htmlFor="isCompleted" className="text-sm text-[#555454]">Mark complete</Label>
        </div>
      </div>
    </form>
  );
} 