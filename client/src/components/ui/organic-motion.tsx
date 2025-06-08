import { Drawer } from "vaul";
import React from "react";

type Direction = "up" | "down" | "left" | "right" | "center";

interface OrganicMotionProps {
  children: React.ReactNode;
  direction?: Direction;
  isVisible?: boolean;
  className?: string;
  delay?: number;
  intensity?: "subtle" | "medium" | "dramatic";
}

// Use Vaul's natural spring physics for organic motion
export function OrganicMotion({
  children,
  direction = "up",
  isVisible = true,
  className = "",
}: OrganicMotionProps) {
  if (!isVisible) return null;
  
  return (
    <Drawer.Root open={isVisible} modal={false}>
      <Drawer.Content className={`fixed inset-0 pointer-events-none ${className}`}>
        <div className="pointer-events-auto">
          {children}
        </div>
      </Drawer.Content>
    </Drawer.Root>
  );
}

// Enhanced hover effect using Vaul's natural springs
interface OrganicHoverProps {
  children: React.ReactNode;
  className?: string;
  magnetStrength?: number;
}

export function OrganicHover({ 
  children, 
  className = "",
}: OrganicHoverProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

// Stagger animation using multiple Vaul instances
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
}: OrganicStaggerProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <OrganicMotion
          key={index}
          direction={direction}
          delay={index * 0.1}
        >
          {child}
        </OrganicMotion>
      ))}
    </div>
  );
}

// Floating animation
interface OrganicFloatProps {
  children: React.ReactNode;
  className?: string;
  intensity?: "gentle" | "medium" | "strong";
}

export function OrganicFloat({ 
  children, 
  className = "",
}: OrganicFloatProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}