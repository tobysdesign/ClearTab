'use client'

// Icons replaced with ASCII placeholders
import React from 'react'
import { CloseIcon } from '@/components/icons'
import { useChatContext } from '@/hooks/use-chat-context'
import { motion, AnimatePresence } from 'framer-motion'
import { ChatPanel } from './chat-panel'
import { ShinyAiButton, Button } from '@cleartab/ui'
import styles from './chat-overlay.module.css'

function ChatOverlay() {
  const {
    isChatOpen,
    closeChat,
    messages,
    processMessage,
    processStreamingMessage,
    isThinking,
    thinkingContent,
    inputValue,
    setInputValue,
    isStreamingMode,
    toggleStreamingMode,
  } = useChatContext()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInputValue(e.target.value)
  }

  const handleUserInput = async () => {
    if (isStreamingMode) {
      await processStreamingMessage()
    } else {
      await processMessage()
    }
  }

  return (
    <AnimatePresence>
      {isChatOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={styles.overlay}
      onClick={closeChat}
    >
          <motion.div
            layoutId="ai-chat-modal"
          className={styles.modal}
            style={{
              height: '70vh',
              maxHeight: '750px',
            }}
        onClick={(e) => e.stopPropagation()}
      >
          <motion.div className={styles.chatContainer}>
            <div className={styles.header}>
              <div className={styles.headerContent}>
                <div className={styles.titleSection}>
              <ShinyAiButton layoutId="ai-chat-icon-transform" onClick={() => {}} />
                  <h2 className={styles.title}>AI Chat</h2>
                </div>
                <div className={styles.actions}>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={toggleStreamingMode}
                    className={styles.streamButton}
                    tooltipLabel="Toggle streaming mode"
                    shortcut="⌥S"
                  >
                    {isStreamingMode ? 'Stream: ON' : 'Stream: OFF'}
                  </Button>
                  <Button variant="ghost" size="icon" className={styles.iconButton} tooltipLabel="More actions" shortcut="⌘/.">
                    <span className={styles.icon}>•</span>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={closeChat} className={styles.iconButton} tooltipLabel="Close chat" shortcut="Esc">
                    <CloseIcon size={16} className="text-white/60" />
                  </Button>
                </div>
        </div>
            </div>
            <div className={styles.content}>
              <ChatPanel
                messages={messages}
                onUserInput={handleUserInput}
                isPending={isThinking}
                thinkingContent={thinkingContent}
                isStreamingMode={isStreamingMode}
                inputValue={inputValue}
                onInputChange={handleInputChange}
              />
            </div>
          </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 

export default ChatOverlay 
