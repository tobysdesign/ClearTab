'use client'

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react'
import { askAi } from '@/lib/actions/ai'
import { useSettings } from '@/hooks/use-settings'
import { useToast } from '@/hooks/use-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export interface Message {
  content: string
  role: 'user' | 'assistant'
  isStreaming?: boolean
}

interface ChatContextType {
  isChatOpen: boolean
  setIsChatOpen: React.Dispatch<React.SetStateAction<boolean>>
  openChat: () => void
  closeChat: () => void
  messages: Message[]
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  isThinking: boolean
  thinkingContent: string
  inputValue: string
  setInputValue: React.Dispatch<React.SetStateAction<string>>
  processMessage: (initialMessage?: string) => Promise<void>
  processStreamingMessage: (initialMessage?: string) => Promise<void>
  isStreamingMode: boolean
  toggleStreamingMode: () => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [isThinking, setIsThinking] = useState(false)
  const [thinkingContent, setThinkingContent] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [isStreamingMode, setIsStreamingMode] = useState(true)
  const { hasSeenOnboarding, onboardingStep, setOnboardingStep, completeOnboarding, userName, agentName } = useSettings()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (!response.ok) throw new Error('Failed to create task')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast({
        title: 'Task created',
        description: 'Your task has been created successfully.',
      })
    },
  })

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (!response.ok) throw new Error('Failed to create note')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      toast({
        title: 'Note created',
        description: 'Your note has been created successfully.',
      })
    },
  })

  const processMessage = useCallback(async (initialMessage?: string) => {
    if ((!inputValue.trim() && !initialMessage) && hasSeenOnboarding) return

    setIsThinking(true)
    const userMessage = initialMessage || inputValue || ''
    setInputValue('')

    // Add user message to chat
    if (userMessage) {
      setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    }

    try {
      // Process hashtags before sending to AI
      if (hasSeenOnboarding) {
        const taskMatch = userMessage.match(/#task\s+(.+)/)
        const noteMatch = userMessage.match(/#note\s+(.+)/)

        if (taskMatch) {
          await createTaskMutation.mutateAsync(taskMatch[1])
        }
        if (noteMatch) {
          await createNoteMutation.mutateAsync(noteMatch[1])
      }
      }

      // Get AI response
      const response = await askAi(userMessage, hasSeenOnboarding, onboardingStep, userName, agentName)

      if (response.success && response.data) {
        // Handle onboarding steps
        if (!hasSeenOnboarding && response.data.onboardingStep) {
          setOnboardingStep(response.data.onboardingStep)
          
          // Complete onboarding with both names
        if (response.data.setupComplete) {
            completeOnboarding({ userName: userMessage, agentName: 'Toby' }) // Defaulting agent name for now
        }
        }

        // Add AI response to chat
        const aiMessage = response.data.data || ''
        setMessages(prev => [...prev, { role: 'assistant', content: aiMessage }])
      } else {
        throw new Error(response.error || 'Failed to get AI response')
      }
    } catch (error) {
      console.error('Error processing message:', error)
      toast({
        title: 'Error',
        description: 'Failed to process your message. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsThinking(false)
    }
  }, [inputValue, hasSeenOnboarding, onboardingStep, setOnboardingStep, completeOnboarding, createTaskMutation, createNoteMutation, toast, userName, agentName])

  const processStreamingMessage = useCallback(async (initialMessage?: string) => {
    if ((!inputValue.trim() && !initialMessage) && hasSeenOnboarding) return

    setIsThinking(true)
    setThinkingContent('')
    const userMessage = initialMessage || inputValue || ''
    setInputValue('')

    // Add user message to chat
    if (userMessage) {
      setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    }

    try {
      // Process hashtags before sending to AI
      if (hasSeenOnboarding) {
        const taskMatch = userMessage.match(/#task\s+(.+)/)
        const noteMatch = userMessage.match(/#note\s+(.+)/)

        if (taskMatch) {
          await createTaskMutation.mutateAsync(taskMatch[1])
        }
        if (noteMatch) {
          await createNoteMutation.mutateAsync(noteMatch[1])
        }
      }

      // Start streaming response
      const response = await fetch('/api/ai/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMessage,
          hasSeenOnboarding,
          userName,
          agentName
        })
      })

      if (!response.ok) throw new Error('Failed to get streaming response')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      
      let currentMessage = ''
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
                    // Add initial assistant message
                    setMessages(prev => {
                      const newMessages = [...prev, { role: 'assistant', content: data.content, isStreaming: true }]
                      messageIndex = newMessages.length - 1
                      return newMessages
                    })
                  } else {
                    // Update existing message
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
              console.warn('Failed to parse streaming chunk:', parseError)
            }
          }
        }
      }

    } catch (error) {
      console.error('Error processing streaming message:', error)
      toast({
        title: 'Error',
        description: 'Failed to process your message. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsThinking(false)
      setThinkingContent('')
    }
  }, [inputValue, hasSeenOnboarding, userName, agentName, createTaskMutation, createNoteMutation, toast])

  const toggleStreamingMode = useCallback(() => {
    setIsStreamingMode(prev => !prev)
  }, [])

  const openChat = useCallback(() => {
    setIsChatOpen(true)
    if (messages.length === 0) {
      if (hasSeenOnboarding) {
        setMessages([{ role: 'assistant', content: 'Welcome back! What can I help you with?' }])
      } else {
        processMessage('')
      }
    }
  }, [hasSeenOnboarding, processMessage, messages])

  const closeChat = useCallback(() => {
    setIsChatOpen(false)
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey && event.key === 'k') {
        event.preventDefault()
        setIsChatOpen(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

    return (
    <ChatContext.Provider
      value={{
        isChatOpen, 
        setIsChatOpen, 
        openChat, 
        closeChat, 
        messages, 
        setMessages,
        isThinking,
        thinkingContent,
        inputValue,
        setInputValue,
        processMessage,
        processStreamingMessage,
        isStreamingMode,
        toggleStreamingMode,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChatContext() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider')
  }
  return context
} 