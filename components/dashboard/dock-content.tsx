'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Search from 'lucide-react/dist/esm/icons/search'
import Settings from 'lucide-react/dist/esm/icons/settings'
import X from 'lucide-react/dist/esm/icons/x'
import MessageSquare from 'lucide-react/dist/esm/icons/message-square'
import { ShinyAiButton } from '@/components/ui/shiny-ai-button'
import { cn } from '@/lib/utils'
import { useChatContext } from '@/hooks/use-chat-context'
import styles from './dock-content.module.css'

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
            styles.container,
            isVertical ? styles.containerVertical : styles.containerHorizontal
        )}>
            <button
                onClick={() => setShowSearch(!showSearch)}
                className={cn(
                    styles.iconButton,
                    showSearch && styles.iconButtonActive
                )}
            >
                <Search className={styles.icon} />
            </button>

            <ShinyAiButton
                onClick={handleToggleChat}
                className={cn(
                    isChatOpen && styles.aiButtonActive
                )}
            />

            {showSearch && (
                <div className={cn(
                    styles.searchContainer,
                    isVertical ? styles.searchContainerVertical : styles.searchContainerHorizontal
                )}>
                    <Input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className={styles.iconButton}
                        >
                            <X className={styles.icon} />
                        </button>
                    )}
                </div>
            )}

            {/* Settings button is handled by SettingsDrawer component */}
        </div>
    )
}
