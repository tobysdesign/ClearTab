'use client'

import React, { useRef, useEffect } from 'react'
import { PlaceholdersAndVanishInput } from '@/components/ui/placeholders-and-vanish-input'
import { cn } from '@/lib/utils'

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatPanelProps {
  messages: Message[]
  isPending: boolean
  onUserInput: () => void
  inputValue: string
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

function ChatMessage({ message }: { message: Message }) {
    return (
        <div
            className={cn(
                "mb-4 flex",
                message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
        >
            <div
                className={cn(
                    "rounded-lg px-4 py-2",
                    message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-200'
                )}
            >
                {message.content}
            </div>
        </div>
    );
}

export function ChatPanel({
  messages,
  isPending,
  onUserInput,
  inputValue,
  onInputChange,
}: ChatPanelProps) {
    const placeholders = [
        "Try adding #task at the anywhere in a message and I will create a task for you",
        "Did you know adding #note when you message the message will become a note!",
        "Cmd + K opens the chat window, don't do it now because it closes it too!",
        "If you tell me when people or things are important I can recall when asked how many times you referenced it and what else was mentioned when it was."
    ];

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (inputValue.trim()) {
            onUserInput();
        }
    }

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex-grow overflow-y-auto pr-4 -mr-4">
        {messages.map((msg, index) => (
          <ChatMessage key={index} message={msg} />
        ))}
        {isPending && (
            <ChatMessage message={{ role: 'assistant', content: '...'}} />
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="mt-4">
        <PlaceholdersAndVanishInput
            placeholders={placeholders}
            onChange={onInputChange}
            onSubmit={handleSubmit}
            value={inputValue}
        />
      </div>
    </div>
  )
}
