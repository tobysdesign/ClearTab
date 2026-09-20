'use client'

import React, { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ScheduleWidget } from '@/components/widgets/schedule-widget'
import { WeatherWidgetNew } from '@/components/widgets/weather-widget-new'
import { RecorderWidget } from '@/components/widgets/recorder-widget'
import { CountdownWidget } from '@/components/widgets/countdown-widget-main'
import { WidgetVisibilityState } from '@/hooks/use-beta-widgets'
import { useDockPadding } from '@/hooks/use-dock-padding'
import styles from './beta-adaptive-grid.module.css'

interface BetaAdaptiveGridProps {
  notes: React.ReactNode
  tasks: React.ReactNode
  visibleWidgets: WidgetVisibilityState
  dockPosition: 'top' | 'left' | 'right' | 'bottom'
  searchQuery?: string
}

const springTransition: any = {
  layout: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 32,
  },
  opacity: { duration: 0.2 },
  scale: { duration: 0.2 },
}

export function BetaAdaptiveGrid({
  notes,
  tasks,
  visibleWidgets,
  dockPosition,
  searchQuery: _searchQuery,
}: BetaAdaptiveGridProps) {
  const padding = useDockPadding(dockPosition)

  const hasNotes = visibleWidgets.notes
  const hasTasks = visibleWidgets.tasks
  const hasPrimary = hasNotes || hasTasks

  const activeUtilities = useMemo(() => {
    const list: ('weather' | 'recorder' | 'countdown' | 'schedule')[] = []
    if (visibleWidgets.weather) list.push('weather')
    if (visibleWidgets.recorder) list.push('recorder')
    if (visibleWidgets.countdown) list.push('countdown')
    if (visibleWidgets.schedule) list.push('schedule')
    return list
  }, [visibleWidgets])

  const utilityCount = activeUtilities.length
  const hasUtility = utilityCount > 0

  // Select appropriate CSS grid columns for utility strip
  const utilityColsClass = useMemo(() => {
    switch (utilityCount) {
      case 4:
        return styles.utilityCols4
      case 3:
        return styles.utilityCols3
      case 2:
        return styles.utilityCols2
      case 1:
        return styles.utilityCols1
      default:
        return ''
    }
  }, [utilityCount])

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
      <div className={styles.adaptiveGrid}>
        {/* PRIMARY WORKSPACE (Notes + Tasks) */}
        <AnimatePresence mode="popLayout">
          {hasPrimary && (
            <motion.section
              key="primary-section"
              layout
              transition={springTransition}
              className={`${styles.primarySection} ${
                hasUtility ? styles.primarySectionWithUtility : styles.primarySectionFullHeight
              }`}
            >
              {hasNotes && (
                <motion.div
                  key="notes-widget-card"
                  layoutId="widget-notes"
                  layout
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={springTransition}
                  className={`${styles.primaryWidgetNotes} ${
                    hasTasks ? styles.primaryWidgetNotesShared : styles.primaryWidgetNotesSolo
                  }`}
                >
                  {notes}
                </motion.div>
              )}

              {hasTasks && (
                <motion.div
                  key="tasks-widget-card"
                  layoutId="widget-tasks"
                  layout
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={springTransition}
                  className={`${styles.primaryWidgetTasks} ${
                    hasNotes ? styles.primaryWidgetTasksShared : styles.primaryWidgetTasksSolo
                  }`}
                >
                  {tasks}
                </motion.div>
              )}
            </motion.section>
          )}
        </AnimatePresence>

        {/* UTILITY SHELF (Weather, Voice Memo, Countdown, Schedule) */}
        <AnimatePresence mode="popLayout">
          {hasUtility && (
            <motion.section
              key="utility-section"
              layout
              transition={springTransition}
              className={`${styles.utilitySection} ${utilityColsClass} ${
                hasPrimary ? styles.utilitySectionNormal : styles.utilitySectionExpanded
              }`}
            >
              <AnimatePresence mode="popLayout">
                {visibleWidgets.weather && (
                  <motion.div
                    key="widget-weather"
                    layoutId="widget-weather"
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={springTransition}
                    className={styles.utilityWidgetCard}
                  >
                    <WeatherWidgetNew />
                  </motion.div>
                )}

                {visibleWidgets.recorder && (
                  <motion.div
                    key="widget-recorder"
                    layoutId="widget-recorder"
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={springTransition}
                    className={styles.utilityWidgetCard}
                  >
                    <RecorderWidget />
                  </motion.div>
                )}

                {visibleWidgets.countdown && (
                  <motion.div
                    key="widget-countdown"
                    layoutId="widget-countdown"
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={springTransition}
                    className={styles.utilityWidgetCard}
                  >
                    <CountdownWidget />
                  </motion.div>
                )}

                {visibleWidgets.schedule && (
                  <motion.div
                    key="widget-schedule"
                    layoutId="widget-schedule"
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={springTransition}
                    className={styles.utilityWidgetCard}
                  >
                    <ScheduleWidget />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
