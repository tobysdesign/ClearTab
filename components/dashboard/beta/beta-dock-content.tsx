'use client'

import React from 'react'
import { CloseIcon } from '@/components/icons'
import { LayoutToggleIcon } from '@/components/icons/layout-toggle-icon'
import { LayoutGlyphIcon, ShortcutsGlyphIcon } from '@/components/icons/dock-icons'
import { Input } from '@/components/ui/input'
import { DockIconButton, Tooltip, TooltipContent, TooltipTrigger } from '@cleartab/ui'
import { AiShaderButton } from '@/components/ai/ai-shader-button'
import { SettingsTrigger } from '@/components/settings/settings-trigger'
import { cn } from '@/lib/utils'
import { useChatContext } from '@/hooks/use-chat-context'
import { PresetFlank, WidgetFlank } from './dock-edit-panels'
import { awayFromDock } from '@/hooks/use-beta-widgets'
import type { BetaPresetLayout, DockPosition, WidgetId, WidgetVisibilityState } from '@/hooks/use-beta-widgets'
import styles from '../dock-content.module.css'

interface BetaDockContentProps {
  showSearch: boolean
  searchQuery: string
  setSearchQuery: (query: string) => void
  showSettings: boolean
  setShowSettings: (show: boolean) => void
  setShowSearch: (show: boolean) => void
  isVertical: boolean
  /** Where the dock sits; dock overlays (tooltips) open away from this edge. */
  position: DockPosition
  /** Edit mode is live: show the flanking preset + widget panels and highlight the trigger. */
  editMode: boolean
  /** Toggle edit mode (no-op on surfaces where editing is disabled). */
  onToggleEdit: () => void
  presetLayout: BetaPresetLayout
  setPresetLayout: (layout: BetaPresetLayout) => void
  widgets: WidgetVisibilityState
  toggleWidget: (id: WidgetId) => void
  activeCount: number
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
  position,
  editMode,
  onToggleEdit,
  presetLayout,
  setPresetLayout,
  widgets,
  toggleWidget,
  activeCount,
  onOpenShortcuts,
}: BetaDockContentProps) {
  const { isChatOpen, openChat, closeChat } = useChatContext()
  const orientation = isVertical ? 'vertical' : 'horizontal'
  // Dock tooltips open away from the edge the dock sits on (the roomy side)
  const tooltipSide = awayFromDock(position)

  const handleToggleChat = () => {
    if (isChatOpen) {
      closeChat()
    } else {
      openChat()
    }
  }

  return (
    <>
      <div
        className={cn(
          styles.container,
          isVertical ? styles.containerVertical : styles.containerHorizontal,
          editMode && styles.containerEditing
        )}
      >
        {editMode ? (
          <button
            type="button"
            onClick={onToggleEdit}
            className={styles.doneButton}
            aria-pressed={true}
            aria-label="Done editing layout"
            data-testid="layout-trigger"
          >
            <span>Done</span>
            <kbd className={styles.doneKbd}>Enter</kbd>
          </button>
        ) : (
          <DockIconButton
            onClick={onToggleEdit}
            title="Edit layout"
            shortcut="⌘L"
            data-testid="layout-trigger"
            tooltipSide={tooltipSide}
          >
            <LayoutGlyphIcon size={32} />
          </DockIconButton>
        )}

        {/* While editing the layout, hide the unrelated dock actions — only the
            Done toggle (and the drag handle, rendered by the parent) remain. */}
        {!editMode && (
          <>
            <AiShaderButton
              data-testid="ai-chat-trigger"
              onClick={handleToggleChat}
              tooltip={isChatOpen ? 'Close AI chat' : 'Open AI chat'}
              tooltipSide={tooltipSide}
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
                    tooltipSide={tooltipSide}
                  >
                    <CloseIcon size={16} />
                  </DockIconButton>
                )}
              </div>
            )}

            <SettingsTrigger tooltipSide={tooltipSide} />

            <DockIconButton
              onClick={onOpenShortcuts}
              title="Keyboard shortcuts"
              shortcut="⌘/"
              data-testid="shortcuts-trigger"
              tooltipSide={tooltipSide}
            >
              <ShortcutsGlyphIcon size={32} />
            </DockIconButton>
          </>
        )}
      </div>

      {editMode && (
        <PresetFlank
          presetLayout={presetLayout}
          setPresetLayout={setPresetLayout}
          orientation={orientation}
        />
      )}

      {editMode && (
        <WidgetFlank
          widgets={widgets}
          toggleWidget={toggleWidget}
          activeCount={activeCount}
          orientation={orientation}
        />
      )}
    </>
  )
}
