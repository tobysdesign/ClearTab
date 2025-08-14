'use client'

import { useCreateBlockNote } from "@blocknote/react"
import { BlockNoteView } from "@blocknote/mantine"
import "@blocknote/mantine/style.css"
import "@blocknote/core/fonts/inter.css"
import "./block-note-custom.css"
import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import Bot from 'lucide-react/dist/esm/icons/bot'
import CheckSquare from 'lucide-react/dist/esm/icons/check-square'
import styles from './block-note-editor.module.css'
import { EMPTY_BLOCKNOTE_CONTENT } from '@/shared/schema'

interface BlockNoteEditorProps {
  value?: any;
  onChange?: (value: any) => void;
  editable?: boolean;
  placeholder?: string;
  onSelectionChange?: (selectedText: string) => void;
  onBlur?: () => void;
  onAskAI?: (selectedText: string) => void;
  onCreateTask?: (selectedText: string) => void;
  isNewNote?: boolean;
}

export function BlockNoteEditor({
  value,
  onChange,
  editable = true,
  placeholder = 'Start writing...',
  onSelectionChange,
  onBlur,
  onAskAI,
  onCreateTask,
  isNewNote = false
}: BlockNoteEditorProps) {
  
  const safeInitialContent = useMemo(() => {
    return value && value.length > 0 ? value : EMPTY_BLOCKNOTE_CONTENT;
  }, [value]);

  // Create editor with initialContent
  const editor = useCreateBlockNote({
    initialContent: safeInitialContent
  }, []);
  
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const debouncedSave = useCallback((blocks: any) => {
    if (!onChange) return
    
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      try {
        onChange(blocks);
      } catch (error) {
        console.error("Error in debouncedSave:", error);
      }
    }, 500);
  }, [onChange]);

  useEffect(() => {
    if (!editor) return;

    if (!isNewNote && value !== undefined && Array.isArray(value)) {
      try {
        const currentContent = editor.document; 
        
        if (!currentContent || !Array.isArray(currentContent)) {
          return;
        }

        if (JSON.stringify(currentContent) !== JSON.stringify(value)) {
          editor.replaceBlocks(currentContent, value);
        }
      } catch (error) {
        console.error("Error updating editor content:", error);
      }
    }
  }, [value, editor, isNewNote]);

  useEffect(() => {
    if (!editor) return;
    
    const unsubscribe = editor.onEditorContentChange(() => {
      const blocks = editor.document;
      debouncedSave(blocks);
    });

    return unsubscribe;
  }, [editor, debouncedSave]);

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const [selectedText, setSelectedText] = useState('')

  // This function is not used in the current implementation, but can be kept for future use.
  const handleSelectionChange = () => {
    if (editor) {
      const selectedText = editor.getSelectedText()
      
      if (selectedText && selectedText.trim()) {
        setSelectedText(selectedText)
        onSelectionChange?.(selectedText)
      } else {
        setSelectedText('')
        onSelectionChange?.('')
      }
    }
  }

  const handleAskAI = () => {
    if (onAskAI && selectedText) {
      onAskAI(selectedText)
    }
  }

  const handleCreateTask = () => {
    if (onCreateTask && selectedText) {
      onCreateTask(selectedText)
    }
  }

  return (
    <div className={styles.container}>
      <BlockNoteView
        editor={editor}
        sideMenu={false}
        theme="dark"
        className={styles.editorContent}
      />
      
      {/* Custom toolbar for AI and task creation */}
      {(onAskAI || onCreateTask) && selectedText && (
        <div className={styles.customActions}>
          {onAskAI && (
            <Button 
              variant="outline" 
              size="sm" 
              className={styles.actionButton}
              onClick={handleAskAI}
            >
              <Bot className={styles.icon} />
              Ask AI
            </Button>
          )}
          {onCreateTask && (
            <Button 
              variant="outline" 
              size="sm" 
              className={styles.actionButton}
              onClick={handleCreateTask}
            >
              <CheckSquare className={styles.icon} />
              Create Task
            </Button>
          )}
        </div>
      )}
    </div>
  )
} 