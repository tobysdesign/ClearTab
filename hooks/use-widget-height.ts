"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export function useWidgetHeight() {
  const observerRef = useRef<ResizeObserver | null>(null);
  const [height, setHeight] = useState<number>(0);
  const [isMini, setIsMini] = useState(false);

  const ref = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (node) {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
           // Use contentRect for precise content box size
          const h = entry.contentRect.height;
          setHeight(h);
          // Consider < 120px as "Mini Mode" to be safe (target is 60px)
          setIsMini(h < 120);
        }
      });
      observer.observe(node);
      observerRef.current = observer;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return { ref, height, isMini };
}
