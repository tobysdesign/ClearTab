"use client";

// Icons replaced with ASCII placeholders
import { Input } from "@cleartab/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@cleartab/ui";
import { DatePicker } from "@cleartab/ui";
import { DateRangePicker } from "@cleartab/ui";
import { Button } from "@cleartab/ui";
import { format, differenceInDays, startOfDay, formatDateSmart } from "@/lib/date-utils";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { useEffect, useState, useMemo, useCallback, memo, useRef } from "react";
import { useToast } from "@cleartab/ui";
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
  const [showForm, setShowForm] = useState(true); // New state to control form vs card view
  const [isEditing, setIsEditing] = useState(false); // Track if we're editing existing countdown
  const [showMenu, setShowMenu] = useState(false); // Control dropdown menu
  const [isInitialLoading, setIsInitialLoading] = useState(true); // Track initial data loading
  const [currentlySaved, setCurrentlySaved] = useState<{
    countdownTitle: string;
    mode: "recurring" | "start-end";
    frequency?: string;
    startDate?: Date;
    endDate?: Date;
  } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  useEffect(() => {
    // LOCAL-FIRST: Load from localStorage immediately, sync with API in background
    const loadSettings = () => {
      try {
        // STEP 1: Load from localStorage immediately (instant UI)
        const localData = localStorage.getItem('countdown-preferences');
        console.log('📱 Loading countdown preferences from localStorage');

        if (localData) {
          const data = JSON.parse(localData);
          loadDataIntoState(data);
        }

        // Always finish loading immediately, don't wait for API
        setIsInitialLoading(false);

        // STEP 2: Sync with API in background (no UI blocking)
        backgroundSync();

      } catch (error) {
        console.error('Error loading local countdown settings:', error);
        setIsInitialLoading(false);
      }
    };

    const backgroundSync = async () => {
      try {
        console.log('🔄 Background syncing countdown preferences...');

        // Non-blocking API call with timeout
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Background sync timeout')), 10000)
        );

        const apiPromise = fetch('/api/preferences');
        const response = await Promise.race([apiPromise, timeoutPromise]) as Response;

        if (response.ok) {
          const { data: remoteData } = await response.json();
          const localData = localStorage.getItem('countdown-preferences');

          if (remoteData) {
            // Simple conflict resolution: remote data wins if different
            const localParsed = localData ? JSON.parse(localData) : {};
            const hasChanges = JSON.stringify(localParsed) !== JSON.stringify(remoteData);

            if (hasChanges) {
              console.log('🔄 Updating local data from remote sync');
              localStorage.setItem('countdown-preferences', JSON.stringify(remoteData));

              // Only update UI if user hasn't made changes since loading
              if (!isEditing && !isSubmitting) {
                loadDataIntoState(remoteData);
              }
            } else {
              console.log('✅ Local and remote data in sync');
            }
          }
        }
      } catch (error) {
        console.log('⚠️ Background sync failed (this is ok):', error.message);
        // Background sync failures are silent - don't affect user experience
      }
    };

    const loadDataIntoState = (data: any) => {
      // Load saved settings
      setCountdownTitle(data.countdownTitle || 'Countdown');

      // Determine which tab to show based on saved data
      if (data.paydayFrequency && data.paydayFrequency !== 'none') {
        // Has recurrence frequency, show Single tab
        setActiveTab('recurring');
      } else {
        // No recurrence, show Range tab
        setActiveTab('start-end');
      }
      // Parse dates from database timestamps
      if (data.startDate) {
        setStartDate(new Date(data.startDate));
      }
      if (data.endDate) {
        setEndDate(new Date(data.endDate));
      }
      if (data.paydayDate) {
        setStartDate(new Date(data.paydayDate));
      }
      if (data.paydayFrequency && data.paydayFrequency !== 'none') {
        setFrequency(data.paydayFrequency);
      }
      setCurrentlySaved({
        countdownTitle: data.countdownTitle || 'Countdown',
        mode: (data.paydayFrequency && data.paydayFrequency !== 'none') ? 'recurring' : 'start-end',
        frequency: data.paydayFrequency,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      });

      // If we have saved data, show the card view instead of form
      if (data.countdownTitle || data.startDate || data.endDate || data.paydayDate) {
        setShowForm(false);
      }
    };

    loadSettings();
  }, [isEditing, isSubmitting]);

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
      // Prepare dates - preserve the selected date without timezone conversion
      const prepareDate = (date: Date | undefined) => {
        if (!date) return null;
        // Format as YYYY-MM-DD to avoid timezone conversion issues
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}T12:00:00.000Z`; // Fixed UTC timestamp at noon
      };

      const settingsToSave = {
        countdownTitle: countdownTitle.trim() || "Countdown",
        countdownMode: "date-range", // Always use date-range mode for both tabs
        paydayFrequency: activeTab === "start-end" ? "none" : frequency,
        ...(activeTab === "start-end"
          ? {
              startDate: prepareDate(startDate),
              endDate: prepareDate(endDate),
              paydayDate: null,
            }
          : {
              paydayDate: prepareDate(startDate),
              startDate: null,
              endDate: null,
            }),
      };

      console.log('💾 Saving countdown:', settingsToSave.countdownTitle, activeTab);

      // Save to API
      const response = await fetch('/api/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsToSave),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, errorText);
        throw new Error('Failed to save settings');
      }

      const result = await response.json();
      console.log('✅ Save response:', result);

      // Update currently saved state
      setCurrentlySaved({
        countdownTitle: countdownTitle.trim() || "Countdown",
        mode: activeTab,
        frequency: activeTab === "recurring" ? frequency : undefined,
        startDate,
        endDate,
      });

      setSaveSuccess(true);
      setHasAttemptedSave(false); // Reset validation state on successful save
      setIsEditing(false); // Clear editing state
      setShowForm(false); // Switch to card view
      toast({
        title: "Success",
        description: "Countdown settings saved successfully",
      });

      // Clear local cache and invalidate query to update widget
      localStorage.removeItem('countdown-preferences-cache');
      localStorage.removeItem('countdown-preferences-cache-time');
      console.log('🔄 Invalidating React Query cache...');
      await queryClient.invalidateQueries({ queryKey: ["preferences"] });

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

  const handleEditCountdown = () => {
    setIsEditing(true);
    setShowForm(true);
    setShowMenu(false);
  };

  const handleDeleteCountdown = async () => {
    if (!window.confirm('Are you sure you want to delete this countdown?')) {
      return;
    }

    try {
      const response = await fetch('/api/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countdownTitle: null,
          countdownMode: null,
          paydayFrequency: null,
          startDate: null,
          endDate: null,
          paydayDate: null,
        }),
      });

      if (response.ok) {
        setCurrentlySaved(null);
        setShowForm(true);
        setIsEditing(false);
        // Reset form
        setCountdownTitle("Countdown");
        setStartDate(undefined);
        setEndDate(undefined);
        setActiveTab("start-end");
        // Clear cache after successful delete
        localStorage.removeItem('countdown-preferences-cache');
        localStorage.removeItem('countdown-preferences-cache-time');
        toast({
          title: "Success",
          description: "Countdown deleted successfully",
        });
        await queryClient.invalidateQueries({ queryKey: ["preferences"] });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete countdown",
        variant: "destructive",
      });
    }
    setShowMenu(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setShowForm(false);
    setHasAttemptedSave(false);
    // Reset form to saved values
    if (currentlySaved) {
      setCountdownTitle(currentlySaved.countdownTitle);
      setActiveTab(currentlySaved.mode);
      setStartDate(currentlySaved.startDate);
      setEndDate(currentlySaved.endDate);
      if (currentlySaved.frequency) {
        setFrequency(currentlySaved.frequency as "weekly" | "fortnightly" | "monthly" | "annual");
      }
    }
  };

  const handleMenuToggle = () => {
    setShowMenu(!showMenu);
  };

  // Skeleton loading components
  const SkeletonForm = () => (
    <div className={styles.container}>
      <div className={styles.cardContainer}>
        {/* Browser-style Tabs Skeleton */}
        <div className={styles.tabsContainer}>
          <div className={`${styles.skeletonTab} ${styles.skeleton}`} />
          <div className={`${styles.skeletonTab} ${styles.skeleton}`} />
        </div>

        <div className={styles.skeletonContainer}>
          {/* Title Input Skeleton */}
          <div className={styles.formRow}>
            <div className={`${styles.skeletonLabel} ${styles.skeleton}`} />
            <div className={`${styles.skeletonInput} ${styles.skeleton}`} />
          </div>

          {/* Form Fields Skeleton */}
          <div className={styles.skeletonRow}>
            <div className={styles.formRow}>
              <div className={`${styles.skeletonLabel} ${styles.skeleton}`} />
              <div className={`${styles.skeletonHalfInput} ${styles.skeleton}`} />
            </div>
            <div className={styles.formRow}>
              <div className={`${styles.skeletonLabel} ${styles.skeleton}`} />
              <div className={`${styles.skeletonHalfInput} ${styles.skeleton}`} />
            </div>
          </div>

          {/* Button Skeleton */}
          <div className={`${styles.skeletonButton} ${styles.skeleton}`} />
        </div>
      </div>
    </div>
  );

  const SkeletonCard = () => (
    <div className={styles.container}>
      <div className={styles.skeletonCard}>
        <div className={`${styles.skeletonCardTitle} ${styles.skeleton}`} />
        <div className={`${styles.skeletonCardMenu} ${styles.skeleton}`} />

        <div className={`${styles.skeletonLabel} ${styles.skeleton}`} style={{ width: '60%', marginBottom: '4px' }} />
        <div className={`${styles.skeletonEventTitle} ${styles.skeleton}`} />

        <div className={styles.skeletonCardRow}>
          <div className={styles.skeletonCardLeft}>
            <div className={styles.skeletonCardField}>
              <div className={`${styles.skeletonFieldLabel} ${styles.skeleton}`} />
              <div className={`${styles.skeletonFieldValue} ${styles.skeleton}`} />
            </div>
            <div className={styles.skeletonCardField}>
              <div className={`${styles.skeletonFieldLabel} ${styles.skeleton}`} />
              <div className={`${styles.skeletonFieldValue} ${styles.skeleton}`} />
            </div>
          </div>

          <div className={styles.skeletonDaysRight}>
            <div className={`${styles.skeletonDaysLabel} ${styles.skeleton}`} />
            <div className={`${styles.skeletonDaysValue} ${styles.skeleton}`} />
          </div>
        </div>
      </div>
    </div>
  );

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

  // Show skeleton while initially loading
  if (isInitialLoading) {
    // We don't know if we'll show a form or card yet, so show a generic skeleton
    // that could be either (we'll default to form skeleton)
    return <SkeletonForm />;
  }

  // Show compact card if we have saved data and not in form mode
  if (!showForm && currentlySaved) {
    return (
      <div className={styles.container}>
        <div className={styles.countdownCard}>
          <div className={styles.countdownCardTitle}>Countdown widget</div>
          <div className={styles.menuContainer} ref={menuRef}>
            <div className={styles.countdownCardMenu} onClick={handleMenuToggle}>⋯</div>
            {showMenu && (
              <div className={styles.menuDropdown}>
                <button className={styles.menuItem} onClick={handleEditCountdown}>
                  Edit
                </button>
                <button
                  className={`${styles.menuItem} ${styles.deleteItem}`}
                  onClick={handleDeleteCountdown}
                >
                  Delete
                </button>
              </div>
            )}
          </div>

          <div className={styles.countdownName}>NAME OF COUNTDOWN</div>
          <div className={styles.countdownEventName}>
            {currentlySaved.countdownTitle}
          </div>

          <div className={styles.countdownDetails}>
            <div className={styles.countdownDateInfo}>
              {currentlySaved.mode === "start-end" ? (
                <>
                  <div className={styles.countdownField}>
                    <div className={styles.countdownFieldLabel}>FROM</div>
                    <div className={styles.countdownFieldValue}>
                      {currentlySaved.startDate ? format(currentlySaved.startDate, "dd/MM/yy") : "—"}
                    </div>
                  </div>
                  <div className={styles.countdownField}>
                    <div className={styles.countdownFieldLabel}>TO</div>
                    <div className={styles.countdownFieldValue}>
                      {currentlySaved.endDate ? format(currentlySaved.endDate, "dd/MM/yy") : "—"}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.countdownField}>
                    <div className={styles.countdownFieldLabel}>DATE</div>
                    <div className={styles.countdownFieldValue}>
                      {currentlySaved.startDate ? format(currentlySaved.startDate, "dd/MM/yy") : "—"}
                    </div>
                  </div>
                  <div className={styles.countdownField}>
                    <div className={styles.countdownFieldLabel}>RECUR</div>
                    <div className={styles.countdownFieldValue}>
                      {currentlySaved.frequency ?
                        currentlySaved.frequency.charAt(0).toUpperCase() + currentlySaved.frequency.slice(1)
                        : "None"}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className={styles.countdownDaysField}>
              <div className={styles.countdownDaysLabel}>DAYS UNTIL</div>
              <div className={styles.countdownDaysValue}>
                {countdownPreview ? (
                  countdownPreview.status === "ended"
                    ? "0 days"
                    : `${countdownPreview.days} days`
                ) : "— days"}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                  placeholder="Please select"
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
                  placeholder="Please select"
                  className={styles.dateInput}
                  hideIcon={true}
                />
              </div>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>END</label>
                <DatePicker
                  date={endDate}
                  onSelect={setEndDate}
                  placeholder="Please select"
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

          {/* Save/Cancel Buttons */}
          {isEditing ? (
            <div className={styles.buttonRow}>
              <Button
                variant="outline"
                onClick={handleCancelEdit}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleSaveCountSettings}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Update countdown"}
              </Button>
            </div>
          ) : (
            <Button
              variant="default"
              onClick={handleSaveCountSettings}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Set countdown"}
            </Button>
          )}

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
