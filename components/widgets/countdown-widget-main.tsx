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
import { WidgetContainer, WidgetContent } from '@/components/ui/widget-container'
import { WidgetHeader } from '@/components/ui/widget-header'
import { WidgetLoader } from './widget-loader'
import { useEffect, useState } from 'react'
import styles from './widget.module.css'
import { ClientOnly } from '@/components/ui/safe-motion'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Settings from 'lucide-react/dist/esm/icons/settings'

interface CountdownWidgetProps {
  variant?: 'vertical' | 'horizontal'
}

const RECURRENCE_DAYS = {
  'weekly': 7,
  'fortnightly': 14,
  'monthly': 30
} as const

type PaydayFrequency = keyof typeof RECURRENCE_DAYS
type RecurrenceDays = (typeof RECURRENCE_DAYS)[PaydayFrequency]

export function CountdownWidget({ variant = 'vertical' }: CountdownWidgetProps) {
  const router = useRouter()
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
    return <WidgetLoader className="Countdown" minHeight="h-[280px]" />
  }

  // Calculate dot size and spacing based on grid dimensions
  const dotSize = Math.min(10, Math.max(6, 100 / (cols * 2))); // Responsive dot size
  const dotSpacingX = Math.min(20, Math.max(10, 100 / cols));
  const dotSpacingY = Math.min(24, Math.max(16, 60 / rows));

  return (
    <WidgetContainer>
      <WidgetHeader title="Countdown" className="h-[60px]">
      </WidgetHeader>
      <WidgetContent scrollable={false} className="widget-relative p-6">
        <div className="flex h-full">
          {/* Left side - Text content */}
          <div className="flex-1 flex flex-col justify-center">
            {/* Title - shows "Pay" or configured countdown name */}
            <div className="text-[#8D8D8D] text-[18px] font-normal mb-2">Pay</div>
            
            {/* Number */}
            <ClientOnly>
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={displayNumber}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="text-[64px] font-light leading-none text-white"
                >
                  {formattedDaysLeft}
                </motion.div>
              </AnimatePresence>
            </ClientOnly>
            
            {/* Days label */}
            <div className="text-[18px] font-normal text-white/80">days</div>
          </div>
          
          {/* Right side - Dots grid */}
          <div className="flex items-center">
            <div className="grid grid-cols-5 gap-1.5">
              {[...Array(Math.min(daysLeft, 30))].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    delay: i * 0.02,
                    duration: 0.3,
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: '#FF69B4' }}
                />
              ))}
            </div>
          </div>
        </div>
      </WidgetContent>
    </WidgetContainer>
  )
} 