'use client'

import { useEffect, useRef, useState, Suspense, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { motion, PanInfo, useAnimationControls } from 'framer-motion'
import { cn } from '@/lib/utils'
import { DragIcon } from '@/components/icons'
import { BetaDockContent } from './beta-dock-content'
import { BetaAdaptiveGrid } from './beta-adaptive-grid'
import { VisualLayoutModal } from './visual-layout-modal'
import { PieGuide } from '../pie-guide'
import { type ReactNode } from 'react'
import { BrandedLoader } from '@cleartab/ui'
import { useBetaWidgets } from '@/hooks/use-beta-widgets'
import styles from '../dashboard-client.module.css'

interface BetaDashboardClientProps {
  notes: ReactNode
  tasks: ReactNode
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

export function BetaDashboardClient({ notes, tasks }: BetaDashboardClientProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const controls = useAnimationControls()
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [nearestZoneId, setNearestZoneId] = useState<'top' | 'left' | 'right' | 'bottom' | null>(null)
  const [dragOrigin, setDragOrigin] = useState<{ x: number; y: number } | null>(null)
  const [isLayoutModalOpen, setIsLayoutModalOpen] = useState(false)

  const {
    widgets,
    activePreset,
    activeCount,
    totalCount,
    primaryOrder,
    utilityOrder,
    layoutMode,
    setLayoutMode,
    presetLayout,
    setPresetLayout,
    layoutOrientation,
    setLayoutOrientation,
    toggleWidget,
    swapPrimaryOrder,
    moveUtility,
    applyPreset,
    resetToAll,
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
    } else {
      document.body.classList.remove('dragging')
    }
    return () => {
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
      {/* Floating Beta Indicator & Controls pill */}
      <div
        style={{
          position: 'fixed',
          top: 14,
          right: 18,
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '4px 10px',
          borderRadius: 9999,
          background: 'rgba(24, 24, 27, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          fontSize: 12,
          color: '#e4e4e7',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            padding: '2px 7px',
            borderRadius: 6,
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            color: '#fff',
          }}
        >
          Beta
        </span>

        {/* Layout modal trigger button */}
        <button
          type="button"
          onClick={() => setIsLayoutModalOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            borderRadius: 6,
            color: '#fff',
            fontSize: 11,
            fontWeight: 500,
            padding: '4px 9px',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          <span>🎛️ Choose Layout</span>
          <span
            style={{
              fontSize: 10,
              padding: '1px 5px',
              borderRadius: 9999,
              background: 'rgba(59, 130, 246, 0.3)',
              color: '#93c5fd',
            }}
          >
            {activeCount}/{totalCount}
          </span>
        </button>

        <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
        <Link
          href="/"
          style={{
            color: '#a1a1aa',
            textDecoration: 'none',
            fontWeight: 400,
            fontSize: 11,
            transition: 'color 0.15s',
          }}
          title="Return to Classic rigid layout"
        >
          Classic
        </Link>
      </div>

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
            visibleWidgets={widgets}
            presetLayout={presetLayout}
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
                activeCount={activeCount}
                totalCount={totalCount}
                onOpenLayoutModal={() => setIsLayoutModalOpen(true)}
              />

              <div
                className="dock-handle"
                onPointerDown={(e) => {
                  const target = e.currentTarget as HTMLDivElement
                  target.setPointerCapture(e.pointerId)
                }}
              >
                <DragIcon size={16} className="text-white/60" />
              </div>
            </div>
          </motion.div>,
          document.body
        )}

      <VisualLayoutModal
        isOpen={isLayoutModalOpen}
        onClose={() => setIsLayoutModalOpen(false)}
        presetLayout={presetLayout}
        setPresetLayout={setPresetLayout}
        widgets={widgets}
        toggleWidget={toggleWidget}
        activeCount={activeCount}
        totalCount={totalCount}
      />
    </div>
  )
}
