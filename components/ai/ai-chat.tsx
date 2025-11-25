'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CloseIcon, ChevronDownIcon, ChevronUpIcon } from '@/components/icons'
import { useChatContext } from '@/hooks/use-chat-context'
import { ChatMessages } from './chat-messages'
import { ChatInput } from './chat-input'
import styles from './ai-chat.module.css'

export function AiChat() {
  const {
    isChatOpen,
    closeChat,
    messages,
    processStreamingMessage,
    isThinking,
    thinkingContent,
    inputValue,
    setInputValue,
    setMessages,
  } = useChatContext()

  const [isExpanded, setIsExpanded] = useState(false)

  // Expand when there are messages or thinking
  useEffect(() => {
    if (messages.length > 0 || isThinking) {
      setIsExpanded(true)
    }
  }, [messages.length, isThinking])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isChatOpen) {
        closeChat()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isChatOpen, closeChat])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInputValue(e.target.value)
  }, [setInputValue])

  const handleSubmit = useCallback(async () => {
    if (!inputValue.trim()) return
    await processStreamingMessage()
  }, [inputValue, processStreamingMessage])

  const handleQuickReply = useCallback(async (reply: string) => {
    // Add user message for the quick reply
    setMessages(prev => [...prev, { role: 'user', content: reply }])
    // Process as if user typed it
    setInputValue(reply)
    await processStreamingMessage(reply)
  }, [setMessages, setInputValue, processStreamingMessage])

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev)
  }, [])

  if (!isChatOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closeChat}
      >
        <motion.div
          className={styles.container}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
        >
          <AnimatePresence mode="wait">
            {isExpanded && messages.length > 0 ? (
              <motion.div
                key="expanded"
                className={styles.expandedContent}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className={styles.header}>
                  <button
                    className={styles.collapseButton}
                    onClick={toggleExpanded}
                    aria-label="Collapse chat"
                  >
                    <ChevronDownIcon size={14} />
                  </button>
                  <button
                    className={styles.closeButton}
                    onClick={closeChat}
                    aria-label="Close chat"
                  >
                    <CloseIcon size={14} />
                  </button>
                </div>
                <ChatMessages
                  messages={messages}
                  isThinking={isThinking}
                  thinkingContent={thinkingContent}
                  onQuickReply={handleQuickReply}
                />
              </motion.div>
            ) : messages.length > 0 ? (
              <motion.div
                key="collapsed-indicator"
                className={styles.collapsedIndicator}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <button
                  className={styles.expandButton}
                  onClick={toggleExpanded}
                  aria-label="Expand chat"
                >
                  <ChevronUpIcon size={14} />
                  <span className={styles.messageCount}>
                    {messages.length} message{messages.length !== 1 ? 's' : ''}
                  </span>
                </button>
                <button
                  className={styles.closeButton}
                  onClick={closeChat}
                  aria-label="Close chat"
                >
                  <CloseIcon size={14} />
                </button>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <ChatInput
            value={inputValue}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            disabled={isThinking}
            placeholder="Message..."
          />

          <div className={styles.hints}>
            <span className={styles.hint}>#task</span>
            <span className={styles.hint}>#note</span>
            <span className={styles.shortcut}>Cmd+K</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default AiChat
