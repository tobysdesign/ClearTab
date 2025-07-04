'use client'
import React from 'react'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import { motion } from 'framer-motion'

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
      className={`relative w-[40px] h-[40px] cursor-pointer ${className}`}
      transition={{
        type: "spring",
        damping: 30,
        stiffness: 200,
        mass: 0.7,
      }}
    >
      <button className="shiny-cta absolute inset-0" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <DotLottieReact
          src="https://lottie.host/5368e488-cb9d-4667-b407-8b42472d4c6e/0QAbp6DRx3.lottie"
          loop
          autoplay
          speed={0.5}
          style={{
            width: '135%',
            height: '74%',
            lineHeight: 0,
            aspectRatio: '421 / 233',
            left: '-2px',
            position: 'relative',
          }}
        />
      </div>
    </motion.div>
  )
} 