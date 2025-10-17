'use client'

// Icons replaced with ASCII placeholders
import { Input } from '@/components/ui/input'
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
    showSettings: _showSettings,
    setShowSettings: _setShowSettings,
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
                <span className={styles.icon}>🔍</span>
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
                            <span className={styles.icon}>×</span>
                        </button>
                    )}
                </div>
            )}

            {/* Settings button is handled by SettingsDrawer component */}
        </div>
    )
}
