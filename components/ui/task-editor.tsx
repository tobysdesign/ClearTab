'use client'

import { memo } from 'react'
import dynamic from 'next/dynamic'
import { EMPTY_QUILL_CONTENT } from '@/shared/schema'

const DynamicQuillEditor = dynamic(() => import('./quill-editor').then(mod => mod.QuillEditor), { ssr: false });

interface TaskEditorProps {
  initialContent?: any
  onChange?: (content: any) => void
  placeholder?: string
  className?: string
  readOnly?: boolean
}

export const TaskEditor = memo(function TaskEditor({
  initialContent,
  onChange,
  placeholder = "Describe the task...",
  className,
  readOnly = false
}: TaskEditorProps) {
  return (
    <div className={`task-editor-wrapper ${className || ''}`}>
      <QuillEditor
        value={initialContent || EMPTY_QUILL_CONTENT}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        editable={!readOnly}
        className="task-editor-content"
      />
    </div>
  )
}) 