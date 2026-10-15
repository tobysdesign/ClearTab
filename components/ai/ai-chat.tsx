'use client'

import React, { useCallback } from 'react'
import { DockPanel } from '@cleartab/ui'
import { CloseIcon } from '@/components/icons'
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

  // Same dock-anchored panel as Settings/Layout/Shortcuts (which also handles
  // Escape, click-outside and one-panel-at-a-time).
  return (
    <DockPanel isOpen={isChatOpen} onClose={closeChat} anchorSelector='[data-testid="ai-chat-trigger"]' className={styles.container}>
      <div className={styles.modalHeader}>
        <h2 className={styles.modalTitle}>AI Chat</h2>
        <button type="button" onClick={closeChat} className={styles.closeButton}>
          <span>Done</span>
          <kbd className={styles.escKey}>Esc</kbd>
        </button>
      </div>

      {messages.length > 0 && (
        <div className={styles.messagesArea}>
          <ChatMessages
            messages={messages}
            isThinking={isThinking}
            thinkingContent={thinkingContent}
            onQuickReply={handleQuickReply}
            onRetry={retryLastMessage}
            onAddTasks={addSuggestedTasks}
          />
        </div>
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
    </DockPanel>
  )
}

export default AiChat
