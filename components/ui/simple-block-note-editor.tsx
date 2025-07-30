'use client'

import { useCreateBlockNote } from "@blocknote/react"
import { BlockNoteView } from "@blocknote/mantine"
import "@blocknote/core/fonts/inter.css"
import "@blocknote/mantine/style.css"
import "./block-note-custom.css"
import { useEffect, useRef, memo, useState } from 'react'
import "./editor-placeholder.css"
import type { BlockNoteEditor } from "@blocknote/core"
import { 
  DefaultReactSuggestionItem,
  getDefaultReactSlashMenuItems,
  FormattingToolbarController,
  BlockTypeSelectItem
} from "@blocknote/react"
import { MiniAiChat } from './mini-ai-chat'
import { useChatContext } from '@/hooks/use-chat-context'
import BotIcon from 'lucide-react/dist/esm/icons/bot'

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
  const editorRef = useRef<BlockNoteEditor | null>(null)
  const [editorReady, setEditorReady] = useState(false)
  
  // Mini AI Chat state
  const [selectedText, setSelectedText] = useState('')
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null)
  const [isMiniChatOpen, setIsMiniChatOpen] = useState(false)
  const { setMessages: setMainChatMessages, openChat } = useChatContext()

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
    
    // Set editor ready after a short delay to ensure it's fully initialized
    const timer = setTimeout(() => {
      editorRef.current = editor
      setEditorReady(true)
    }, 100)
    
    return () => clearTimeout(timer)
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
      // Clean up subscription
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [editor, onChange])

  // Set up selection tracking
  useEffect(() => {
    const handleSelectionChange = () => {
      if (!editor) return
      
      try {
        const selection = editor.getSelectedText()
        if (selection && selection.trim().length > 0) {
          setSelectedText(selection.trim())
          
          // Get selection position for mini chat positioning
          const domSelection = window.getSelection()
          if (domSelection && domSelection.rangeCount > 0) {
            const range = domSelection.getRangeAt(0)
            const rect = range.getBoundingClientRect()
            setSelectionPosition({
              x: rect.left + rect.width / 2,
              y: rect.bottom
            })
          }
        } else {
          setSelectedText('')
          setSelectionPosition(null)
        }
      } catch (error) {
        console.warn('Selection tracking error:', error)
      }
    }

    try {
      const unsubscribe = editor.onSelectionChange?.(handleSelectionChange)
      
      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe()
        }
      }
    } catch (error) {
      console.warn('Selection change setup error:', error)
      return () => {}
    }
  }, [editor])

  // Custom formatting toolbar component
  const CustomFormattingToolbar = () => {
    if (!editorReady || !editorRef.current) return null
    
    const editor = editorRef.current
    
    try {
      const currentBlock = editor.getTextCursorPosition()?.block
      const activeStyles = editor.getActiveStyles()
      
      if (!currentBlock) return null
      
      return (
        <div className="bn-formatting-toolbar">
          {/* Block Type Selector */}
          <select
            value={currentBlock.type || "paragraph"}
            onChange={(e) => {
              try {
                editor.updateBlock(currentBlock, {
                  type: e.target.value as any
                })
              } catch (error) {
                console.warn("Block type update failed:", error)
              }
            }}
            className="bn-dropdown"
          >
            <option value="paragraph">Paragraph</option>
            <option value="heading">Heading 1</option>
            <option value="heading">Heading 2</option>
            <option value="heading">Heading 3</option>
            <option value="bulletListItem">Bullet List</option>
            <option value="numberedListItem">1,2,3 List</option>
          </select>
          
          {/* Text Formatting */}
          <button
            onClick={() => {
              try {
                editor.toggleStyles({ bold: true })
              } catch (error) {
                console.warn("Bold toggle failed:", error)
              }
            }}
            data-active={activeStyles?.bold || false}
            title="Bold"
          >
            <strong>B</strong>
          </button>
          
          <button
            onClick={() => {
              try {
                editor.toggleStyles({ italic: true })
              } catch (error) {
                console.warn("Italic toggle failed:", error)
              }
            }}
            data-active={activeStyles?.italic || false}
            title="Italic"
          >
            <em>I</em>
          </button>
          
          <button
            onClick={() => {
              try {
                editor.toggleStyles({ underline: true })
              } catch (error) {
                console.warn("Underline toggle failed:", error)
              }
            }}
            data-active={activeStyles?.underline || false}
            title="Underline"
          >
            <u>U</u>
          </button>
          
          <button
            onClick={() => {
              try {
                editor.toggleStyles({ strike: true })
              } catch (error) {
                console.warn("Strike toggle failed:", error)
              }
            }}
            data-active={activeStyles?.strike || false}
            title="Strikethrough"
          >
            <s>S</s>
          </button>
          
          {/* Alignment Toggle Group */}
          <div className="alignment-toggle-group">
            <button
              onClick={() => {
                try {
                  editor.updateBlock(currentBlock, {
                    props: { textAlignment: "left" } as any
                  })
                } catch (error) {
                  console.warn("Left align failed:", error)
                }
              }}
              data-active={(currentBlock.props as any)?.textAlignment === "left"}
              title="Align Left"
            >
              ⬅
            </button>
            <button
              onClick={() => {
                try {
                  editor.updateBlock(currentBlock, {
                    props: { textAlignment: "center" } as any
                  })
                } catch (error) {
                  console.warn("Center align failed:", error)
                }
              }}
              data-active={(currentBlock.props as any)?.textAlignment === "center"}
              title="Align Center"
            >
              ⬌
            </button>
            <button
              onClick={() => {
                try {
                  editor.updateBlock(currentBlock, {
                    props: { textAlignment: "right" } as any
                  })
                } catch (error) {
                  console.warn("Right align failed:", error)
                }
              }}
              data-active={(currentBlock.props as any)?.textAlignment === "right"}
              title="Align Right"
            >
              ➡
            </button>
          </div>
          
          {/* Text Color */}
          <button
            onClick={() => {
              try {
                editor.toggleStyles({ textColor: "red" })
              } catch (error) {
                console.warn("Text color failed:", error)
              }
            }}
            title="Text Color"
          >
            A
          </button>
          
          {/* Custom Actions */}
          <button
            onClick={() => {
              try {
                const selection = editor.getSelectedText()
                if (selection && selection.trim()) {
                  setSelectedText(selection.trim())
                  setIsMiniChatOpen(true)
                }
              } catch (error) {
                console.warn("Ask AI failed:", error)
              }
            }}
            title="Ask AI about selected text"
            disabled={!selectedText}
          >
            <BotIcon size={14} />
          </button>
          
          <button
            onClick={() => {
              try {
                const selectedText = editor.getSelectedText()
                console.log("Add to Tasks:", selectedText)
                // TODO: Implement Add to Tasks functionality
              } catch (error) {
                console.warn("Add to Tasks failed:", error)
              }
            }}
            title="Add to Tasks"
          >
            ✓
          </button>
        </div>
      )
    } catch (error) {
      console.warn("Formatting toolbar render failed:", error)
      return null
    }
  }

  // Mini chat handlers
  const handleCloseMiniChat = () => {
    setIsMiniChatOpen(false)
    setSelectedText('')
    setSelectionPosition(null)
  }

  const handleSendToMainChat = (messages: any[]) => {
    // Convert mini chat messages to main chat format and add them
    const mainChatMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }))
    
    // Add a context message at the beginning
    const contextMessage = {
      role: 'assistant' as const,
      content: `[Continuing conversation about: "${selectedText}"]`
    }
    
    setMainChatMessages(prev => [...prev, contextMessage, ...mainChatMessages])
    openChat()
  }

  return (
    <div className={`flex flex-col h-full w-full ${className || ''}`}>
      <BlockNoteView
        editor={editor}
        editable={editable}
        theme={theme}
        sideMenu={false}
        className="editor-with-custom-placeholder"
        formattingToolbar={false}
      >
        <FormattingToolbarController
          formattingToolbar={CustomFormattingToolbar}
        />
      </BlockNoteView>
      
      {/* Mini AI Chat */}
      <MiniAiChat
        isOpen={isMiniChatOpen}
        onClose={handleCloseMiniChat}
        selectedText={selectedText}
        position={selectionPosition}
        onSendToMainChat={handleSendToMainChat}
      />
    </div>
  )
}) 