"use client";

import { cva, type VariantProps } from "class-variance-authority";
import {
  motion,
  MotionProps,
  MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import React, { PropsWithChildren, useContext, useRef } from "react";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DockProps extends VariantProps<typeof dockVariants> {
  className?: string;
  iconSize?: number;
  iconMagnification?: number;
  iconDistance?: number;
  orientation?: "horizontal" | "vertical";
  direction?: "top" | "middle" | "bottom";
  children: React.ReactNode;
}

const DEFAULT_SIZE = 40;
const DEFAULT_MAGNIFICATION = 60;
const DEFAULT_DISTANCE = 140;

interface DockContextValue {
  mousePosition: MotionValue<number>;
  orientation: "horizontal" | "vertical";
  iconSize: number;
  iconMagnification: number;
  iconDistance: number;
}

const DockContext = React.createContext<DockContextValue>({
  mousePosition: new MotionValue(Infinity),
  orientation: "horizontal",
  iconSize: DEFAULT_SIZE,
  iconMagnification: DEFAULT_MAGNIFICATION,
  iconDistance: DEFAULT_DISTANCE,
});

const useDockContext = () => {
  const context = useContext(DockContext);
  return context;
};

const dockVariants = cva(
  "mx-auto flex w-max items-center justify-center gap-2 rounded-2xl border bg-neutral-950/10 p-2 backdrop-blur-md dark:border-white/10 dark:bg-neutral-950/30",
);

const Dock = React.forwardRef<HTMLDivElement, DockProps>(
  (
    {
      className,
      children,
      iconSize = DEFAULT_SIZE,
      iconMagnification = DEFAULT_MAGNIFICATION,
      iconDistance = DEFAULT_DISTANCE,
      orientation = "horizontal",
      direction = "middle",
      ...props
    },
    ref,
  ) => {
    const mousePosition = useMotionValue(Infinity);

    return (
      <DockContext.Provider
        value={{
          mousePosition,
          orientation,
          iconSize,
          iconMagnification,
          iconDistance,
        }}
      >
        <motion.div
          ref={ref}
          onMouseMove={(e) =>
            mousePosition.set(
              orientation === "horizontal" ? e.pageX : e.pageY,
            )
          }
          onMouseLeave={() => mousePosition.set(Infinity)}
          {...props}
          className={cn(dockVariants({ className }), {
            "items-start": direction === "top",
            "items-center": direction === "middle",
            "items-end": direction === "bottom",
          })}
        >
          <div className="relative flex items-center gap-2">
            {children}
          </div>
        </motion.div>
      </DockContext.Provider>
    );
  },
);

Dock.displayName = "Dock";

export { Dock, useDockContext };

export interface DockIconProps extends Omit<MotionProps, "children"> {
  className?: string;
  children?: React.ReactNode;
}

const DockIcon = ({
  className,
  children,
  ...props
}: DockIconProps) => {
  const {
    mousePosition,
    orientation,
    iconSize: size,
    iconMagnification: magnification,
    iconDistance: distance,
  } = useDockContext();

  const ref = useRef<HTMLDivElement>(null);

  const distanceCalc = useTransform(
    mousePosition,
    (val: number) => {
      const bounds = ref.current?.getBoundingClientRect() ?? {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      };
      return orientation === "horizontal"
        ? val - bounds.x - bounds.width / 2
        : val - bounds.y - bounds.height / 2;
    },
  );

  const dimensionSync = useTransform(
    distanceCalc,
    [-distance, 0, distance],
    [size, magnification, size],
  );

  const dimension = useSpring(dimensionSync, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  return (
    <motion.div
      ref={ref}
      style={
        orientation === "horizontal"
          ? { width: dimension, height: dimension }
          : { width: size, height: dimension }
      }
      className={cn(
        "flex cursor-pointer items-center justify-center rounded-full",
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-center w-full h-full">
        {children}
      </div>
    </motion.div>
  );
};

DockIcon.displayName = "DockIcon";