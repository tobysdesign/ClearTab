"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./simple-tooltip.module.css";

interface SimpleTooltipProps {
  content: string;
  children: React.ReactElement;
}

export function SimpleTooltip({ content, children }: SimpleTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setPosition({
          top: rect.top - 8,
          left: rect.left + rect.width / 2,
        });
        setIsVisible(true);
      }
    }, 200);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      {children &&
        typeof children === "object" &&
        "type" in children &&
        children.type !== null &&
        // @ts-ignore
        children.props &&
        // Clone the child element and attach event handlers and ref
        ({
          ...children,
          ref: triggerRef,
          onMouseEnter: handleMouseEnter,
          onMouseLeave: handleMouseLeave,
        } as React.ReactElement)}

      {isVisible && (
        <div
          className={styles.tooltip}
          style={{
            position: "fixed",
            top: `${position.top}px`,
            left: `${position.left}px`,
            transform: "translate(-50%, -100%)",
          }}
        >
          {content}
        </div>
      )}
    </>
  );
}
