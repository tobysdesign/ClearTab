'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useChatContext } from '@/hooks/use-chat-context'
import SendIcon from 'lucide-react/dist/esm/icons/send'
import MessageSquarePlusIcon from 'lucide-react/dist/esm/icons/message-square-plus'
import XIcon from 'lucide-react/dist/esm/icons/x'

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
        className="fixed inset-0 z-[9999] bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          style={chatPosition}
          className="w-96 h-96 bg-gradient-to-b from-[#1a1a1a] to-[#141414] rounded-2xl border border-neutral-700 shadow-2xl flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-neutral-700">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <h3 className="text-sm font-medium text-neutral-200">AI Assistant</h3>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSendToMainChat}
                className="h-6 px-2 text-xs hover:bg-neutral-600"
                disabled={messages.length <= 1}
              >
                <MessageSquarePlusIcon className="w-3 h-3 mr-1" />
                Send to Main
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-6 w-6 hover:bg-neutral-600"
              >
                <XIcon className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex max-w-[85%]",
                  message.role === 'user' ? 'self-end ml-auto' : 'self-start'
                )}
              >
                <div
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm",
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-neutral-700 text-neutral-200'
                  )}
                >
                  {message.content}
                  {message.isStreaming && (
                    <span className="inline-block w-1 h-3 bg-neutral-300 ml-1 animate-pulse" />
                  )}
                </div>
              </div>
            ))}
            
            {thinkingContent && (
              <div className="flex max-w-[85%] self-start">
                <div className="rounded-lg px-3 py-2 bg-neutral-800 text-neutral-400 border border-neutral-600">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-neutral-400 rounded-full animate-bounce" />
                      <div className="w-1 h-1 bg-neutral-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                      <div className="w-1 h-1 bg-neutral-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    </div>
                    <span className="text-xs italic">{thinkingContent}</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-neutral-700">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about this text..."
                className="flex-1 h-8 text-sm bg-neutral-800 border-neutral-600 focus:border-blue-500"
                disabled={isThinking}
              />
              <Button
                onClick={handleSendMessage}
                size="sm"
                className="h-8 px-3"
                disabled={!inputValue.trim() || isThinking}
              >
                <SendIcon className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}