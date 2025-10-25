'use client'
import React from 'react'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
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
        <DotLottieReact
          src="https://lottie.host/5368e488-cb9d-4667-b407-8b42472d4c6e/0QAbp6DRx3.lottie"
          loop
          autoplay
          speed={0.5}
          style={{
            width: '100%',
            height: '100%',
            lineHeight: 0,
            aspectRatio: '421 / 233',
            left: '0',
            position: 'relative',
          }}
        />
      </div>
    </motion.div>
  )
} 