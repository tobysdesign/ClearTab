'use client'

import { useEffect } from "react"
import ResizableBentoGrid from "@/components/dashboard/resizable-bento-grid"
import ChatOverlay from "@/components/ai/chat-overlay"
import FloatingAIButton from "@/components/floating-ai-button"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { useAgentInit } from "@/hooks/use-agent-init"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import Link from "next/link"

export default function Dashboard() {
  const { isFirstTime, isInitFlowOpen, closeInitFlow } = useAgentInit()
  const { isChatOpen, openChat, closeChat, initialMessage } = useKeyboardShortcuts()

  useEffect(() => {
    document.title = "AI Productivity Dashboard"
    
    if (isInitFlowOpen && !isChatOpen) {
      openChat()
    }
  }, [isInitFlowOpen, isChatOpen, openChat])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="bg-background/80 text-foreground min-h-screen">
        <div className="absolute top-4 right-4 z-10">
          <Link href="/settings">
            <Button variant="ghost" size="sm" className="bg-background/50 backdrop-blur-sm">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        
        <ResizableBentoGrid />
        
        <FloatingAIButton />
        
        <ChatOverlay 
          isOpen={isChatOpen || isInitFlowOpen}
          onClose={closeChat}
          initialMessage={initialMessage}
          isSetupMode={isInitFlowOpen}
          onSetupComplete={closeInitFlow}
        />
      </div>
    </div>
  )
}