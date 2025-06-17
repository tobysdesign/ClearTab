'use client'

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function ChatPanel() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-y-auto p-4 bg-muted/50 rounded-lg">
        {/* Messages will go here */}
        <p className="text-muted-foreground">Ask me anything...</p>
      </div>
      <form className="mt-4 flex gap-2">
        <Input placeholder="Type a message..." />
        <Button type="submit">Send</Button>
      </form>
    </div>
  )
} 