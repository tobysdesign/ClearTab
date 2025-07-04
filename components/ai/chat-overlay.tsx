'use client'

import React from 'react'
import { useChatContext } from '@/hooks/use-chat-context'
import { motion, AnimatePresence } from 'framer-motion'
import { ChatPanel } from './chat-panel'
import { ShinyAiButton } from '../ui/shiny-ai-button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, MoreHorizontal } from 'lucide-react'

function ChatOverlay() {
  const {
    isChatOpen,
    closeChat,
    messages,
    processMessage,
    isThinking,
    inputValue,
    setInputValue,
  } = useChatContext()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInputValue(e.target.value)
  }

  const handleUserInput = async () => {
    await processMessage()
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
          <Card className="h-full flex flex-col bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl">
            <CardHeader className="flex-shrink-0 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
              <ShinyAiButton layoutId="ai-chat-icon-transform" onClick={() => {}} />
                  <CardTitle className="text-lg">Tasks</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={closeChat}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
        </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 min-h-0">
              <ChatPanel
                messages={messages}
                onUserInput={handleUserInput}
                isPending={isThinking}
                inputValue={inputValue}
                onInputChange={handleInputChange}
              />
            </CardContent>
          </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 

export default ChatOverlay 