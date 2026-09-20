'use client'

import React, { useEffect } from 'react'
import { Switch } from '@/components/ui/switch'
import {
  BetaPresetLayout,
  WidgetId,
  WidgetVisibilityState,
  WIDGET_METADATA,
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
  isEnabled: boolean
  className?: string
  isLight?: boolean
}

function MiniWireframeBlock({ label, isEnabled, className = '', isLight = false }: MiniBlockProps) {
  return (
    <div
      className={`${styles.miniBlock} ${isLight ? styles.miniBlockLight : ''} ${
        !isEnabled ? styles.miniBlockOff : ''
      } ${className}`}
    >
      <span className={styles.miniBlockName}>{label}</span>
      <div className={`${styles.miniToggleIndicator} ${!isEnabled ? styles.miniToggleIndicatorOff : ''}`} />
      <span className={styles.miniGripDots}>:::</span>
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

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerTitleRow}>
            <h2 className={styles.modalTitle}>Choose Dashboard Layout</h2>
            <span className={styles.activeCountBadge}>
              {activeCount}/{totalCount} Active Widgets
            </span>
          </div>

          <button type="button" onClick={onClose} className={styles.closeButton}>
            <span>Done</span>
            <kbd style={{ opacity: 0.6, fontSize: 11 }}>Esc</kbd>
          </button>
        </div>

        {/* 1. Layout Preset Selection Grid */}
        <div className={styles.sectionHeader}>
          <span>Select Structure Blueprint</span>
        </div>

        <div className={styles.layoutsGrid}>
          {/* Preset 1: default_4right */}
          <div
            className={`${styles.layoutCard} ${
              presetLayout === 'default_4right' ? styles.layoutCardActive : ''
            }`}
            onClick={() => setPresetLayout('default_4right')}
          >
            <div className={styles.layoutTitleRow}>
              <span className={styles.layoutName}>default_4right</span>
              {presetLayout === 'default_4right' && (
                <span className={styles.activeBadge}>Active</span>
              )}
            </div>

            <div className={styles.wireframeFrame}>
              <div className={styles.default4RightBlueprint}>
                <MiniWireframeBlock
                  label="Notes"
                  isEnabled={widgets.notes}
                  className={styles.default4RightNotes}
                  isLight
                />
                <div className={styles.default4RightRightCol}>
                  <MiniWireframeBlock
                    label="Tasks"
                    isEnabled={widgets.tasks}
                    className={styles.default4RightTasks}
                    isLight
                  />
                  <div className={styles.default4RightGrid2x2}>
                    <MiniWireframeBlock label="Schedule" isEnabled={widgets.schedule} />
                    <MiniWireframeBlock label="Weather" isEnabled={widgets.weather} />
                    <MiniWireframeBlock label="Count" isEnabled={widgets.countdown} />
                    <MiniWireframeBlock label="Voice" isEnabled={widgets.recorder} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preset 2: 3left */}
          <div
            className={`${styles.layoutCard} ${
              presetLayout === '3left' ? styles.layoutCardActive : ''
            }`}
            onClick={() => setPresetLayout('3left')}
          >
            <div className={styles.layoutTitleRow}>
              <span className={styles.layoutName}>3left</span>
              {presetLayout === '3left' && (
                <span className={styles.activeBadge}>Active</span>
              )}
            </div>

            <div className={styles.wireframeFrame}>
              <div className={styles.twoRowBlueprint}>
                <div className={styles.twoRowTopSplit}>
                  <MiniWireframeBlock label="Notes" isEnabled={widgets.notes} isLight />
                  <MiniWireframeBlock label="Tasks" isEnabled={widgets.tasks} isLight />
                </div>
                <div className={styles.twoRowBottomSplit}>
                  <div className={styles.cluster3}>
                    <MiniWireframeBlock label="Weather" isEnabled={widgets.weather} />
                    <MiniWireframeBlock label="Count" isEnabled={widgets.countdown} />
                    <MiniWireframeBlock label="Voice" isEnabled={widgets.recorder} />
                  </div>
                  <MiniWireframeBlock
                    label="Schedule"
                    isEnabled={widgets.schedule}
                    className={styles.cluster1Schedule}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preset 3: 3right */}
          <div
            className={`${styles.layoutCard} ${
              presetLayout === '3right' ? styles.layoutCardActive : ''
            }`}
            onClick={() => setPresetLayout('3right')}
          >
            <div className={styles.layoutTitleRow}>
              <span className={styles.layoutName}>3right</span>
              {presetLayout === '3right' && (
                <span className={styles.activeBadge}>Active</span>
              )}
            </div>

            <div className={styles.wireframeFrame}>
              <div className={styles.twoRowBlueprint}>
                <div className={styles.twoRowTopSplit}>
                  <MiniWireframeBlock label="Tasks" isEnabled={widgets.tasks} isLight />
                  <MiniWireframeBlock label="Notes" isEnabled={widgets.notes} isLight />
                </div>
                <div className={styles.twoRowBottomSplit}>
                  <MiniWireframeBlock
                    label="Schedule"
                    isEnabled={widgets.schedule}
                    className={styles.cluster1Schedule}
                  />
                  <div className={styles.cluster3}>
                    <MiniWireframeBlock label="Weather" isEnabled={widgets.weather} />
                    <MiniWireframeBlock label="Count" isEnabled={widgets.countdown} />
                    <MiniWireframeBlock label="Voice" isEnabled={widgets.recorder} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preset 4: 2left2right */}
          <div
            className={`${styles.layoutCard} ${
              presetLayout === '2left2right' ? styles.layoutCardActive : ''
            }`}
            onClick={() => setPresetLayout('2left2right')}
          >
            <div className={styles.layoutTitleRow}>
              <span className={styles.layoutName}>2left2right</span>
              {presetLayout === '2left2right' && (
                <span className={styles.activeBadge}>Active</span>
              )}
            </div>

            <div className={styles.wireframeFrame}>
              <div className={styles.twoRowBlueprint}>
                <div className={styles.twoRowTopSplit}>
                  <MiniWireframeBlock label="Notes" isEnabled={widgets.notes} isLight />
                  <MiniWireframeBlock label="Tasks" isEnabled={widgets.tasks} isLight />
                </div>
                <div className={styles.twoRowBottomSplit}>
                  <div className={styles.cluster2}>
                    <MiniWireframeBlock label="Weather" isEnabled={widgets.weather} />
                    <MiniWireframeBlock label="Voice" isEnabled={widgets.recorder} />
                  </div>
                  <div className={styles.cluster2}>
                    <MiniWireframeBlock label="Count" isEnabled={widgets.countdown} />
                    <MiniWireframeBlock label="Schedule" isEnabled={widgets.schedule} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Dedicated Widget Toggles Section */}
        <div className={styles.togglesSection}>
          <div className={styles.sectionHeader}>
            <span>Toggle Widget Visibility</span>
            <span style={{ fontSize: 11, color: '#71717a', textTransform: 'none' }}>
              Turn widgets on or off for the active layout
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
