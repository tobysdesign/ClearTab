'use client'

// Custom SVG icon components
import { CloseIcon } from '@/components/icons'
import { LayoutToggleIcon } from '@/components/icons/layout-toggle-icon'
import { Input } from '@/components/ui/input'
import { DockIconButton } from '@cleartab/ui'
import { AiShaderButton } from '@/components/ai/ai-shader-button'
import { SettingsTrigger } from '@/components/settings/settings-trigger'
import { cn } from '@/lib/utils'
import { useChatContext } from '@/hooks/use-chat-context'
import { useLayout } from '@/hooks/use-layout'
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
    setShowSearch: _setShowSearch,
    isVertical
}: DockContentProps) {
    const { isChatOpen, openChat, closeChat } = useChatContext()
    const { layout, toggleLayout } = useLayout()

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
            <DockIconButton
                onClick={toggleLayout}
                title={`Switch to ${layout === 'two-row' ? 'single' : 'two'} row layout`}
                shortcut="⌘L"
            >
                <LayoutToggleIcon
                    isToggled={layout === 'single-row'}
                    size={16}
                />
            </DockIconButton>

            <AiShaderButton
                data-testid="ai-chat-trigger"
                onClick={handleToggleChat}
                tooltip={isChatOpen ? 'Close AI chat' : 'Open AI chat'}
                shortcut="⌘K"
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
                        <DockIconButton
                            onClick={() => setSearchQuery("")}
                            title="Clear search"
                            shortcut="Esc"
                        >
                            <CloseIcon size={16} />
                        </DockIconButton>
                    )}
                </div>
            )}

            <SettingsTrigger />
        </div>
    )
}
