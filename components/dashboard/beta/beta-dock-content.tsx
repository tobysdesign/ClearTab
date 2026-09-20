'use client'

import React from 'react'
import { CloseIcon } from '@/components/icons'
import { LayoutToggleIcon } from '@/components/icons/layout-toggle-icon'
import { Input } from '@/components/ui/input'
import { DockIconButton, ShinyAiButton } from '@cleartab/ui'
import { SettingsTrigger } from '@/components/settings/settings-trigger'
import { cn } from '@/lib/utils'
import { useChatContext } from '@/hooks/use-chat-context'
import { WidgetTogglePopover } from './widget-toggle-popover'
import {
  WidgetVisibilityState,
  WidgetId,
  PrimaryWidgetId,
  UtilityWidgetId,
  PresetId,
  BetaPresetLayout,
  LayoutMode,
  LayoutOrientation,
} from '@/hooks/use-beta-widgets'
import styles from '../dock-content.module.css'

interface BetaDockContentProps {
  showSearch: boolean
  searchQuery: string
  setSearchQuery: (query: string) => void
  showSettings: boolean
  setShowSettings: (show: boolean) => void
  setShowSearch: (show: boolean) => void
  isVertical: boolean
  widgets: WidgetVisibilityState
  activePreset: PresetId
  activeCount: number
  totalCount: number
  primaryOrder: PrimaryWidgetId[]
  utilityOrder: UtilityWidgetId[]
  presetLayout: BetaPresetLayout
  setPresetLayout: (layout: BetaPresetLayout) => void
  layoutMode: LayoutMode
  setLayoutMode: (mode: LayoutMode) => void
  layoutOrientation: LayoutOrientation
  setLayoutOrientation: (orientation: LayoutOrientation) => void
  toggleWidget: (id: WidgetId) => void
  swapPrimaryOrder: () => void
  moveUtility: (id: UtilityWidgetId, direction: 'left' | 'right') => void
  applyPreset: (presetId: Exclude<PresetId, 'custom'>) => void
  resetToAll: () => void
  dockPosition: 'top' | 'left' | 'right' | 'bottom'
}

export function BetaDockContent({
  showSearch,
  searchQuery,
  setSearchQuery,
  showSettings: _showSettings,
  setShowSettings: _setShowSettings,
  setShowSearch: _setShowSearch,
  isVertical,
  widgets,
  activePreset,
  activeCount,
  totalCount,
  primaryOrder,
  utilityOrder,
  presetLayout,
  setPresetLayout,
  layoutMode,
  setLayoutMode,
  layoutOrientation,
  setLayoutOrientation,
  toggleWidget,
  swapPrimaryOrder,
  moveUtility,
  applyPreset,
  resetToAll,
  dockPosition,
}: BetaDockContentProps) {
  const { isChatOpen, openChat, closeChat } = useChatContext()

  const handleToggleChat = () => {
    if (isChatOpen) {
      closeChat()
    } else {
      openChat()
    }
  }

  // Popover placement should be opposite to dock position
  const popoverSide =
    dockPosition === 'bottom'
      ? 'top'
      : dockPosition === 'top'
        ? 'bottom'
        : dockPosition === 'left'
          ? 'right'
          : 'left'

  return (
    <div
      className={cn(
        styles.container,
        isVertical ? styles.containerVertical : styles.containerHorizontal
      )}
    >
      <WidgetTogglePopover
        widgets={widgets}
        activePreset={activePreset}
        activeCount={activeCount}
        totalCount={totalCount}
        primaryOrder={primaryOrder}
        utilityOrder={utilityOrder}
        presetLayout={presetLayout}
        setPresetLayout={setPresetLayout}
        layoutMode={layoutMode}
        setLayoutMode={setLayoutMode}
        layoutOrientation={layoutOrientation}
        setLayoutOrientation={setLayoutOrientation}
        toggleWidget={toggleWidget}
        swapPrimaryOrder={swapPrimaryOrder}
        moveUtility={moveUtility}
        applyPreset={applyPreset}
        resetToAll={resetToAll}
        side={popoverSide}
      >
        <div style={{ position: 'relative' }}>
          <DockIconButton
            title={`Customize Adaptive Layout (${activeCount}/${totalCount} active) • ⌘L`}
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
                backgroundColor: '#6366f1',
                pointerEvents: 'none',
              }}
            />
          )}
        </div>
      </WidgetTogglePopover>

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
