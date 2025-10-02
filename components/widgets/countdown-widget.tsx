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
      <div className={styles.countdownContainer}>
        <WidgetHeader title="Countdown" />

        <div className={styles.countdownContent}>
          <div className={styles.countdownTitle}>{title}</div>

          <div className={styles.countdownDots}>
            {[...Array(Math.min(daysLeft, 30))].map((_, i) => (
              <div
                key={i}
                className={styles.countdownDot}
              />
            ))}
          </div>

          <div className={styles.countdownFooter}>
            <div className={styles.countdownNumberSection}>
              <div className={styles.bigNumber}>{formattedDaysLeft}</div>
              <div className={styles.postText}>days remaining</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
