'use client'

import { cn } from '@/lib/utils'
import styles from './circular-progress.module.css'

interface CircularProgressProps {
  value: number
  size?: number
  strokeWidth?: number
  textClassName?: string
  progressClassName?: string
  bgClassName?: string
}

export function CircularProgress({
  value,
  size = 160,
  strokeWidth = 10,
  textClassName,
  progressClassName,
  bgClassName
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className={cn("stroke-current", bgClassName)}
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={cn("stroke-current transition-all duration-300 ease-out", progressClassName)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset
          }}
        />
      </svg>
      <div className={styles.container}>
        <span className={cn("text-white", textClassName)}>
          {value}%
        </span>
      </div>
    </div>
  )
} 