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
// Payday settings deprecated - using local storage instead
// import { WidgetActions } from "@/components/dashboard/widget-actions";
import {
  WidgetContainer,
  WidgetContent,
  WidgetHeader,
  AddButton,
  WidgetLoader,
  EmptyState,
} from "@cleartab/ui";
import { useEffect, useState } from "react";
import { PenIcon } from "@/components/icons";
import { usePreferences, type Preferences } from "@/hooks/use-preferences";
import { CountdownBreakdown } from "./countdown-breakdown";
// import styles from "./widget.module.css";
import countdownStyles from "./countdown-widget-main.module.css";
import { useWidgetHeight } from "@/hooks/use-widget-height";
import { CountdownSetupPanel } from "./countdown-setup-panel";

const COUNTDOWN_ADD_DATE_TESTID = "countdown-add-date";
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

const DEFAULT_COUNTDOWN_PREFERENCES: Preferences = {
  countdownTitle: "Countdown",
  countdownMode: "date-range",
  paydayFrequency: "none",
};

function calculateCountdownSettings(paydayData?: Preferences | null) {
  const defaultSettings = {
    nextPayday: new Date(),
    daysLeft: RECURRENCE_DAYS["fortnightly"],
    recurrenceInDays: RECURRENCE_DAYS["fortnightly"] as RecurrenceDays,
  };
  if (!paydayData) return defaultSettings;

  const { countdownMode, manualCount, paydayFrequency } = paydayData;
  const endDate = (paydayData as any).endDate;
  const startDate = (paydayData as any).startDate;
  const paydayDate = (paydayData as any).paydayDate;

  if (countdownMode === "manual-count") {
    return {
      nextPayday: new Date(),
      daysLeft: manualCount || 0,
      recurrenceInDays: 14 as RecurrenceDays,
    };
  } else if (countdownMode === "date-range" || paydayDate) {
    const today = startOfDay(new Date());

    if (paydayFrequency === "none") {
      const targetDateValue = endDate || paydayDate;
      if (!targetDateValue) return defaultSettings;

      const targetDate = new Date(targetDateValue);
      const daysLeft = differenceInDays(startOfDay(targetDate), today);

      return {
        nextPayday: targetDate,
        daysLeft: Math.max(0, daysLeft),
        recurrenceInDays: Math.max(14, Math.abs(daysLeft)) as RecurrenceDays,
      };
    } else if (paydayFrequency && (endDate || paydayDate)) {
      const lastPaydayValue = startDate || paydayDate;
      if (!lastPaydayValue) return defaultSettings;

      const lastPayday = new Date(lastPaydayValue);
      const recurrenceInDays = (RECURRENCE_DAYS[paydayFrequency as PaydayFrequency] || 14) as RecurrenceDays;

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

      return {
        nextPayday,
        daysLeft,
        recurrenceInDays,
      };
    }
  }
  return defaultSettings;
}

export function CountdownWidget({
  variant = "vertical",
}: CountdownWidgetProps) {
  const { ref, isMini } = useWidgetHeight();
  const [isSetupOpen, setIsSetupOpen] = useState(false);

  // Preferences are shared (one request for the whole page) and cached locally,
  // so the countdown draws immediately on a new tab
  const { data: preferences, isPending } = usePreferences();
  const paydayData = preferences ?? (isPending ? undefined : DEFAULT_COUNTDOWN_PREFERENCES);
  const isLoading = isPending && !preferences;

  const [settings, setSettings] = useState(() => calculateCountdownSettings(paydayData));

  // Calculate countdown based on mode
  useEffect(() => {
    if (!paydayData) return;
    setSettings(calculateCountdownSettings(paydayData));
  }, [paydayData]);

  // Get the countdown title from settings
  const countdownTitle = paydayData?.countdownTitle || "Countdown";

  const { daysLeft } = settings;

  // Check if no countdown is configured
  const hasCountdownConfigured =
    paydayData &&
    (paydayData.endDate ||
      paydayData.paydayDate ||
      (paydayData.startDate && paydayData.endDate));




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
    return (
      <div ref={ref} style={{ height: '100%', width: '100%' }}>
        <WidgetLoader className="Countdown" minHeight="280px" />
      </div>
    );
  }

  // Show empty state if no countdown is configured
  if (!hasCountdownConfigured) {
    return (
      <div ref={ref} className={countdownStyles.modeWrapper}>
        <AnimatePresence mode="wait" initial={false}>
          {isMini ? (
            <motion.div
              key="mini-empty"
              className={countdownStyles.modeWrapper}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              <WidgetContainer>
                <div className={countdownStyles.miniContainer}>
                  <div className={countdownStyles.miniEmptyLeft}>
                  <button
                    type="button"
                    data-testid={COUNTDOWN_ADD_DATE_TESTID}
                    onClick={() => setIsSetupOpen(true)}
                    className={countdownStyles.miniSetDateButton}
                  >
                    Set date
                  </button>
                    <span className={countdownStyles.miniEmptyText}>
                      Counting the days?
                    </span>
                  </div>

                  
                </div>
              </WidgetContainer>
            </motion.div>
          ) : (
            <motion.div
              key="normal-empty"
              className={countdownStyles.modeWrapper}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              <WidgetContainer>
                <WidgetHeader title="Counter" />
                <WidgetContent scrollable={false} className={countdownStyles.content}>
                  <EmptyState
                    className={countdownStyles.emptyState}
                    title="No Countdown"
                    description="Counting the days?"
                    action={{
                      label: "Set date",
                      onClick: () => setIsSetupOpen(true),
                      testId: COUNTDOWN_ADD_DATE_TESTID,
                    }}
                  />
                </WidgetContent>
              </WidgetContainer>
            </motion.div>
          )}
        </AnimatePresence>
        <CountdownSetupPanel
          isOpen={isSetupOpen}
          onClose={() => setIsSetupOpen(false)}
          anchorSelector={`[data-testid="${COUNTDOWN_ADD_DATE_TESTID}"]`}
        />
      </div>
    );
  }

  return (
    <div ref={ref} className={countdownStyles.modeWrapper}>
      <AnimatePresence mode="wait" initial={false}>
        {isMini ? (
          <motion.div
            key="mini"
            className={countdownStyles.modeWrapper}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <WidgetContainer>
              <div className={countdownStyles.miniContainer}>
                <span className={countdownStyles.miniEventLabel}>
                  {countdownTitle}
                </span>

                <div className={countdownStyles.miniRight}>
                  <span className={countdownStyles.miniNumber}>
                    {formattedDaysLeft}
                  </span>
                  <span className={countdownStyles.miniDaysLabel}>
                    days
                  </span>
                </div>
              </div>
            </WidgetContainer>
          </motion.div>
        ) : (
          <motion.div
            key="normal"
            className={countdownStyles.modeWrapper}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <WidgetContainer>
              <WidgetHeader title="Counter">
                <AddButton
                  data-testid={COUNTDOWN_ADD_DATE_TESTID}
                  onClick={() => setIsSetupOpen(true)}
                  tooltip="Edit countdown"
                  variant="ghost"
                >
                  <PenIcon size={16} />
                </AddButton>
              </WidgetHeader>
              <WidgetContent scrollable={false} className={countdownStyles.content}>
                <div className={countdownStyles.mainContainer}>
                  <CountdownBreakdown daysLeft={daysLeft} title={countdownTitle} />
                </div>
              </WidgetContent>
            </WidgetContainer>
          </motion.div>
        )}
      </AnimatePresence>
      <CountdownSetupPanel
        isOpen={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
        anchorSelector={`[data-testid="${COUNTDOWN_ADD_DATE_TESTID}"]`}
      />
    </div>
  );
}
