"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverAnchor = PopoverPrimitive.Anchor

const popoverContentStyles: React.CSSProperties = {
  zIndex: 99999,
  width: 'auto',
  borderRadius: '12px',
  border: '1px solid #252525',
  backgroundColor: '#1a1a1a',
  padding: 0,
  color: 'white',
  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
  outline: 'none',
  position: 'relative',
}

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, style, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(className)}
      style={{ ...popoverContentStyles, ...style }}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }
