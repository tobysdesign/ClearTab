'use client'

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react'
import { askAi } from '@/lib/actions/ai'
import { useSettings } from '@/hooks/use-settings'
import { useToast } from '@/hooks/use-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export interface Message {
  content: string
  role: 'user' | 'assistant'
}

interface ChatContextType {
  isChatOpen: boolean
  setIsChatOpen: React.Dispatch<React.SetStateAction<boolean>>
  openChat: () => void
  closeChat: () => void
  messages: Message[]
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  isThinking: boolean
  inputValue: string
  setInputValue: React.Dispatch<React.SetStateAction<string>>
  processMessage: (initialMessage?: string) => Promise<void>
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [isThinking, setIsThinking] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [agentName, setAgentName] = useState('')
  const { hasSeenOnboarding, onboardingStep, setOnboardingStep, completeOnboarding } = useSettings()
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
      const response = await askAi(userMessage, hasSeenOnboarding, onboardingStep)

      if (response.success && response.data) {
        // Handle onboarding steps
        if (!hasSeenOnboarding && response.data.onboardingStep) {
          setOnboardingStep(response.data.onboardingStep)
          
          // Store agent name during onboarding
          if (onboardingStep === 'agent-name') {
            setAgentName(userMessage)
        }
        
          // Complete onboarding with both names
        if (response.data.setupComplete) {
            completeOnboarding({ userName: userMessage, agentName })
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
  }, [inputValue, hasSeenOnboarding, onboardingStep, setOnboardingStep, completeOnboarding, createTaskMutation, createNoteMutation, toast, agentName])

  const openChat = useCallback(() => {
    setIsChatOpen(true)
    if (!hasSeenOnboarding) {
      processMessage('')
    }
  }, [hasSeenOnboarding, processMessage])

  const closeChat = useCallback(() => {
    setIsChatOpen(false)
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
    inputValue,
    setInputValue,
        processMessage,
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