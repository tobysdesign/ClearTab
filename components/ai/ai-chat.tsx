'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DockPanel, Tooltip, TooltipContent, TooltipTrigger } from '@cleartab/ui'
import { ChevronDownIcon, ChevronUpIcon, CloseIcon } from '@/components/icons'
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
    retryLastMessage,
    sendQuickReply,
    addSuggestedTasks,
    contextText,
    clearContext,
    isThinking,
    thinkingContent,
    inputValue,
    setInputValue,
  } = useChatContext()

  const [isExpanded, setIsExpanded] = useState(false)

  // Expand when there are messages or thinking
  useEffect(() => {
    if (messages.length > 0 || isThinking) {
      setIsExpanded(true)
    }
  }, [messages.length, isThinking])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInputValue(e.target.value)
  }, [setInputValue])

  const handleSubmit = useCallback(async () => {
    if (!inputValue.trim()) return
    await processStreamingMessage()
  }, [inputValue, processStreamingMessage])

  // "Make tasks from this" runs task suggestion; other replies are sent as messages
  const handleQuickReply = useCallback(async (reply: string) => {
    await sendQuickReply(reply)
  }, [sendQuickReply])

  const handleInsertCommand = useCallback((command: 'task' | 'note') => {
    const rest = inputValue.replace(/#(task|note)\s*/g, '')
    setInputValue(`#${command} ${rest}`)
  }, [inputValue, setInputValue])

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev)
  }, [])

  // Same dock-anchored panel as Settings/Layout/Shortcuts (which also handles
  // Escape, click-outside and one-panel-at-a-time).
  return (
    <DockPanel isOpen={isChatOpen} onClose={closeChat} anchorSelector='[data-testid="ai-chat-trigger"]' className={styles.container}>
      <div className={styles.modalHeader}>
        <h2 className={styles.modalTitle}>AI Chat</h2>
        <div className={styles.headerActions}>
          {messages.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={toggleExpanded}
                  aria-label={isExpanded ? 'Collapse chat' : 'Expand chat'}
                >
                  {isExpanded ? <ChevronDownIcon size={14} /> : <ChevronUpIcon size={14} />}
                </button>
              </TooltipTrigger>
              <TooltipContent>{isExpanded ? 'Collapse chat' : 'Expand chat'}</TooltipContent>
            </Tooltip>
          )}
          <button type="button" onClick={closeChat} className={styles.closeButton}>
            <span>Done</span>
            <kbd className={styles.escKey}>Esc</kbd>
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && messages.length > 0 && (
          <motion.div
            key="expanded"
            className={styles.expandedContent}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChatMessages
              messages={messages}
              isThinking={isThinking}
              thinkingContent={thinkingContent}
              onQuickReply={handleQuickReply}
              onRetry={retryLastMessage}
              onAddTasks={addSuggestedTasks}
            />
          </motion.div>
        )}
      </AnimatePresence>
      {!isExpanded && messages.length > 0 && (
        <button type="button" className={styles.collapsedIndicator} onClick={toggleExpanded}>
          {messages.length} message{messages.length !== 1 ? 's' : ''} hidden
        </button>
      )}

      {contextText && (
        <div className={styles.contextChip}>
          <span className={styles.contextLabel}>About</span>
          <span className={styles.contextText}>{contextText}</span>
          <button type="button" className={styles.contextClear} onClick={clearContext} aria-label="Stop asking about this text">
            <CloseIcon size={12} />
          </button>
        </div>
      )}

      <ChatInput
        value={inputValue}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        onInsertCommand={handleInsertCommand}
        disabled={isThinking}
        placeholder="Message..."
      />

      <div className={styles.hints}>
        <span className={styles.shortcut}>
          <kbd className={styles.key}>⌘</kbd>
          <kbd className={styles.key}>K</kbd>
        </span>
      </div>
    </DockPanel>
  )
}

export default AiChat
