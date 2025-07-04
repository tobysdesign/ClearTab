'use client'

import { Card } from '@/components/ui/card'
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

const calculateNextPayday = (
  targetDate: Date,
  frequency: PaydayFrequency
) => {
  const today = startOfDay(new Date())
  let nextDate = startOfDay(targetDate)
  const recurrence = RECURRENCE_DAYS[frequency]

  while (isBefore(nextDate, today) || nextDate.getTime() === today.getTime()) {
    if (frequency === 'monthly') {
      nextDate = addMonths(nextDate, 1)
    } else {
      nextDate = addDays(nextDate, recurrence)
    }
  }

  return {
    nextDate,
    daysRemaining: differenceInDays(nextDate, today)
  }
}

export function FinanceWidget({ variant = 'vertical' }: FinanceWidgetProps) {
  const { data: settings, isLoading } = useQuery({
    queryKey: ['paydaySettings'],
    queryFn: async () => {
      const result = await getPaydaySettings()
      if (result.data?.paydayDate && result.data?.paydayFrequency) {
        const frequency = result.data.paydayFrequency as PaydayFrequency
        const { nextDate, daysRemaining } = calculateNextPayday(
          new Date(result.data.paydayDate),
          frequency
        )
        return {
          nextPayday: nextDate,
          daysLeft: daysRemaining,
          recurrenceInDays: RECURRENCE_DAYS[frequency],
        }
      }
      const defaultRecurrence = RECURRENCE_DAYS['fortnightly']
      return {
        nextPayday: new Date(),
        daysLeft: defaultRecurrence,
        recurrenceInDays: defaultRecurrence
      }
    },
    refetchInterval: 24 * 60 * 60 * 1000, // Refetch daily
  })

  const { daysLeft, recurrenceInDays } = settings || {
    daysLeft: 0,
    recurrenceInDays: RECURRENCE_DAYS['fortnightly']
  }
  
  const rows = 3
  const cols = 10

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

  useEffect(() => {
    const animation = animate(count, daysLeft ?? 0, {
      duration: 0.8,
      ease: "easeOut",
      onUpdate: (latest) => setDisplayNumber(Math.round(latest))
    })

    return animation.stop
  }, [daysLeft, count])

  // Format the days left for display with animation
  const formattedDaysLeft = displayNumber.toString().padStart(2, '0')
  const [firstDigit, secondDigit] = formattedDaysLeft.split('')

  if (isLoading) {
    return <WidgetLoader className="finance" minHeight="h-[280px]" />
  }

  return (
    <Card className="dashCard relative flex flex-col h-full overflow-hidden p-6">
      <WidgetActions>
        <FinanceSettingsPopover />
      </WidgetActions>
      <div className="flex flex-col gap-1 pr-8">
        <h2 className="font-inter-display text-[14px] font-normal text-white">Countdown</h2>
        <span className="font-inter-display text-[14px] font-normal text-[#8D8D8D]">Payday</span>
      </div>

      <div className="flex-grow relative max-h-[110px]">
        {/* Numbers block */}
        <div className="absolute bottom-0 right-0 flex flex-col items-end z-10">
          <motion.span 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="font-inter-display text-[14px] font-light tracking-[0.2em] uppercase text-white"
          >
            № days
          </motion.span>
          <div className="flex items-baseline space-x-[-10px]">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={`first-${firstDigit}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="font-tiny font-thin text-[100px] leading-[90%] tracking-tighter text-[#5E5553]"
              >
                {firstDigit}
              </motion.span>
              <motion.span
                key={`second-${secondDigit}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
                className="font-tiny font-normal text-[100px] leading-[90%] tracking-tighter text-white oldstyle-nums"
              >
                {secondDigit}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        {/* Grid of dots */}
        <motion.div 
          className="absolute bottom-0 left-0 w-full z-0"
          animate={{ x: `${translateX}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 30 }}
        >
          <motion.div 
            className="grid grid-cols-10 grid-rows-3 gap-2 px-6 justify-center"
            initial="hidden"
            animate="visible"
            transition={{ staggerChildren: 0.05, delayChildren: 0.1 }}
          >
            {dots.map(({ index, position }) => {
              const isToday = index === (daysLeft ?? 1) - 1
              const isPast = index > (daysLeft ?? 1) - 1
              return (
                <motion.div
                  key={position}
                  variants={dotVariants}
                  className={cn(
                    "h-5 w-5 rounded-full",
                    isToday
                      ? "bg-[#FA531C]"
                      : isPast
                      ? "bg-[#232121]"
                      : "bg-[#3B3A3A]"
                  )}
                />
              )
            })}
          </motion.div>
        </motion.div>
      </div>
    </Card>
  )
} 