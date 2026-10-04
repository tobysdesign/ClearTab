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
 * A panel that grows from the dock instead of appearing as a centered,
 * backdrop-blocking modal: no dimming overlay (just an invisible click-outside
 * -to-close layer). The panel itself is centered on the viewport; a separate
 * tail element points at the triggering icon's actual position. The tail is
 * rendered as its own fixed-position sibling, not a child of the panel --
 * the panel needs overflow-y: auto for tall content, which would otherwise
 * clip the tail where it pokes out past the panel's edge. Assumes the dock
 * sits at the bottom of the viewport.
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

  const bottomOffset = anchorRect ? `calc(100vh - ${anchorRect.top}px + 14px)` : undefined
  const anchorCenterX = anchorRect ? anchorRect.left + anchorRect.width / 2 : undefined

  return createPortal(
    <AnimatePresence>
      {isOpen && anchorRect && (
        <React.Fragment>
          <div className={styles.clickCatcher} onClick={onClose} />
          <motion.div
            className={styles.tail}
            style={{ left: anchorCenterX, bottom: `calc(${bottomOffset} - 7px)` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          />
          {/* Plain div for centering, not a motion component: framer-motion owns the
              `transform` CSS property entirely once scale/y are animated on an element,
              which would silently overwrite a CSS transform: translateX(-50%) here. */}
          <div className={styles.panelPositioner} style={{ left: '50%', bottom: bottomOffset }}>
            <motion.div
              className={cn(styles.panel, className)}
              initial={{ opacity: 0, scale: 0.92, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 8 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              {children}
            </motion.div>
          </div>
        </React.Fragment>
      )}
    </AnimatePresence>,
    document.body,
  )
}
