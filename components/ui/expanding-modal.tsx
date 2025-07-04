'use client'

import React, { useRef, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useOutsideClick } from '@/hooks/use-outside-click'
import { cn } from '@/lib/utils'
import { GlowButton } from './glow-button'
import { X } from 'lucide-react'

export interface ExpandingModalProps {
  children: React.ReactNode
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  layoutId: string
  position?: 'center' | 'bottom'
  className?: string
}

export function ExpandingModal({
  children,
  isOpen,
  setIsOpen,
  layoutId,
  position = 'center',
  className,
}: ExpandingModalProps) {
  const ref = useRef<HTMLDivElement>(null)

  useOutsideClick(ref, () => {
    if (isOpen) {
      setIsOpen(false)
    }
  })

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          layoutId={layoutId}
          className={cn(
            'fixed inset-0 z-50 flex justify-center p-4',
            position === 'center' && 'items-center',
            position === 'bottom' && 'items-end pb-24',
            className,
          )}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            ref={ref}
            className="relative w-full h-full md:h-fit md:max-h-[90%] md:max-w-lg bg-[#141414] rounded-2xl overflow-hidden border border-[#252525]"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: 1, 
              opacity: 1,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 30,
                mass: 0.8
              }
            }}
            exit={{ 
              scale: 0.8, 
              opacity: 0,
              transition: {
                duration: 0.2,
                ease: "easeInOut"
              }
            }}
          >
            <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
              className="absolute top-6 right-6 z-10"
            >
              <GlowButton
            onClick={() => setIsOpen(false)}
                className="!p-0 h-8 w-8 flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </GlowButton>
            </motion.div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 