"use client";

// import { cn } from "@/lib/utils";
import {
  motion,
  useMotionValue,
  useTransform,
  // animate,
  AnimatePresence,
} from "framer-motion";
import {
  addDays,
  differenceInDays,
  isBefore,
  startOfDay,
  addMonths,
} from "@/lib/date-utils";
import { useQuery } from "@tanstack/react-query";
// Payday settings deprecated - using local storage instead
// import { WidgetActions } from "@/components/dashboard/widget-actions";
import {
  WidgetContainer,
  WidgetContent,
  WidgetHeader,
  WidgetLoader,
} from "@cleartab/ui";
import { useEffect, useState, useLayoutEffect, useRef } from "react";
// import styles from "./widget.module.css";
import countdownStyles from "./countdown-widget-main.module.css";
import { ClientOnly } from "@/components/ui/safe-motion";
import { useRouter } from "next/navigation";
// Icons replaced with ASCII placeholders

interface CountdownWidgetProps {
  variant?: "vertical" | "horizontal";
}

const RECURRENCE_DAYS = {
  weekly: 7,
  fortnightly: 14,
  monthly: 30,
  annual: 365,
} as const;

type PaydayFrequency = keyof typeof RECURRENCE_DAYS;
type RecurrenceDays = (typeof RECURRENCE_DAYS)[PaydayFrequency];

export function CountdownWidget({
  variant = "vertical",
}: CountdownWidgetProps) {
  const router = useRouter();
  const [settings, setSettings] = useState<{
    nextPayday: Date;
    daysLeft: number;
    recurrenceInDays: RecurrenceDays;
  }>({
    nextPayday: new Date(),
    daysLeft: RECURRENCE_DAYS["fortnightly"],
    recurrenceInDays: RECURRENCE_DAYS["fortnightly"],
  });

  // Load settings from preferences API
  const { data: paydayData, isLoading } = useQuery({
    queryKey: ["preferences"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/preferences");
        if (response.ok) {
          const { data } = await response.json();
          console.log("🎯 Widget received preferences:", data);
          return (
            data || {
              countdownTitle: "Countdown",
              countdownMode: "date-range",
              paydayFrequency: "none",
            }
          );
        }
      } catch (error) {
        console.error("Error loading preferences:", error);
      }
      // Fallback to defaults
      return {
        countdownTitle: "Countdown",
        countdownMode: "date-range",
        paydayFrequency: "none",
      };
    },
  });

  // Calculate countdown based on mode
  useEffect(() => {
    if (!paydayData) return;

    const { countdownMode, manualCount, paydayFrequency } = paydayData;
    const endDate = (paydayData as any).endDate;
    const startDate = (paydayData as any).startDate;
    const paydayDate = (paydayData as any).paydayDate;

    console.log("🧮 Calculating countdown with:", {
      countdownMode,
      paydayFrequency,
      endDate,
      startDate,
      paydayDate,
      manualCount,
    });

    if (countdownMode === "manual-count") {
      // Manual count mode - just use the manual count
      setSettings({
        nextPayday: new Date(),
        daysLeft: manualCount || 0,
        recurrenceInDays: 14, // Default for dot display
      });
    } else if (countdownMode === "date-range" || paydayDate) {
      // Date-based mode
      const today = startOfDay(new Date());

      if (paydayFrequency === "none") {
        // One-time countdown to end date
        const targetDateValue = endDate || paydayDate;
        if (!targetDateValue) return; // No date set

        // Parse date from ISO string timestamp
        const targetDate = new Date(targetDateValue);
        const daysLeft = differenceInDays(startOfDay(targetDate), today);

        setSettings({
          nextPayday: targetDate,
          daysLeft: Math.max(0, daysLeft),
          recurrenceInDays: Math.max(14, Math.abs(daysLeft)) as RecurrenceDays, // Use days left or default
        });
      } else if (paydayFrequency && (endDate || paydayDate)) {
        // Recurring countdown
        const lastPaydayValue = startDate || paydayDate;
        if (!lastPaydayValue) return; // No date set

        const lastPayday = new Date(lastPaydayValue);
        const recurrenceInDays = RECURRENCE_DAYS[paydayFrequency];

        // Calculate next occurrence
        let nextPayday = new Date(lastPayday);
        while (
          isBefore(nextPayday, today) ||
          nextPayday.getTime() === today.getTime()
        ) {
          if (paydayFrequency === "monthly") {
            nextPayday = addMonths(nextPayday, 1);
          } else if (paydayFrequency === "annual") {
            nextPayday = new Date(
              nextPayday.setFullYear(nextPayday.getFullYear() + 1),
            );
          } else {
            nextPayday = addDays(nextPayday, recurrenceInDays);
          }
        }

        const daysLeft = differenceInDays(nextPayday, today);

        setSettings({
          nextPayday,
          daysLeft,
          recurrenceInDays,
        });
      }
    }
  }, [paydayData]);

  // Get the countdown title from settings
  const countdownTitle = paydayData?.countdownTitle || "Countdown";

  const { daysLeft, recurrenceInDays } = settings;

  // Check if no countdown is configured
  const hasCountdownConfigured =
    paydayData &&
    (paydayData.endDate ||
      paydayData.paydayDate ||
      (paydayData.startDate && paydayData.endDate));

  // Calculate total days for dot display
  const totalDays = Math.max(daysLeft, recurrenceInDays);
  const elapsedDots = totalDays - daysLeft;

  // DotGrid component using your cleaner approach
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
        } else if (isStartEndMode && index >= totalDays - eventDurationDays) {
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
    }, [count, gap, elapsedDots, totalDays, isStartEndMode, eventDurationDays]);

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

  // Add counter animation
  const count = useMotionValue(daysLeft ?? 0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [displayNumber, setDisplayNumber] = useState(daysLeft ?? 0);

  // Update display number when daysLeft changes
  useEffect(() => {
    setDisplayNumber(daysLeft ?? 0);
  }, [daysLeft]);

  // Format the days left for display
  const formattedDaysLeft = displayNumber.toString();

  if (isLoading) {
    return <WidgetLoader className="Countdown" minHeight="280px" />;
  }

  // For start/end mode, calculate event duration
  const isStartEndMode =
    (paydayData as any)?.startDate && (paydayData as any)?.endDate;
  const eventDurationDays = isStartEndMode
    ? differenceInDays(
        new Date((paydayData as any).endDate),
        new Date((paydayData as any).startDate),
      )
    : 0;

  // Show empty state if no countdown is configured
  if (!hasCountdownConfigured) {
    return (
      <WidgetContainer>
        <WidgetHeader title="Countdown" />
        <WidgetContent scrollable={false} className={countdownStyles.content}>
          <div className={countdownStyles.emptyState}>
            <div className={countdownStyles.emptyContent}>
              <p className={countdownStyles.emptyTitle}>
                Add a{" "}
                <span className={countdownStyles.emptyHighlight}>single</span>,{" "}
                <span className={countdownStyles.emptyHighlight}>
                  recurring
                </span>{" "}
                or <span className={countdownStyles.emptyHighlight}>range</span>{" "}
                of dates to get a visual countdown of progress.
              </p>
              <button
                className={countdownStyles.addButton}
                onClick={() => router.push("/settings")}
              >
                + Add date
              </button>
            </div>
          </div>
        </WidgetContent>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer>
      <WidgetHeader title="Countdown" />
      <WidgetContent scrollable={false} className={countdownStyles.content}>
        <div className={countdownStyles.mainContainer}>
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
                    className={countdownStyles.number}
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
