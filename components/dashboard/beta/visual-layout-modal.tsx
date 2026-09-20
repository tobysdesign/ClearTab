'use client'

import React, { useEffect } from 'react'
import { BetaPresetLayout, LAYOUT_PRESET_METADATA } from '@/hooks/use-beta-widgets'
import styles from './visual-layout-modal.module.css'

interface VisualLayoutModalProps {
  isOpen: boolean
  onClose: () => void
  presetLayout: BetaPresetLayout
  setPresetLayout: (layout: BetaPresetLayout) => void
}

interface MiniBlockProps {
  label: string
  className?: string
  isLight?: boolean
}

function MiniWireframeBlock({ label, className = '', isLight = false }: MiniBlockProps) {
  return (
    <div className={`${styles.miniBlock} ${isLight ? styles.miniBlockLight : ''} ${className}`}>
      <span className={styles.miniBlockName}>{label}</span>
      <span className={styles.miniGripDots}>:::</span>
    </div>
  )
}

export function VisualLayoutModal({
  isOpen,
  onClose,
  presetLayout = 'default_4right',
  setPresetLayout,
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
              Active: {LAYOUT_PRESET_METADATA[presetLayout]?.name || presetLayout}
            </span>
          </div>

          <button type="button" onClick={onClose} className={styles.closeButton}>
            <span>Done</span>
            <kbd style={{ opacity: 0.6, fontSize: 11 }}>Esc</kbd>
          </button>
        </div>

        {/* Layout Blueprint Grid */}
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
              <div className={styles.default4RightBlueprint}>
                <MiniWireframeBlock label="Notes" className={styles.default4RightNotes} isLight />
                <div className={styles.default4RightRightCol}>
                  <MiniWireframeBlock label="Tasks" className={styles.default4RightTasks} isLight />
                  <div className={styles.default4RightGrid2x2}>
                    <MiniWireframeBlock label="Schedule" />
                    <MiniWireframeBlock label="Weather" />
                    <MiniWireframeBlock label="Count" />
                    <MiniWireframeBlock label="Voice" />
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
            onClick={() => handleSelectLayout('3left')}
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
                  <MiniWireframeBlock label="Notes" isLight />
                  <MiniWireframeBlock label="Tasks" isLight />
                </div>
                <div className={styles.twoRowBottomSplit}>
                  <div className={styles.cluster3}>
                    <MiniWireframeBlock label="Weather" />
                    <MiniWireframeBlock label="Count" />
                    <MiniWireframeBlock label="Voice" />
                  </div>
                  <MiniWireframeBlock label="Schedule" className={styles.cluster1Schedule} />
                </div>
              </div>
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
              <div className={styles.twoRowBlueprint}>
                <div className={styles.twoRowTopSplit}>
                  <MiniWireframeBlock label="Tasks" isLight />
                  <MiniWireframeBlock label="Notes" isLight />
                </div>
                <div className={styles.twoRowBottomSplit}>
                  <MiniWireframeBlock label="Schedule" className={styles.cluster1Schedule} />
                  <div className={styles.cluster3}>
                    <MiniWireframeBlock label="Weather" />
                    <MiniWireframeBlock label="Count" />
                    <MiniWireframeBlock label="Voice" />
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
            onClick={() => handleSelectLayout('2left2right')}
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
                  <MiniWireframeBlock label="Notes" isLight />
                  <MiniWireframeBlock label="Tasks" isLight />
                </div>
                <div className={styles.twoRowBottomSplit}>
                  <div className={styles.cluster2}>
                    <MiniWireframeBlock label="Weather" />
                    <MiniWireframeBlock label="Voice" />
                  </div>
                  <div className={styles.cluster2}>
                    <MiniWireframeBlock label="Count" />
                    <MiniWireframeBlock label="Schedule" />
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
