'use client'

import { useCreateBlockNote } from "@blocknote/react"
import { BlockNoteView } from "@blocknote/mantine"
import "@blocknote/core/fonts/inter.css"
import "@blocknote/mantine/style.css"
import "./block-note-custom.css"
import { useEffect, useRef, memo } from 'react'
import "./editor-placeholder.css"
import type { BlockNoteEditor } from "@blocknote/core"

interface SimpleBlockNoteEditorProps {
  initialContent?: any
  onChange?: (content: any) => void
  onEditorReady?: (editor: BlockNoteEditor) => void
  editable?: boolean
  theme?: "light" | "dark"
  className?: string
}

export const SimpleBlockNoteEditor = memo(function SimpleBlockNoteEditor({
  initialContent,
  onChange,
  onEditorReady,
  editable = true,
  theme = "dark",
  className
}: SimpleBlockNoteEditorProps) {
  const changeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastContentRef = useRef<string>('')
  const isInitializedRef = useRef(false)

  // Create editor instance at the top level
  const editor = useCreateBlockNote({
    initialContent: initialContent || undefined,
    domAttributes: {
      editor: {
        class: "editor-with-placeholder"
      }
    }
  })

  // Initialize content and call onEditorReady when editor is ready
  useEffect(() => {
    if (!isInitializedRef.current) {
      const initialContentStr = JSON.stringify(initialContent || [])
      lastContentRef.current = initialContentStr
      isInitializedRef.current = true
    }
    
    if (onEditorReady) {
      onEditorReady(editor)
    }
  }, [editor, onEditorReady, initialContent])

  // Set up change handler
  useEffect(() => {
    if (!onChange) return

    const handleChange = () => {
      // Clear any existing timeout
      if (changeTimeoutRef.current) {
        clearTimeout(changeTimeoutRef.current)
      }

      // Debounce changes to prevent rapid firing
      changeTimeoutRef.current = setTimeout(() => {
        const contentStr = JSON.stringify(editor.document || [])
        
        // Only call onChange if content actually changed
        if (contentStr !== lastContentRef.current) {
          lastContentRef.current = contentStr
          onChange(editor.document)
        }
      }, 500) // Reduced from 1000ms to 500ms for better responsiveness
    }

    const unsubscribe = editor.onEditorContentChange(handleChange)

    return () => {
      if (changeTimeoutRef.current) {
        clearTimeout(changeTimeoutRef.current)
        changeTimeoutRef.current = null
      }
      // Clean up subscription
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [editor, onChange])

  return (
    <div className={`flex flex-col h-full w-full ${className || ''}`}>
      <BlockNoteView
        editor={editor}
        editable={editable}
        theme={theme}
        sideMenu={false}
        className="editor-with-custom-placeholder"
      />
    </div>
  )
}) 