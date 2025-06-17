'use client'

import * as React from 'react'
import { Drawer as DrawerPrimitive } from 'vaul'

import { cn } from '@/lib/utils'

const PopOver = ({
  shouldScaleBackground = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root
    shouldScaleBackground={shouldScaleBackground}
    {...props}
  />
)
PopOver.displayName = 'PopOver'

const PopOverTrigger = DrawerPrimitive.Trigger

const PopOverPortal = DrawerPrimitive.Portal

const PopOverClose = DrawerPrimitive.Close

const PopOverOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn('fixed inset-0 z-50', className)}
    {...props}
  />
))
PopOverOverlay.displayName = DrawerPrimitive.Overlay.displayName

const PopOverContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <PopOverPortal>
    <PopOverOverlay />
    <DrawerPrimitive.Content
      ref={ref}
      className={cn(
        'fixed bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background',
        className
      )}
      data-pop-over="true"
      {...props}
    >
      <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
      {children}
    </DrawerPrimitive.Content>
  </PopOverPortal>
))
PopOverContent.displayName = DrawerPrimitive.Content.displayName

const PopOverHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('grid gap-1.5 p-4 text-center sm:text-left', className)}
    {...props}
  />
)
PopOverHeader.displayName = 'PopOverHeader'

const PopOverFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('mt-auto flex flex-col gap-2 p-4', className)}
    {...props}
  />
)
PopOverFooter.displayName = 'PopOverFooter'

const PopOverTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
))
PopOverTitle.displayName = DrawerPrimitive.Title.displayName

const PopOverDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
PopOverDescription.displayName = DrawerPrimitive.Description.displayName

export {
  PopOver,
  PopOverPortal,
  PopOverOverlay,
  PopOverTrigger,
  PopOverClose,
  PopOverContent,
  PopOverHeader,
  PopOverFooter,
  PopOverTitle,
  PopOverDescription,
} 