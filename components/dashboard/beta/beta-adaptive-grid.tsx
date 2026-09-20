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
import { BetaPresetLayout } from '@/hooks/use-beta-widgets'
import { useDockPadding } from '@/hooks/use-dock-padding'
import styles from './beta-adaptive-grid.module.css'

interface BetaAdaptiveGridProps {
  notes: React.ReactNode
  tasks: React.ReactNode
  presetLayout: BetaPresetLayout
  dockPosition: 'top' | 'left' | 'right' | 'bottom'
  searchQuery?: string
}

export function BetaAdaptiveGrid({
  notes,
  tasks,
  presetLayout = 'default_4right',
  dockPosition,
  searchQuery: _searchQuery,
}: BetaAdaptiveGridProps) {
  const padding = useDockPadding(dockPosition)

  // =========================================================================
  // 1. default_4right
  // Left: Notes (full-height tall card)
  // Right: Top Tasks, Bottom 2x2 grid (Schedule | Weather / Count | Voice)
  // =========================================================================
  const renderDefault4Right = () => {
    return (
      <PanelGroup
        key="default_4right"
        direction="horizontal"
        className={styles.panelGroupFull}
      >
        {/* Left: Notes */}
        <Panel defaultSize={48} minSize={25} className={styles.widgetPanel}>
          {notes}
        </Panel>

        <PanelResizeHandle className={styles.resizeHandleHorizontal} />

        {/* Right Stack */}
        <Panel defaultSize={52} minSize={25} className={styles.widgetPanel}>
          <PanelGroup direction="vertical" className={styles.panelGroupFull}>
            {/* Top Right: Tasks */}
            <Panel defaultSize={34} minSize={15} className={styles.widgetPanel}>
              {tasks}
            </Panel>

            <PanelResizeHandle className={styles.resizeHandleVertical} />

            {/* Bottom Right: 2x2 Grid */}
            <Panel defaultSize={66} minSize={25} className={styles.widgetPanel}>
              <PanelGroup direction="vertical" className={styles.panelGroupFull}>
                {/* Row 1: Schedule | Weather */}
                <Panel defaultSize={50} minSize={20} className={styles.widgetPanel}>
                  <PanelGroup direction="horizontal" className={styles.panelGroupFull}>
                    <Panel defaultSize={50} minSize={15} className={styles.widgetPanel}>
                      <ScheduleWidget />
                    </Panel>
                    <PanelResizeHandle className={styles.resizeHandleHorizontal} />
                    <Panel defaultSize={50} minSize={15} className={styles.widgetPanel}>
                      <WeatherWidgetNew />
                    </Panel>
                  </PanelGroup>
                </Panel>

                <PanelResizeHandle className={styles.resizeHandleVertical} />

                {/* Row 2: Countdown | Voice Memo */}
                <Panel defaultSize={50} minSize={20} className={styles.widgetPanel}>
                  <PanelGroup direction="horizontal" className={styles.panelGroupFull}>
                    <Panel defaultSize={50} minSize={15} className={styles.widgetPanel}>
                      <CountdownWidget />
                    </Panel>
                    <PanelResizeHandle className={styles.resizeHandleHorizontal} />
                    <Panel defaultSize={50} minSize={15} className={styles.widgetPanel}>
                      <RecorderWidget />
                    </Panel>
                  </PanelGroup>
                </Panel>
              </PanelGroup>
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    )
  }

  // =========================================================================
  // 2. 3left
  // Top: Notes | Tasks
  // Bottom: [Weather | Count | Voice] on left, Schedule wide on right
  // =========================================================================
  const render3Left = () => {
    return (
      <PanelGroup key="3left" direction="vertical" className={styles.panelGroupFull}>
        {/* Top Row: Notes | Tasks */}
        <Panel defaultSize={62} minSize={25} className={styles.widgetPanel}>
          <PanelGroup direction="horizontal" className={styles.panelGroupFull}>
            <Panel defaultSize={50} minSize={20} className={styles.widgetPanel}>
              {notes}
            </Panel>
            <PanelResizeHandle className={styles.resizeHandleHorizontal} />
            <Panel defaultSize={50} minSize={20} className={styles.widgetPanel}>
              {tasks}
            </Panel>
          </PanelGroup>
        </Panel>

        <PanelResizeHandle className={styles.resizeHandleVertical} />

        {/* Bottom Row: 3 utilities left, Schedule right */}
        <Panel defaultSize={38} minSize={18} className={styles.widgetPanel}>
          <PanelGroup direction="horizontal" className={styles.panelGroupFull}>
            {/* Left 3 Cluster */}
            <Panel defaultSize={55} minSize={25} className={styles.widgetPanel}>
              <PanelGroup direction="horizontal" className={styles.panelGroupFull}>
                <Panel defaultSize={33} minSize={10} className={styles.widgetPanel}>
                  <WeatherWidgetNew />
                </Panel>
                <PanelResizeHandle className={styles.resizeHandleHorizontal} />
                <Panel defaultSize={33} minSize={10} className={styles.widgetPanel}>
                  <CountdownWidget />
                </Panel>
                <PanelResizeHandle className={styles.resizeHandleHorizontal} />
                <Panel defaultSize={34} minSize={10} className={styles.widgetPanel}>
                  <RecorderWidget />
                </Panel>
              </PanelGroup>
            </Panel>

            <PanelResizeHandle className={styles.resizeHandleHorizontal} />

            {/* Right: Schedule */}
            <Panel defaultSize={45} minSize={20} className={styles.widgetPanel}>
              <ScheduleWidget />
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    )
  }

  // =========================================================================
  // 3. 3right
  // Top: Tasks | Notes
  // Bottom: Schedule wide on left, [Weather | Count | Voice] on right
  // =========================================================================
  const render3Right = () => {
    return (
      <PanelGroup key="3right" direction="vertical" className={styles.panelGroupFull}>
        {/* Top Row: Tasks | Notes */}
        <Panel defaultSize={62} minSize={25} className={styles.widgetPanel}>
          <PanelGroup direction="horizontal" className={styles.panelGroupFull}>
            <Panel defaultSize={50} minSize={20} className={styles.widgetPanel}>
              {tasks}
            </Panel>
            <PanelResizeHandle className={styles.resizeHandleHorizontal} />
            <Panel defaultSize={50} minSize={20} className={styles.widgetPanel}>
              {notes}
            </Panel>
          </PanelGroup>
        </Panel>

        <PanelResizeHandle className={styles.resizeHandleVertical} />

        {/* Bottom Row: Schedule left, 3 utilities right */}
        <Panel defaultSize={38} minSize={18} className={styles.widgetPanel}>
          <PanelGroup direction="horizontal" className={styles.panelGroupFull}>
            {/* Left: Schedule */}
            <Panel defaultSize={45} minSize={20} className={styles.widgetPanel}>
              <ScheduleWidget />
            </Panel>

            <PanelResizeHandle className={styles.resizeHandleHorizontal} />

            {/* Right 3 Cluster */}
            <Panel defaultSize={55} minSize={25} className={styles.widgetPanel}>
              <PanelGroup direction="horizontal" className={styles.panelGroupFull}>
                <Panel defaultSize={33} minSize={10} className={styles.widgetPanel}>
                  <WeatherWidgetNew />
                </Panel>
                <PanelResizeHandle className={styles.resizeHandleHorizontal} />
                <Panel defaultSize={33} minSize={10} className={styles.widgetPanel}>
                  <CountdownWidget />
                </Panel>
                <PanelResizeHandle className={styles.resizeHandleHorizontal} />
                <Panel defaultSize={34} minSize={10} className={styles.widgetPanel}>
                  <RecorderWidget />
                </Panel>
              </PanelGroup>
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    )
  }

  // =========================================================================
  // 4. 2left2right
  // Top: Notes | Tasks
  // Bottom: [Weather | Voice] on left, [Count | Schedule] on right
  // =========================================================================
  const render2Left2Right = () => {
    return (
      <PanelGroup key="2left2right" direction="vertical" className={styles.panelGroupFull}>
        {/* Top Row: Notes | Tasks */}
        <Panel defaultSize={62} minSize={25} className={styles.widgetPanel}>
          <PanelGroup direction="horizontal" className={styles.panelGroupFull}>
            <Panel defaultSize={50} minSize={20} className={styles.widgetPanel}>
              {notes}
            </Panel>
            <PanelResizeHandle className={styles.resizeHandleHorizontal} />
            <Panel defaultSize={50} minSize={20} className={styles.widgetPanel}>
              {tasks}
            </Panel>
          </PanelGroup>
        </Panel>

        <PanelResizeHandle className={styles.resizeHandleVertical} />

        {/* Bottom Row: 2 left (Weather | Voice), 2 right (Count | Schedule) */}
        <Panel defaultSize={38} minSize={18} className={styles.widgetPanel}>
          <PanelGroup direction="horizontal" className={styles.panelGroupFull}>
            {/* Left 2 */}
            <Panel defaultSize={50} minSize={20} className={styles.widgetPanel}>
              <PanelGroup direction="horizontal" className={styles.panelGroupFull}>
                <Panel defaultSize={50} minSize={10} className={styles.widgetPanel}>
                  <WeatherWidgetNew />
                </Panel>
                <PanelResizeHandle className={styles.resizeHandleHorizontal} />
                <Panel defaultSize={50} minSize={10} className={styles.widgetPanel}>
                  <RecorderWidget />
                </Panel>
              </PanelGroup>
            </Panel>

            <PanelResizeHandle className={styles.resizeHandleHorizontal} />

            {/* Right 2 */}
            <Panel defaultSize={50} minSize={20} className={styles.widgetPanel}>
              <PanelGroup direction="horizontal" className={styles.panelGroupFull}>
                <Panel defaultSize={50} minSize={10} className={styles.widgetPanel}>
                  <CountdownWidget />
                </Panel>
                <PanelResizeHandle className={styles.resizeHandleHorizontal} />
                <Panel defaultSize={50} minSize={10} className={styles.widgetPanel}>
                  <ScheduleWidget />
                </Panel>
              </PanelGroup>
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    )
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
