'use client'
import React from 'react'
import { motion } from 'framer-motion'
import styles from './shiny-ai-button.module.css'

interface ShinyAiButtonProps {
  onClick: () => void
  className?: string
  layoutId?: string
}

export function ShinyAiButton({
  onClick,
  className,
  layoutId
}: ShinyAiButtonProps) {
  return (
    <motion.div
      layoutId={layoutId}
      onClick={onClick}
      className={`${styles.container} ${className}`}
      transition={{
        type: "spring",
        damping: 30,
        stiffness: 200,
        mass: 0.7,
      }}
    >
      <button className="shiny-cta absolute inset-0" />
      <div className={styles.iconContainer}>
        <div className={styles.simpleAiIcon}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"
              fill="currentColor"
              className={styles.sparkle}
            />
            <circle
              cx="8"
              cy="8"
              r="1.5"
              fill="currentColor"
              className={styles.dot}
            />
            <circle
              cx="16"
              cy="6"
              r="1"
              fill="currentColor"
              className={styles.dot}
            />
          </svg>
        </div>
      </div>
    </motion.div>
  )
} 