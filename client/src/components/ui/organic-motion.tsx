import { motion, AnimatePresence, Variants } from "framer-motion";
import React from "react";

type Direction = "up" | "down" | "left" | "right" | "center";

interface SpringConfig {
  stiffness?: number;
  damping?: number;
  mass?: number;
  duration?: number;
}

interface OrganicMotionProps {
  children: React.ReactNode;
  direction?: Direction;
  isVisible?: boolean;
  className?: string;
  delay?: number;
  springConfig?: SpringConfig;
  intensity?: "subtle" | "medium" | "dramatic";
}

const getDirectionalVariants = (direction: Direction, intensity: "subtle" | "medium" | "dramatic" = "medium"): Variants => {
  const intensityMap = {
    subtle: { distance: 15, scale: 0.96, blur: 4, rotation: 5 },
    medium: { distance: 35, scale: 0.9, blur: 8, rotation: 12 },
    dramatic: { distance: 60, scale: 0.8, blur: 12, rotation: 20 }
  };
  
  const { distance, scale, blur, rotation } = intensityMap[intensity];
  
  const directionOffsets = {
    up: { 
      x: 0, 
      y: distance, 
      rotateX: rotation,
      rotateY: 0,
      transformOrigin: "center bottom"
    },
    down: { 
      x: 0, 
      y: -distance, 
      rotateX: -rotation,
      rotateY: 0,
      transformOrigin: "center top"
    },
    left: { 
      x: distance, 
      y: 0, 
      rotateX: 0,
      rotateY: rotation,
      transformOrigin: "right center"
    },
    right: { 
      x: -distance, 
      y: 0, 
      rotateX: 0,
      rotateY: -rotation,
      transformOrigin: "left center"
    },
    center: { 
      x: 0, 
      y: 0, 
      rotateX: 0,
      rotateY: 0,
      transformOrigin: "center center"
    }
  };

  const offset = directionOffsets[direction];

  return {
    initial: {
      opacity: 0,
      scale,
      x: offset.x,
      y: offset.y,
      rotateX: offset.rotateX,
      rotateY: offset.rotateY,
      filter: `blur(${blur}px)`,
      transformPerspective: 1000,
    },
    animate: {
      opacity: 1,
      scale: 1,
      x: 0,
      y: 0,
      rotateX: 0,
      rotateY: 0,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        stiffness: 120,
        damping: 18,
        mass: 0.9,
        opacity: { duration: 0.3 },
        filter: { duration: 0.4 },
      },
    },
    exit: {
      opacity: 0,
      scale: scale * 0.95,
      x: offset.x * 0.4,
      y: offset.y * 0.4,
      rotateX: offset.rotateX * 0.3,
      rotateY: offset.rotateY * 0.3,
      filter: `blur(${blur * 0.7}px)`,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 25,
        mass: 0.6,
        duration: 0.25,
      },
    },
  };
};

const getSequentialVariants = (index: number, direction: Direction): Variants => {
  const delay = index * 0.08;
  const baseVariants = getDirectionalVariants(direction, "medium");
  
  return {
    ...baseVariants,
    animate: {
      ...baseVariants.animate,
      transition: {
        ...baseVariants.animate.transition,
        delay,
      },
    },
  };
};

export function OrganicMotion({
  children,
  direction = "up",
  isVisible = true,
  className = "",
  delay = 0,
  springConfig,
  intensity = "medium",
}: OrganicMotionProps) {
  const variants = getDirectionalVariants(direction, intensity);
  
  const customVariants: Variants = springConfig ? {
    ...variants,
    animate: {
      ...variants.animate,
      transition: {
        ...variants.animate.transition,
        delay,
        ...springConfig,
      },
    },
  } : {
    ...variants,
    animate: {
      ...variants.animate,
      transition: {
        ...variants.animate.transition,
        delay,
      },
    },
  };

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          className={className}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={customVariants}
          style={{
            transformStyle: "preserve-3d",
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Enhanced stagger animation for lists with organic feel
interface OrganicStaggerProps {
  children: React.ReactNode[];
  direction?: Direction;
  className?: string;
  staggerDelay?: number;
  intensity?: "subtle" | "medium" | "dramatic";
}

export function OrganicStagger({
  children,
  direction = "up",
  className = "",
  staggerDelay = 0.08,
  intensity = "medium",
}: OrganicStaggerProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <OrganicMotion
          key={index}
          direction={direction}
          delay={index * staggerDelay}
          intensity={intensity}
        >
          {child}
        </OrganicMotion>
      ))}
    </div>
  );
}

// Magnetic hover effect for interactive elements
interface OrganicHoverProps {
  children: React.ReactNode;
  className?: string;
  magnetStrength?: number;
}

export function OrganicHover({ 
  children, 
  className = "",
  magnetStrength = 8 
}: OrganicHoverProps) {
  return (
    <motion.div
      className={className}
      whileHover={{
        scale: 1.05,
        rotateX: 5,
        rotateY: 5,
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 20,
        },
      }}
      whileTap={{
        scale: 0.98,
        rotateX: -2,
        rotateY: -2,
        transition: {
          type: "spring",
          stiffness: 400,
          damping: 25,
        },
      }}
      style={{
        transformStyle: "preserve-3d",
      }}
    >
      {children}
    </motion.div>
  );
}

// Floating animation for elements that should feel weightless
interface OrganicFloatProps {
  children: React.ReactNode;
  className?: string;
  intensity?: "gentle" | "medium" | "strong";
}

export function OrganicFloat({ 
  children, 
  className = "",
  intensity = "medium"
}: OrganicFloatProps) {
  const intensityMap = {
    gentle: { y: [-2, 2, -2], duration: 4 },
    medium: { y: [-4, 4, -4], duration: 3 },
    strong: { y: [-8, 8, -8], duration: 2.5 }
  };
  
  const config = intensityMap[intensity];
  
  return (
    <motion.div
      className={className}
      animate={{
        y: config.y,
        rotateX: [0, 2, 0, -2, 0],
        rotateY: [0, -1, 0, 1, 0],
      }}
      transition={{
        duration: config.duration,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      style={{
        transformStyle: "preserve-3d",
      }}
    >
      {children}
    </motion.div>
  );
}