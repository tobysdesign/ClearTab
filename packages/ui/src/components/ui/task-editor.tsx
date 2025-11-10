'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { EMPTY_QUILL_CONTENT } from '@/shared/schema'
import styles from './task-editor.module.css'

const QuillEditor = dynamic(
  () => import('./quill-editor').then(mod => mod.QuillEditor),
  {
    ssr: false,
    loading: () => (
      <div className={styles.taskEditorLoading}>
        Loading editor...
      </div>
    )
  }
)

interface TaskEditorProps {
  initialContent?: any
  onChange?: (content: any) => void
  onBlur?: () => void
  placeholder?: string
  className?: string
  readOnly?: boolean
}

export function TaskEditor({
  initialContent,
  onChange,
  onBlur,
  placeholder = "Describe the task...",
  className,
  readOnly = false
}: TaskEditorProps) {
  // Use a ref to avoid re-renders on every keystroke
  const contentRef = React.useRef(initialContent || EMPTY_QUILL_CONTENT)

  // Update ref when initialContent changes
  React.useEffect(() => {
    if (initialContent) {
      contentRef.current = initialContent
    }
  }, [initialContent])

  const handleChange = React.useCallback((content: any) => {
    contentRef.current = content
    onChange?.(content)
  }, [onChange])

  return (
    <div className={`${styles.taskEditorWrapper} ${className || ''}`}>
      <QuillEditor
        key={`task-editor-${readOnly ? 'readonly' : 'editable'}`}
        value={contentRef.current}
        onChange={handleChange}
        onBlur={onBlur}
        placeholder={placeholder}
        readOnly={readOnly}
        editable={!readOnly}
        className={styles.taskEditorBase}
      />
    </div>
  )
}