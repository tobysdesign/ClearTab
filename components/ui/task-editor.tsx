'use client'

import { useCreateBlockNote } from "@blocknote/react"
import { BlockNoteView } from "@blocknote/mantine"
import "@blocknote/core/fonts/inter.css"
import "@blocknote/mantine/style.css"
import { useEffect, useRef, memo } from 'react'
// import type { BlockNoteEditor } from "@blocknote/core"
import { Block } from "@blocknote/core"

interface TaskEditorProps {
  initialContent?: Block[]
  onChange?: (content: Block[]) => void
  placeholder?: string
  className?: string
  readOnly?: boolean
}

export const TaskEditor = memo(function TaskEditor({
  initialContent = [],
  onChange,
  placeholder = "Describe the task...",
  className,
  style,
  readOnly: _readOnly = false
}: TaskEditorProps & { style?: React.CSSProperties }) {
  const changeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastContentRef = useRef<string>('')
  const isInitializedRef = useRef(false)

  // Create editor instance
  const editor = useCreateBlockNote({
    initialContent: initialContent.length > 0 ? initialContent : [
      {
        id: "initial",
        type: "paragraph",
        content: []
      }
    ] as any,
    domAttributes: {
      editor: {
        class: "task-editor-content"
      }
    }
  })

  // Initialize content tracking
  useEffect(() => {
    if (!isInitializedRef.current) {
      const initialContentStr = JSON.stringify(initialContent || [])
      lastContentRef.current = initialContentStr
      isInitializedRef.current = true
    }
  }, [initialContent])

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
      }, 300) // 300ms debounce for task editor
    }

    let unsubscribe: (() => void) | undefined
    
    try {
      const result = editor.onEditorContentChange(handleChange)
      if (typeof result === 'function') {
        unsubscribe = result
      }
    } catch (error) {
      console.warn('Content change handler setup error:', error)
    }

    return () => {
      if (changeTimeoutRef.current) {
        clearTimeout(changeTimeoutRef.current)
        changeTimeoutRef.current = null
      }
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [editor, onChange])

  return (
    <div className={`task-editor-wrapper ${className || ''}`} style={style}>
      <style dangerouslySetInnerHTML={{
        __html: `
          .task-editor-wrapper {
            border-radius: var(--md-sys-shape-corner-extra-small);
            overflow: hidden;
            min-height: 80px;
            background-color: transparent;
          }
          
          .task-editor-wrapper .bn-container {
            background-color: transparent !important;
            border: none !important;
            color: var(--md-sys-color-on-surface) !important;
            min-height: 80px !important;
          }
          
          .task-editor-wrapper .bn-editor {
            padding: 10px !important;
            min-height: 80px !important;
            box-sizing: border-box !important;
          }
          
          .task-editor-wrapper .task-editor-content {
            min-height: 56px !important;
          }
          
          .task-editor-wrapper [data-node-type="paragraph"] {
            font-size: 14px !important;
            line-height: 20px !important;
            font-family: var(--md-sys-typescale-body-large-font) !important;
            color: var(--md-sys-color-on-surface) !important;
            margin: 0 !important;
            padding: 2px 0 !important;
          }
          
          .task-editor-wrapper .ProseMirror p.is-editor-empty:first-child::before {
            content: "${placeholder}";
            color: var(--md-sys-color-on-surface-variant);
            float: left;
            pointer-events: none;
            height: 0;
            font-size: 14px;
            line-height: 20px;
            font-family: var(--md-sys-typescale-body-large-font);
          }
          
          .task-editor-wrapper .ProseMirror {
            outline: none !important;
            padding: 0 !important;
            margin: 0 !important;
            min-height: 56px !important;
          }
          
          .task-editor-wrapper .ProseMirror ::selection {
            background: rgba(187, 134, 252, 0.3) !important;
          }
          
          .task-editor-wrapper .ProseMirror:focus {
            outline: none !important;
          }
          
          /* Hide all toolbars and menus for task editor */
          .task-editor-wrapper .bn-formatting-toolbar,
          .task-editor-wrapper .bn-suggestion-menu,
          .task-editor-wrapper .bn-side-menu {
            display: none !important;
          }
          
          /* Style text formatting within task editor */
          .task-editor-wrapper strong {
            font-weight: 600 !important;
            color: var(--md-sys-color-on-surface) !important;
          }
          
          .task-editor-wrapper em {
            font-style: italic !important;
            color: var(--md-sys-color-on-surface) !important;
          }
          
          .task-editor-wrapper code {
            background-color: var(--md-sys-color-surface-container-highest) !important;
            color: var(--md-sys-color-primary) !important;
            padding: 2px 4px !important;
            border-radius: 4px !important;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
            font-size: 0.9em !important;
          }
        `
      }} />
      
      <BlockNoteView
        editor={editor}
        editable={true}
        theme="dark"
        sideMenu={false}
        formattingToolbar={false}
        slashMenu={false}
        className="task-editor-view"
      />
    </div>
  )
}) 