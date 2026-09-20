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
  activeCount: number
  totalCount: number
  onOpenLayoutModal: () => void
}

export function BetaDockContent({
  showSearch,
  searchQuery,
  setSearchQuery,
  showSettings: _showSettings,
  setShowSettings: _setShowSettings,
  setShowSearch: _setShowSearch,
  isVertical,
  activeCount,
  totalCount,
  onOpenLayoutModal,
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
      <div style={{ position: 'relative' }}>
        <DockIconButton
          onClick={onOpenLayoutModal}
          title={`Choose Visual Layout (${activeCount}/${totalCount} active) • ⌘L`}
          shortcut="⌘L"
        >
          <LayoutToggleIcon
            isToggled={activeCount < totalCount}
            size={16}
          />
        </DockIconButton>
        {activeCount < totalCount && (
          <span
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: '#3b82f6',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>

      <ShinyAiButton
        onClick={handleToggleChat}
        tooltip={isChatOpen ? 'Close Chat' : 'Open Chat'}
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
              title="Clear Search"
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
