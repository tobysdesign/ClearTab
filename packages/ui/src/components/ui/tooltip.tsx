"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"
import styles from './tooltip.module.css'

// One app-wide provider (app/providers.tsx) so moving between buttons skips
// the delay once any tooltip has opened. Components shouldn't add their own.
function TooltipProvider({
  delayDuration = 250,
  skipDelayDuration = 400,
  // Tooltips are plain labels (pointer-events: none), so close as soon as the
  // pointer leaves the trigger instead of waiting for it to reach the content.
  disableHoverableContent = true,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      delayDuration={delayDuration}
      skipDelayDuration={skipDelayDuration}
      disableHoverableContent={disableHoverableContent}
      {...props}
    />
  )
}

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, children, ...props }, ref) => (
  // Portaled so tooltips escape widget overflow/transform clipping (e.g. the
  // recorder's 3D flip container).
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(styles.content, className)}
      {...props}
    >
      {children}
      <TooltipPrimitive.Arrow className={styles.arrow} width={12} height={6} />
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Portal>
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

/** Keyboard shortcut hint shown after a tooltip's label, e.g. "Open chat ⌘K". */
function TooltipShortcut({ children }: { children: React.ReactNode }) {
  return <kbd className={styles.shortcut}>{children}</kbd>
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, TooltipShortcut }
