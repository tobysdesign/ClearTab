'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Settings, X, MessageSquare } from 'lucide-react'
import { ShinyAiButton } from '@/components/ui/shiny-ai-button'
import { cn } from '@/lib/utils'
import { useChatContext } from '@/hooks/use-chat-context'

interface DockContentProps {
    showSearch: boolean
    searchQuery: string
    setSearchQuery: (query: string) => void
    showSettings: boolean
    setShowSettings: (show: boolean) => void
    setShowSearch: (show: boolean) => void
    isVertical: boolean
}

export function DockContent({ 
    showSearch, 
    searchQuery, 
    setSearchQuery, 
    showSettings, 
    setShowSettings, 
    setShowSearch,
    isVertical 
}: DockContentProps) {
    const { isChatOpen, openChat, closeChat } = useChatContext()

    const handleToggleChat = () => {
        if (isChatOpen) {
            closeChat()
        } else {
            openChat()
        }
    }

    return (
        <div className={cn(
            "flex items-center",
            isVertical ? "flex-col space-y-2" : "space-x-2"
        )}>
            <button
                onClick={() => setShowSearch(!showSearch)}
                className={cn(
                    "rounded-lg p-2 transition-all duration-200 hover:bg-white/20 hover:shadow-lg text-white/80 hover:text-white",
                    showSearch && "bg-white/20 text-white shadow-lg"
                )}
            >
                <Search className="h-4 w-4" />
            </button>

            <ShinyAiButton
                onClick={handleToggleChat}
                className={cn(
                    isChatOpen && "bg-muted"
                )}
            />

            {showSearch && (
                <div className={cn(
                    "flex items-center",
                    isVertical ? "flex-col space-y-2" : "space-x-2"
                )}>
                    <Input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-8 w-[150px] bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/40"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="rounded-lg p-2 transition-all duration-200 hover:bg-white/20 hover:shadow-lg text-white/80 hover:text-white"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            )}

            <button
                onClick={() => setShowSettings(!showSettings)}
                className={cn(
                    "rounded-lg p-2 transition-all duration-200 hover:bg-white/20 hover:shadow-lg text-white/80 hover:text-white",
                    showSettings && "bg-white/20 text-white shadow-lg"
                )}
            >
                <Settings className="h-4 w-4" />
            </button>
        </div>
    )
} 