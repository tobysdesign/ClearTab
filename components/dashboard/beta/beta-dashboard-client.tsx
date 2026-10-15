'use client'

import { useEffect, useRef, useState, Suspense, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, PanInfo, useAnimationControls } from 'framer-motion'
import { cn } from '@/lib/utils'
import { DragIcon } from '@/components/icons'
import { BetaDockContent } from './beta-dock-content'
import { BetaAdaptiveGrid } from './beta-adaptive-grid'
import dynamic from 'next/dynamic'

const VisualLayoutModal = dynamic(
  () => import('./visual-layout-modal').then((mod) => ({ default: mod.VisualLayoutModal })),
  { ssr: false }
)

const KeyboardShortcutsModal = dynamic(
  () => import('./keyboard-shortcuts-modal').then((mod) => ({ default: mod.KeyboardShortcutsModal })),
  { ssr: false }
)

import { PieGuide } from '../pie-guide'
import { type ReactNode } from 'react'
import { BrandedLoader } from '@cleartab/ui'
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
  const [isLayoutModalOpen, setIsLayoutModalOpen] = useState(false)
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false)

  const {
    presetLayout,
    setPresetLayout,
    widgets,
    toggleWidget,
    activeCount,
    totalCount,
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
        setShowSettings((prev) => !prev)
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault()
        setIsLayoutModalOpen((prev) => !prev)
      }
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
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
  }, [])

  const calculateDropZones = useCallback(() => {
    if (typeof window === 'undefined') return []

    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    const isVertical = position === 'left' || position === 'right'
    const DOCK_WIDTH_HORIZONTAL = 150
    const DOCK_HEIGHT = 52
    const width = isVertical ? DOCK_HEIGHT : DOCK_WIDTH_HORIZONTAL
    const height = isVertical ? DOCK_WIDTH_HORIZONTAL : DOCK_HEIGHT
    const margin = 10

    const newZones: DropZone[] = [
      {
        id: 'bottom',
        x: (windowWidth - width) / 2,
        y: windowHeight - height - margin,
        width,
        height,
      },
      {
        id: 'top',
        x: (windowWidth - width) / 2,
        y: margin,
        width,
        height,
      },
      {
        id: 'left',
        x: margin,
        y: (windowHeight - width) / 2,
        width,
        height,
      },
      {
        id: 'right',
        x: windowWidth - width - margin,
        y: (windowHeight - width) / 2,
        width,
        height,
      },
    ]

    setDropZones(newZones)
    return newZones
  }, [position])

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

  const defaultZone: DropZone = {
    id: position,
    x: typeof window !== 'undefined' ? (window.innerWidth - 150) / 2 : 0,
    y: typeof window !== 'undefined' ? window.innerHeight - 62 : 0,
    width: 150,
    height: 52,
  }

  const currentZone = dropZones.find((z) => z.id === position) || defaultZone

  useEffect(() => {
    if (currentZone) {
      controls.start(
        {
          x: currentZone.x,
          y: currentZone.y,
        },
        { type: 'spring', stiffness: 500, damping: 40 }
      )
    }
  }, [currentZone, controls, position])

  const handleDragStart = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    _info: PanInfo
  ) => {
    setIsDragging(true)
    if (currentZone) {
      setDragOrigin({
        x: currentZone.x + currentZone.width / 2,
        y: currentZone.y + currentZone.height / 2,
      })
    }
  }

  const handleDrag = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    _info: PanInfo
  ) => {
    let closestZone: DropZone | null = null
    let minDistance = Infinity

    const validZones = dropZones.filter((z) => z.id !== position)

    for (const zone of validZones) {
      const distance = Math.sqrt(
        Math.pow(_info.point.x - zone.x, 2) + Math.pow(_info.point.y - zone.y, 2)
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
    } else if (currentZone) {
      controls.start(
        {
          x: currentZone.x,
          y: currentZone.y,
          width: currentZone.width,
          height: currentZone.height,
        },
        { type: 'spring', stiffness: 500, damping: 40 }
      )
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
          />
        </Suspense>
      </div>

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
            initial={currentZone ? { x: currentZone.x, y: currentZone.y } : undefined}
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
                onOpenLayoutModal={() => setIsLayoutModalOpen((prev) => !prev)}
                onOpenShortcuts={() => setIsShortcutsModalOpen((prev) => !prev)}
              />

              <div
                className="dock-handle"
                onPointerDown={(e) => {
                  const target = e.currentTarget as HTMLDivElement
                  target.setPointerCapture(e.pointerId)
                }}
              >
                <DragIcon size={16} className={betaStyles.dockDragIcon} />
              </div>
            </div>
          </motion.div>,
          document.body
        )}

      {isLayoutModalOpen && (
        <VisualLayoutModal
          isOpen={isLayoutModalOpen}
          onClose={() => setIsLayoutModalOpen(false)}
          presetLayout={presetLayout}
          setPresetLayout={setPresetLayout}
          widgets={widgets}
          toggleWidget={toggleWidget}
          activeCount={activeCount}
          totalCount={totalCount}
          customLayout={customLayout}
          onMoveWidget={moveWidgetInCustomLayout}
        />
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
