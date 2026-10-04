'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import styles from './dock-panel.module.css'

interface DockPanelProps {
  isOpen: boolean
  onClose: () => void
  /** CSS selector for the dock button this panel grows from (e.g. a data-testid
   * attribute selector). Looked up fresh via document.querySelector each time
   * the panel opens, rather than a React ref, so it works for triggers mounted
   * anywhere in the tree -- including ones decoupled from this panel's own
   * render tree (e.g. Settings, which opens via a global custom event). */
  anchorSelector: string
  children: React.ReactNode
  className?: string
}

/**
 * A panel that grows from a dock icon instead of appearing as a centered,
 * backdrop-blocking modal: no dimming overlay (just an invisible click-outside
 * -to-close layer), positioned directly above the triggering icon with a tail
 * pointing at it. Assumes the dock sits at the bottom of the viewport.
 */
export function DockPanel({ isOpen, onClose, anchorSelector, children, className }: DockPanelProps) {
  const [anchorRect, setAnchorRect] = React.useState<DOMRect | null>(null)

  React.useEffect(() => {
    if (!isOpen) return
    const updateRect = () => {
      const el = document.querySelector(anchorSelector)
      if (el) setAnchorRect(el.getBoundingClientRect())
    }
    updateRect()
    window.addEventListener('resize', updateRect)
    return () => window.removeEventListener('resize', updateRect)
  }, [isOpen, anchorSelector])

  React.useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {isOpen && anchorRect && (
        <React.Fragment>
          <div className={styles.clickCatcher} onClick={onClose} />
          <motion.div
            className={cn(styles.panel, className)}
            style={{
              left: anchorRect.left + anchorRect.width / 2,
              bottom: `calc(100vh - ${anchorRect.top}px + 14px)`,
            }}
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.tail} />
            {children}
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>,
    document.body,
  )
}
