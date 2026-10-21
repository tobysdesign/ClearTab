'use client'

import { useEffect, useRef, useState, Suspense, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, PanInfo, useAnimationControls } from 'framer-motion'
import { cn } from '@/lib/utils'
import { DragIcon } from '@/components/icons'
import { DraggableGlyphIcon } from '@/components/icons/dock-icons'
import { BetaDockContent } from './beta-dock-content'
import { BetaAdaptiveGrid } from './beta-adaptive-grid'
import dynamic from 'next/dynamic'

const KeyboardShortcutsModal = dynamic(
  () => import('./keyboard-shortcuts-modal').then((mod) => ({ default: mod.KeyboardShortcutsModal })),
  { ssr: false }
)

import { PieGuide } from '../pie-guide'
import { type ReactNode } from 'react'
import { BrandedLoader, Tooltip, TooltipTrigger, TooltipContent } from '@cleartab/ui'
import {
  useBetaWidgets,
  type BetaPresetLayout,
  type CustomLayoutState,
  type WidgetVisibilityState,
} from '@/hooks/use-beta-widgets'
import styles from '../dashboard-client.module.css'
import betaStyles from './beta-dashboard-client.module.css'

interface BetaDashboardClientProps {
  notes: ReactNode
  tasks: ReactNode
  /** The landing page demo drives the layout itself instead of the saved one */
  layoutOverride?: {
    presetLayout: BetaPresetLayout
    visibleWidgets: WidgetVisibilityState
    customLayout: CustomLayoutState
  }
}

interface DropZone {
  id: 'top' | 'left' | 'right' | 'bottom'
  x: number
  y: number
  width: number
  height: number
}

function LoadingState() {
  return (
    <div className={styles.loadingContainer}>
      <BrandedLoader size="medium" />
    </div>
  )
}

type DockPosition = 'top' | 'left' | 'right' | 'bottom'

export function BetaDashboardClient({ notes, tasks, layoutOverride }: BetaDashboardClientProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const controls = useAnimationControls()
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [nearestZoneId, setNearestZoneId] = useState<'top' | 'left' | 'right' | 'bottom' | null>(null)
  const [dragOrigin, setDragOrigin] = useState<{ x: number; y: number } | null>(null)
  // Layout editing writes to the real user's prefs, so it is disabled on
  // demo/landing surfaces that drive the layout via layoutOverride.
  const editingEnabled = !layoutOverride
  const [editMode, setEditModeRaw] = useState(false)
  const setEditMode = useCallback(
    (next: boolean | ((prev: boolean) => boolean)) => {
      if (!editingEnabled) return
      setEditModeRaw(next)
    },
    [editingEnabled]
  )
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false)

  const {
    presetLayout,
    setPresetLayout,
    widgets,
    toggleWidget,
    activeCount,
    customLayout,
    moveWidgetInCustomLayout,
  } = useBetaWidgets()

  const [position, setPosition] = useState<DockPosition>(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('dock-position')
      if (stored === 'top' || stored === 'left' || stored === 'right' || stored === 'bottom') {
        return stored
      }
    }
    return 'bottom'
  })
  const [dropZones, setDropZones] = useState<DropZone[]>([])

  // The dock is fit-content, so measure it rather than hardcoding a width. `dockLength` is the
  // icon run, `dockThickness` the bar's depth; both drive centring at every edge.
  const dockRef = useRef<HTMLDivElement>(null)
  const [dockLength, setDockLength] = useState(150)
  const [dockThickness, setDockThickness] = useState(52)

  useEffect(() => {
    const el = dockRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const measure = () => {
      const w = el.offsetWidth
      const h = el.offsetHeight
      if (w && h) {
        setDockLength(Math.round(Math.max(w, h)))
        setDockThickness(Math.round(Math.min(w, h)))
      }
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const initialPosition = position

  const initialCurrentZoneState =
    typeof window !== 'undefined'
      ? {
          id: initialPosition,
          x:
            initialPosition === 'left'
              ? 10
              : initialPosition === 'right'
                ? window.innerWidth - 52 - 10
                : (window.innerWidth - 150) / 2,
          y:
            initialPosition === 'top'
              ? 10
              : initialPosition === 'bottom'
                ? window.innerHeight - 52 - 10
                : (window.innerHeight - 150) / 2,
          width: initialPosition === 'left' || initialPosition === 'right' ? 52 : 150,
          height: initialPosition === 'left' || initialPosition === 'right' ? 150 : 52,
        }
      : null

  const [_currentZoneState, _setCurrentZoneState] = useState<DropZone | null>(initialCurrentZoneState)

  useEffect(() => {
    if (isDragging) {
      document.body.classList.add('dragging')
      const handlePointerUp = () => setIsDragging(false)
      window.addEventListener('pointerup', handlePointerUp)
      window.addEventListener('blur', handlePointerUp)
      return () => {
        document.body.classList.remove('dragging')
        window.removeEventListener('pointerup', handlePointerUp)
        window.removeEventListener('blur', handlePointerUp)
      }
    } else {
      document.body.classList.remove('dragging')
    }
  }, [isDragging])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        setShowSearch((prev) => !prev)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault()
        // Open/toggle the settings drawer, same as the dock's settings button.
        // (setShowSettings alone did nothing — the dock no longer reads that state.)
        window.dispatchEvent(new CustomEvent('openSettings', { detail: { tab: 'schedule', toggle: true } }))
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'l' && editingEnabled) {
        e.preventDefault()
        setEditMode((prev) => !prev)
      }
      if (e.key === 'Escape') {
        const target = e.target as HTMLElement
        const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
        if (!isTyping) setEditMode(false)
      }
      if (e.key === 'Enter' && editMode) {
        const target = e.target as HTMLElement
        const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
        if (!isTyping) {
          e.preventDefault()
          setEditMode(false)
        }
      }
      // "?" — match the character AND the Shift+/ position, since some layouts/OSes
      // deliver e.key "/" (with Shift) or an empty e.code rather than "?".
      if (
        (e.key === '?' || ((e.key === '/' || e.code === 'Slash') && e.shiftKey)) &&
        !e.metaKey &&
        !e.ctrlKey
      ) {
        const target = e.target as HTMLElement
        const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
        if (!isTyping) {
          e.preventDefault()
          setIsShortcutsModalOpen((prev) => !prev)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editingEnabled, setEditMode, editMode])

  const calculateDropZones = useCallback(() => {
    if (typeof window === 'undefined') return []

    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    // Each zone uses the dock's dimensions for its own orientation, so the pill is centred on
    // its true size whichever edge it's on. `long` = the icon run, `short` = the bar depth.
    const long = dockLength
    const short = dockThickness
    const margin = 10

    const newZones: DropZone[] = [
      {
        id: 'bottom',
        x: (windowWidth - long) / 2,
        y: windowHeight - short - margin,
        width: long,
        height: short,
      },
      {
        id: 'top',
        x: (windowWidth - long) / 2,
        y: margin,
        width: long,
        height: short,
      },
      {
        id: 'left',
        x: margin,
        y: (windowHeight - long) / 2,
        width: short,
        height: long,
      },
      {
        id: 'right',
        x: windowWidth - short - margin,
        y: (windowHeight - long) / 2,
        width: short,
        height: long,
      },
    ]

    setDropZones(newZones)
    return newZones
  }, [position, dockLength, dockThickness])

  useEffect(() => {
    calculateDropZones()
    window.addEventListener('resize', calculateDropZones)
    return () => window.removeEventListener('resize', calculateDropZones)
  }, [calculateDropZones])

  useEffect(() => {
    const handleDockPositionChange = (event: Event) => {
      const detail = (event as CustomEvent<{ position: DockPosition }>).detail
      if (!detail?.position) return
      setPosition(detail.position)
    }

    window.addEventListener('dock-position-change', handleDockPositionChange as EventListener)
    return () =>
      window.removeEventListener('dock-position-change', handleDockPositionChange as EventListener)
  }, [])

  // Resting x/y for an edge, from a LIVE measurement of the dock (it's fit-content), so it's
  // exactly centred regardless of icon count, search state, or when the ResizeObserver settles.
  const getRestingPosition = useCallback((pos: DockPosition) => {
    const margin = 10
    const ww = typeof window !== 'undefined' ? window.innerWidth : 0
    const wh = typeof window !== 'undefined' ? window.innerHeight : 0
    const el = dockRef.current
    const w = el?.offsetWidth || dockLength
    const h = el?.offsetHeight || dockThickness
    switch (pos) {
      case 'top': return { x: (ww - w) / 2, y: margin }
      case 'left': return { x: margin, y: (wh - h) / 2 }
      case 'right': return { x: ww - w - margin, y: (wh - h) / 2 }
      case 'bottom':
      default: return { x: (ww - w) / 2, y: wh - h - margin }
    }
  }, [dockLength, dockThickness])

  useEffect(() => {
    const place = () => {
      const { x, y } = getRestingPosition(position)
      controls.start({ x, y }, { type: 'spring', stiffness: 500, damping: 40 })
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [position, controls, getRestingPosition])

  const handleDragStart = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    _info: PanInfo
  ) => {
    setIsDragging(true)
    // The drop guide sits at the centre of the screen, not on the dock
    setDragOrigin({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
  }

  const handleDrag = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    _info: PanInfo
  ) => {
    let closestZone: DropZone | null = null
    let minDistance = Infinity

    const validZones = dropZones.filter((z) => z.id !== position)

    for (const zone of validZones) {
      // Measure to each zone's centre, so a drag toward any edge picks that edge reliably
      const zoneCenterX = zone.x + zone.width / 2
      const zoneCenterY = zone.y + zone.height / 2
      const distance = Math.sqrt(
        Math.pow(_info.point.x - zoneCenterX, 2) + Math.pow(_info.point.y - zoneCenterY, 2)
      )

      if (distance < minDistance) {
        minDistance = distance
        closestZone = zone
      }
    }

    if (closestZone && minDistance < 600) {
      setNearestZoneId(closestZone.id)
    } else {
      setNearestZoneId(null)
    }
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    if (nearestZoneId) {
      setPosition(nearestZoneId)
    } else {
      // Snap back to the centred resting position (width/height stay fit-content, so the
      // pill background always covers the whole dock, handle included).
      const { x, y } = getRestingPosition(position)
      controls.start({ x, y }, { type: 'spring', stiffness: 500, damping: 40 })
    }
    setNearestZoneId(null)
    setDragOrigin(null)
  }

  const isVertical = position === 'left' || position === 'right'

  return (
    <div ref={containerRef} className="dashboard-container">
      <PieGuide
        isDragging={isDragging}
        hoveredSlice={nearestZoneId}
        position={dragOrigin}
        originPosition={position}
      />

      <div className="dashboard-content">
        <Suspense fallback={<LoadingState />}>
          <BetaAdaptiveGrid
            notes={notes}
            tasks={tasks}
            presetLayout={layoutOverride?.presetLayout ?? presetLayout}
            visibleWidgets={layoutOverride?.visibleWidgets ?? widgets}
            customLayout={layoutOverride?.customLayout ?? customLayout}
            dockPosition={position}
            searchQuery={searchQuery}
            editMode={editingEnabled && editMode}
            onMoveWidget={editingEnabled ? moveWidgetInCustomLayout : undefined}
          />
        </Suspense>
      </div>

      {editingEnabled && editMode && (
        <button
          type="button"
          className={betaStyles.editCloseButton}
          onClick={() => setEditMode(false)}
          aria-label="Close layout editing"
        >
          <span>Close</span>
          <kbd className={betaStyles.editCloseKbd}>Esc</kbd>
        </button>
      )}

      {editingEnabled && editMode && (
        <div className={betaStyles.editInstructions}>
          <span className={betaStyles.editInstructionsText}>
            Drag onto a widget&apos;s edge (top / bottom / left / right) to join, or its center to swap
          </span>
          <span className={betaStyles.editLegend}>
            <span className={betaStyles.editLegendItem}>
              <span className={cn(betaStyles.editSwatch, betaStyles.editSwatchSwap)} />
              Swap
            </span>
            <span className={betaStyles.editLegendItem}>
              <span className={cn(betaStyles.editSwatch, betaStyles.editSwatchJoin)} />
              Join
            </span>
          </span>
        </div>
      )}

      {isDragging &&
        dropZones.map((zone) => {
          if (zone.id === position) return null
          return (
            <div
              key={zone.id}
              className={cn(
                'drop-zone',
                nearestZoneId === zone.id ? 'drop-zone-active' : 'drop-zone-inactive'
              )}
              style={{
                left: zone.x + zone.width / 2,
                top: zone.y + zone.height / 2,
                width: zone.id === 'left' || zone.id === 'right' ? '52px' : '150px',
                height: zone.id === 'left' || zone.id === 'right' ? '150px' : '50px',
              }}
            />
          )
        })}

      {typeof window !== 'undefined' &&
        createPortal(
          <motion.div
            ref={dockRef}
            drag
            dragConstraints={{
              left: 0,
              right: typeof window !== 'undefined' ? window.innerWidth - 100 : 1000,
              top: 0,
              bottom: typeof window !== 'undefined' ? window.innerHeight - 100 : 1000,
            }}
            onDragStart={handleDragStart}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            dragMomentum={false}
            className="dock-container"
            animate={controls}
            initial={getRestingPosition(position)}
            style={{ position: 'fixed', top: 0, left: 0, zIndex: 50 }}
          >
            <div
              className={cn(
                'dock-content',
                isVertical ? 'dock-content-vertical' : 'dock-content-horizontal'
              )}
            >
              <BetaDockContent
                showSearch={showSearch}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                showSettings={showSettings}
                setShowSettings={setShowSettings}
                setShowSearch={setShowSearch}
                isVertical={isVertical}
                editMode={editingEnabled && editMode}
                onToggleEdit={() => setEditMode((prev) => !prev)}
                presetLayout={presetLayout}
                setPresetLayout={setPresetLayout}
                widgets={widgets}
                toggleWidget={toggleWidget}
                activeCount={activeCount}
                onOpenShortcuts={() => setIsShortcutsModalOpen((prev) => !prev)}
              />

              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="dock-handle"
                    onPointerDown={(e) => {
                      const target = e.currentTarget as HTMLDivElement
                      target.setPointerCapture(e.pointerId)
                    }}
                  >
                    <DraggableGlyphIcon size={32} className={betaStyles.dockDragIcon} />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  Drag to reposition the dock (top, right, bottom, left).
                </TooltipContent>
              </Tooltip>
            </div>
          </motion.div>,
          document.body
        )}

      {isShortcutsModalOpen && (
        <KeyboardShortcutsModal
          isOpen={isShortcutsModalOpen}
          onClose={() => setIsShortcutsModalOpen(false)}
        />
      )}
    </div>
  )
}
