'use client'

import { useEffect, useState } from 'react'
import type { Task } from '@/shared/schema'
import { useDebouncedCallback } from 'use-debounce'
import { Input } from '@/components/ui/input'
import dynamic from 'next/dynamic'
import type { YooptaContentValue } from '@yoopta/editor'
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

const Editor = dynamic(
  () => import('@/components/ui/editor').then(mod => mod.Editor),
  {
    ssr: false,
    loading: () => <p>Loading editor...</p>,
  },
)

const EMPTY_CONTENT: YooptaContentValue = {
  'initial-node': {
    id: 'initial-node',
    type: 'Paragraph',
    value: [
      {
        id: 'initial-element',
        type: 'paragraph',
        children: [{ text: '' }],
        props: {
          nodeType: 'block',
        },
      },
    ],
    meta: {
      order: 0,
      depth: 0,
    },
  },
}

interface EditTaskFormProps {
  task: Task
  onSave: (updatedTask: Partial<Task>) => void
}

export function EditTaskForm({ task, onSave }: EditTaskFormProps) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState<YooptaContentValue>(
    (task.description as unknown as YooptaContentValue) || EMPTY_CONTENT,
  )
  const [status, setStatus] = useState(task.status)
  const [dueDate, setDueDate] = useState<Date | undefined>(
    task.dueDate ? new Date(task.dueDate) : undefined,
  )

  const debouncedSave = useDebouncedCallback((updatedData: Partial<Task>) => {
    onSave({ id: task.id, ...updatedData })
  }, 500)

  useEffect(() => {
    setTitle(task.title)
    setDescription(
      (task.description as unknown as YooptaContentValue) || EMPTY_CONTENT,
    )
    setStatus(task.status)
    setDueDate(task.dueDate ? new Date(task.dueDate) : undefined)
  }, [task])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    debouncedSave({ title: newTitle })
  }

  const handleDescriptionChange = (newDescription: YooptaContentValue) => {
    setDescription(newDescription)
    debouncedSave({ description: newDescription as unknown as Task['description'] })
  }

  const handleStatusChange = (newStatus: Task['status']) => {
    setStatus(newStatus)
    debouncedSave({ status: newStatus })
  }

  const handleDueDateChange = (date: Date | undefined) => {
    setDueDate(date)
    debouncedSave({ dueDate: date })
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center gap-3">
        <Checkbox
          id={`checkbox-${task.id}`}
          checked={status === 'completed'}
          onCheckedChange={(checked) => handleStatusChange(checked ? 'completed' : 'pending')}
        />
        <motion.div layoutId={`title-${task.id}`} className="flex-1">
        <Input
          value={title}
          onChange={handleTitleChange}
          placeholder="New task"
          className="border-0 bg-transparent p-0 text-xl font-bold !outline-none !ring-0 placeholder:text-muted-foreground/50"
        />
        </motion.div>
      </div>

      <div className="flex-grow overflow-y-auto pl-7">
        <Editor
          value={description}
          onChange={handleDescriptionChange}
          placeholder='Add details here, you can style by using "/" or by highlighting text.'
        />
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center space-x-2 scale-110 origin-left">
          <Switch
            id={`important-switch-${task.id}`}
            checked={status === 'important'}
            onCheckedChange={checked =>
              handleStatusChange(checked ? 'important' : 'pending')
            }
          />
          <Label htmlFor={`important-switch-${task.id}`}>Important</Label>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={'ghost-icon'}
              className={cn(
                'justify-start text-left font-normal',
                !dueDate && 'text-[#8c8c8c]',
                dueDate && 'text-white'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dueDate ? format(dueDate, 'PPP') : <span>Set due date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dueDate}
              onSelect={handleDueDateChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
} 