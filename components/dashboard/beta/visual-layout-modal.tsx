'use client'

import React, { useEffect } from 'react'
import { Switch } from '@/components/ui/switch'
import {
  BetaPresetLayout,
  WidgetId,
  WidgetVisibilityState,
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

interface BlockProps {
  id: WidgetId
  label: string
  isEnabled: boolean
  onToggle: (id: WidgetId) => void
  className?: string
  isLight?: boolean
}

function InteractiveWidgetBlock({
  id,
  label,
  isEnabled,
  onToggle,
  className = '',
  isLight = false,
}: BlockProps) {
  return (
    <div
      className={`${styles.widgetBlock} ${isLight ? styles.widgetBlockLight : ''} ${
        !isEnabled ? styles.widgetBlockOff : ''
      } ${className}`}
      onClick={(e) => {
        // Toggle on clicking anywhere on the widget card in the preview
        e.stopPropagation()
        onToggle(id)
      }}
    >
      <span className={styles.widgetNameLabel}>{label}</span>

      <div onClick={(e) => e.stopPropagation()}>
        <Switch
          checked={isEnabled}
          onCheckedChange={() => onToggle(id)}
          aria-label={`Toggle ${label}`}
        />
      </div>

      <span className={styles.dragDots}>:::</span>
    </div>
  )
}

export function VisualLayoutModal({
  isOpen,
  onClose,
  presetLayout,
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

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.headerTitleRow}>
            <h2 className={styles.modalTitle}>Choose Layout</h2>
            <span className={styles.activeCountBadge}>
              {activeCount}/{totalCount} Widgets Enabled
            </span>
          </div>

          <button type="button" onClick={onClose} className={styles.closeButton}>
            <span>Done</span>
            <kbd style={{ opacity: 0.6, fontSize: 11 }}>Esc</kbd>
          </button>
        </div>

        <div className={styles.layoutsContainer}>
          {/* 1. default_4right */}
          <div className={styles.layoutColumn}>
            <div className={styles.layoutNameTitle}>
              <span>default_4right</span>
              {presetLayout === 'default_4right' && (
                <span className={styles.activeLayoutPill}>Active</span>
              )}
            </div>

            <div
              className={`${styles.layoutFrame} ${
                presetLayout === 'default_4right' ? styles.layoutFrameActive : ''
              }`}
              onClick={() => setPresetLayout('default_4right')}
            >
              <div className={styles.default4RightContainer}>
                {/* Notes takes full height of left side */}
                <InteractiveWidgetBlock
                  id="notes"
                  label="Notes"
                  isEnabled={widgets.notes}
                  onToggle={toggleWidget}
                  className={styles.default4RightNotes}
                  isLight
                />

                {/* Right Column */}
                <div className={styles.default4RightRightCol}>
                  <InteractiveWidgetBlock
                    id="tasks"
                    label="Tasks"
                    isEnabled={widgets.tasks}
                    onToggle={toggleWidget}
                    className={styles.default4RightTasks}
                  />

                  <div className={styles.default4RightGrid2x2}>
                    <InteractiveWidgetBlock
                      id="schedule"
                      label="Schedule"
                      isEnabled={widgets.schedule}
                      onToggle={toggleWidget}
                    />
                    <InteractiveWidgetBlock
                      id="weather"
                      label="Weather"
                      isEnabled={widgets.weather}
                      onToggle={toggleWidget}
                    />
                    <InteractiveWidgetBlock
                      id="countdown"
                      label="Count"
                      isEnabled={widgets.countdown}
                      onToggle={toggleWidget}
                    />
                    <InteractiveWidgetBlock
                      id="recorder"
                      label="Voice"
                      isEnabled={widgets.recorder}
                      onToggle={toggleWidget}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. 3left */}
          <div className={styles.layoutColumn}>
            <div className={styles.layoutNameTitle}>
              <span>3left</span>
              {presetLayout === '3left' && (
                <span className={styles.activeLayoutPill}>Active</span>
              )}
            </div>

            <div
              className={`${styles.layoutFrame} ${
                presetLayout === '3left' ? styles.layoutFrameActive : ''
              }`}
              onClick={() => setPresetLayout('3left')}
            >
              <div className={styles.twoRowLayoutContainer}>
                <div className={styles.twoRowTopSplit}>
                  <InteractiveWidgetBlock
                    id="notes"
                    label="Notes"
                    isEnabled={widgets.notes}
                    onToggle={toggleWidget}
                    isLight
                  />
                  <InteractiveWidgetBlock
                    id="tasks"
                    label="Tasks"
                    isEnabled={widgets.tasks}
                    onToggle={toggleWidget}
                    isLight
                  />
                </div>

                <div className={styles.twoRowBottomSplit}>
                  <div className={styles.bottom3Cluster}>
                    <InteractiveWidgetBlock
                      id="weather"
                      label="Weather"
                      isEnabled={widgets.weather}
                      onToggle={toggleWidget}
                    />
                    <InteractiveWidgetBlock
                      id="countdown"
                      label="Count"
                      isEnabled={widgets.countdown}
                      onToggle={toggleWidget}
                    />
                    <InteractiveWidgetBlock
                      id="recorder"
                      label="Voice"
                      isEnabled={widgets.recorder}
                      onToggle={toggleWidget}
                    />
                  </div>

                  <InteractiveWidgetBlock
                    id="schedule"
                    label="Schedule"
                    isEnabled={widgets.schedule}
                    onToggle={toggleWidget}
                    className={styles.bottom1Schedule}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. 3right */}
          <div className={styles.layoutColumn}>
            <div className={styles.layoutNameTitle}>
              <span>3right</span>
              {presetLayout === '3right' && (
                <span className={styles.activeLayoutPill}>Active</span>
              )}
            </div>

            <div
              className={`${styles.layoutFrame} ${
                presetLayout === '3right' ? styles.layoutFrameActive : ''
              }`}
              onClick={() => setPresetLayout('3right')}
            >
              <div className={styles.twoRowLayoutContainer}>
                <div className={styles.twoRowTopSplit}>
                  <InteractiveWidgetBlock
                    id="tasks"
                    label="Tasks"
                    isEnabled={widgets.tasks}
                    onToggle={toggleWidget}
                    isLight
                  />
                  <InteractiveWidgetBlock
                    id="notes"
                    label="Notes"
                    isEnabled={widgets.notes}
                    onToggle={toggleWidget}
                    isLight
                  />
                </div>

                <div className={styles.twoRowBottomSplit}>
                  <InteractiveWidgetBlock
                    id="schedule"
                    label="Schedule"
                    isEnabled={widgets.schedule}
                    onToggle={toggleWidget}
                    className={styles.bottom1Schedule}
                  />

                  <div className={styles.bottom3Cluster}>
                    <InteractiveWidgetBlock
                      id="weather"
                      label="Weather"
                      isEnabled={widgets.weather}
                      onToggle={toggleWidget}
                    />
                    <InteractiveWidgetBlock
                      id="countdown"
                      label="Count"
                      isEnabled={widgets.countdown}
                      onToggle={toggleWidget}
                    />
                    <InteractiveWidgetBlock
                      id="recorder"
                      label="Voice"
                      isEnabled={widgets.recorder}
                      onToggle={toggleWidget}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. 2left2right */}
          <div className={styles.layoutColumn}>
            <div className={styles.layoutNameTitle}>
              <span>2left2right</span>
              {presetLayout === '2left2right' && (
                <span className={styles.activeLayoutPill}>Active</span>
              )}
            </div>

            <div
              className={`${styles.layoutFrame} ${
                presetLayout === '2left2right' ? styles.layoutFrameActive : ''
              }`}
              onClick={() => setPresetLayout('2left2right')}
            >
              <div className={styles.twoRowLayoutContainer}>
                <div className={styles.twoRowTopSplit}>
                  <InteractiveWidgetBlock
                    id="notes"
                    label="Notes"
                    isEnabled={widgets.notes}
                    onToggle={toggleWidget}
                    isLight
                  />
                  <InteractiveWidgetBlock
                    id="tasks"
                    label="Tasks"
                    isEnabled={widgets.tasks}
                    onToggle={toggleWidget}
                    isLight
                  />
                </div>

                <div className={styles.twoRowBottomSplit}>
                  <div className={styles.bottom2Cluster}>
                    <InteractiveWidgetBlock
                      id="weather"
                      label="Weather"
                      isEnabled={widgets.weather}
                      onToggle={toggleWidget}
                    />
                    <InteractiveWidgetBlock
                      id="recorder"
                      label="Voice"
                      isEnabled={widgets.recorder}
                      onToggle={toggleWidget}
                    />
                  </div>

                  <div className={styles.bottom2Cluster}>
                    <InteractiveWidgetBlock
                      id="countdown"
                      label="Count"
                      isEnabled={widgets.countdown}
                      onToggle={toggleWidget}
                    />
                    <InteractiveWidgetBlock
                      id="schedule"
                      label="Schedule"
                      isEnabled={widgets.schedule}
                      onToggle={toggleWidget}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
