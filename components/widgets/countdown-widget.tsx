'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WidgetHeader } from '@/components/ui/widget-header'
import styles from './countdown-widget.module.css'

interface CountdownWidgetProps {
  title?: string
  totalDays: number
  remainingDays: number
  variant?: 'dots' | 'circles'
  size?: 'small' | 'medium' | 'large'
}

export function CountdownWidget({
  title = 'Payday',
  totalDays,
  remainingDays,
  variant = 'dots',
  size = 'medium'
}: CountdownWidgetProps) {
  const [daysLeft, setDaysLeft] = useState<number>(remainingDays)

  // Format the days left for display
  const formattedDaysLeft = daysLeft.toString().padStart(2, '0')
  const [firstDigit, secondDigit] = formattedDaysLeft.split('')

  return (
    <div className={styles.container}>
      <div className="relative flex flex-col h-full w-full">
        {/* Header */}
        <WidgetHeader title="Countdown" className="!justify-start" />

        {/* Content area matching weather widget structure */}
        <div className="flex-1 flex flex-col justify-between p-6">
          {/* Title - countdown name at top */}
          <div className="text-[#8D8D8D] text-[16px] font-normal">{title}</div>

          {/* Center area for dots */}
          <div className="flex gap-2 justify-center">
            {[...Array(Math.min(daysLeft, 30))].map((_, i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: '#FF69B4' }}
              />
            ))}
          </div>

          {/* Footer matching weather widget cardFooter structure */}
          <div className="flex justify-between items-end gap-4">
            <div className="flex flex-col items-start flex-1">
              <div className="bigNumber mb-1">{formattedDaysLeft}</div>
              <div className={styles.postText}>days remaining</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
