'use client'

import React from 'react'
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from 'react-resizable-panels'
import { ScheduleWidget } from '@/components/widgets/schedule-widget'
import { WeatherWidgetNew } from '@/components/widgets/weather-widget-new'
import { RecorderWidget } from '@/components/widgets/recorder-widget'
import { CountdownWidget } from '@/components/widgets/countdown-widget-main'
import { BetaPresetLayout, WidgetVisibilityState, WidgetId, CustomLayoutState } from '@/hooks/use-beta-widgets'
import { PanelNode, DropZone, collapseForVisibility, presetToTree } from '@/lib/panel-tree'
import { useDockPadding } from '@/hooks/use-dock-padding'
import { useIsStacked } from '@/hooks/use-stacked-layout'
import { EditOverlay } from './edit-overlay'
import styles from './beta-adaptive-grid.module.css'

// --- Pixel-aware resizing ---------------------------------------------------
// react-resizable-panels only accepts a percentage `minSize`, so to enforce a
// fixed pixel floor we measure each group and express the floor as a percentage
// of it. The library clamps dragging to minSize itself, so the layout stays in
// bounds -- unlike a CSS min-width/height, which the library can't see and which
// lets panels overflow off-screen.
//
// A vertical group floors its panels by HEIGHT (>= 48px each); a horizontal
// group floors them by WIDTH (>= an eighth of the viewport each). The floor is
// always the floor of a panel's WHOLE subtree, not a single widget: a panel
// holding two stacked widgets must reserve 2x the height, and one holding two
// side-by-side widgets must reserve 2x the width, or a parent drag could squeeze
// it until its own children fall below the floor.
// Narrow screens: widgets stack in one scrollable column (see useIsStacked)
const STACK_ORDER: WidgetId[] = ['notes', 'tasks', 'schedule', 'weather', 'countdown', 'recorder']

const MIN_WIDGET_HEIGHT_PX = 48
const MIN_WIDGET_WIDTH_FRACTION = 1 / 8 // of the viewport width (12.5%)
const RESIZE_HIT_MARGINS = { fine: 14, coarse: 20 }

// Min height (px) a subtree needs so every leaf stays >= MIN_WIDGET_HEIGHT_PX.
function nodeMinHeightPx(node: PanelNode | null): number {
  if (!node) return 0
  if (node.type === 'widget') return MIN_WIDGET_HEIGHT_PX
  const a = nodeMinHeightPx(node.children[0])
  const b = nodeMinHeightPx(node.children[1])
  return node.direction === 'row' ? Math.max(a, b) : a + b // stacked -> sum
}

// How many leaf-widths wide a subtree must be (each leaf = one min-width unit).
function nodeMinWidthUnits(node: PanelNode | null): number {
  if (!node) return 0
  if (node.type === 'widget') return 1
  const a = nodeMinWidthUnits(node.children[0])
  const b = nodeMinWidthUnits(node.children[1])
  return node.direction === 'row' ? a + b : Math.max(a, b) // side-by-side -> sum
}

// The resize axis + measured size of the nearest enclosing group. A panel reads
// this to turn its pixel/unit floor into the percentage minSize the library wants.
const GroupBoxContext = React.createContext<{
  dir: 'horizontal' | 'vertical'
  width: number
  height: number
} | null>(null)

function AdaptivePanelGroup({
  direction,
  className,
  children,
  ...rest
}: React.ComponentProps<typeof PanelGroup>) {
  const wrapRef = React.useRef<HTMLDivElement>(null)
  const [box, setBox] = React.useState({ width: 0, height: 0 })

  React.useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const measure = () => setBox({ width: el.clientWidth, height: el.clientHeight })
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    measure()
    return () => ro.disconnect()
  }, [])

  // react-resizable-panels puts `overflow: hidden` inline on groups and panels, which
  // clips widget drop shadows at every panel edge. Only an inline style can override
  // the library's inline style (CSS would need !important); widgets clip their own content.
  return (
    <div ref={wrapRef} className={styles.panelGroupFull}>
      <GroupBoxContext.Provider value={{ dir: direction, width: box.width, height: box.height }}>
        <PanelGroup direction={direction} className={className} {...rest} style={{ ...rest.style, overflow: 'visible' }}>
          {children}
        </PanelGroup>
      </GroupBoxContext.Provider>
    </div>
  )
}

// In a vertical group a panel's floor is `minHeightPx`; in a horizontal group it
// is `minWidthUnits` eighths-of-the-viewport wide. Either is converted to a
// percentage of the measured group. `minSize` is the fallback before measuring.
function AdaptivePanel({
  minSize,
  minHeightPx = MIN_WIDGET_HEIGHT_PX,
  minWidthUnits = 1,
  ...rest
}: React.ComponentProps<typeof Panel> & { minHeightPx?: number; minWidthUnits?: number }) {
  const group = React.useContext(GroupBoxContext)
  const defaultMin =
    group?.dir === 'horizontal'
      ? minWidthUnits * (100 * MIN_WIDGET_WIDTH_FRACTION)
      : minSize ?? 10
  let effectiveMin = minSize !== undefined ? minSize : defaultMin
  if (group?.dir === 'vertical' && group.height > 0) {
    effectiveMin = Math.min(100, (minHeightPx / group.height) * 100)
  } else if (group?.dir === 'horizontal' && group.width > 0) {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 0
    const minWidthPx = minWidthUnits * vw * MIN_WIDGET_WIDTH_FRACTION
    effectiveMin = Math.min(100, (minWidthPx / group.width) * 100)
  }
  // The measured minimum can exceed the preset/saved default in small windows;
  // react-resizable-panels rejects defaultSize < minSize, so lift the default to it
  const defaultSize =
    rest.defaultSize !== undefined && effectiveMin !== undefined
      ? Math.max(rest.defaultSize, effectiveMin)
      : rest.defaultSize
  return (
    <Panel
      minSize={effectiveMin}
      {...rest}
      defaultSize={defaultSize}
      style={{ ...rest.style, overflow: 'visible' }}
    />
  )
}

interface BetaAdaptiveGridProps {
  notes: React.ReactNode
  tasks: React.ReactNode
  presetLayout: BetaPresetLayout
  visibleWidgets?: WidgetVisibilityState
  customLayout?: CustomLayoutState
  dockPosition: 'top' | 'left' | 'right' | 'bottom'
  searchQuery?: string
  editMode?: boolean
  onMoveWidget?: (draggedId: WidgetId, targetId: WidgetId, zone: DropZone) => void
}

/*
 * Keeps the grid hidden until its layout stops changing. On first load the panel
 * groups measure themselves in passes and the notes list sizes to its panel, so the
 * first painted frames moved by up to ~0.25 CLS in narrow windows. Shifts in hidden
 * content don't count; the dock and background show immediately and the grid fades in.
 * Settled = panel sizes unchanged for 3 frames in a row, capped at 800ms.
 */
function useSettledLayout(ref: React.RefObject<HTMLDivElement | null>) {
  const [settled, setSettled] = React.useState(false)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const started = performance.now()
    let previous = ''
    let stableFrames = 0
    let frame = 0

    const check = () => {
      const signature = Array.from(el.querySelectorAll<HTMLElement>(`.${styles.widgetPanel}, [data-widget], [data-settle]`))
        .map((node) => {
          const r = node.getBoundingClientRect()
          return `${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.width)},${Math.round(r.height)}`
        })
        .join('|')
      stableFrames = signature === previous ? stableFrames + 1 : 0
      previous = signature
      if (stableFrames >= 3 || performance.now() - started > 800) {
        setSettled(true)
        return
      }
      frame = requestAnimationFrame(check)
    }
    frame = requestAnimationFrame(check)
    return () => cancelAnimationFrame(frame)
  }, [ref])

  return settled
}

export function BetaAdaptiveGrid({
  notes,
  tasks,
  presetLayout = 'notetaker',
  visibleWidgets = {
    notes: true,
    tasks: true,
    schedule: true,
    weather: true,
    recorder: true,
    countdown: true,
  },
  customLayout = { tree: null },
  dockPosition,
  searchQuery: _searchQuery,
  editMode = false,
  onMoveWidget,
}: BetaAdaptiveGridProps) {
  const padding = useDockPadding(dockPosition)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const settled = useSettledLayout(containerRef)
  const isStacked = useIsStacked()

  const isVisible = (id: WidgetId) => visibleWidgets[id] ?? true

  const renderWidget = (id: WidgetId) => {
    switch (id) {
      case 'notes':
        return notes
      case 'tasks':
        return tasks
      case 'weather':
        return <WeatherWidgetNew />
      case 'recorder':
        return <RecorderWidget />
      case 'countdown':
        return <CountdownWidget />
      case 'schedule':
        return <ScheduleWidget />
    }
  }

  const noopMove = () => {}
  const renderPanelNode = (node: PanelNode | null): React.ReactNode => {
    if (!node) return null
    if (node.type === 'widget') {
      // EditOverlay is ALWAYS the wrapper so renderWidget's subtree keeps a stable tree
      // position across edit-mode toggles (no remount of editors / recorder state).
      return (
        <EditOverlay widgetId={node.id} active={!!(editMode && onMoveWidget)} className={styles.widgetPanel} onMove={onMoveWidget ?? noopMove}>
          {renderWidget(node.id)}
        </EditOverlay>
      )
    }
    return (
      <AdaptivePanelGroup direction={node.direction === 'row' ? 'horizontal' : 'vertical'} className={styles.panelGroupFull}>
        <AdaptivePanel defaultSize={node.sizes[0]} minHeightPx={nodeMinHeightPx(node.children[0])} minWidthUnits={nodeMinWidthUnits(node.children[0])} className={styles.widgetPanel}>
          {renderPanelNode(node.children[0])}
        </AdaptivePanel>
        <PanelResizeHandle
          hitAreaMargins={RESIZE_HIT_MARGINS}
          className={node.direction === 'row' ? styles.resizeHandleHorizontal : styles.resizeHandleVertical}
        />
        <AdaptivePanel defaultSize={node.sizes[1]} minHeightPx={nodeMinHeightPx(node.children[1])} minWidthUnits={nodeMinWidthUnits(node.children[1])} className={styles.widgetPanel}>
          {renderPanelNode(node.children[1])}
        </AdaptivePanel>
      </AdaptivePanelGroup>
    )
  }

  // Narrow screens: every visible widget in one column, scrolled as a page
  const renderStacked = () => (
    <div className={styles.stack}>
      {STACK_ORDER.filter(isVisible).map((id) => (
        <div key={id} className={`${styles.stackItem} ${styles[`stack_${id}`]}`}>
          {renderWidget(id)}
        </div>
      ))}
    </div>
  )

  const currentTree = (): PanelNode | null => {
    const base = presetLayout === 'custom' ? customLayout.tree : presetToTree(presetLayout)
    return base ? collapseForVisibility(base, isVisible) : null
  }

  // Every layout (presets and custom) renders through the panel tree in BOTH edit and
  // non-edit modes, so toggling edit mode only flips EditOverlay's `active` flag and
  // widgets reconcile in place (no remount).
  const renderActiveLayout = () => {
    if (isStacked) return renderStacked()
    return renderPanelNode(currentTree())
  }

  return (
    <div
      ref={containerRef}
      className={styles.dashboardContainer}
      data-settled={settled}
      data-stacked={isStacked}
      style={{
        paddingTop: `${padding.paddingTop}px`,
        paddingRight: `${padding.paddingRight}px`,
        paddingBottom: `${padding.paddingBottom}px`,
        paddingLeft: `${padding.paddingLeft}px`,
      }}
    >
      {renderActiveLayout()}
    </div>
  )
}
