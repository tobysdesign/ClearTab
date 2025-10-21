"use client";

// Icons replaced with ASCII placeholders
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Button } from "@/components/ui/button";
import { format, differenceInDays, startOfDay } from "@/lib/date-utils";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { useToast } from "@/components/ui/use-toast";
// Payday settings deprecated - now using countdown widget directly
import { useQueryClient } from "@tanstack/react-query";
import styles from "./countdown-widget-settings.module.css";

const _weekDays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function CountdownWidgetSettings() {
  const [activeTab, setActiveTab] = useState<"recurring" | "start-end">(
    "start-end",
  );
  const [frequency, setFrequency] = useState<
    "weekly" | "fortnightly" | "monthly" | "annual"
  >("weekly");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [countdownTitle, setCountdownTitle] = useState<string>("Countdown");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasAttemptedSave, setHasAttemptedSave] = useState(false);
  const [currentlySaved, setCurrentlySaved] = useState<{
    countdownTitle: string;
    mode: "recurring" | "start-end";
    frequency?: string;
    startDate?: Date;
    endDate?: Date;
  } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Payday settings deprecated - initialize with defaults
    setCurrentlySaved({
      countdownTitle: "Countdown",
      mode: "start-end",
    });
  }, []);

  const handleSaveCountSettings = async () => {
    setHasAttemptedSave(true);

    // Simple validation
    if (activeTab === "start-end" && (!startDate || !endDate)) {
      toast({
        title: "Error",
        description: "Please select both start and end dates.",
        variant: "destructive",
      });
      return;
    }
    if (activeTab === "recurring" && !startDate) {
      toast({
        title: "Error",
        description: "Please select a starting date.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setSaveSuccess(false);
    try {
      const settingsToSave = {
        countdownTitle: countdownTitle.trim() || "Countdown",
        countdownMode: activeTab === "start-end" ? "date-range" : "date-range",
        paydayFrequency: activeTab === "start-end" ? "none" : frequency,
        ...(activeTab === "start-end"
          ? {
              startDate,
              endDate,
              paydayDate: null,
            }
          : {
              paydayDate: startDate,
              startDate: null,
              endDate: null,
            }),
      };

      // Payday settings deprecated - just update local state for now
      // Update currently saved state
      setCurrentlySaved({
        countdownTitle: countdownTitle.trim() || "Countdown",
        mode: activeTab,
        frequency: activeTab === "recurring" ? frequency : undefined,
        startDate,
        endDate,
      });

      setSaveSuccess(true);
      toast({
        title: "Success",
        description: "Countdown settings saved successfully",
      });

      // Invalidate query to update widget
      await queryClient.invalidateQueries({ queryKey: ["payday-settings"] });

      // Reset success state after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFrequencyChange = useCallback(
    (value: "weekly" | "fortnightly" | "monthly" | "annual") => {
      setFrequency(value);
    },
    [],
  );

  const handleTabChange = useCallback((tab: "recurring" | "start-end") => {
    setActiveTab(tab);
  }, []);

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      setStartDate(range.from);
      setEndDate(range.to);
    } else if (range?.from) {
      setStartDate(range.from);
      setEndDate(undefined);
    } else {
      setStartDate(undefined);
      setEndDate(undefined);
    }
  };

  // Calculate preview of countdown
  const countdownPreview = useMemo(() => {
    if (activeTab === "start-end") {
      if (!startDate || !endDate) return null;
      const today = startOfDay(new Date());
      const daysUntilStart = differenceInDays(startOfDay(startDate), today);
      const daysUntilEnd = differenceInDays(startOfDay(endDate), today);
      const totalDuration = differenceInDays(
        startOfDay(endDate),
        startOfDay(startDate),
      );

      if (daysUntilEnd < 0) {
        return { status: "ended", message: "Event has ended", days: 0 };
      } else if (daysUntilStart > 0) {
        return {
          status: "upcoming",
          message: `${daysUntilStart} days until start`,
          days: daysUntilStart,
        };
      } else {
        return {
          status: "active",
          message: `Event in progress`,
          subMessage: `${daysUntilEnd} days remaining`,
          days: daysUntilEnd,
        };
      }
    } else {
      // Recurring mode
      if (!startDate) return null;
      const today = startOfDay(new Date());
      const nextOccurrence = startOfDay(startDate);

      if (nextOccurrence < today) {
        return {
          status: "recurring",
          message: "Recurring countdown active",
          subMessage: `Next occurrence will be calculated`,
          days: 0,
        };
      } else {
        const daysUntil = differenceInDays(nextOccurrence, today);
        return {
          status: "recurring",
          message: `${daysUntil} days until next occurrence`,
          subMessage: `Repeats ${frequency}`,
          days: daysUntil,
        };
      }
    }
  }, [activeTab, startDate, endDate, frequency]);

  return (
    <div className={styles.container}>
      <div className={styles.cardContainer}>
        {/* Browser-style Tabs */}
        <div className={styles.tabsContainer}>
          <div
            className={cn(
              styles.browserTab,
              activeTab === "recurring" && styles.activeTab,
            )}
            onClick={() => handleTabChange("recurring")}
          >
            <span>Single</span>
          </div>
          <div
            className={cn(
              styles.browserTab,
              activeTab === "start-end" && styles.activeTab,
            )}
            onClick={() => handleTabChange("start-end")}
          >
            <span>Range</span>
          </div>
        </div>

        <div className={styles.tabContent}>
          {/* Title Input - common to both tabs */}
          <div className={styles.formRow}>
            <label className={styles.formLabel}>COUNTING DOWN TO:</label>
            <Input
              value={countdownTitle}
              onChange={(e) => setCountdownTitle(e.target.value)}
              placeholder="example: My birthday"
              className={styles.formInput}
            />
          </div>

          {/* Tab Content */}
          <div
            style={{ display: activeTab === "recurring" ? "block" : "none" }}
          >
            <div className={styles.formGrid}>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>DATE RANGE</label>
                <DatePicker
                  date={startDate}
                  onSelect={setStartDate}
                  placeholder="22/07/25"
                  className={styles.dateInput}
                  hideIcon={true}
                />
              </div>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>RECUR</label>
                <Select value={frequency} onValueChange={handleFrequencyChange}>
                  <SelectTrigger className={styles.formSelect}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="fortnightly">Fortnightly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div
            style={{ display: activeTab === "start-end" ? "block" : "none" }}
          >
            <div className={styles.formGrid}>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>START</label>
                <DatePicker
                  date={startDate}
                  onSelect={setStartDate}
                  placeholder="22/07/25"
                  className={styles.dateInput}
                  hideIcon={true}
                />
              </div>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>END</label>
                <DatePicker
                  date={endDate}
                  onSelect={setEndDate}
                  placeholder="23/07/25"
                  className={styles.dateInput}
                  hideIcon={true}
                />
              </div>
            </div>
          </div>

          {/* Validation Feedback */}
          {hasAttemptedSave &&
            activeTab === "start-end" &&
            (!startDate || !endDate) && (
              <div className={styles.error}>
                Please select both start and end dates
              </div>
            )}
          {hasAttemptedSave && activeTab === "recurring" && !startDate && (
            <div className={styles.error}>Please select a starting date</div>
          )}

          {/* Save Button */}
          <Button
            onClick={handleSaveCountSettings}
            disabled={isSubmitting}
            className={styles.saveButton}
          >
            {isSubmitting ? "Saving..." : "Set countdown"}
          </Button>

          {/* Success Message */}
          {saveSuccess && (
            <div className={styles.success}>
              Countdown settings saved successfully!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
