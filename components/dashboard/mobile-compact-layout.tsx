'use client'

import { useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronUpIcon } from '@/components/icons'
import { WeatherWidgetNew } from '@/components/widgets/weather-widget-new'
import { RecorderWidget } from '@/components/widgets/recorder-widget'
import { CountdownWidget } from '@/components/widgets/countdown-widget-main'
import { ScheduleWidget } from '@/components/widgets/schedule-widget'
import styles from './mobile-compact-layout.module.css'

interface MobileCompactLayoutProps {
  notes: ReactNode
  tasks: ReactNode
}

function CollapsibleSection({
  title,
  children,
  defaultExpanded = false,
}: {
  title: string
  children: ReactNode
  defaultExpanded?: boolean
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <div className={styles.collapsibleSection}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={styles.collapsibleHeader}
      >
        <span className={styles.collapsibleTitle}>{title}</span>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronUpIcon size={16} className="text-white/60" />
        </motion.div>
      </button>
      
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={styles.collapsibleContent}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function MobileCompactLayout({ notes, tasks }: MobileCompactLayoutProps) {
  return (
    <div className={styles.container}>
      {/* Collapsible Lists */}
      <div className={styles.listsSection}>
        <CollapsibleSection title="Notes" defaultExpanded={true}>
          <div className={styles.listWrapper}>{notes}</div>
        </CollapsibleSection>

        <CollapsibleSection title="Tasks">
          <div className={styles.listWrapper}>{tasks}</div>
        </CollapsibleSection>

        <CollapsibleSection title="Schedule">
          <div className={styles.listWrapper}>
            <ScheduleWidget />
          </div>
        </CollapsibleSection>
      </div>

      {/* Mini Widgets Row */}
      <div className={styles.miniWidgetsRow}>
        <div className={styles.miniWidget}>
          <WeatherWidgetNew />
        </div>
        <div className={styles.miniWidget}>
          <CountdownWidget />
        </div>
        <div className={styles.miniWidget}>
          <RecorderWidget />
        </div>
      </div>
    </div>
  )
}
