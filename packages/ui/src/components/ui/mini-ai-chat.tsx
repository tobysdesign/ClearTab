'use client'

// Icons replaced with ASCII placeholders
import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from './input'
import { Button } from '../button/button'
import { cn } from '@/lib/utils'
import styles from './mini-ai-chat.module.css'
interface MiniMessage {
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

interface MiniAiChatProps {
  isOpen: boolean
  onClose: () => void
  selectedText: string
  position?: { x: number; y: number }
  onSendToMainChat?: (messages: MiniMessage[]) => void
}

export function MiniAiChat({ 
  isOpen, 
  onClose, 
  selectedText, 
  position,
  onSendToMainChat 
}: MiniAiChatProps) {
  const [messages, setMessages] = useState<MiniMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [thinkingContent, setThinkingContent] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Initialize with selected text context
  useEffect(() => {
    if (isOpen && selectedText && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: `I can see you've selected: "${selectedText}"\n\nHow can I help you with this text?`
        }
      ])
    }
  }, [isOpen, selectedText, messages.length])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, thinkingContent])

  // Position the chat near the selection or fallback to center
  const chatPosition = position 
    ? { 
        position: 'fixed' as const,
        left: Math.min(position.x, window.innerWidth - 400),
        top: Math.min(position.y + 20, window.innerHeight - 400),
        zIndex: 10000
      }
    : {
        position: 'fixed' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10000
      }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage = inputValue
    setInputValue('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    
    setIsThinking(true)
    setThinkingContent('Processing your request...')

    try {
      // Create context message that includes the selected text
      const contextualPrompt = `Context: User selected text "${selectedText}"\nUser question: ${userMessage}`
      
      const response = await fetch('/api/ai/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: contextualPrompt,
          hasSeenOnboarding: true,
          userName: '',
          agentName: ''
        })
      })

      if (!response.ok) throw new Error('Failed to get response')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      
      let messageIndex = -1

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n').filter(line => line.trim())

          for (const line of lines) {
            try {
              const data = JSON.parse(line)
              
              switch (data.type) {
                case 'thinking':
                  setThinkingContent(data.content)
                  break
                  
                case 'content':
                  if (messageIndex === -1) {
                    setMessages(prev => {
                      const newMessages = [...prev, { role: 'assistant' as const, content: data.content, isStreaming: true }]
                      messageIndex = newMessages.length - 1
                      return newMessages
                    })
                  } else {
                    setMessages(prev => {
                      const updated = [...prev]
                      updated[messageIndex] = { 
                        ...updated[messageIndex], 
                        content: data.fullContent || updated[messageIndex].content + data.content 
                      }
                      return updated
                    })
                  }
                  break
                  
                case 'complete':
                  setMessages(prev => {
                    const updated = [...prev]
                    if (messageIndex >= 0) {
                      updated[messageIndex] = { 
                        ...updated[messageIndex], 
                        content: data.fullContent,
                        isStreaming: false
                      }
                    }
                    return updated
                  })
                  break
                  
                case 'error':
                  throw new Error(data.content)
              }
            } catch (parseError) {
              console.warn('Failed to parse chunk:', parseError)
            }
          }
        }
      }
    } catch (error) {
      console.error('Mini chat error:', error)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }])
    } finally {
      setIsThinking(false)
      setThinkingContent('')
    }
  }

  const handleSendToMainChat = () => {
    if (onSendToMainChat) {
      onSendToMainChat(messages)
    }
    onClose()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={styles.overlay}
        onClick={onClose}
      >
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          style={chatPosition}
          className={styles.chatContainer}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <div className={styles.statusDot} />
              <h3 className={styles.title}>AI Assistant</h3>
            </div>
            <div className={styles.headerRight}>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSendToMainChat}
                className={styles.sendButton}
                disabled={messages.length <= 1}
                tooltipLabel="Send to main chat"
                shortcut="⌘↩"
              >
                <span className={styles.sendIcon}>•</span>
                Send to Main
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className={styles.closeButton}
                tooltipLabel="Close"
                shortcut="Esc"
              >
                <span className={styles.closeIcon}>×</span>
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className={styles.messagesContainer}>
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  styles.messageWrapper,
                  message.role === 'user' ? styles.messageWrapperUser : styles.messageWrapperAssistant
                )}
              >
                <div
                  className={cn(
                    styles.messageBubble,
                    message.role === 'user'
                      ? styles.messageBubbleUser
                      : styles.messageBubbleAssistant
                  )}
                >
                  {message.content}
                  {message.isStreaming && (
                    <span className={styles.streamingCursor} />
                  )}
                </div>
              </div>
            ))}
            
            {thinkingContent && (
              <div className={styles.thinkingContainer}>
                <div className={styles.thinkingBubble}>
                  <div className={styles.thinkingContent}>
                    <div className={styles.thinkingDots}>
                      <div className={styles.thinkingDot1} />
                      <div className={styles.thinkingDot2} />
                      <div className={styles.thinkingDot3} />
                    </div>
                    <span className={styles.thinkingText}>{thinkingContent}</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className={styles.inputContainer}>
            <div className={styles.inputWrapper}>
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about this text..."
                className={styles.input}
                disabled={isThinking}
              />
              <Button
                onClick={handleSendMessage}
                size="sm"
                className={styles.submitButton}
                disabled={!inputValue.trim() || isThinking}
                tooltipLabel="Send"
                shortcut="↩"
              >
                <span className={styles.submitIcon}>•</span>
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
