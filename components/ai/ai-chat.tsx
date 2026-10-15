'use client'

import React, { useCallback, useState } from 'react'
import { DockPanel } from '@cleartab/ui'
import { AddIcon, ChevronLeftIcon, CloseIcon, TrashIcon } from '@/components/icons'
import { useChatContext } from '@/hooks/use-chat-context'
import { ChatMessages } from './chat-messages'
import { ChatInput } from './chat-input'
import styles from './ai-chat.module.css'

const SIDEBAR_KEY = 'cleartab-chat-sidebar-open'

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
    threads,
    activeThreadId,
    newThread,
    selectThread,
    deleteThread,
  } = useChatContext()

  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true
    try {
      return window.localStorage.getItem(SIDEBAR_KEY) !== 'false'
    } catch {
      return true
    }
  })

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => {
      const next = !prev
      try {
        window.localStorage.setItem(SIDEBAR_KEY, String(next))
      } catch {
        // ignore
      }
      return next
    })
  }, [])

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
    <DockPanel
      isOpen={isChatOpen}
      onClose={closeChat}
      anchorSelector='[data-testid="ai-chat-trigger"]'
      className={`${styles.container} ${sidebarOpen ? styles.withSidebar : ''}`}
    >
      <div className={styles.layout}>
        {sidebarOpen && (
          <aside className={styles.sidebar}>
            <button type="button" className={styles.newChatButton} onClick={newThread}>
              <AddIcon size={14} />
              <span>New chat</span>
            </button>
            <ul className={styles.threadList}>
              {threads.map(thread => (
                <li key={thread.id} className={styles.threadItem} data-active={thread.id === activeThreadId}>
                  <button
                    type="button"
                    className={styles.threadButton}
                    onClick={() => selectThread(thread.id)}
                    title={thread.title}
                  >
                    {thread.title}
                  </button>
                  <button
                    type="button"
                    className={styles.threadDelete}
                    onClick={() => deleteThread(thread.id)}
                    aria-label={`Delete "${thread.title}"`}
                  >
                    <TrashIcon size={12} />
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        )}

        <div className={styles.main}>
          <div className={styles.modalHeader}>
            <div className={styles.headerLeft}>
              <button
                type="button"
                className={styles.sidebarToggle}
                onClick={toggleSidebar}
                aria-label={sidebarOpen ? 'Hide conversations' : 'Show conversations'}
              >
                <ChevronLeftIcon size={16} className={sidebarOpen ? undefined : styles.toggleCollapsed} />
              </button>
              <h2 className={styles.modalTitle}>AI Chat</h2>
            </div>
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
        </div>
      </div>
    </DockPanel>
  )
}

export default AiChat
