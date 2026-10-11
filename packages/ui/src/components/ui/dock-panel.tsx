'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import styles from './dock-panel.module.css'

type Placement = 'top' | 'bottom' | 'left' | 'right'

interface DockPanelProps {
  isOpen: boolean
  onClose: () => void
  /** CSS selector for the trigger this panel grows from (e.g. a data-testid
   * attribute selector). Looked up fresh via document.querySelector each time
   * the panel opens, rather than a React ref, so it works for triggers mounted
   * anywhere in the tree -- including ones decoupled from this panel's own
   * render tree (e.g. Settings, which opens via a global custom event, or a
   * button inside a dashboard widget). */
  anchorSelector: string
  children: React.ReactNode
  className?: string
  /** Side the panel prefers to open on. It auto-flips to another side when the
   * preferred one would overflow the viewport. Defaults to 'top' -- the panel
   * grows upward from a dock button sitting at the bottom of the screen. */
  preferredPlacement?: Placement
}

/** Broadcast whenever any DockPanel opens, so every other open one closes --
 * only one dock panel is visible at a time regardless of how it was opened
 * (dock click, keyboard shortcut, global custom event). */
const DOCK_PANEL_OPEN_EVENT = 'dockpanel:open'

/** Gap between the panel and its trigger, and the minimum margin we keep
 * between the panel and the viewport edges when deciding whether a side fits. */
const GAP = 14
const VIEWPORT_PAD = 16
/** Keep the tail at least this far from the panel's corners so it always reads
 * as attached, even when the trigger is near the viewport edge. */
const TAIL_INSET = 16

/** Pick the first side (preferred first) on which the panel fits inside the
 * viewport. Falls back to the preferred side when nothing fits outright. */
function choosePlacement(
  a: DOMRect,
  vw: number,
  vh: number,
  pw: number,
  ph: number,
  preferred: Placement,
): Placement {
  const fits: Record<Placement, boolean> = {
    top: a.top - GAP - ph >= VIEWPORT_PAD,
    bottom: a.bottom + GAP + ph <= vh - VIEWPORT_PAD,
    right: a.right + GAP + pw <= vw - VIEWPORT_PAD,
    left: a.left - GAP - pw >= VIEWPORT_PAD,
  }
  const order: Placement[] = [preferred, 'top', 'bottom', 'right', 'left']
  for (const p of order) {
    if (fits[p]) return p
  }
  return preferred
}

/**
 * A panel that grows from its trigger instead of appearing as a centered,
 * backdrop-blocking modal. There's no overlay at all: a pointerdown anywhere
 * outside the panel closes it, so the trigger (and everything else) stays
 * clickable -- clicking another dock button closes this panel and opens that
 * one. The panel opens on the preferred side of the trigger when there's room,
 * and flips to another side (below, or to the left/right) when the preferred
 * side would run off-screen. The tail always points back at the trigger, so
 * the panel reads as growing out of the button. The tail lives inside the same
 * animated wrapper as the panel (so it scales/fades/moves in lockstep with it)
 * but as a sibling of the scrolling panel, not a child -- the panel's
 * overflow-y: auto would otherwise clip the tail where it pokes out past the
 * panel's edge.
 */
export function DockPanel({
  isOpen,
  onClose,
  anchorSelector,
  children,
  className,
  preferredPlacement = 'top',
}: DockPanelProps) {
  const [anchorRect, setAnchorRect] = React.useState<DOMRect | null>(null)
  const [viewport, setViewport] = React.useState({ w: 0, h: 0 })
  const [panelSize, setPanelSize] = React.useState({ w: 0, h: 0 })
  const [placement, setPlacement] = React.useState<Placement>(preferredPlacement)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const panelId = React.useId()
  const onCloseRef = React.useRef(onClose)
  onCloseRef.current = onClose
  // Set by a React pointerdown handler on the panel, which (unlike a DOM
  // contains() check) also catches events from the panel's own portaled
  // descendants -- React events bubble through portals.
  const pointerInsideRef = React.useRef(false)

  // Measure the trigger + viewport (and the panel, once it has mounted) and
  // decide which side to open on. Runs in a layout effect so the placement is
  // resolved before the browser paints, avoiding a flash on the wrong side.
  React.useLayoutEffect(() => {
    if (!isOpen) return
    const update = () => {
      const el = document.querySelector(anchorSelector)
      if (!el) return
      const a = el.getBoundingClientRect()
      const vw = window.innerWidth
      const vh = window.innerHeight
      setAnchorRect(a)
      setViewport({ w: vw, h: vh })
      const panel = panelRef.current
      if (panel) {
        const pw = panel.offsetWidth
        const ph = panel.offsetHeight
        setPanelSize({ w: pw, h: ph })
        setPlacement(choosePlacement(a, vw, vh, pw, ph, preferredPlacement))
      }
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [isOpen, anchorSelector, preferredPlacement])

  // Re-measure once the panel is actually in the DOM (the effect above runs
  // before it mounts, so panelRef is null on the first pass).
  React.useLayoutEffect(() => {
    if (!isOpen || !anchorRect) return
    const panel = panelRef.current
    if (!panel) return
    const pw = panel.offsetWidth
    const ph = panel.offsetHeight
    setPanelSize({ w: pw, h: ph })
    setPlacement(choosePlacement(anchorRect, viewport.w, viewport.h, pw, ph, preferredPlacement))
  }, [isOpen, anchorRect, viewport.w, viewport.h, preferredPlacement])

  React.useEffect(() => {
    if (!isOpen) return
    window.dispatchEvent(new CustomEvent(DOCK_PANEL_OPEN_EVENT, { detail: panelId }))
    const handleOtherOpened = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== panelId) onCloseRef.current()
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current()
    }
    // Bubble phase on document: React's root listener (which sets
    // pointerInsideRef) runs before this.
    const handlePointerDown = (e: PointerEvent) => {
      const inside = pointerInsideRef.current
      pointerInsideRef.current = false
      if (inside) return
      // Our own trigger: leave it to its click handler, so re-clicking the
      // button doesn't close-then-reopen the panel.
      const anchor = document.querySelector(anchorSelector)
      if (anchor && e.target instanceof Node && anchor.contains(e.target)) return
      onCloseRef.current()
    }
    window.addEventListener(DOCK_PANEL_OPEN_EVENT, handleOtherOpened)
    window.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerdown', handlePointerDown)
    return () => {
      window.removeEventListener(DOCK_PANEL_OPEN_EVENT, handleOtherOpened)
      window.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [isOpen, anchorSelector, panelId])

  if (typeof document === 'undefined') return null

  // Derive the positioner placement, the tail, and the scale-in origin from the
  // chosen side. For top/bottom the panel is centered on the viewport (matching
  // the dock panels) and the tail slides along the bottom/top edge to sit under
  // the trigger; for left/right the panel is centered on the trigger's vertical
  // midpoint (clamped into the viewport) and the tail sits on the near edge.
  const positionerStyle: React.CSSProperties = {}
  const tailStyle: React.CSSProperties = {}
  let tailClass = styles.tailDown
  let transformOrigin = '50% 100%'
  let initialOffset: { x?: number; y?: number } = { y: 8 }

  if (anchorRect) {
    const centerX = anchorRect.left + anchorRect.width / 2
    const centerY = anchorRect.top + anchorRect.height / 2

    if (placement === 'top' || placement === 'bottom') {
      // The panel is centered on the viewport, so position the tail (relative
      // to the panel's own left edge) under the trigger, clamped to stay
      // attached when the trigger is far from the viewport's horizontal center.
      const panelLeft = viewport.w / 2 - panelSize.w / 2
      const tailX = panelSize.w
        ? Math.max(TAIL_INSET, Math.min(centerX - panelLeft, panelSize.w - TAIL_INSET))
        : centerX - panelLeft
      const tailLeft = `${tailX}px`
      positionerStyle.left = '50%'
      positionerStyle.transform = 'translateX(-50%)'
      tailStyle.left = tailLeft
      if (placement === 'top') {
        positionerStyle.bottom = `calc(100vh - ${anchorRect.top}px + ${GAP}px)`
        transformOrigin = `${tailLeft} 100%`
        tailClass = styles.tailDown
        initialOffset = { y: 8 }
      } else {
        positionerStyle.top = `${anchorRect.bottom + GAP}px`
        transformOrigin = `${tailLeft} 0%`
        tailClass = styles.tailUp
        initialOffset = { y: -8 }
      }
    } else {
      const ph = panelSize.h
      const desiredTop = centerY - ph / 2
      const clampedTop = Math.max(VIEWPORT_PAD, Math.min(desiredTop, viewport.h - VIEWPORT_PAD - ph))
      const tailTop = ph
        ? Math.max(TAIL_INSET, Math.min(centerY - clampedTop, ph - TAIL_INSET))
        : centerY - clampedTop
      positionerStyle.top = `${clampedTop}px`
      tailStyle.top = `${tailTop}px`
      if (placement === 'right') {
        positionerStyle.left = `${anchorRect.right + GAP}px`
        transformOrigin = `0% ${tailTop}px`
        tailClass = styles.tailLeft
        initialOffset = { x: -8 }
      } else {
        positionerStyle.left = `${anchorRect.left - GAP - panelSize.w}px`
        transformOrigin = `100% ${tailTop}px`
        tailClass = styles.tailRight
        initialOffset = { x: 8 }
      }
    }
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && anchorRect && (
        /* Plain div for positioning, not a motion component: framer-motion owns
           the `transform` CSS property entirely once scale is animated on an
           element, which would silently overwrite the transform set here. */
        <div key="dock-panel" className={styles.panelPositioner} style={positionerStyle}>
          <motion.div
            className={styles.panelMotion}
            style={{ transformOrigin }}
            initial={{ opacity: 0, scale: 0.92, ...initialOffset }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, ...initialOffset }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            onPointerDown={() => { pointerInsideRef.current = true }}
          >
            <div ref={panelRef} className={cn(styles.panel, className)}>
              {children}
            </div>
            <div className={cn(styles.tail, tailClass)} style={tailStyle} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
