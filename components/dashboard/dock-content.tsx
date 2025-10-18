'use client'

// Custom SVG icon components
import { CloseIcon, SearchIcon } from '@/components/icons'
import { Input } from '@/components/ui/input'
import { ShinyAiButton } from '@/components/ui/shiny-ai-button'
import { SettingsTrigger } from '@/components/settings/settings-trigger'
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
                <SearchIcon size={16} className="text-white/60" />
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
                            <CloseIcon size={16} className="text-white/60" />
                        </button>
                    )}
                </div>
            )}

            <SettingsTrigger />
        </div>
    )
}
