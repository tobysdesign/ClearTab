'use client'

import React, { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import styles from './chat-messages.module.css'

export interface Message {
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
  quickReplies?: string[]
}

interface ChatMessagesProps {
  messages: Message[]
  isThinking: boolean
  thinkingContent: string
  onQuickReply: (reply: string) => void
}

function MessageBubble({ message, onQuickReply, isLast }: {
  message: Message
  onQuickReply: (reply: string) => void
  isLast: boolean
}) {
  const isUser = message.role === 'user'

  return (
    <div className={`${styles.messageContainer} ${isUser ? styles.user : styles.assistant}`}>
      <div className={`${styles.bubble} ${isUser ? styles.userBubble : styles.assistantBubble}`}>
        <span className={styles.content}>{message.content}</span>
        {message.isStreaming && <span className={styles.cursor} />}
      </div>
      {isLast && message.quickReplies && message.quickReplies.length > 0 && (
        <div className={styles.quickReplies}>
          {message.quickReplies.map((reply, index) => (
            <button
              key={index}
              className={styles.quickReplyButton}
              onClick={() => onQuickReply(reply)}
            >
              {reply}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ThinkingIndicator({ content }: { content: string }) {
  return (
    <div className={`${styles.messageContainer} ${styles.assistant}`}>
      <div className={`${styles.bubble} ${styles.assistantBubble} ${styles.thinking}`}>
        <div className={styles.thinkingDots}>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </div>
        {content && <span className={styles.thinkingText}>{content}</span>}
      </div>
    </div>
  )
}

export function ChatMessages({ messages, isThinking, thinkingContent, onQuickReply }: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isThinking])

  return (
    <div className={styles.container} ref={scrollRef}>
      {messages.map((message, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          <MessageBubble
            message={message}
            onQuickReply={onQuickReply}
            isLast={index === messages.length - 1}
          />
        </motion.div>
      ))}
      {isThinking && <ThinkingIndicator content={thinkingContent} />}
    </div>
  )
}

export default ChatMessages
