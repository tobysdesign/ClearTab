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
import { PanelNode, collapseForVisibility } from '@/lib/panel-tree'
import { useDockPadding } from '@/hooks/use-dock-padding'
import styles from './beta-adaptive-grid.module.css'

interface BetaAdaptiveGridProps {
  notes: React.ReactNode
  tasks: React.ReactNode
  presetLayout: BetaPresetLayout
  visibleWidgets?: WidgetVisibilityState
  customLayout?: CustomLayoutState
  dockPosition: 'top' | 'left' | 'right' | 'bottom'
  searchQuery?: string
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
}: BetaAdaptiveGridProps) {
  const padding = useDockPadding(dockPosition)

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

  // Helper to render an array of widgets horizontally
  const renderHorizontalCluster = (
    widgetIds: WidgetId[],
    keyPrefix: string
  ) => {
    const active = widgetIds.filter(isVisible)
    if (active.length === 0) return null

    if (active.length === 1) {
      return (
        <div className={styles.widgetPanel} key={`${keyPrefix}-${active[0]}`}>
          {renderWidget(active[0])}
        </div>
      )
    }

    const equalSize = Math.round(100 / active.length)

    return (
      <PanelGroup
        key={`${keyPrefix}-${active.join('-')}`}
        direction="horizontal"
        className={styles.panelGroupFull}
      >
        {active.map((id, index) => {
          return (
            <React.Fragment key={id}>
              <Panel defaultSize={equalSize} minSize={10} className={styles.widgetPanel}>
                {renderWidget(id)}
              </Panel>
              {index < active.length - 1 && (
                <PanelResizeHandle className={styles.resizeHandleHorizontal} />
              )}
            </React.Fragment>
          )
        })}
      </PanelGroup>
    )
  }

  const render2x2Grid = (
    hR1: boolean,
    hR2: boolean,
    r1: WidgetId[],
    r2: WidgetId[],
    prefix: string
  ) => {
    if (hR1 && hR2) {
      return (
        <PanelGroup direction="vertical" className={styles.panelGroupFull}>
          <Panel defaultSize={50} minSize={20} className={styles.widgetPanel}>
            {renderHorizontalCluster(r1, `${prefix}-r1`)}
          </Panel>
          <PanelResizeHandle className={styles.resizeHandleVertical} />
          <Panel defaultSize={50} minSize={20} className={styles.widgetPanel}>
            {renderHorizontalCluster(r2, `${prefix}-r2`)}
          </Panel>
        </PanelGroup>
      )
    }
    if (hR1) return renderHorizontalCluster(r1, `${prefix}-r1`)
    if (hR2) return renderHorizontalCluster(r2, `${prefix}-r2`)
    return null
  }

  const renderPanelNode = (node: PanelNode | null): React.ReactNode => {
    if (!node) return null
    if (node.type === 'widget') {
      return <div className={styles.widgetPanel}>{renderWidget(node.id)}</div>
    }
    return (
      <PanelGroup direction={node.direction === 'row' ? 'horizontal' : 'vertical'} className={styles.panelGroupFull}>
        <Panel defaultSize={node.sizes[0]} minSize={15} className={styles.widgetPanel}>
          {renderPanelNode(node.children[0])}
        </Panel>
        <PanelResizeHandle
          className={node.direction === 'row' ? styles.resizeHandleHorizontal : styles.resizeHandleVertical}
        />
        <Panel defaultSize={node.sizes[1]} minSize={15} className={styles.widgetPanel}>
          {renderPanelNode(node.children[1])}
        </Panel>
      </PanelGroup>
    )
  }

  // =========================================================================
  // 1. Notetaker (Default)
  // Left: Notes (full-height tall card)
  // Right: Top Tasks, Bottom 2x2 grid (Schedule | Weather / Count | Voice)
  // =========================================================================
  const renderNotetaker = () => {
    const hasNotes = isVisible('notes')
    const hasTasks = isVisible('tasks')

    const row1Widgets: WidgetId[] = (['schedule', 'weather'] as WidgetId[]).filter(isVisible)
    const row2Widgets: WidgetId[] = (['countdown', 'recorder'] as WidgetId[]).filter(isVisible)

    const hasRow1 = row1Widgets.length > 0
    const hasRow2 = row2Widgets.length > 0
    const hasGrid2x2 = hasRow1 || hasRow2
    const hasRight = hasTasks || hasGrid2x2

    const renderRightColumn = () => {
      if (hasTasks && hasGrid2x2) {
        return (
          <PanelGroup direction="vertical" className={styles.panelGroupFull}>
            <Panel defaultSize={34} minSize={15} className={styles.widgetPanel}>
              {renderWidget('tasks')}
            </Panel>
            <PanelResizeHandle className={styles.resizeHandleVertical} />
            <Panel defaultSize={66} minSize={25} className={styles.widgetPanel}>
              {render2x2Grid(hasRow1, hasRow2, row1Widgets, row2Widgets, 'notetaker')}
            </Panel>
          </PanelGroup>
        )
      }
      if (hasTasks && !hasGrid2x2) return <div className={styles.widgetPanel}>{renderWidget('tasks')}</div>
      if (!hasTasks && hasGrid2x2) return render2x2Grid(hasRow1, hasRow2, row1Widgets, row2Widgets, 'notetaker')
      return null
    }

    if (hasNotes && hasRight) {
      return (
        <PanelGroup key="notetaker-layout" direction="horizontal" className={styles.panelGroupFull}>
          <Panel defaultSize={48} minSize={25} className={styles.widgetPanel}>{renderWidget('notes')}</Panel>
          <PanelResizeHandle className={styles.resizeHandleHorizontal} />
          <Panel defaultSize={52} minSize={25} className={styles.widgetPanel}>{renderRightColumn()}</Panel>
        </PanelGroup>
      )
    }
    if (hasNotes) return <div className={styles.widgetPanel}>{renderWidget('notes')}</div>
    if (hasRight) return renderRightColumn()
    return null
  }

  // =========================================================================
  // 2. Taskmaster (Inverse of Notetaker)
  // Left: Tasks (full-height tall card)
  // Right: Top Notes, Bottom 2x2 grid (Schedule | Weather / Count | Voice)
  // =========================================================================
  const renderTaskmaster = () => {
    const hasTasks = isVisible('tasks')
    const hasNotes = isVisible('notes')

    const row1Widgets: WidgetId[] = (['schedule', 'weather'] as WidgetId[]).filter(isVisible)
    const row2Widgets: WidgetId[] = (['countdown', 'recorder'] as WidgetId[]).filter(isVisible)

    const hasRow1 = row1Widgets.length > 0
    const hasRow2 = row2Widgets.length > 0
    const hasGrid2x2 = hasRow1 || hasRow2
    const hasRight = hasNotes || hasGrid2x2

    const renderRightColumn = () => {
      if (hasNotes && hasGrid2x2) {
        return (
          <PanelGroup direction="vertical" className={styles.panelGroupFull}>
            <Panel defaultSize={34} minSize={15} className={styles.widgetPanel}>
              {renderWidget('notes')}
            </Panel>
            <PanelResizeHandle className={styles.resizeHandleVertical} />
            <Panel defaultSize={66} minSize={25} className={styles.widgetPanel}>
              {render2x2Grid(hasRow1, hasRow2, row1Widgets, row2Widgets, 'taskmaster')}
            </Panel>
          </PanelGroup>
        )
      }
      if (hasNotes && !hasGrid2x2) return <div className={styles.widgetPanel}>{renderWidget('notes')}</div>
      if (!hasNotes && hasGrid2x2) return render2x2Grid(hasRow1, hasRow2, row1Widgets, row2Widgets, 'taskmaster')
      return null
    }

    if (hasTasks && hasRight) {
      return (
        <PanelGroup key="taskmaster-layout" direction="horizontal" className={styles.panelGroupFull}>
          <Panel defaultSize={48} minSize={25} className={styles.widgetPanel}>{renderWidget('tasks')}</Panel>
          <PanelResizeHandle className={styles.resizeHandleHorizontal} />
          <Panel defaultSize={52} minSize={25} className={styles.widgetPanel}>{renderRightColumn()}</Panel>
        </PanelGroup>
      )
    }
    if (hasTasks) return <div className={styles.widgetPanel}>{renderWidget('tasks')}</div>
    if (hasRight) return renderRightColumn()
    return null
  }

  // Parameterized Two-Row Layout Helper (for Even & Minimal)
  const renderTwoRowSplit = (
    topDefaultSize: number,
    topMinSize: number,
    bottomDefaultSize: number,
    bottomMinSize: number,
    keyPrefix: string
  ) => {
    const topWidgets: WidgetId[] = (['notes', 'tasks'] as WidgetId[]).filter(isVisible)
    const bottomWidgets: WidgetId[] = (['schedule', 'weather', 'countdown', 'recorder'] as WidgetId[]).filter(isVisible)

    const hasTop = topWidgets.length > 0
    const hasBottom = bottomWidgets.length > 0

    if (hasTop && hasBottom) {
      return (
        <PanelGroup key={`${keyPrefix}-layout`} direction="vertical" className={styles.panelGroupFull}>
          <Panel defaultSize={topDefaultSize} minSize={topMinSize} className={styles.widgetPanel}>
            {renderHorizontalCluster(topWidgets, `${keyPrefix}-top`)}
          </Panel>
          <PanelResizeHandle className={styles.resizeHandleVertical} />
          <Panel defaultSize={bottomDefaultSize} minSize={bottomMinSize} className={styles.widgetPanel}>
            {renderHorizontalCluster(bottomWidgets, `${keyPrefix}-bottom`)}
          </Panel>
        </PanelGroup>
      )
    }
    if (hasTop) return renderHorizontalCluster(topWidgets, `${keyPrefix}-top`)
    if (hasBottom) return renderHorizontalCluster(bottomWidgets, `${keyPrefix}-bottom`)
    return null
  }

  const renderActiveLayout = () => {
    switch (presetLayout) {
      case 'notetaker': return renderNotetaker()
      case 'even': return renderTwoRowSplit(60, 20, 40, 20, 'even')
      case 'taskmaster': return renderTaskmaster()
      case 'minimal': return renderTwoRowSplit(75, 20, 25, 15, 'minimal')
      case 'custom': {
        const visibleTree = customLayout.tree ? collapseForVisibility(customLayout.tree, isVisible) : null
        return visibleTree ? renderPanelNode(visibleTree) : renderNotetaker()
      }
      default: return renderNotetaker()
    }
  }

  return (
    <div
      className={styles.dashboardContainer}
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
