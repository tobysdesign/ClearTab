'use client'

import { cn } from '@/lib/utils'
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion'
import {
  addDays,
  differenceInDays,
  isBefore,
  startOfDay,
  addMonths,
} from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { getPaydaySettings } from '@/lib/actions/settings'
import { WidgetActions } from '@/components/dashboard/widget-actions'
import { FinanceSettingsPopover } from '@/components/settings/finance-settings-popover'
import { WidgetLoader } from './widget-loader'
import { useEffect, useState } from 'react'
import styles from './widget.module.css'
import { ClientOnly } from '@/components/ui/safe-motion'

interface FinanceWidgetProps {
  variant?: 'vertical' | 'horizontal'
}

const RECURRENCE_DAYS = {
  'weekly': 7,
  'fortnightly': 14,
  'monthly': 30
} as const

type PaydayFrequency = keyof typeof RECURRENCE_DAYS
type RecurrenceDays = (typeof RECURRENCE_DAYS)[PaydayFrequency]

export function FinanceWidget({ variant = 'vertical' }: FinanceWidgetProps) {
  const [settings, setSettings] = useState<{
    nextPayday: Date,
    daysLeft: number,
    recurrenceInDays: RecurrenceDays
  }>({
    nextPayday: new Date(),
    daysLeft: RECURRENCE_DAYS['fortnightly'],
    recurrenceInDays: RECURRENCE_DAYS['fortnightly']
  })
  const [isLoading, setIsLoading] = useState(false)

  const { daysLeft, recurrenceInDays } = settings
  
  // Make rows and columns responsive based on the recurrence period
  const getGridDimensions = () => {
    if (recurrenceInDays <= 7) {
      return { rows: 2, cols: 4 }; // For weekly
    } else if (recurrenceInDays <= 14) {
      return { rows: 3, cols: 5 }; // For fortnightly
    } else {
      return { rows: 5, cols: 6 }; // For monthly
    }
  };
  
  const { rows, cols } = getGridDimensions();

  const safeRecurrence = recurrenceInDays > 1 ? recurrenceInDays : 2
  // Linear interpolation: maps daysLeft range [1, N] to translateX range [36, -50]
  const translateX = 36 - 86 * (((daysLeft ?? 1) - 1) / (safeRecurrence - 1))

  const dotVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: { scale: 1, opacity: 1 },
  }

  // Create array of dots in correct order (left to right, top to bottom in each column)
  const dots = Array.from({ length: recurrenceInDays }, (_, i) => {
    const col = Math.floor(i / rows)
    const row = i % rows
    return { index: i, position: row * cols + col }
  }).sort((a, b) => a.position - b.position)

  // Add counter animation
  const count = useMotionValue(daysLeft ?? 0)
  const rounded = useTransform(count, (latest) => Math.round(latest))
  const [displayNumber, setDisplayNumber] = useState(daysLeft ?? 0)

  // Format the days left for display with animation
  const formattedDaysLeft = displayNumber.toString().padStart(2, '0')
  const [firstDigit, secondDigit] = formattedDaysLeft.split('')

  if (isLoading) {
    return <WidgetLoader className="finance" minHeight="h-[280px]" />
  }

  // Calculate dot size and spacing based on grid dimensions
  const dotSize = Math.min(10, Math.max(6, 100 / (cols * 2))); // Responsive dot size
  const dotSpacingX = Math.min(20, Math.max(10, 100 / cols));
  const dotSpacingY = Math.min(24, Math.max(16, 60 / rows));

  return (
    <div className={styles.widgetContainer}>
      <div className={cn(styles.widgetContent, "relative flex flex-col h-full overflow-hidden p-6")}>
        <WidgetActions>
          <FinanceSettingsPopover />
        </WidgetActions>
        <div className="flex flex-col gap-1">
          <h2 className="font-inter-display text-[14px] font-normal text-white">Countdown</h2>
          <span className="font-inter-display text-[14px] font-normal text-[#8D8D8D]">Payday</span>
        </div>

        <div className="flex-grow flex items-end justify-between">
            {/* Numbers block */}
            <div className="flex flex-col items-start">
              <div className="flex items-baseline">
                <ClientOnly>
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={displayNumber}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="font-inter-display text-[64px] font-light leading-none text-white"
                    >
                      {firstDigit}
                    </motion.span>
                  </AnimatePresence>
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={displayNumber}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4, ease: "easeOut", delay: 0.05 }}
                      className="font-inter-display text-[64px] font-light leading-none text-white"
                    >
                      {secondDigit}
                    </motion.span>
                  </AnimatePresence>
                </ClientOnly>
                <span className="font-inter-display text-[24px] font-light leading-none text-white ml-2">days</span>
              </div>
              <span className="font-inter-display text-[14px] font-normal text-[#8D8D8D]">until payday</span>
            </div>

            {/* Dots visualization */}
            <ClientOnly>
              <div className="relative w-[120px] h-[80px] mr-2">
                <div className="absolute w-full h-full">
                  {dots.map((dot, index) => (
                    <motion.div
                      key={index}
                      className="absolute rounded-full"
                      style={{
                        width: `${dotSize}px`,
                        height: `${dotSize}px`,
                        left: `${(dot.position % cols) * dotSpacingX}px`,
                        top: `${Math.floor(dot.position / cols) * dotSpacingY}px`,
                        backgroundColor: index < daysLeft ? 'rgba(255, 255, 255, 0.2)' : '#FF69B4', // Inactive dots are dim, active dots are pink
                      }}
                      variants={dotVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{
                        delay: index * 0.02,
                        duration: 0.5,
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                      }}
                      custom={index}
                    />
                  ))}
                  <motion.div
                    className="absolute rounded-full bg-pink-500"
                    style={{
                      width: `${dotSize * 1.5}px`,
                      height: `${dotSize * 1.5}px`,
                      translateX: translateX,
                      translateY: "20px",
                    }}
                  />
                </div>
              </div>
            </ClientOnly>
        </div>
      </div>
    </div>
  )
} 