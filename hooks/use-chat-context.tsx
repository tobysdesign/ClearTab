'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface ChatContextType {
  messages: any[] // Replace 'any' with your message type
  setMessages: React.Dispatch<React.SetStateAction<any[]>> // Replace 'any' with your message type
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<any[]>([]) // Replace 'any' with your message type
  const value = { messages, setMessages }
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChatContext() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider')
  }
  return context
} 