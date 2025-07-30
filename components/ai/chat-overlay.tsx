'use client'

import React from 'react'
import { useChatContext } from '@/hooks/use-chat-context'
import { motion, AnimatePresence } from 'framer-motion'
import { ChatPanel } from './chat-panel'
import { ShinyAiButton } from '../ui/shiny-ai-button'
import { Button } from '@/components/ui/button'
import X from 'lucide-react/dist/esm/icons/x'
import MoreHorizontal from 'lucide-react/dist/esm/icons/more-horizontal'

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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={closeChat}
    >
          <motion.div
            layoutId="ai-chat-modal"
          className="relative w-full max-w-2xl mx-4"
            style={{
              height: '70vh',
              maxHeight: '750px',
            }}
        onClick={(e) => e.stopPropagation()}
      >
          <motion.div className="h-full flex flex-col bg-gradient-to-b from-[#151515] to-[#121212] rounded-3xl border border-neutral-800 shadow-2xl">
            <div className="flex-shrink-0 border-b border-neutral-800 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
              <ShinyAiButton layoutId="ai-chat-icon-transform" onClick={() => {}} />
                  <h2 className="text-lg font-semibold">AI Chat</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={toggleStreamingMode}
                    className="text-xs px-2 h-7"
                  >
                    {isStreamingMode ? 'Stream: ON' : 'Stream: OFF'}
                  </Button>
                  <Button variant="ghost" size="icon" className="w-8 h-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={closeChat} className="w-8 h-8">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
        </div>
            </div>
            <div className="flex-1 p-0 min-h-0">
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