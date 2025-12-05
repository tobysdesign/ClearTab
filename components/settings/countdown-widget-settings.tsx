"use client";

import * as React from "react";
import { format } from "@/lib/date-utils";
import { Button } from "@cleartab/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@cleartab/ui";
import { MoreActionsIcon } from "@/components/icons";
import sharedStyles from "./settings-shared.module.css";
import drawerStyles from "./settings-drawer.module.css";

type Recurrence = "none" | "weekly" | "fortnightly" | "monthly" | "annual";

interface CountdownPreferences {
  countdownTitle?: string | null;
  paydayDate?: string | null;
  paydayFrequency?: Recurrence | null;
  startDate?: string | null;
  endDate?: string | null;
}

interface CountdownSummary {
  title: string;
  displayDate: string;
  recurrence: Recurrence;
}

const recurrenceOptions: { value: Recurrence; label: string }[] = [
  { value: "none", label: "None" },
  { value: "weekly", label: "Weekly" },
  { value: "fortnightly", label: "Fortnightly" },
  { value: "monthly", label: "Monthly" },
  { value: "annual", label: "Annual" },
];

interface CountdownWidgetSettingsProps {
  sectionId: string;
  heading: string;
  description?: string;
}

export const CountdownWidgetSettings = React.forwardRef<
  HTMLElement,
  CountdownWidgetSettingsProps
>(function CountdownWidgetSettings({ sectionId, heading, description }, ref) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [clearing, setClearing] = React.useState(false);
  const [summary, setSummary] = React.useState<CountdownSummary | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);

  const [labelInput, setLabelInput] = React.useState("");
  const [dateInput, setDateInput] = React.useState("");
  const [recurrenceInput, setRecurrenceInput] = React.useState<Recurrence>("none");

  const syncFormWithSummary = React.useCallback((next: CountdownSummary | null) => {
    setLabelInput(next?.title ?? "");
    setDateInput(next?.displayDate ?? "");
    setRecurrenceInput(next?.recurrence ?? "none");
  }, []);

  React.useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await fetch("/api/preferences", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to load countdown settings");
        }

        const payload = await response.json();
        const data = (payload?.data ?? {}) as CountdownPreferences;

        if (!active) return;

        const parsed = parseCountdown(data);
        setSummary(parsed);
        syncFormWithSummary(parsed);
      } catch (error) {
        console.error(error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [syncFormWithSummary]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!dateInput || !labelInput.trim()) {
      toast({
        title: "Missing details",
        description: "Both a date and a label are required.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    const payload = {
      countdownTitle: labelInput.trim(),
      countdownMode: "date-range",
      paydayFrequency: recurrenceInput,
      paydayDate: toApiDate(dateInput),
      startDate: null,
      endDate: null,
    };

    try {
      const response = await fetch("/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save countdown");
      }

      const nextSummary: CountdownSummary = {
        title: labelInput.trim(),
        displayDate: dateInput,
        recurrence: recurrenceInput,
      };

      setSummary(nextSummary);
      syncFormWithSummary(nextSummary);
      setIsEditing(false);
      toast({
        title: "Countdown saved",
        description: "Your widget will refresh shortly.",
      });
    } catch (error) {
      toast({
        title: "Unable to save",
        description: "Please try again in a few moments.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setClearing(true);
    try {
      const response = await fetch("/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countdownTitle: null,
          countdownMode: null,
          paydayFrequency: null,
          paydayDate: null,
          startDate: null,
          endDate: null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to clear countdown");
      }

      setSummary(null);
      syncFormWithSummary(null);
      setIsEditing(false);
      toast({
        title: "Countdown cleared",
        description: "Set a new countdown whenever you’re ready.",
      });
    } catch (error) {
      toast({
        title: "Unable to clear countdown",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setClearing(false);
    }
  };

  const displayDate = summary?.displayDate
    ? safeFormat(summary.displayDate, "dd/MM/yy")
    : "—";

  const handleEditStart = React.useCallback(() => {
    syncFormWithSummary(summary);
    setIsEditing(true);
  }, [summary, syncFormWithSummary]);

  const handleCancelEdit = React.useCallback(() => {
    syncFormWithSummary(summary);
    setIsEditing(false);
  }, [summary, syncFormWithSummary]);

  return (
    <section
      ref={ref}
      className={sharedStyles.card}
      style={{ gap: "28px" }}
      data-section-id={sectionId}
    >
      <div className={sharedStyles.rowList} style={{ gap: "14px" }}>
        <div className={sharedStyles.rowListHeader}>
          <div className={drawerStyles.sectionHeading}>
            <h2 className={drawerStyles.sectionTitle}>{heading}</h2>
            {description ? (
              <p className={drawerStyles.sectionDescription}>{description}</p>
            ) : null}
          </div>
        </div>

        {isEditing ? (
          <form
            className={`${sharedStyles.innerCard} ${sharedStyles.inlineFieldRow}`}
            onSubmit={handleSubmit}
          >
            <div className={`${sharedStyles.field} ${sharedStyles.fieldGrow}`}>
              <span className={sharedStyles.label}>Label</span>
              <input
                id="countdown-label"
                value={labelInput}
                onChange={(event) => setLabelInput(event.target.value)}
                placeholder="“Birthday”"
                className={sharedStyles.input}
              />
            </div>

            <div className={`${sharedStyles.field} ${sharedStyles.fieldAuto}`}>
              <span className={sharedStyles.label}>Date</span>
              <input
                id="countdown-date"
                type="date"
                value={dateInput}
                onChange={(event) => setDateInput(event.target.value)}
                className={`${sharedStyles.input} ${sharedStyles.inputAuto}`}
              />
            </div>

            <div className={`${sharedStyles.field} ${sharedStyles.fieldAuto}`}>
              <span className={sharedStyles.label}>Recurrence</span>
              <select
                id="countdown-recurrence"
                value={recurrenceInput}
                onChange={(event) => setRecurrenceInput(event.target.value as Recurrence)}
                className={`${sharedStyles.input} ${sharedStyles.inputSelect} ${sharedStyles.selectAuto}`}
              >
                {recurrenceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={`${sharedStyles.fieldAuto} ${sharedStyles.inlineActions}`}>
              <Button
                type="button"
                className={`${sharedStyles.button} ${sharedStyles.buttonPill} ${sharedStyles.buttonSubtle}`}
                onClick={handleCancelEdit}
                disabled={saving}
                tooltipLabel="Cancel"
                shortcut="Esc"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className={`${sharedStyles.button} ${sharedStyles.buttonPill}`}
                tooltipLabel="Save countdown"
                shortcut="⌘S"
              >
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        ) : (
          <div
            className={sharedStyles.row}
            style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr)) auto" }}
          >
            <div className={sharedStyles.rowMeta}>
              <div>
                <div className={sharedStyles.label}>Name</div>
                <div className={sharedStyles.rowTitle}>
                  {loading ? "Loading…" : summary?.title ?? "—"}
                </div>
              </div>
            </div>
            <div className={sharedStyles.rowMeta}>
              <div>
                <div className={sharedStyles.label}>Date</div>
                <div className={sharedStyles.rowTitle}>{loading ? "Loading…" : displayDate}</div>
              </div>
            </div>
            <div className={sharedStyles.rowMeta}>
              <div>
                <div className={sharedStyles.label}>Recurrence</div>
                <div className={sharedStyles.rowTitle}>
                  {loading ? "Loading…" : formatRecurrence(summary?.recurrence ?? "none")}
                </div>
              </div>
            </div>
            <div className={sharedStyles.rowActions}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className={`${sharedStyles.button} ${sharedStyles.buttonIcon}`}
                    aria-label="Countdown actions"
                    tooltipLabel="Countdown actions"
                    shortcut="⌘/."
                  >
                    <MoreActionsIcon size={16} aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onSelect={() => handleEditStart()}
                    disabled={loading || saving}
                  >
                    {summary ? "Edit details" : "Add countdown"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={sharedStyles.menuDanger}
                    disabled={!summary || clearing}
                    onSelect={() => handleClear()}
                  >
                    Clear countdown
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
      </div>
    </section>
  );
});

CountdownWidgetSettings.displayName = "CountdownWidgetSettings";

function parseCountdown(data: CountdownPreferences): CountdownSummary | null {
  const title = data.countdownTitle ?? "";
  const recurrence = (data.paydayFrequency as Recurrence | undefined) ?? "none";
  const isoDate = data.paydayDate ?? data.startDate ?? null;

  if (!title && !isoDate) {
    return null;
  }

  const displayDate = isoDate ? toInputDate(isoDate) : "";

  return {
    title: title || "Countdown",
    displayDate,
    recurrence,
  };
}

function formatRecurrence(value: Recurrence): string {
  if (value === "none") {
    return "None";
  }
  const [first, ...rest] = value.split("");
  return [first.toUpperCase(), ...rest].join("");
}

function toApiDate(inputDate: string): string | null {
  if (!inputDate) return null;
  const date = new Date(`${inputDate}T12:00:00.000Z`);
  return date.toISOString();
}

function toInputDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function safeFormat(value: string, pattern: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return format(date, pattern);
}
