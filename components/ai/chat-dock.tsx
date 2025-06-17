'use client'

import {
    PopOver,
    PopOverContent,
    PopOverDescription,
    PopOverHeader,
    PopOverTitle,
    PopOverTrigger,
} from "@/components/ui/pop-over"
import { Dock } from "@/components/ui/dock"
import { ChatPanel } from "@/components/ai/chat-panel"
import { Button } from "@/components/ui/button"
import { ChatBubbleIcon } from "@radix-ui/react-icons"

export function ChatDock() {
    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2">
            <Dock>
                <PopOver>
                    <PopOverTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <ChatBubbleIcon className="h-6 w-6" />
                        </Button>
                    </PopOverTrigger>
                    <PopOverContent className="w-[440px] h-[70vh] bottom-20 rounded-lg left-1/2 ml-[-220px]">
                        <PopOverHeader>
                            <PopOverTitle>AI Chat</PopOverTitle>
                            <PopOverDescription>
                                Your intelligent assistant.
                            </PopOverDescription>
                        </PopOverHeader>
                        <div className="flex-grow overflow-y-auto p-4">
                            <ChatPanel />
                        </div>
                    </PopOverContent>
                </PopOver>
            </Dock>
        </div>
    )
} 