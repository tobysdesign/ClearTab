'use client'

import { useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { createTaskFromText } from '@/components/widgets/tasks-widget'
import { YooptaContentValue, EMPTY_CONTENT } from '@/shared/schema'

// Import the editor dynamically to avoid SSR issues
const BlockNoteEditor = dynamic(
  () => import('@/components/ui/block-note-editor').then(mod => mod.BlockNoteEditor),
  { 
    ssr: false,
    loading: () => <EditorSkeleton /> 
  }
)

// Skeleton component to show while editor is loading
function EditorSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-8 w-5/6" />
      <Skeleton className="h-8 w-2/3" />
    </div>
  )
}

// Removed: extractTextFromContent function

export interface EditorProps {
  value?: YooptaContentValue // Type as YooptaContentValue
  onChange?: (value: YooptaContentValue) => void // Type onChange to receive YooptaContentValue
  className?: string
  placeholder?: string
  editable?: boolean
  onOpenAiChat?: (selectedText: string) => void
  onCreateTask?: (selectedText: string) => void
  onBlur?: () => void
  readOnly?: boolean
}

export function Editor({
  value,
  onChange,
  className,
  placeholder = "Start writing...",
  editable = true,
  onOpenAiChat,
  onCreateTask,
  onBlur,
  readOnly = false
}: EditorProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [selectedText, setSelectedText] = useState<string>('')
  const [hasSelection, setHasSelection] = useState(false)
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  
  // value is now directly YooptaContentValue, no need for textContent derivation

  // Handle selection changes to enable/disable AI buttons
  const handleSelectionChange = useCallback((text: string) => {
    setSelectedText(text)
    setHasSelection(!!text.trim())
  }, [])

  // Handle AI chat button click
  const handleAiChatClick = useCallback(() => {
    if (selectedText && onOpenAiChat) {
      onOpenAiChat(selectedText)
    }
  }, [selectedText, onOpenAiChat])

  // Handle task creation button click
  const handleCreateTaskClick = useCallback(async () => {
    if (!selectedText) return
    
    try {
      setIsCreatingTask(true)
      
      if (onCreateTask) {
        // Use the callback if provided (for test page)
        onCreateTask(selectedText)
      } else {
        // Otherwise use the direct API function
        const task = await createTaskFromText(selectedText)
        if (task) {
          // Show success feedback
          console.log("Task created:", task)
          // Could add toast notification here
        }
      }
    } catch (error) {
      console.error("Failed to create task:", error)
      // Could add error toast here
    } finally {
      setIsCreatingTask(false)
    }
  }, [selectedText, onCreateTask])

  // Handle content change - pass YooptaContentValue directly
  const handleContentChange = useCallback((newContent: YooptaContentValue) => {
    if (onChange) {
      onChange(newContent);
    }
  }, [onChange]);

  // Effect to handle client-side mounting
  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return <EditorSkeleton />
  }

  return (
    <div className={cn("relative flex flex-col", className)}>
      <BlockNoteEditor
        value={value}
        onChange={handleContentChange}
        editable={editable && !readOnly}
        placeholder={placeholder}
        onSelectionChange={handleSelectionChange}
        onBlur={onBlur}
        onAskAI={onOpenAiChat}
        onCreateTask={onCreateTask}
      />
      
      {/* AI action buttons that appear when text is selected */}
      {hasSelection && !readOnly && (
        <div className="absolute bottom-2 right-2 flex gap-2 z-10">
          {onOpenAiChat && (
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={handleAiChatClick}
              className="shadow-md"
            >
              Ask AI
            </Button>
          )}
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={handleCreateTaskClick}
            disabled={isCreatingTask}
            className="shadow-md"
          >
            {isCreatingTask ? "Creating..." : "Create Task"}
          </Button>
        </div>
      )}
    </div>
  )
} 