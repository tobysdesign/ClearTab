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
import {
  WidgetVisibilityState,
  PrimaryWidgetId,
  UtilityWidgetId,
  LayoutOrientation,
} from '@/hooks/use-beta-widgets'
import { useDockPadding } from '@/hooks/use-dock-padding'
import styles from './beta-adaptive-grid.module.css'

interface BetaAdaptiveGridProps {
  notes: React.ReactNode
  tasks: React.ReactNode
  visibleWidgets: WidgetVisibilityState
  primaryOrder: PrimaryWidgetId[]
  utilityOrder: UtilityWidgetId[]
  layoutOrientation: LayoutOrientation
  dockPosition: 'top' | 'left' | 'right' | 'bottom'
  searchQuery?: string
}

export function BetaAdaptiveGrid({
  notes,
  tasks,
  visibleWidgets,
  primaryOrder,
  utilityOrder,
  layoutOrientation,
  dockPosition,
  searchQuery: _searchQuery,
}: BetaAdaptiveGridProps) {
  const padding = useDockPadding(dockPosition)

  const visiblePrimary = primaryOrder.filter((id) => visibleWidgets[id])
  const visibleUtility = utilityOrder.filter((id) => visibleWidgets[id])

  const hasPrimary = visiblePrimary.length > 0
  const hasUtility = visibleUtility.length > 0

  const renderPrimaryComponent = (id: PrimaryWidgetId) => {
    if (id === 'notes') return notes
    if (id === 'tasks') return tasks
    return null
  }

  const renderUtilityComponent = (id: UtilityWidgetId) => {
    switch (id) {
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

  // Primary Section (Notes + Tasks)
  const renderPrimaryGroup = (direction: 'horizontal' | 'vertical' = 'horizontal') => {
    if (visiblePrimary.length === 0) return null

    if (visiblePrimary.length === 1) {
      const id = visiblePrimary[0]
      return (
        <div className={styles.widgetPanel} key={`single-primary-${id}`}>
          {renderPrimaryComponent(id)}
        </div>
      )
    }

    return (
      <PanelGroup
        key={`primary-group-${visiblePrimary.join('-')}`}
        direction={direction}
        className={styles.panelGroupFull}
      >
        {visiblePrimary.map((id, index) => {
          const defaultSize = id === 'notes' ? 60 : 40
          return (
            <React.Fragment key={id}>
              <Panel defaultSize={defaultSize} minSize={20} className={styles.widgetPanel}>
                {renderPrimaryComponent(id)}
              </Panel>
              {index < visiblePrimary.length - 1 && (
                <PanelResizeHandle className={styles.resizeHandleHorizontal} />
              )}
            </React.Fragment>
          )
        })}
      </PanelGroup>
    )
  }

  // Utility Section (Weather, Recorder, Countdown, Schedule)
  const renderUtilityGroup = (direction: 'horizontal' | 'vertical' = 'horizontal') => {
    if (visibleUtility.length === 0) return null

    if (visibleUtility.length === 1) {
      const id = visibleUtility[0]
      return (
        <div className={styles.widgetPanel} key={`single-utility-${id}`}>
          {renderUtilityComponent(id)}
        </div>
      )
    }

    const count = visibleUtility.length
    const equalShare = Math.round(100 / count)

    return (
      <PanelGroup
        key={`utility-group-${visibleUtility.join('-')}`}
        direction={direction}
        className={styles.panelGroupFull}
      >
        {visibleUtility.map((id, index) => {
          const isSchedule = id === 'schedule'
          const share = isSchedule && count > 2 ? equalShare + 10 : equalShare
          const isHorizontal = direction === 'horizontal'
          return (
            <React.Fragment key={id}>
              <Panel defaultSize={share} minSize={10} className={styles.widgetPanel}>
                {renderUtilityComponent(id)}
              </Panel>
              {index < visibleUtility.length - 1 && (
                <PanelResizeHandle
                  className={isHorizontal ? styles.resizeHandleHorizontal : styles.resizeHandleVertical}
                />
              )}
            </React.Fragment>
          )
        })}
      </PanelGroup>
    )
  }

  // Render combined layout based on orientation
  const renderLayout = () => {
    // Only Primary is active
    if (hasPrimary && !hasUtility) {
      return renderPrimaryGroup('horizontal')
    }

    // Only Utility is active
    if (!hasPrimary && hasUtility) {
      return renderUtilityGroup('horizontal')
    }

    // Both Primary and Utility are active:
    // 1. Column layout: Primary left, Utility right
    if (layoutOrientation === 'columns') {
      return (
        <PanelGroup
          key={`columns-${visiblePrimary.join('-')}-${visibleUtility.join('-')}`}
          direction="horizontal"
          className={styles.panelGroupFull}
        >
          <Panel defaultSize={68} minSize={30} className={styles.widgetPanel}>
            {renderPrimaryGroup('vertical')}
          </Panel>
          <PanelResizeHandle className={styles.resizeHandleHorizontal} />
          <Panel defaultSize={32} minSize={20} className={styles.widgetPanel}>
            {renderUtilityGroup('vertical')}
          </Panel>
        </PanelGroup>
      )
    }

    // 2. Inverted Rows: Utility on top, Primary on bottom
    if (layoutOrientation === 'inverted') {
      return (
        <PanelGroup
          key={`inverted-${visibleUtility.join('-')}-${visiblePrimary.join('-')}`}
          direction="vertical"
          className={styles.panelGroupFull}
        >
          <Panel defaultSize={35} minSize={15} className={styles.widgetPanel}>
            {renderUtilityGroup('horizontal')}
          </Panel>
          <PanelResizeHandle className={styles.resizeHandleVertical} />
          <Panel defaultSize={65} minSize={25} className={styles.widgetPanel}>
            {renderPrimaryGroup('horizontal')}
          </Panel>
        </PanelGroup>
      )
    }

    // 3. Default Rows: Primary on top, Utility on bottom
    return (
      <PanelGroup
        key={`rows-${visiblePrimary.join('-')}-${visibleUtility.join('-')}`}
        direction="vertical"
        className={styles.panelGroupFull}
      >
        <Panel defaultSize={65} minSize={25} className={styles.widgetPanel}>
          {renderPrimaryGroup('horizontal')}
        </Panel>
        <PanelResizeHandle className={styles.resizeHandleVertical} />
        <Panel defaultSize={35} minSize={15} className={styles.widgetPanel}>
          {renderUtilityGroup('horizontal')}
        </Panel>
      </PanelGroup>
    )
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
      {renderLayout()}
    </div>
  )
}
