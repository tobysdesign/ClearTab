'use client'

import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from 'react-resizable-panels'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { WeatherWidgetNew } from '@/components/widgets/weather-widget-new'
import { RecorderWidget } from '@/components/widgets/recorder-widget'
import { ScheduleWidget } from '@/components/widgets/schedule-widget'
import { CountdownWidget } from '@/components/widgets/countdown-widget-main'
import { useDockPadding } from '@/hooks/use-dock-padding'
import { useLayout } from '@/hooks/use-layout'
import styles from './resizable-bento-grid.module.css'

interface ResizableBentoGridProps {
    notes: ReactNode
    tasks: ReactNode
    searchQuery: string
    dockPosition: 'top' | 'left' | 'right' | 'bottom'
}

export function ResizableBentoGrid({
  notes,
  tasks,
  dockPosition,
  searchQuery: _searchQuery,
}: ResizableBentoGridProps) {
  const padding = useDockPadding(dockPosition)
  const { layout } = useLayout()

  const motionProps = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay },
    className: styles.panelMotion,
  })

  const renderTwoRowLayout = () => (
    <PanelGroup direction="vertical" className="panel-group">
      {/* Top Row */}
      <Panel defaultSize={50} minSize={30}>
        <PanelGroup direction="horizontal" className="panel-group">
          <Panel defaultSize={50} minSize={8}>
            <motion.div {...motionProps(0.25)} className="panel-motion">
              {notes}
            </motion.div>
          </Panel>
          <PanelResizeHandle className={styles.resizeHandleHorizontal} />
          <Panel defaultSize={50} minSize={8}>
            <motion.div {...motionProps(0.5)} className="panel-motion">
              {tasks}
            </motion.div>
          </Panel>
        </PanelGroup>
      </Panel>

      <PanelResizeHandle className={styles.resizeHandleVertical} />

      {/* Bottom Row */}
      <Panel defaultSize={50} minSize={30}>
        <PanelGroup direction="horizontal" className="panel-group">
          <Panel defaultSize={25}>
            <motion.div {...motionProps(0.75)} className="panel-motion">
              <WeatherWidgetNew />
            </motion.div>
          </Panel>
          <PanelResizeHandle className={styles.resizeHandleHorizontal} />
          <Panel defaultSize={25}>
            <motion.div {...motionProps(0.85)} className="panel-motion">
              <RecorderWidget />
            </motion.div>
          </Panel>
          <PanelResizeHandle className={styles.resizeHandleHorizontal} />
          <Panel defaultSize={25}>
            <motion.div {...motionProps(1)} className="panel-motion">
              <CountdownWidget />
            </motion.div>
          </Panel>
          <PanelResizeHandle className={styles.resizeHandleHorizontal} />
          <Panel defaultSize={25}>
            <motion.div {...motionProps(1.25)} className="panel-motion">
              <ScheduleWidget />
            </motion.div>
          </Panel>
        </PanelGroup>
      </Panel>
    </PanelGroup>
  )

  const renderSingleRowLayout = () => (
    <PanelGroup direction="horizontal" className={styles.singleRowPanelGroup}>
      <Panel defaultSize={67} minSize={30}>
        <PanelGroup direction="vertical" className="panel-group">
          <Panel defaultSize={60} minSize={25}>
            <motion.div {...motionProps(0.25)} className="panel-motion">
              {notes}
            </motion.div>
          </Panel>
          <PanelResizeHandle className={styles.resizeHandleVertical} />
          <Panel defaultSize={40} minSize={25}>
            <PanelGroup direction="horizontal" className="panel-group">
              <Panel defaultSize={33}>
                <motion.div {...motionProps(0.75)} className="panel-motion">
                  <WeatherWidgetNew />
                </motion.div>
              </Panel>
              <PanelResizeHandle className={styles.resizeHandleHorizontal} />
              <Panel defaultSize={33}>
                <motion.div {...motionProps(0.85)} className="panel-motion">
                  <CountdownWidget />
                </motion.div>
              </Panel>
              <PanelResizeHandle className={styles.resizeHandleHorizontal} />
              <Panel defaultSize={33}>
                <motion.div {...motionProps(1)} className="panel-motion">
                  <RecorderWidget />
                </motion.div>
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </Panel>
      <PanelResizeHandle className={styles.resizeHandleInline} />
      <Panel defaultSize={33} minSize={8}>
        <PanelGroup direction="vertical" className="panel-group">
          <Panel defaultSize={50} minSize={8}>
            <motion.div {...motionProps(0.5)} className="panel-motion">
              {tasks}
            </motion.div>
          </Panel>
          <PanelResizeHandle className={styles.resizeHandleVertical} />
          <Panel defaultSize={50} minSize={25}>
            <motion.div {...motionProps(1.25)} className="panel-motion">
              <ScheduleWidget />
            </motion.div>
          </Panel>
        </PanelGroup>
      </Panel>
    </PanelGroup>
  )

  return (
    <motion.div
      animate={{
        paddingTop: padding.paddingTop,
        paddingRight: padding.paddingRight,
        paddingBottom: padding.paddingBottom,
        paddingLeft: padding.paddingLeft,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
        duration: 0.6,
      }}
      className="bento-container"
    >
      {layout === 'two-row' ? renderTwoRowLayout() : renderSingleRowLayout()}
    </motion.div>
  )
}
