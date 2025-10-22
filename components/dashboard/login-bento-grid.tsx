'use client'

import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from 'react-resizable-panels'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
// Import the actual login widgets
import { LoginNotesWidget } from '@/components/widgets/login-notes-widget'
import { LoginTasksWidget } from '@/components/widgets/login-tasks-widget'
import { LoginScheduleWidget } from '@/components/widgets/login-schedule-widget'
import { LoginWeatherWidget } from '@/components/widgets/login-weather-widget'
import { LoginRecorderWidget } from '@/components/widgets/login-recorder-widget'
import { LoginCountdownWidget } from '@/components/widgets/login-countdown-widget'

import { useDockPadding } from '@/hooks/use-dock-padding'
import styles from './login-bento-grid.module.css'

interface LoginBentoGridProps {
    login: ReactNode
    searchQuery: string
    dockPosition: 'top' | 'left' | 'right' | 'bottom'
}

export function LoginBentoGrid({
  login,
  dockPosition,
  searchQuery: _searchQuery,
}: LoginBentoGridProps) {
  const padding = useDockPadding(dockPosition)

  const motionProps = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay },
    className: styles.panelMotion,
  })

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
      <PanelGroup key="login-layout" direction="horizontal" className="panel-group">
        {/* Left Column - Notes (row 1), Weather+Recorder+Countdown (row 2) */}
        <Panel defaultSize={41} minSize={30}>
          <PanelGroup direction="vertical" className="panel-group">
            {/* Row 1: Notes */}
            <Panel defaultSize={50} minSize={30}>
              <motion.div {...motionProps(0.1)} className="panel-motion">
                <LoginNotesWidget />
              </motion.div>
            </Panel>
            <PanelResizeHandle className={styles.resizeHandleVertical} />
            {/* Row 2: Weather, Recorder, Countdown side by side */}
            <Panel defaultSize={50} minSize={30}>
              <PanelGroup direction="horizontal" className="panel-group">
                <Panel defaultSize={33} minSize={25}>
                  <motion.div {...motionProps(0.3)} className="panel-motion">
                    <LoginWeatherWidget />
                  </motion.div>
                </Panel>
                <PanelResizeHandle className={styles.resizeHandleHorizontal} />
                <Panel defaultSize={33} minSize={25}>
                  <motion.div {...motionProps(0.5)} className="panel-motion">
                    <LoginRecorderWidget />
                  </motion.div>
                </Panel>
                <PanelResizeHandle className={styles.resizeHandleHorizontal} />
                <Panel defaultSize={34} minSize={25}>
                  <motion.div {...motionProps(0.6)} className="panel-motion">
                    <LoginCountdownWidget />
                  </motion.div>
                </Panel>
              </PanelGroup>
            </Panel>
          </PanelGroup>
        </Panel>

        <PanelResizeHandle className={styles.resizeHandleHorizontal} />

        {/* Center Column - Login Widget spans both rows - Fixed ~250px width */}
        <Panel defaultSize={18} minSize={18} maxSize={18}>
          <motion.div {...motionProps(0.4)} className="panel-motion">
            {login}
          </motion.div>
        </Panel>

        <PanelResizeHandle className={styles.resizeHandleHorizontal} />

        {/* Right Column - Tasks (row 1), Schedule (row 2) */}
        <Panel defaultSize={41} minSize={30}>
          <PanelGroup direction="vertical" className="panel-group">
            {/* Row 1: Tasks */}
            <Panel defaultSize={50} minSize={30}>
              <motion.div {...motionProps(0.2)} className="panel-motion">
                <LoginTasksWidget />
              </motion.div>
            </Panel>
            <PanelResizeHandle className={styles.resizeHandleVertical} />
            {/* Row 2: Schedule */}
            <Panel defaultSize={50} minSize={30}>
              <motion.div {...motionProps(0.7)} className="panel-motion">
                <LoginScheduleWidget />
              </motion.div>
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </motion.div>
  )
}