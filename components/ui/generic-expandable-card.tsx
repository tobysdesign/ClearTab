'use client'

import React, { useState, useRef, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useOutsideClick } from '@/hooks/use-outside-click'

interface GenericExpandableCardProps {
  trigger: ReactNode
  content: ReactNode
  isOpen?: boolean
  onOpenChange?: (isOpen: boolean) => void
}

export function GenericExpandableCard({
  trigger,
  content,
  isOpen: controlledIsOpen,
  onOpenChange,
}: GenericExpandableCardProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const isOpen = controlledIsOpen ?? internalIsOpen
  const setIsOpen = onOpenChange ?? setInternalIsOpen

  useOutsideClick(ref, () => {
    if (isOpen) {
      setIsOpen(false)
    }
  })

  return (
    <>
      <div onClick={() => setIsOpen(true)} className="cursor-pointer">
        {trigger}
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 h-full w-full z-10"
            />
            <div className="fixed inset-0 grid place-items-center z-50">
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex absolute top-2 right-2 items-center justify-center border border-border rounded-full h-6 w-6"
                onClick={() => setIsOpen(false)}
              >
                <CloseIcon />
              </motion.button>
              {React.isValidElement(trigger) && (
              <motion.div
                ref={ref}
                  layoutId={trigger.props.layoutId}
                className="w-full max-w-[500px] md:h-fit md:max-h-[90%] flex flex-col bg-[#212121] border border-border sm:rounded-3xl overflow-hidden shadow-2xl"
              >
                  <div className="p-4 h-full">{content}</div>
              </motion.div>
              )}
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export const CloseIcon = () => {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-foreground"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </motion.svg>
  )
}

export const ExpandIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-muted-foreground"
  >
    <path
      d="M5.13125 1.86875L1.86875 5.13125M1.86875 5.13125L1.86875 1.5M1.86875 5.13125L5.5 5.13125"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8.86875 12.1312L12.1312 8.86875M12.1312 8.86875L12.1312 12.5M12.1312 8.86875L8.5 8.86875"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
) 