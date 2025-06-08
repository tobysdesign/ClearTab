"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface OrganicMotionProps {
  children: React.ReactNode
  direction?: "up" | "down" | "left" | "right" | "center"
  className?: string
  delay?: number
  duration?: number
  isVisible?: boolean
  triggerKey?: string | number
}

const directionVariants = {
  up: {
    initial: { 
      opacity: 0, 
      y: 50, 
      scale: 0.9,
      filter: "blur(8px)"
    },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300,
        mass: 0.8,
        opacity: { duration: 0.3 },
        filter: { duration: 0.4 }
      }
    },
    exit: { 
      opacity: 0, 
      y: -20, 
      scale: 0.95,
      filter: "blur(4px)",
      transition: {
        duration: 0.25,
        ease: "easeInOut"
      }
    }
  },
  down: {
    initial: { 
      opacity: 0, 
      y: -50, 
      scale: 0.9,
      filter: "blur(8px)"
    },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300,
        mass: 0.8,
        opacity: { duration: 0.3 },
        filter: { duration: 0.4 }
      }
    },
    exit: { 
      opacity: 0, 
      y: 20, 
      scale: 0.95,
      filter: "blur(4px)",
      transition: {
        duration: 0.25,
        ease: "easeInOut"
      }
    }
  },
  left: {
    initial: { 
      opacity: 0, 
      x: 50, 
      scale: 0.9,
      filter: "blur(8px)"
    },
    animate: { 
      opacity: 1, 
      x: 0, 
      scale: 1,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300,
        mass: 0.8,
        opacity: { duration: 0.3 },
        filter: { duration: 0.4 }
      }
    },
    exit: { 
      opacity: 0, 
      x: -20, 
      scale: 0.95,
      filter: "blur(4px)",
      transition: {
        duration: 0.25,
        ease: "easeInOut"
      }
    }
  },
  right: {
    initial: { 
      opacity: 0, 
      x: -50, 
      scale: 0.9,
      filter: "blur(8px)"
    },
    animate: { 
      opacity: 1, 
      x: 0, 
      scale: 1,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300,
        mass: 0.8,
        opacity: { duration: 0.3 },
        filter: { duration: 0.4 }
      }
    },
    exit: { 
      opacity: 0, 
      x: 20, 
      scale: 0.95,
      filter: "blur(4px)",
      transition: {
        duration: 0.25,
        ease: "easeInOut"
      }
    }
  },
  center: {
    initial: { 
      opacity: 0, 
      scale: 0.8,
      filter: "blur(8px)"
    },
    animate: { 
      opacity: 1, 
      scale: 1,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300,
        mass: 0.8,
        opacity: { duration: 0.3 },
        filter: { duration: 0.4 }
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.85,
      filter: "blur(4px)",
      transition: {
        duration: 0.25,
        ease: "easeInOut"
      }
    }
  }
}

export function OrganicMotion({ 
  children, 
  direction = "center", 
  className,
  delay = 0,
  duration,
  isVisible = true,
  triggerKey
}: OrganicMotionProps) {
  const variants = directionVariants[direction]

  // Create custom variants with proper typing
  const customVariants = {
    initial: variants.initial,
    animate: {
      ...variants.animate,
      transition: {
        ...variants.animate.transition,
        ...(duration && { duration }),
        ...(delay > 0 && { delay })
      }
    },
    exit: variants.exit
  }

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key={triggerKey}
          className={cn(className)}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={customVariants}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Stagger animation for lists
interface OrganicStaggerProps {
  children: React.ReactNode[]
  direction?: "up" | "down" | "left" | "right"
  className?: string
  staggerDelay?: number
}

export function OrganicStagger({
  children,
  direction = "up",
  className,
  staggerDelay = 0.1
}: OrganicStaggerProps) {
  return (
    <motion.div
      className={cn(className)}
      initial="initial"
      animate="animate"
      variants={{
        initial: {},
        animate: {
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
    >
      {children.map((child, index) => (
        <OrganicMotion key={index} direction={direction} triggerKey={index}>
          {child}
        </OrganicMotion>
      ))}
    </motion.div>
  )
}

export { directionVariants }