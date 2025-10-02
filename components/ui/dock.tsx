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
import GripVertical from 'lucide-react/dist/esm/icons/grip-vertical';
import { cn } from "@/lib/utils";
import styles from "./dock.module.css";

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

const dockVariants = cva(styles.dock);

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
          data-direction={direction}
          className={cn(dockVariants({ className }))}
        >
          <div className={styles.dockItemsWrapper}>
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
      className={cn(styles.dockIcon, className)}
      {...props}
    >
      <div className={styles.dockIconInner}>
        {children}
      </div>
    </motion.div>
  );
};

DockIcon.displayName = "DockIcon";
