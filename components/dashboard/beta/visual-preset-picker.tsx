'use client'

import React from 'react'
import { BetaPresetLayout, WidgetVisibilityState } from '@/hooks/use-beta-widgets'
import styles from './visual-preset-picker.module.css'

interface VisualPresetPickerProps {
  presetLayout: BetaPresetLayout
  setPresetLayout: (layout: BetaPresetLayout) => void
  widgets: WidgetVisibilityState
}

interface BlockProps {
  label: string
  isEnabled: boolean
  className?: string
  style?: React.CSSProperties
}

function MiniBlock({ label, isEnabled, className, style }: BlockProps) {
  return (
    <div
      className={`${styles.miniBlock} ${!isEnabled ? styles.miniBlockDisabled : ''} ${className || ''}`}
      style={style}
    >
      <span>{label}</span>
      <div className={`${styles.miniToggleDot} ${!isEnabled ? styles.miniToggleDotOff : ''}`} />
      <span className={styles.miniDotsGrip}>:::</span>
    </div>
  )
}

export function VisualPresetPicker({
  presetLayout,
  setPresetLayout,
  widgets,
}: VisualPresetPickerProps) {
  return (
    <div className={styles.pickerContainer}>
      <div className={styles.cardsGrid}>
        {/* Preset 1: default_4right */}
        <div
          className={`${styles.presetCard} ${presetLayout === 'default_4right' ? styles.presetCardActive : ''}`}
          onClick={() => setPresetLayout('default_4right')}
        >
          <div className={styles.presetTitleRow}>
            <span className={styles.presetTitle}>default_4right</span>
            {presetLayout === 'default_4right' && <span className={styles.activeTag}>Active</span>}
          </div>
          <div className={styles.wireframeCanvas}>
            <div className={styles.blueprintDefault}>
              <MiniBlock
                label="Notes"
                isEnabled={widgets.notes}
                className={styles.colNotesTall}
                style={{ background: '#f4f4f5' }}
              />
              <div className={styles.colRightStack}>
                <MiniBlock
                  label="Tasks"
                  isEnabled={widgets.tasks}
                  className={styles.rowTasksTop}
                  style={{ background: '#71717a', color: '#fff' }}
                />
                <div className={styles.grid2x2Bottom}>
                  <MiniBlock label="Schedule" isEnabled={widgets.schedule} style={{ background: '#71717a', color: '#fff' }} />
                  <MiniBlock label="Weather" isEnabled={widgets.weather} style={{ background: '#71717a', color: '#fff' }} />
                  <MiniBlock label="Count" isEnabled={widgets.countdown} style={{ background: '#71717a', color: '#fff' }} />
                  <MiniBlock label="Voice" isEnabled={widgets.recorder} style={{ background: '#71717a', color: '#fff' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preset 2: 3left */}
        <div
          className={`${styles.presetCard} ${presetLayout === '3left' ? styles.presetCardActive : ''}`}
          onClick={() => setPresetLayout('3left')}
        >
          <div className={styles.presetTitleRow}>
            <span className={styles.presetTitle}>3left</span>
            {presetLayout === '3left' && <span className={styles.activeTag}>Active</span>}
          </div>
          <div className={styles.wireframeCanvas}>
            <div className={styles.blueprintTwoRow}>
              <div className={styles.rowTopSplit}>
                <MiniBlock label="Notes" isEnabled={widgets.notes} style={{ background: '#f4f4f5' }} />
                <MiniBlock label="Tasks" isEnabled={widgets.tasks} style={{ background: '#f4f4f5' }} />
              </div>
              <div className={styles.rowBottomSplit}>
                <div className={styles.cluster3}>
                  <MiniBlock label="Weather" isEnabled={widgets.weather} style={{ background: '#71717a', color: '#fff' }} />
                  <MiniBlock label="Count" isEnabled={widgets.countdown} style={{ background: '#71717a', color: '#fff' }} />
                  <MiniBlock label="Voice" isEnabled={widgets.recorder} style={{ background: '#71717a', color: '#fff' }} />
                </div>
                <MiniBlock
                  label="Schedule"
                  isEnabled={widgets.schedule}
                  className={styles.cluster1Schedule}
                  style={{ background: '#a1a1aa' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preset 3: 3right */}
        <div
          className={`${styles.presetCard} ${presetLayout === '3right' ? styles.presetCardActive : ''}`}
          onClick={() => setPresetLayout('3right')}
        >
          <div className={styles.presetTitleRow}>
            <span className={styles.presetTitle}>3right</span>
            {presetLayout === '3right' && <span className={styles.activeTag}>Active</span>}
          </div>
          <div className={styles.wireframeCanvas}>
            <div className={styles.blueprintTwoRow}>
              <div className={styles.rowTopSplit}>
                <MiniBlock label="Tasks" isEnabled={widgets.tasks} style={{ background: '#f4f4f5' }} />
                <MiniBlock label="Notes" isEnabled={widgets.notes} style={{ background: '#f4f4f5' }} />
              </div>
              <div className={styles.rowBottomSplit}>
                <MiniBlock
                  label="Schedule"
                  isEnabled={widgets.schedule}
                  className={styles.cluster1Schedule}
                  style={{ background: '#a1a1aa' }}
                />
                <div className={styles.cluster3}>
                  <MiniBlock label="Weather" isEnabled={widgets.weather} style={{ background: '#71717a', color: '#fff' }} />
                  <MiniBlock label="Count" isEnabled={widgets.countdown} style={{ background: '#71717a', color: '#fff' }} />
                  <MiniBlock label="Voice" isEnabled={widgets.recorder} style={{ background: '#71717a', color: '#fff' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preset 4: 2left2right */}
        <div
          className={`${styles.presetCard} ${presetLayout === '2left2right' ? styles.presetCardActive : ''}`}
          onClick={() => setPresetLayout('2left2right')}
        >
          <div className={styles.presetTitleRow}>
            <span className={styles.presetTitle}>2left2right</span>
            {presetLayout === '2left2right' && <span className={styles.activeTag}>Active</span>}
          </div>
          <div className={styles.wireframeCanvas}>
            <div className={styles.blueprintTwoRow}>
              <div className={styles.rowTopSplit}>
                <MiniBlock label="Notes" isEnabled={widgets.notes} style={{ background: '#f4f4f5' }} />
                <MiniBlock label="Tasks" isEnabled={widgets.tasks} style={{ background: '#f4f4f5' }} />
              </div>
              <div className={styles.rowBottomSplit}>
                <div className={styles.cluster2}>
                  <MiniBlock label="Weather" isEnabled={widgets.weather} style={{ background: '#71717a', color: '#fff' }} />
                  <MiniBlock label="Voice" isEnabled={widgets.recorder} style={{ background: '#71717a', color: '#fff' }} />
                </div>
                <div className={styles.cluster2}>
                  <MiniBlock label="Count" isEnabled={widgets.countdown} style={{ background: '#71717a', color: '#fff' }} />
                  <MiniBlock label="Schedule" isEnabled={widgets.schedule} style={{ background: '#71717a', color: '#fff' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
