'use client'

import { useCallback, useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import dynamic from 'next/dynamic'
import { EMPTY_QUILL_CONTENT } from '@/shared/schema'
import styles from './editor.module.css'

// Skeleton component to show while editor is loading
function EditorSkeleton() {
  return (
    <div className={styles.skeletonContainer}>
      <Skeleton className={styles.skeletonFirst} />
      <Skeleton className={styles.skeletonSecond} />
      <Skeleton className={styles.skeletonThird} />
      <Skeleton className={styles.skeletonFourth} />
    </div>
  )
}

const QuillEditor = dynamic(
  () => import('./quill-editor').then(mod => mod.QuillEditor),
  {
    ssr: false,
    loading: () => <EditorSkeleton />
  }
)

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
  placeholder: _placeholder = "Start writing...",
  editable = true,
  onOpenAiChat,
  onCreateTask,
  onBlur: _onBlur,
  readOnly = false
}: EditorProps) {
  const [isMounted, setIsMounted] = useState(false)

  // Handle content change
  const handleContentChange = useCallback((newContent: any) => {
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
    <div className={cn(styles.editorContainer, className)}>
      <QuillEditor
        value={value || EMPTY_QUILL_CONTENT}
        onChange={handleContentChange}
        editable={editable && !readOnly}
        className={styles.editorContent}
        placeholder={_placeholder}
        onOpenAiChat={onOpenAiChat}
        onCreateTask={onCreateTask}
        onBlur={_onBlur}
        readOnly={readOnly}
      />
    </div>
  )
}