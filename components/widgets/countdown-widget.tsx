'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
      <div className="relative flex flex-col h-full w-full p-6">
        {/* Header */}
        <h2 className="text-[16px] font-normal text-white/90">Countdown</h2>
        
        {/* Content area */}
        <div className="flex-1 flex flex-col items-center justify-center -mt-8">
          {/* Title - countdown name */}
          <div className="text-[#8D8D8D] text-[16px] font-normal mb-3">{title}</div>
          
          {/* Number and Days layout */}
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-[64px] font-extralight leading-none text-white">{formattedDaysLeft}</span>
            <span className="text-[24px] font-light text-white/80">days</span>
          </div>
          
          {/* Dots showing remaining days only */}
          <div className="flex gap-2">
            {[...Array(Math.min(daysLeft, 30))].map((_, i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: '#FF69B4' }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 