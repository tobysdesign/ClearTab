'use client'

import { useChatContext } from "@/hooks/use-chat-context"
import { Dock } from "@/components/ui/dock"
import { Button } from "@/components/ui/button"
import { ChatBubbleIcon } from "@radix-ui/react-icons"

export function ChatDock() {
    const { openChat } = useChatContext()

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2">
            <Dock>
                <Button variant="ghost-icon" size="icon" onClick={openChat}>
                    <ChatBubbleIcon className="h-6 w-6" />
                </Button>
            </Dock>
        </div>
    )
} 