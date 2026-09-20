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
import { BetaPresetLayout, WidgetVisibilityState, WidgetId } from '@/hooks/use-beta-widgets'
import { useDockPadding } from '@/hooks/use-dock-padding'
import styles from './beta-adaptive-grid.module.css'

interface BetaAdaptiveGridProps {
  notes: React.ReactNode
  tasks: React.ReactNode
  presetLayout: BetaPresetLayout
  visibleWidgets?: WidgetVisibilityState
  dockPosition: 'top' | 'left' | 'right' | 'bottom'
  searchQuery?: string
}

export function BetaAdaptiveGrid({
  notes,
  tasks,
  presetLayout = 'default_4right',
  visibleWidgets = {
    notes: true,
    tasks: true,
    schedule: true,
    weather: true,
    recorder: true,
    countdown: true,
  },
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

  // =========================================================================
  // 1. default_4right
  // Left: Notes (full-height tall card)
  // Right: Top Tasks, Bottom 2x2 grid (Schedule | Weather / Count | Voice)
  // =========================================================================
  const renderDefault4Right = () => {
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
            {/* Top Right: Tasks */}
            <Panel defaultSize={34} minSize={15} className={styles.widgetPanel}>
              {renderWidget('tasks')}
            </Panel>

            <PanelResizeHandle className={styles.resizeHandleVertical} />

            {/* Bottom Right: 2x2 Grid */}
            <Panel defaultSize={66} minSize={25} className={styles.widgetPanel}>
              {render2x2Grid(hasRow1, hasRow2, row1Widgets, row2Widgets)}
            </Panel>
          </PanelGroup>
        )
      }

      if (hasTasks && !hasGrid2x2) {
        return <div className={styles.widgetPanel}>{renderWidget('tasks')}</div>
      }

      if (!hasTasks && hasGrid2x2) {
        return render2x2Grid(hasRow1, hasRow2, row1Widgets, row2Widgets)
      }

      return null
    }

    const render2x2Grid = (
      hR1: boolean,
      hR2: boolean,
      r1: WidgetId[],
      r2: WidgetId[]
    ) => {
      if (hR1 && hR2) {
        return (
          <PanelGroup direction="vertical" className={styles.panelGroupFull}>
            <Panel defaultSize={50} minSize={20} className={styles.widgetPanel}>
              {renderHorizontalCluster(r1, 'd4r-r1')}
            </Panel>
            <PanelResizeHandle className={styles.resizeHandleVertical} />
            <Panel defaultSize={50} minSize={20} className={styles.widgetPanel}>
              {renderHorizontalCluster(r2, 'd4r-r2')}
            </Panel>
          </PanelGroup>
        )
      }
      if (hR1) return renderHorizontalCluster(r1, 'd4r-r1')
      if (hR2) return renderHorizontalCluster(r2, 'd4r-r2')
      return null
    }

    if (hasNotes && hasRight) {
      return (
        <PanelGroup
          key={`default_4right-${row1Widgets.join('-')}-${row2Widgets.join('-')}`}
          direction="horizontal"
          className={styles.panelGroupFull}
        >
          <Panel defaultSize={48} minSize={25} className={styles.widgetPanel}>
            {renderWidget('notes')}
          </Panel>
          <PanelResizeHandle className={styles.resizeHandleHorizontal} />
          <Panel defaultSize={52} minSize={25} className={styles.widgetPanel}>
            {renderRightColumn()}
          </Panel>
        </PanelGroup>
      )
    }

    if (hasNotes && !hasRight) {
      return <div className={styles.widgetPanel}>{renderWidget('notes')}</div>
    }

    if (!hasNotes && hasRight) {
      return renderRightColumn()
    }

    return null
  }

  // =========================================================================
  // 2. 3left
  // Top: Notes | Tasks
  // Bottom: [Weather | Count | Voice] on left, Schedule wide on right
  // =========================================================================
  const render3Left = () => {
    const topWidgets: WidgetId[] = (['notes', 'tasks'] as WidgetId[]).filter(isVisible)
    const leftCluster: WidgetId[] = (['weather', 'countdown', 'recorder'] as WidgetId[]).filter(isVisible)
    const hasSchedule = isVisible('schedule')

    const hasTop = topWidgets.length > 0
    const hasLeftCluster = leftCluster.length > 0
    const hasBottom = hasLeftCluster || hasSchedule

    const renderBottomRow = () => {
      if (hasLeftCluster && hasSchedule) {
        return (
          <PanelGroup direction="horizontal" className={styles.panelGroupFull}>
            <Panel defaultSize={55} minSize={20} className={styles.widgetPanel}>
              {renderHorizontalCluster(leftCluster, '3l-left')}
            </Panel>
            <PanelResizeHandle className={styles.resizeHandleHorizontal} />
            <Panel defaultSize={45} minSize={20} className={styles.widgetPanel}>
              {renderWidget('schedule')}
            </Panel>
          </PanelGroup>
        )
      }
      if (hasLeftCluster) return renderHorizontalCluster(leftCluster, '3l-left')
      if (hasSchedule) return <div className={styles.widgetPanel}>{renderWidget('schedule')}</div>
      return null
    }

    if (hasTop && hasBottom) {
      return (
        <PanelGroup key="3left" direction="vertical" className={styles.panelGroupFull}>
          <Panel defaultSize={62} minSize={25} className={styles.widgetPanel}>
            {renderHorizontalCluster(topWidgets, '3l-top')}
          </Panel>
          <PanelResizeHandle className={styles.resizeHandleVertical} />
          <Panel defaultSize={38} minSize={18} className={styles.widgetPanel}>
            {renderBottomRow()}
          </Panel>
        </PanelGroup>
      )
    }

    if (hasTop && !hasBottom) return renderHorizontalCluster(topWidgets, '3l-top')
    if (!hasTop && hasBottom) return renderBottomRow()
    return null
  }

  // =========================================================================
  // 3. 3right
  // Top: Tasks | Notes
  // Bottom: Schedule wide on left, [Weather | Count | Voice] on right
  // =========================================================================
  const render3Right = () => {
    const topWidgets: WidgetId[] = (['tasks', 'notes'] as WidgetId[]).filter(isVisible)
    const rightCluster: WidgetId[] = (['weather', 'countdown', 'recorder'] as WidgetId[]).filter(isVisible)
    const hasSchedule = isVisible('schedule')

    const hasTop = topWidgets.length > 0
    const hasRightCluster = rightCluster.length > 0
    const hasBottom = hasSchedule || hasRightCluster

    const renderBottomRow = () => {
      if (hasSchedule && hasRightCluster) {
        return (
          <PanelGroup direction="horizontal" className={styles.panelGroupFull}>
            <Panel defaultSize={45} minSize={20} className={styles.widgetPanel}>
              {renderWidget('schedule')}
            </Panel>
            <PanelResizeHandle className={styles.resizeHandleHorizontal} />
            <Panel defaultSize={55} minSize={20} className={styles.widgetPanel}>
              {renderHorizontalCluster(rightCluster, '3r-right')}
            </Panel>
          </PanelGroup>
        )
      }
      if (hasSchedule) return <div className={styles.widgetPanel}>{renderWidget('schedule')}</div>
      if (hasRightCluster) return renderHorizontalCluster(rightCluster, '3r-right')
      return null
    }

    if (hasTop && hasBottom) {
      return (
        <PanelGroup key="3right" direction="vertical" className={styles.panelGroupFull}>
          <Panel defaultSize={62} minSize={25} className={styles.widgetPanel}>
            {renderHorizontalCluster(topWidgets, '3r-top')}
          </Panel>
          <PanelResizeHandle className={styles.resizeHandleVertical} />
          <Panel defaultSize={38} minSize={18} className={styles.widgetPanel}>
            {renderBottomRow()}
          </Panel>
        </PanelGroup>
      )
    }

    if (hasTop && !hasBottom) return renderHorizontalCluster(topWidgets, '3r-top')
    if (!hasTop && hasBottom) return renderBottomRow()
    return null
  }

  // =========================================================================
  // 4. 2left2right
  // Top: Notes | Tasks
  // Bottom: [Weather | Voice] on left, [Count | Schedule] on right
  // =========================================================================
  const render2Left2Right = () => {
    const topWidgets: WidgetId[] = (['notes', 'tasks'] as WidgetId[]).filter(isVisible)
    const left2: WidgetId[] = (['weather', 'recorder'] as WidgetId[]).filter(isVisible)
    const right2: WidgetId[] = (['countdown', 'schedule'] as WidgetId[]).filter(isVisible)

    const hasTop = topWidgets.length > 0
    const hasLeft2 = left2.length > 0
    const hasRight2 = right2.length > 0
    const hasBottom = hasLeft2 || hasRight2

    const renderBottomRow = () => {
      if (hasLeft2 && hasRight2) {
        return (
          <PanelGroup direction="horizontal" className={styles.panelGroupFull}>
            <Panel defaultSize={50} minSize={20} className={styles.widgetPanel}>
              {renderHorizontalCluster(left2, '2l2r-left')}
            </Panel>
            <PanelResizeHandle className={styles.resizeHandleHorizontal} />
            <Panel defaultSize={50} minSize={20} className={styles.widgetPanel}>
              {renderHorizontalCluster(right2, '2l2r-right')}
            </Panel>
          </PanelGroup>
        )
      }
      if (hasLeft2) return renderHorizontalCluster(left2, '2l2r-left')
      if (hasRight2) return renderHorizontalCluster(right2, '2l2r-right')
      return null
    }

    if (hasTop && hasBottom) {
      return (
        <PanelGroup key="2left2right" direction="vertical" className={styles.panelGroupFull}>
          <Panel defaultSize={62} minSize={25} className={styles.widgetPanel}>
            {renderHorizontalCluster(topWidgets, '2l2r-top')}
          </Panel>
          <PanelResizeHandle className={styles.resizeHandleVertical} />
          <Panel defaultSize={38} minSize={18} className={styles.widgetPanel}>
            {renderBottomRow()}
          </Panel>
        </PanelGroup>
      )
    }

    if (hasTop && !hasBottom) return renderHorizontalCluster(topWidgets, '2l2r-top')
    if (!hasTop && hasBottom) return renderBottomRow()
    return null
  }

  const renderActiveLayout = () => {
    switch (presetLayout) {
      case 'default_4right':
        return renderDefault4Right()
      case '3left':
        return render3Left()
      case '3right':
        return render3Right()
      case '2left2right':
        return render2Left2Right()
      default:
        return renderDefault4Right()
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
