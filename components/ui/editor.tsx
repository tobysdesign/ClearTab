'use client'

import { useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { createTaskFromText } from '@/components/widgets/tasks-widget'

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

// Helper function to extract text content from structured content
function extractTextFromContent(content: any): string {
  try {
    if (!content) return '';
    
    // If it's already a string, return it
    if (typeof content === 'string') return content;
    
    // If it's a Yoopta-style content object
    if (typeof content === 'object') {
      // Try to extract text from children
      let extractedText = '';
      
      // Handle different content formats
      if (content['paragraph-1'] && content['paragraph-1'].value) {
        Object.values(content).forEach((block: any) => {
          if (block.value && Array.isArray(block.value)) {
            block.value.forEach((element: any) => {
              if (element.children) {
                element.children.forEach((child: any) => {
                  extractedText += typeof child === 'string' ? child : (child.text || '');
                });
              }
            });
            extractedText += '\n';
          }
        });
        
        return extractedText;
      }
    }
    
    // Fallback to string representation
    return String(content);
  } catch (error) {
    console.error("Error extracting text:", error);
    return '';
  }
}

export interface EditorProps {
  value?: any
  onChange?: (value: any) => void
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
  
  // Extract text content from value for display
  const textContent = typeof value === 'string' ? value : extractTextFromContent(value);

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

  // Handle content change
  const handleContentChange = useCallback((newContent: string) => {
    if (onChange) {
      // Pass the content directly without transforming
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
        value={textContent}
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