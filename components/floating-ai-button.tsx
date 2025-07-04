'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'
import { useChatContext } from '@/hooks/use-chat-context'

export default function FloatingAIButton() {
  const { openChat } = useChatContext()

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <Button size="lg" className="rounded-full shadow-lg" onClick={openChat}>
        <Sparkles className="h-6 w-6" />
      </Button>
    </div>
  )
} 