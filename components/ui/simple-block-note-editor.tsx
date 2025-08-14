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

// Magic UI Animated Gradient Text Component
function AnimatedGradientText({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent animate-gradient ${className}`}
    >
      {children}
    </span>
  )
}

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
  const dropdownRef = useRef<HTMLDivElement>(null)
  const dropdownButtonRef = useRef<HTMLButtonElement>(null)
  
  // Mini AI Chat state
  const [selectedText, setSelectedText] = useState('')
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null)
  const [isMiniChatOpen, setIsMiniChatOpen] = useState(false)
  const [isFormattingDropdownOpen, setIsFormattingDropdownOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 })
  
  // Safely use chat context - will return null if not wrapped in ChatProvider
  let chatContext
  try {
    chatContext = useChatContext()
  } catch (error) {
    // Not wrapped in ChatProvider, that's okay
    chatContext = null
  }
  const { setMessages: setMainChatMessages, openChat } = chatContext || { setMessages: () => {}, openChat: () => {} }

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
      // Call onChange immediately to let parent handle debouncing
      const contentStr = JSON.stringify(editor.document || [])
      
      // Only call onChange if content actually changed
      if (contentStr !== lastContentRef.current) {
        lastContentRef.current = contentStr
        onChange(editor.document)
      }
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
        console.log('Text selection changed:', selection) // Debug log
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
        // Don't automatically open mini chat - only when button is clicked
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

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isFormattingDropdownOpen && 
          dropdownRef.current && 
          !dropdownRef.current.contains(event.target as Node) &&
          dropdownButtonRef.current &&
          !dropdownButtonRef.current.contains(event.target as Node)) {
        setIsFormattingDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isFormattingDropdownOpen])

  // Custom formatting toolbar component
  const CustomFormattingToolbar = () => {
    if (!editorReady || !editorRef.current) {
      console.log('Formatting toolbar not ready') // Debug log
      return null
    }
    
    const editor = editorRef.current
    
    try {
      const currentBlock = editor.getTextCursorPosition()?.block
      const activeStyles = editor.getActiveStyles()
      
      if (!currentBlock) {
        console.log('No current block for formatting toolbar') // Debug log
        return null
      }
      
      console.log('Rendering formatting toolbar') // Debug log
      
      // Get current alignment for cycling
      const currentAlignment = (currentBlock.props as any)?.textAlignment || "left"
      const alignmentOrder = ["left", "center", "right"]
      const currentAlignmentIndex = alignmentOrder.indexOf(currentAlignment)
      const nextAlignment = alignmentOrder[(currentAlignmentIndex + 1) % alignmentOrder.length]
      
      return (
        <div className="bn-formatting-toolbar">
          {/* Ask Ybot Button - Left side */}
          <button
            onClick={() => {
              try {
                const selection = editor.getSelectedText()
                console.log('Ask Ybot clicked, selection:', selection) // Debug log
                if (selection && selection.trim()) {
                  setSelectedText(selection.trim())
                  setIsMiniChatOpen(true)
                }
              } catch (error) {
                console.warn("Ask Ybot failed:", error)
              }
            }}
            title="Ask Ybot about selected text"
            disabled={!selectedText}
            className="ask-ybot-btn"
          >
            <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 9" width="18" height="12">
              <path d="M10.538 3.914c.128 0 .232.104.232.232v.81a.23.23 0 0 1-.232.232h-.81a.23.23 0 0 1-.232-.232v-.81c0-.128.104-.232.232-.232zm-6.485 0c.128 0 .232.104.232.232v.81a.23.23 0 0 1-.232.232h-.81a.23.23 0 0 1-.232-.232v-.81c0-.128.104-.232.232-.232z" fill="#fff"/>
              <path d="M7.76 3.725q0-1.287.65-1.997c.433-.473.862-.71 1.636-.71q1.16 0 1.81.71t.651 1.997V5.2q0 1.324-.65 2.015c-.434.46-.863.69-1.636.69q-1.161 0-1.811-.69T7.76 5.2zm2.46 3.462c.54 0 .77-.176 1.037-.53q.41-.539.41-1.513V3.78q0-.453-.1-.823a1.7 1.7 0 0 0-.31-.643 1.36 1.36 0 0 0-.51-.426q-.3-.15-.701-.151c-.273 0-.336.05-.536.151q-.3.152-.51.426a1.8 1.8 0 0 0-.3.643q-.1.369-.1.823v1.363q0 .975.4 1.513.41.53 1.22.53M1.274 3.655q0-1.308.65-2.03c.434-.481.863-.722 1.637-.722q1.16 0 1.81.722t.65 2.03v1.502q0 1.347-.65 2.05c-.433.468-.862.702-1.636.702q-1.16 0-1.81-.702-.651-.703-.651-2.05zm2.461 3.523c.54 0 .77-.18 1.036-.54q.41-.547.41-1.539V3.713a3.3 3.3 0 0 0-.1-.837 1.8 1.8 0 0 0-.31-.654 1.4 1.4 0 0 0-.51-.434 1.5 1.5 0 0 0-.7-.154c-.274 0-.336.052-.536.154q-.3.154-.51.434-.201.27-.3.654-.1.376-.1.837V5.1q0 .99.4 1.54.41.54 1.22.539m2.75-3.049a.434.434 0 0 1 .869 0v3.533a.434.434 0 0 1-.869 0zm-5.732.182s-.29.23-.29.434.29.434.29.434c0 .872-.753.064-.753-.434s.753-1.306.753-.434m12.183.868s.29-.23.29-.434-.29-.435-.29-.435c0-.871.753-.063.753.435 0 .497-.753 1.306-.753.434" fill="#fff"/>
            </svg>
            <AnimatedGradientText>Ask Ybot</AnimatedGradientText>
          </button>
          
          {/* Divider */}
          <div className="toolbar-divider"></div>
          
          {/* Paragraph/Heading Dropdown - Removed list options */}
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
            style={{ width: '60px' }}
          >
            <option value="paragraph">P</option>
            <option value="heading">H1</option>
            <option value="heading">H2</option>
            <option value="heading">H3</option>
          </select>
          
          {/* Single Alignment Button that cycles - Fixed positioning */}
          <button
            onClick={() => {
              try {
                editor.updateBlock(currentBlock, {
                  props: { textAlignment: nextAlignment } as any
                })
              } catch (error) {
                console.warn("Alignment toggle failed:", error)
              }
            }}
            title={`Align ${nextAlignment}`}
            className="alignment-btn"
            style={{ position: 'relative' }}
          >
            {currentAlignment === "left" && (
              <svg width="12" height="9" viewBox="0 0 12 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_475_1264)">
                  <path d="M9.31982 2H1.06982" stroke="#E6E6E6" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5.65316 4.5H1.06982" stroke="#E6E6E6" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7.48649 7H1.06982" stroke="#E6E6E6" strokeLinecap="round" strokeLinejoin="round"/>
                </g>
                <defs>
                  <clipPath id="clip0_475_1264">
                    <rect width="11" height="9" fill="white" transform="translate(0.0698242)"/>
                  </clipPath>
                </defs>
              </svg>
            )}
            {currentAlignment === "center" && (
              <svg width="11" height="9" viewBox="0 0 11 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.625 2H1.375" stroke="#E6E6E6" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7.79183 4.5H3.2085" stroke="#E6E6E6" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8.70817 7H2.2915" stroke="#E6E6E6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            {currentAlignment === "right" && (
              <svg width="11" height="9" viewBox="0 0 11 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 2H0.75" stroke="#E6E6E6" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8.99984 4.5H4.4165" stroke="#E6E6E6" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9.00016 7H2.5835" stroke="#E6E6E6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
          
  
  
          
          {/* Text Formatting Buttons */}
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
          
          {/* Formatting Dropdown with more options */}
          <div className="formatting-dropdown">
            <button
              ref={dropdownButtonRef}
              onClick={() => {
                setIsFormattingDropdownOpen(!isFormattingDropdownOpen)
                // Calculate position for dropdown
                if (dropdownButtonRef.current) {
                  const rect = dropdownButtonRef.current.getBoundingClientRect()
                  setDropdownPosition({
                    x: rect.left,
                    y: rect.bottom + 5
                  })
                }
              }}
              title="More formatting options"
              className="formatting-dropdown-btn"
            >
              ⋯
            </button>
          </div>
          
          {/* Divider */}
          <div className="toolbar-divider"></div>
          
          {/* Create Task Button - Right side */}
          <button
            onClick={() => {
              try {
                const selectedText = editor.getSelectedText()
                console.log("Create task clicked:", selectedText) // Debug log
                if (selectedText && selectedText.trim()) {
                  // Create a task from the selected text
                  const taskData = {
                    title: selectedText.trim(),
                    description: `Task created from note selection: "${selectedText.trim()}"`,
                    status: 'pending' as const,
                    priority: 'medium' as const,
                    dueDate: null,
                    tags: ['from-notes']
                  }
                  
                  // Call the API to create the task
                  fetch('/api/tasks', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(taskData),
                  })
                  .then(response => {
                    if (response.ok) {
                      console.log('Task created successfully from selected text')
                      // You could add a toast notification here
                    } else {
                      console.error('Failed to create task')
                    }
                  })
                  .catch(error => {
                    console.error('Error creating task:', error)
                  })
                }
              } catch (error) {
                console.warn("Create task failed:", error)
              }
            }}
            title="Create task"
            disabled={!selectedText}
            className="create-task-btn"
          >
            <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 13" width="14" height="13">
              <g clipPath="url(#a)" stroke="#E6E6E6" strokeWidth=".7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.7 5.8A3.7 3.7 0 1 1 9 3.3"/>
                <path d="m6 6.1 1 1.2 3.8-3.8"/>
              </g>
              <defs>
                <clipPath id="a">
                  <path fill="#fff" d="M2.6 2h9v9h-9z"/>
                </clipPath>
              </defs>
            </svg>
            Create task
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
      <style dangerouslySetInnerHTML={{
        __html: `
          .formatting-dropdown {
            position: relative;
            display: inline-block;
          }
          
          .formatting-dropdown-btn {
            background: none;
            border: none;
            color: #d2d2d2;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 2px;
          }
          
          .formatting-dropdown-btn:hover {
            background-color: #3a3a3a;
          }
          
          .formatting-options {
            position: fixed;
            background-color: #2a2a2a;
            min-width: 120px;
            box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
            z-index: 10000;
            border-radius: 4px;
            padding: 4px;
            display: none;
          }
          
          .formatting-options.show {
            display: block;
          }
          
          .formatting-options button {
            width: 100%;
            padding: 8px 12px;
            text-align: left;
            background: none;
            border: none;
            color: #d2d2d2;
            cursor: pointer;
            border-radius: 2px;
            font-size: 14px;
          }
          
          .formatting-options button:hover {
            background-color: #3a3a3a;
          }
          
          /* Toolbar Dividers */
          .toolbar-divider {
            width: 1px;
            height: 20px;
            background-color: #333;
            margin: 0 8px;
            border-radius: 1px;
          }
          
          /* Magic UI Animated Gradient Text */
          .bg-gradient-to-r {
            background-image: linear-gradient(to right, var(--tw-gradient-stops));
          }
          
          .from-violet-600 {
            --tw-gradient-from: #7c3aed;
            --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(124, 58, 237, 0));
          }
          
          .via-indigo-600 {
            --tw-gradient-stops: var(--tw-gradient-from), #4f46e5, var(--tw-gradient-to, rgba(79, 70, 229, 0));
          }
          
          .to-purple-600 {
            --tw-gradient-to: #9333ea;
          }
          
          .bg-clip-text {
            -webkit-background-clip: text;
            background-clip: text;
          }
          
          .text-transparent {
            color: transparent;
          }
          
          .animate-gradient {
            background-size: 200% 200%;
            animation: gradient 3s ease infinite;
          }
          
          @keyframes gradient {
            0% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
            100% {
              background-position: 0% 50%;
            }
          }
        `
      }} />
      
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
      
      {/* Formatting Dropdown - Outside the editor */}
      {isFormattingDropdownOpen && (
        <div 
          ref={dropdownRef}
          className="formatting-options show"
          style={{
            left: dropdownPosition.x,
            top: dropdownPosition.y
          }}
        >
          <button
            onClick={() => {
              try {
                if (editorRef.current) {
                  editorRef.current.toggleStyles({ strike: true })
                }
              } catch (error) {
                console.warn("Strike toggle failed:", error)
              }
              setIsFormattingDropdownOpen(false)
            }}
            title="Strikethrough"
          >
            <s>S</s> Strikethrough
          </button>
          <button
            onClick={() => {
              try {
                if (editorRef.current) {
                  // Add link functionality here
                  console.log("Link button clicked")
                }
              } catch (error) {
                console.warn("Link toggle failed:", error)
              }
              setIsFormattingDropdownOpen(false)
            }}
            title="Link"
          >
            <svg width="12" height="11" viewBox="0 0 12 11" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline', marginRight: '4px' }}>
              <g clipPath="url(#clip0_479_2074)">
                <path d="M3.94077 8.21509H2.85474C2.13465 8.21509 1.44406 7.92903 0.934879 7.41986C0.425702 6.91068 0.139648 6.22009 0.139648 5.5C0.139648 4.77991 0.425702 4.08932 0.934879 3.58014C1.44406 3.07097 2.13465 2.78491 2.85474 2.78491H3.94077M7.19888 2.78491H8.28491C9.005 2.78491 9.69559 3.07097 10.2048 3.58014C10.7139 4.08932 11 4.77991 11 5.5C11 6.22009 10.7139 6.91068 10.2048 7.41986C9.69559 7.92903 9.005 8.21509 8.28491 8.21509H7.19888M3.39775 5.5H7.74189" stroke="#C4C4C4" strokeWidth="1.08604" strokeLinecap="round" strokeLinejoin="round"/>
              </g>
              <defs>
                <clipPath id="clip0_479_2074">
                  <rect width="11" height="9.43018" fill="white" transform="translate(0.0698242 0.784912)"/>
                </clipPath>
              </defs>
            </svg>
            Link
          </button>
          <button
            onClick={() => {
              try {
                if (editorRef.current) {
                  const currentBlock = editorRef.current.getTextCursorPosition()?.block
                  if (currentBlock) {
                    editorRef.current.updateBlock(currentBlock, {
                      type: "codeBlock" as any
                    })
                  }
                }
              } catch (error) {
                console.warn("Code block failed:", error)
              }
              setIsFormattingDropdownOpen(false)
            }}
            title="Code Block"
          >
            <svg width="12" height="13" viewBox="0 0 12 13" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline', marginRight: '4px' }}>
              <g clipPath="url(#clip0_479_2079)">
                <path d="M8.82793 8.67197L11 6.4999L8.82793 4.32783M2.31172 4.32783L0.139648 6.4999L2.31172 8.67197M6.92737 2.15576L4.21228 10.844" stroke="#C4C4C4" strokeWidth="1.08604" strokeLinecap="round" strokeLinejoin="round"/>
              </g>
              <defs>
                <clipPath id="clip0_479_2079">
                  <rect width="11" height="12.6883" fill="white" transform="translate(0.0698242 0.155762)"/>
                </clipPath>
              </defs>
            </svg>
            Code Block
          </button>
          {/* Add more formatting options here */}
        </div>
      )}
      
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