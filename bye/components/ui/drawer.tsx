"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { DialogTitle } from "@/components/ui/dialog";

import { cn } from "@/lib/utils";

const overlayVariants = {
  default: "bg-[linear-gradient(180deg,rgba(0,0,0,0.3)_0%,rgba(0,0,0,0.2)_100%),linear-gradient(83deg,rgba(0,0,0,0.4)_0%,rgba(0,0,0,0)_50%),linear-gradient(264deg,rgba(0,0,0,0.4)_0%,rgba(0,0,0,0)_50%)]",
  settings: "bg-[linear-gradient(180deg,rgba(0,0,0,0.4)_0%,rgba(0,0,0,0.6)_100%),radial-gradient(circle_at_30%_40%,rgba(31,31,31,0.3)_0%,transparent_50%),radial-gradient(circle_at_70%_60%,rgba(22,21,21,0.3)_0%,transparent_50%)]",
  weather: "bg-[linear-gradient(180deg,rgba(31,31,31,0.3)_0%,rgba(22,21,21,0.4)_100%),linear-gradient(45deg,rgba(50,50,53,0.2)_0%,transparent_50%)]",
  notes: "bg-[linear-gradient(135deg,rgba(0,0,0,0.5)_0%,rgba(0,0,0,0.3)_100%),radial-gradient(ellipse_at_center,rgba(196,196,196,0.1)_0%,transparent_70%)]"
}

type OverlayVariant = keyof typeof overlayVariants;

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
    variant?: OverlayVariant;
  }
>(({ className, variant = "default", ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 backdrop-blur-[2px]",
      overlayVariants[variant],
      className
    )}
    {...props}
  />
));
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName;

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content> & {
    overlayVariant?: OverlayVariant;
  }
>(({ className, children, overlayVariant = "default", ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay variant={overlayVariant} />
    <DrawerPrimitive.Content
      ref={ref}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-[70vh] flex-col rounded-t-[10px] border bg-[#111111]",
        className
      )}
      {...props}
    >
      <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
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
    className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)}
    {...props}
  />
);
DrawerHeader.displayName = "DrawerHeader";

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("mt-auto flex flex-col gap-2 p-4", className)}
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
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
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
    className={cn("text-sm text-muted-foreground", className)}
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