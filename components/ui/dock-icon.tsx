'use client'
import * as React from 'react'
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'framer-motion'

interface DockIconProps extends React.PropsWithChildren {
  mouseX: MotionValue
}

export function DockIcon({ mouseX, children }: DockIconProps) {
  const ref = React.useRef<HTMLDivElement>(null)

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 }
    return val - bounds.x - bounds.width / 2
  })

  const widthSync = useTransform(distance, [-150, 0, 150], [40, 80, 40])
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 })

  return (
    <motion.div
      ref={ref}
      style={{ width }}
      className="flex items-center justify-center aspect-square rounded-full bg-secondary cursor-pointer"
    >
      {children}
    </motion.div>
  )
} 