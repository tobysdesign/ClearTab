"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { DialogTitle } from "@/components/ui/dialog";

import { cn } from "@/lib/utils";
import styles from './drawer.module.css';

type OverlayVariant = 'default' | 'settings' | 'notes' | 'calendar';

const Drawer = ({
  shouldScaleBackground = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root
    shouldScaleBackground={shouldScaleBackground}
    {...props}
  />
);
Drawer.displayName = "Drawer";

const DrawerTrigger = DrawerPrimitive.Trigger;

const DrawerPortal = DrawerPrimitive.Portal;

const DrawerClose = DrawerPrimitive.Close;

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay> & {
    variant?: OverlayVariant
  }
>(({ className, variant = 'default', ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn(
      styles.overlay,
      styles[variant],
      className
    )}
    {...props}
  />
));
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName;

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content> & {
    overlayVariant?: OverlayVariant
    direction?: 'bottom' | 'right'
    showHandle?: boolean
  }
>(({ className, children, overlayVariant = 'default', direction = 'bottom', showHandle = true, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay variant={overlayVariant} />
    <DrawerPrimitive.Content
      ref={ref}
      className={cn(
        styles.content,
        direction === 'right' ? styles.contentRight : styles.contentBottom,
        className
      )}
      {...props}
    >
      {direction === 'bottom' && showHandle && <div className={styles.handle} />}
      {children}
    </DrawerPrimitive.Content>
  </DrawerPortal>
));
DrawerContent.displayName = DrawerPrimitive.Content.displayName;

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(styles.header, className)}
    {...props}
  />
);
DrawerHeader.displayName = "DrawerHeader";

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(styles.footer, className)}
    {...props}
  />
);
DrawerFooter.displayName = "DrawerFooter";

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogTitle
    ref={ref}
    className={cn(styles.title, className)}
    {...props}
  />
));
DrawerTitle.displayName = DrawerPrimitive.Title.displayName;

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn(styles.description, className)}
    {...props}
  />
));
DrawerDescription.displayName = DrawerPrimitive.Description.displayName;

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}; 