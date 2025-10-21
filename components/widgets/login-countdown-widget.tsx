"use client";

import {
  motion,
  AnimatePresence,
} from "framer-motion";
import {
  WidgetContainer,
  WidgetContent,
} from "@/components/ui/widget-container";
import { WidgetHeader } from "@/components/ui/widget-header";
import { useLayoutEffect, useRef, useState } from "react";
import countdownStyles from "./countdown-widget-main.module.css";
import { ClientOnly } from "@/components/ui/safe-motion";

// Mock countdown data
const mockCountdownData = {
  countdownTitle: "Project Launch",
  daysLeft: 12,
  totalDays: 30,
};

export function LoginCountdownWidget() {
  const { daysLeft, totalDays, countdownTitle } = mockCountdownData;
  const elapsedDots = totalDays - daysLeft;
  const [displayNumber] = useState(daysLeft);

  // DotGrid component matching the real widget
  function DotGrid({ count, gap = 7 }: { count: number; gap?: number }) {
    const ref = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
      const el = ref.current!;
      const makeDot = (index: number) => {
        const d = document.createElement("div");
        d.className = getDotClass(index);
        return d;
      };

      const getDotClass = (index: number) => {
        if (index < elapsedDots) {
          return countdownStyles.pastDot;
        } else if (index === totalDays - 1) {
          return countdownStyles.activeDot;
        } else {
          return countdownStyles.dot;
        }
      };

      const ensureDotCount = (n: number) => {
        const cur = el.children.length;
        if (cur < n) {
          for (let i = cur; i < n; i++) el.appendChild(makeDot(i));
        } else {
          while (el.children.length > n) el.lastChild?.remove();
        }
        // Update existing dot classes
        for (let i = 0; i < el.children.length; i++) {
          (el.children[i] as HTMLElement).className = getDotClass(i);
        }
      };

      const bestGrid = (W: number, H: number, N: number, g: number) => {
        let best = { rows: 1, cols: N, size: 0 };
        for (let rows = 1; rows <= N; rows++) {
          const cols = Math.ceil(N / rows);
          const dotW = (W - g * (cols - 1)) / cols;
          const dotH = (H - g * (rows - 1)) / rows;
          const dot = Math.floor(Math.min(dotW, dotH));
          if (dot > best.size) best = { rows, cols, size: dot };
        }
        return best;
      };

      const layout = () => {
        const W = el.clientWidth;
        const H = el.clientHeight;
        if (!W || !H) return;
        ensureDotCount(count);
        const { cols, size } = bestGrid(W, H, count, gap);
        el.style.gap = `${gap}px`;
        el.style.gridTemplateColumns = `repeat(${cols}, ${size}px)`;
        el.style.setProperty("--dot-size", `${size}px`);
      };

      const ro = new ResizeObserver(layout);
      ro.observe(el);
      layout();
      return () => ro.disconnect();
    }, [count, gap, elapsedDots, totalDays]);

    return (
      <div
        ref={ref}
        className={countdownStyles.dotsGrid}
        style={{
          display: "grid",
          placeItems: "center",
          width: "100%",
          height: "100%",
        }}
      />
    );
  }

  const formattedDaysLeft = displayNumber.toString();

  return (
    <WidgetContainer>
      <WidgetHeader title="Countdown" />
      <WidgetContent scrollable={false} className={countdownStyles.content}>
        <div className={countdownStyles.mainContainer} style={{ pointerEvents: 'none' }}>
          {/* Row2: Dots Grid */}
          <DotGrid count={totalDays} gap={7} />

          {/* Row3: Count and labels */}
          <div className={countdownStyles.bottomSection}>
            <div className={countdownStyles.numberSection}>
              <ClientOnly>
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={displayNumber}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="countdown-number"
                  >
                    {formattedDaysLeft}
                  </motion.div>
                </AnimatePresence>
              </ClientOnly>
              <div className={countdownStyles.labelRow}>
                <span className={countdownStyles.daysLabel}>Days until </span>
                <span className={countdownStyles.eventLabel}>
                  {countdownTitle}
                </span>
              </div>
            </div>
          </div>
        </div>
      </WidgetContent>
    </WidgetContainer>
  );
}