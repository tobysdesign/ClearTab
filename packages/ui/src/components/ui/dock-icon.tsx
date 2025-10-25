'use client'
import React from 'react'
import { motion, type MotionValue, useMotionValue, useTransform, useSpring, MotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import styles from './dock-icon.module.css'

interface DockIconProps extends Omit<MotionProps, 'children'> {
  children?: React.ReactNode
  size?: number
  magnification?: number
  distance?: number
  mouseX?: MotionValue<number>
  className?: string
  label?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  onPointerDown?: React.PointerEventHandler<HTMLDivElement>;
}

export const DockIcon = ({ 
  children, 
  mouseX: propsMouseX,
  size = 40,
  magnification = 60,
  distance = 140,
  className,
  label,
  ...props 
}: DockIconProps) => {
  const ref = React.useRef<HTMLDivElement>(null)
  
  const localMouseX = useMotionValue(Infinity)
  const mouseX = propsMouseX ?? localMouseX

  const distanceCalc = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(
    distanceCalc,
    [-distance, 0, distance], 
    [size, magnification, size],
  );

  const width = useSpring(widthSync, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            ref={ref}
            style={{ width, height: width }}
            className={cn(
              "flex cursor-pointer items-center justify-center rounded-full text-white/80 hover:bg-neutral-900/50 hover:text-white",
              className
            )}
            {...props}
          >
            {children}
          </motion.div>
        </TooltipTrigger>
        {label && (
          <TooltipContent 
            side="top" 
            className={styles.tooltipContent}
          >
            {label}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  )
} 

DockIcon.displayName = 'DockIcon' 