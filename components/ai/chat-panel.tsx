'use client'

import React, { useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConversationStarters } from './conversation-starters'
import styles from './chat-panel.module.css'

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
                styles.messageContainer,
                message.role === 'user' ? styles.messageContainerUser : styles.messageContainerAssistant
            )}
        >
            <div
                className={cn(
                    styles.messageContent,
                    message.role === 'user' ? styles.messageContentUser : styles.messageContentAssistant
                )}
            >
                {message.content}
                {message.isStreaming && (
                    <span className={styles.streamingCursor} />
                )}
            </div>
        </div>
    );
}

function ThinkingMessage({ content }: { content: string }) {
    return (
        <div className={styles.thinkingContainer}>
            <div className={styles.thinkingContent}>
                <div className={styles.thinkingIndicator}>
                    <div className={styles.thinkingDots}>
                        <div className={styles.thinkingDot} />
                        <div className={cn(styles.thinkingDot, styles.thinkingDotDelay1)} />
                        <div className={cn(styles.thinkingDot, styles.thinkingDotDelay2)} />
                    </div>
                    <span className={styles.thinkingText}>{content}</span>
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
    const _placeholders = [
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
    <div className={styles.chatContainer}>
      <div className={styles.messagesContainer}>
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
      <div className={styles.inputSection}>
        <form onSubmit={handleSubmit} className={styles.inputForm}>
          <Label htmlFor="chat-input" className={styles.inputLabel}>Message</Label>
          <Input
            id="chat-input"
            placeholder="Type your message..."
            value={inputValue}
            onChange={onInputChange}
            className={styles.input}
          />
        </form>
      </div>
    </div>
  )
}
