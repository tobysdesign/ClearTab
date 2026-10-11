"use client";

import { useState, useCallback, useEffect } from "react";

export function useWidgetHeight() {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const [height, setHeight] = useState<number>(0);
  const [isMini, setIsMini] = useState(false);

  // The ref only records the node; the observer lives in an effect so its
  // setup and teardown are paired. (Previously the ref created the observer
  // and a separate unmount effect disconnected it -- StrictMode's dev
  // mount/unmount/mount ran that cleanup and nothing ever reconnected, so
  // widgets never switched to mini mode.)
  const ref = useCallback((el: HTMLDivElement | null) => {
    setNode(el);
  }, []);

  useEffect(() => {
    if (!node) return;
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
    return () => observer.disconnect();
  }, [node]);

  return { ref, height, isMini };
}
