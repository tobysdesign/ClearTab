'use client'

import React, { useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConversationStarters } from './conversation-starters'

export interface Message {
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

interface ChatPanelProps {
  messages: Message[]
  isPending: boolean
  thinkingContent: string
  isStreamingMode?: boolean
  onUserInput: () => void
  inputValue: string
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

function ChatMessage({ message }: { message: Message }) {
    return (
        <div
            className={cn(
                "mb-4 flex max-w-[80%]",
                message.role === 'user' ? 'self-end' : 'self-start'
            )}
        >
            <div
                className={cn(
                    "rounded-lg px-4 py-2",
                    message.role === 'user'
                        ? 'bg-[#292929] border border-[#434343] text-neutral-200'
                        : 'bg-[#222222] text-neutral-300'
                )}
            >
                {message.content}
                {message.isStreaming && (
                    <span className="inline-block w-2 h-4 bg-neutral-400 ml-1 animate-pulse" />
                )}
            </div>
        </div>
    );
}

function ThinkingMessage({ content }: { content: string }) {
    return (
        <div className="mb-4 flex max-w-[80%] self-start">
            <div className="rounded-lg px-4 py-2 bg-[#1a1a1a] text-neutral-400 border border-[#333]">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                        <div className="w-1 h-1 bg-neutral-400 rounded-full animate-bounce" />
                        <div className="w-1 h-1 bg-neutral-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                        <div className="w-1 h-1 bg-neutral-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    </div>
                    <span className="text-sm italic">{content}</span>
                </div>
            </div>
        </div>
    );
}

export function ChatPanel({
  messages,
  isPending,
  thinkingContent,
  isStreamingMode = true,
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

    const handleStarterSelect = (starter: string) => {
        onInputChange({ target: { value: starter } } as React.ChangeEvent<HTMLInputElement>);
        // We need a slight delay to ensure the input value is updated before submitting
        setTimeout(() => {
            onUserInput();
        }, 50);
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (inputValue.trim()) {
            onUserInput();
        }
    }

  return (
    <div className="flex flex-col h-full p-6 bg-gradient-to-b from-[#151515] to-[#121212] rounded-3xl">
      <div className="flex-grow overflow-y-auto pr-4 -mr-4 flex flex-col">
        {messages.map((msg, index) => (
          <ChatMessage key={index} message={msg} />
        ))}
        {isPending && (!isStreamingMode || !thinkingContent) && (
            <ChatMessage message={{ role: 'assistant', content: '...'}} />
        )}
        {isStreamingMode && thinkingContent && (
            <ThinkingMessage content={thinkingContent} />
        )}
        <div ref={messagesEndRef} />
      </div>
        {messages.length === 0 && !isPending && (
            <ConversationStarters onSelect={handleStarterSelect} />
        )}
      <div className="mt-6 pt-6 border-t border-neutral-800">
        <form onSubmit={handleSubmit} className="relative">
          <Label htmlFor="chat-input" className="absolute -top-3 left-3 bg-[#121212] px-1 text-xs uppercase text-[#555454] tracking-[1.2px] font-medium font-mono">Message</Label>
          <Input
            id="chat-input"
            placeholder="Type your message..."
            value={inputValue}
            onChange={onInputChange}
            className="bg-transparent border-[#3d3d3d] h-11"
          />
        </form>
      </div>
    </div>
  )
}
