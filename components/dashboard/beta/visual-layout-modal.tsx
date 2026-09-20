'use client'

import React, { useEffect } from 'react'
import { Switch } from '@/components/ui/switch'
import {
  BetaPresetLayout,
  WidgetId,
  WidgetVisibilityState,
  WIDGET_METADATA,
  LAYOUT_PRESET_METADATA,
} from '@/hooks/use-beta-widgets'
import styles from './visual-layout-modal.module.css'

interface VisualLayoutModalProps {
  isOpen: boolean
  onClose: () => void
  presetLayout: BetaPresetLayout
  setPresetLayout: (layout: BetaPresetLayout) => void
  widgets: WidgetVisibilityState
  toggleWidget: (id: WidgetId) => void
  activeCount: number
  totalCount: number
}

interface MiniBlockProps {
  label: string
  className?: string
  isLight?: boolean
  style?: React.CSSProperties
}

function MiniWireframeBlock({
  label,
  className = '',
  isLight = false,
  style,
}: MiniBlockProps) {
  return (
    <div
      className={`${styles.miniBlock} ${isLight ? styles.miniBlockLight : ''} ${className}`}
      style={style}
    >
      <span className={styles.miniBlockName}>{label}</span>
      <span className={styles.miniGripDots}>:::</span>
    </div>
  )
}

// 1. default_4right Dynamic Preview
function Default4RightPreview({ widgets }: { widgets: WidgetVisibilityState }) {
  const hasNotes = widgets.notes
  const hasTasks = widgets.tasks
  const row1 = (['schedule', 'weather'] as WidgetId[]).filter((id) => widgets[id])
  const row2 = (['countdown', 'recorder'] as WidgetId[]).filter((id) => widgets[id])
  const hasRow1 = row1.length > 0
  const hasRow2 = row2.length > 0
  const hasGrid = hasRow1 || hasRow2
  const hasRight = hasTasks || hasGrid

  const renderRightStack = () => (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', gap: 4 }}>
      {hasTasks && (
        <MiniWireframeBlock
          label="Tasks"
          isLight
          style={{ flex: hasGrid ? '0 0 34%' : 1, width: '100%' }}
        />
      )}
      {hasGrid && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 4 }}>
          {hasRow1 && (
            <div style={{ display: 'flex', gap: 4, flex: 1 }}>
              {row1.map((id) => (
                <MiniWireframeBlock key={id} label={WIDGET_METADATA[id].name} style={{ flex: 1 }} />
              ))}
            </div>
          )}
          {hasRow2 && (
            <div style={{ display: 'flex', gap: 4, flex: 1 }}>
              {row2.map((id) => (
                <MiniWireframeBlock key={id} label={WIDGET_METADATA[id].name} style={{ flex: 1 }} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )

  if (hasNotes && hasRight) {
    return (
      <div style={{ display: 'flex', width: '100%', height: '100%', gap: 4 }}>
        <MiniWireframeBlock label="Notes" isLight style={{ flex: 1, height: '100%' }} />
        {renderRightStack()}
      </div>
    )
  }

  if (hasNotes && !hasRight) {
    return <MiniWireframeBlock label="Notes" isLight style={{ width: '100%', height: '100%' }} />
  }

  if (!hasNotes && hasRight) {
    return renderRightStack()
  }

  return null
}

// 2. 3left Dynamic Preview
function ThreeLeftPreview({ widgets }: { widgets: WidgetVisibilityState }) {
  const top = (['notes', 'tasks'] as WidgetId[]).filter((id) => widgets[id])
  const leftCluster = (['weather', 'countdown', 'recorder'] as WidgetId[]).filter((id) => widgets[id])
  const hasSchedule = widgets.schedule
  const hasTop = top.length > 0
  const hasLeftCluster = leftCluster.length > 0
  const hasBottom = hasLeftCluster || hasSchedule

  const renderTop = () => (
    <div style={{ display: 'flex', gap: 4, width: '100%', flex: hasBottom ? '0 0 58%' : 1 }}>
      {top.map((id) => (
        <MiniWireframeBlock key={id} label={WIDGET_METADATA[id].name} isLight style={{ flex: 1 }} />
      ))}
    </div>
  )

  const renderBottom = () => (
    <div style={{ display: 'flex', gap: 4, width: '100%', flex: hasTop ? '0 0 42%' : 1 }}>
      {hasLeftCluster && (
        <div style={{ display: 'flex', gap: 3, flex: hasSchedule ? 1.4 : 1 }}>
          {leftCluster.map((id) => (
            <MiniWireframeBlock key={id} label={WIDGET_METADATA[id].name} style={{ flex: 1 }} />
          ))}
        </div>
      )}
      {hasSchedule && (
        <MiniWireframeBlock label="Schedule" style={{ flex: hasLeftCluster ? 1.6 : 1 }} />
      )}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', gap: 4 }}>
      {hasTop && renderTop()}
      {hasBottom && renderBottom()}
    </div>
  )
}

// 3. 3right Dynamic Preview
function ThreeRightPreview({ widgets }: { widgets: WidgetVisibilityState }) {
  const top = (['tasks', 'notes'] as WidgetId[]).filter((id) => widgets[id])
  const rightCluster = (['weather', 'countdown', 'recorder'] as WidgetId[]).filter((id) => widgets[id])
  const hasSchedule = widgets.schedule
  const hasTop = top.length > 0
  const hasRightCluster = rightCluster.length > 0
  const hasBottom = hasSchedule || hasRightCluster

  const renderTop = () => (
    <div style={{ display: 'flex', gap: 4, width: '100%', flex: hasBottom ? '0 0 58%' : 1 }}>
      {top.map((id) => (
        <MiniWireframeBlock key={id} label={WIDGET_METADATA[id].name} isLight style={{ flex: 1 }} />
      ))}
    </div>
  )

  const renderBottom = () => (
    <div style={{ display: 'flex', gap: 4, width: '100%', flex: hasTop ? '0 0 42%' : 1 }}>
      {hasSchedule && (
        <MiniWireframeBlock label="Schedule" style={{ flex: hasRightCluster ? 1.6 : 1 }} />
      )}
      {hasRightCluster && (
        <div style={{ display: 'flex', gap: 3, flex: hasSchedule ? 1.4 : 1 }}>
          {rightCluster.map((id) => (
            <MiniWireframeBlock key={id} label={WIDGET_METADATA[id].name} style={{ flex: 1 }} />
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', gap: 4 }}>
      {hasTop && renderTop()}
      {hasBottom && renderBottom()}
    </div>
  )
}

// 4. 2left2right Dynamic Preview
function TwoLeftTwoRightPreview({ widgets }: { widgets: WidgetVisibilityState }) {
  const top = (['notes', 'tasks'] as WidgetId[]).filter((id) => widgets[id])
  const left2 = (['weather', 'recorder'] as WidgetId[]).filter((id) => widgets[id])
  const right2 = (['countdown', 'schedule'] as WidgetId[]).filter((id) => widgets[id])
  const hasTop = top.length > 0
  const hasLeft2 = left2.length > 0
  const hasRight2 = right2.length > 0
  const hasBottom = hasLeft2 || hasRight2

  const renderTop = () => (
    <div style={{ display: 'flex', gap: 4, width: '100%', flex: hasBottom ? '0 0 58%' : 1 }}>
      {top.map((id) => (
        <MiniWireframeBlock key={id} label={WIDGET_METADATA[id].name} isLight style={{ flex: 1 }} />
      ))}
    </div>
  )

  const renderBottom = () => (
    <div style={{ display: 'flex', gap: 4, width: '100%', flex: hasTop ? '0 0 42%' : 1 }}>
      {hasLeft2 && (
        <div style={{ display: 'flex', gap: 3, flex: 1 }}>
          {left2.map((id) => (
            <MiniWireframeBlock key={id} label={WIDGET_METADATA[id].name} style={{ flex: 1 }} />
          ))}
        </div>
      )}
      {hasRight2 && (
        <div style={{ display: 'flex', gap: 3, flex: 1 }}>
          {right2.map((id) => (
            <MiniWireframeBlock key={id} label={WIDGET_METADATA[id].name} style={{ flex: 1 }} />
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', gap: 4 }}>
      {hasTop && renderTop()}
      {hasBottom && renderBottom()}
    </div>
  )
}

export function VisualLayoutModal({
  isOpen,
  onClose,
  presetLayout = 'default_4right',
  setPresetLayout,
  widgets,
  toggleWidget,
  activeCount,
  totalCount,
}: VisualLayoutModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const widgetKeys: WidgetId[] = ['notes', 'tasks', 'schedule', 'weather', 'recorder', 'countdown']

  const handleSelectLayout = (layout: BetaPresetLayout) => {
    setPresetLayout(layout)
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerTitleRow}>
            <h2 className={styles.modalTitle}>Choose Dashboard Layout</h2>
            <span className={styles.activeCountBadge}>
              Active: {LAYOUT_PRESET_METADATA[presetLayout]?.name || presetLayout} ({activeCount}/{totalCount} widgets)
            </span>
          </div>

          <button type="button" onClick={onClose} className={styles.closeButton}>
            <span>Done</span>
            <kbd style={{ opacity: 0.6, fontSize: 11 }}>Esc</kbd>
          </button>
        </div>

        {/* 1. Layout Preset Selection Grid with Live Dynamic Wireframes */}
        <div className={styles.sectionHeader}>
          <span>1. Select Layout Structure</span>
        </div>

        <div className={styles.layoutsGrid}>
          {/* Preset 1: default_4right */}
          <div
            className={`${styles.layoutCard} ${
              presetLayout === 'default_4right' ? styles.layoutCardActive : ''
            }`}
            onClick={() => handleSelectLayout('default_4right')}
          >
            <div className={styles.layoutTitleRow}>
              <span className={styles.layoutName}>default_4right</span>
              {presetLayout === 'default_4right' && (
                <span className={styles.activeBadge}>Active</span>
              )}
            </div>

            <div className={styles.wireframeFrame}>
              <Default4RightPreview widgets={widgets} />
            </div>
          </div>

          {/* Preset 2: 3left */}
          <div
            className={`${styles.layoutCard} ${
              presetLayout === '3left' ? styles.layoutCardActive : ''
            }`}
            onClick={() => handleSelectLayout('3left')}
          >
            <div className={styles.layoutTitleRow}>
              <span className={styles.layoutName}>3left</span>
              {presetLayout === '3left' && (
                <span className={styles.activeBadge}>Active</span>
              )}
            </div>

            <div className={styles.wireframeFrame}>
              <ThreeLeftPreview widgets={widgets} />
            </div>
          </div>

          {/* Preset 3: 3right */}
          <div
            className={`${styles.layoutCard} ${
              presetLayout === '3right' ? styles.layoutCardActive : ''
            }`}
            onClick={() => handleSelectLayout('3right')}
          >
            <div className={styles.layoutTitleRow}>
              <span className={styles.layoutName}>3right</span>
              {presetLayout === '3right' && (
                <span className={styles.activeBadge}>Active</span>
              )}
            </div>

            <div className={styles.wireframeFrame}>
              <ThreeRightPreview widgets={widgets} />
            </div>
          </div>

          {/* Preset 4: 2left2right */}
          <div
            className={`${styles.layoutCard} ${
              presetLayout === '2left2right' ? styles.layoutCardActive : ''
            }`}
            onClick={() => handleSelectLayout('2left2right')}
          >
            <div className={styles.layoutTitleRow}>
              <span className={styles.layoutName}>2left2right</span>
              {presetLayout === '2left2right' && (
                <span className={styles.activeBadge}>Active</span>
              )}
            </div>

            <div className={styles.wireframeFrame}>
              <TwoLeftTwoRightPreview widgets={widgets} />
            </div>
          </div>
        </div>

        {/* 2. Dedicated Widget Toggles Below Layout Options */}
        <div className={styles.togglesSection}>
          <div className={styles.sectionHeader}>
            <span>2. Toggle Widget Visibility</span>
            <span style={{ fontSize: 11, color: '#71717a', textTransform: 'none' }}>
              Turn widgets on or off — previews above update live
            </span>
          </div>

          <div className={styles.togglesGrid}>
            {widgetKeys.map((id) => {
              const meta = WIDGET_METADATA[id]
              const isChecked = widgets[id] ?? false
              return (
                <div
                  key={id}
                  className={`${styles.toggleRow} ${isChecked ? styles.toggleRowActive : ''}`}
                  onClick={() => toggleWidget(id)}
                >
                  <div className={styles.toggleLabelGroup}>
                    <span className={styles.toggleIcon}>{meta.icon}</span>
                    <span className={styles.toggleName}>{meta.name}</span>
                  </div>

                  <div onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={isChecked}
                      onCheckedChange={() => toggleWidget(id)}
                      aria-label={`Toggle ${meta.name}`}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
