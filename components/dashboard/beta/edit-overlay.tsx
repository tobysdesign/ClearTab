'use client'

import React, { useCallback, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import type { WidgetId, DropZone } from '@/lib/panel-tree'
import { computeDropTarget, dropIndicatorRect, type DropTarget } from '@/lib/panel-drag'
import styles from './edit-overlay.module.css'

interface EditOverlayProps {
  widgetId: WidgetId
  children: React.ReactNode
  onMove: (draggedId: WidgetId, targetId: WidgetId, zone: DropZone) => void
}

// One shared drop indicator for every tile, created lazily on document.body.
// It must live outside the dragged element: framer-motion applies a transform to
// the tile while dragging, which would re-anchor a position:fixed descendant.
let sharedIndicator: HTMLDivElement | null = null
function getIndicator(): HTMLDivElement {
  if (!sharedIndicator || !sharedIndicator.isConnected) {
    sharedIndicator = document.createElement('div')
    sharedIndicator.className = styles.dropIndicator
    sharedIndicator.setAttribute('aria-hidden', 'true')
    document.body.appendChild(sharedIndicator)
  }
  return sharedIndicator
}

function hideIndicator() {
  if (sharedIndicator) sharedIndicator.style.opacity = '0'
}

function showIndicator(target: DropTarget) {
  const el = getIndicator()
  const r = dropIndicatorRect(target)
  el.className = `${styles.dropIndicator} ${target.zone === 'center' ? styles.dropIndicatorCenter : styles.dropIndicatorEdge}`
  el.style.opacity = '1'
  el.style.left = `${r.left}px`
  el.style.top = `${r.top}px`
  el.style.width = `${r.width}px`
  el.style.height = `${r.height}px`
}

/**
 * Edit-mode wrapper for a single widget tile. Mounted ONLY while editing.
 * The motion.div is the one element per tile carrying data-widget-id, so
 * computeDropTarget excludes it (and its descendants) from the hit-test.
 * The in-flight target lives in a ref, never state, so pointer moves don't
 * re-render and fight framer-motion's transform (same rule as the layout modal).
 */
export function EditOverlay({ widgetId, children, onMove }: EditOverlayProps) {
  const elRef = useRef<HTMLDivElement>(null)
  const targetRef = useRef<DropTarget | null>(null)

  useEffect(() => hideIndicator, [])

  const handleDrag = useCallback((point: { x: number; y: number }) => {
    if (!elRef.current) return
    const target = computeDropTarget(elRef.current, point)
    targetRef.current = target
    if (target) showIndicator(target)
    else hideIndicator()
  }, [])

  const handleDragEnd = useCallback((point: { x: number; y: number }) => {
    const el = elRef.current
    hideIndicator()
    const target = (el ? computeDropTarget(el, point) : null) ?? targetRef.current
    targetRef.current = null
    if (!target || target.targetId === widgetId) return
    onMove(widgetId, target.targetId, target.zone)
  }, [onMove, widgetId])

  return (
    <motion.div
      ref={elRef}
      data-widget-id={widgetId}
      className={styles.tile}
      drag
      dragSnapToOrigin
      dragElastic={0.2}
      whileDrag={{ zIndex: 50, scale: 1.01 }}
      onDrag={(_e, info) => handleDrag(info.point)}
      onDragEnd={(_e, info) => handleDragEnd(info.point)}
    >
      {children}
      <div className={styles.blocker} />
    </motion.div>
  )
}
