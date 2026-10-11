'use client'

import React from 'react'
import { CloseIcon } from '@/components/icons'
import { LayoutToggleIcon } from '@/components/icons/layout-toggle-icon'
import { Input } from '@/components/ui/input'
import { DockIconButton, ShinyAiButton } from '@cleartab/ui'
import { SettingsTrigger } from '@/components/settings/settings-trigger'
import { cn } from '@/lib/utils'
import { useChatContext } from '@/hooks/use-chat-context'
import styles from '../dock-content.module.css'

interface BetaDockContentProps {
  showSearch: boolean
  searchQuery: string
  setSearchQuery: (query: string) => void
  showSettings: boolean
  setShowSettings: (show: boolean) => void
  setShowSearch: (show: boolean) => void
  isVertical: boolean
  onOpenLayoutModal: () => void
  onOpenShortcuts: () => void
}

export function BetaDockContent({
  showSearch,
  searchQuery,
  setSearchQuery,
  showSettings: _showSettings,
  setShowSettings: _setShowSettings,
  setShowSearch: _setShowSearch,
  isVertical,
  onOpenLayoutModal,
  onOpenShortcuts,
}: BetaDockContentProps) {
  const { isChatOpen, openChat, closeChat } = useChatContext()

  const handleToggleChat = () => {
    if (isChatOpen) {
      closeChat()
    } else {
      openChat()
    }
  }

  return (
    <div
      className={cn(
        styles.container,
        isVertical ? styles.containerVertical : styles.containerHorizontal
      )}
    >
      <DockIconButton
        onClick={onOpenLayoutModal}
        title="Dashboard layout"
        shortcut="⌘L"
        data-testid="layout-trigger"
      >
        <LayoutToggleIcon
          isToggled={false}
          size={16}
        />
      </DockIconButton>

      <ShinyAiButton
        data-testid="ai-chat-trigger"
        onClick={handleToggleChat}
        tooltip={isChatOpen ? 'Close AI chat' : 'Open AI chat'}
        shortcut="⌘K"
        className={cn(isChatOpen && styles.aiButtonActive)}
      />

      {showSearch && (
        <div
          className={cn(
            styles.searchContainer,
            isVertical ? styles.searchContainerVertical : styles.searchContainerHorizontal
          )}
        >
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          {searchQuery && (
            <DockIconButton
              onClick={() => setSearchQuery('')}
              title="Clear search"
              shortcut="Esc"
            >
              <CloseIcon size={16} />
            </DockIconButton>
          )}
        </div>
      )}

      <SettingsTrigger />

      <DockIconButton
        onClick={onOpenShortcuts}
        title="Keyboard shortcuts"
        shortcut="?"
        data-testid="shortcuts-trigger"
      >
        <span className={cn('material-symbols-outlined', styles.shortcutsIcon)}>keyboard</span>
      </DockIconButton>
    </div>
  )
}
