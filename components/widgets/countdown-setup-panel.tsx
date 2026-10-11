"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Button,
  DockPanel,
  Input,
  Select,
  SelectItem,
  useToast,
} from "@cleartab/ui";
import styles from "./countdown-setup-panel.module.css";

type Recurrence = "none" | "weekly" | "fortnightly" | "monthly" | "annual";

const recurrenceOptions: { value: Recurrence; label: string }[] = [
  { value: "none", label: "None" },
  { value: "weekly", label: "Weekly" },
  { value: "fortnightly", label: "Fortnightly" },
  { value: "monthly", label: "Monthly" },
  { value: "annual", label: "Annual" },
];

interface CountdownSetupPanelProps {
  isOpen: boolean;
  onClose: () => void;
  /** CSS selector for the "add date" button this panel grows from. */
  anchorSelector: string;
}

function toApiDate(inputDate: string): string | null {
  if (!inputDate) return null;
  const date = new Date(`${inputDate}T12:00:00.000Z`);
  return date.toISOString();
}

/**
 * A compact, dock-anchored duplicate of the countdown form that lives in
 * Settings. Opened from the empty Counter widget's "Set date" button so the
 * user can configure a countdown inline, with a tail pointing back at the
 * button, instead of being sent into the full Settings drawer.
 */
export function CountdownSetupPanel({
  isOpen,
  onClose,
  anchorSelector,
}: CountdownSetupPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = React.useState(false);
  const [labelInput, setLabelInput] = React.useState("");
  const [dateInput, setDateInput] = React.useState("");
  const [recurrenceInput, setRecurrenceInput] =
    React.useState<Recurrence>("none");

  // Start from a clean form each time the panel opens.
  React.useEffect(() => {
    if (isOpen) {
      setLabelInput("");
      setDateInput("");
      setRecurrenceInput("none");
    }
  }, [isOpen]);

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

      // The widget reads preferences through React Query -- refetch so it
      // flips out of the empty state immediately.
      await queryClient.invalidateQueries({ queryKey: ["preferences"] });

      toast({
        title: "Countdown saved",
        description: "Your widget will refresh shortly.",
      });
      onClose();
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

  return (
    <DockPanel
      isOpen={isOpen}
      onClose={onClose}
      anchorSelector={anchorSelector}
      className={styles.panel}
    >
      <div className={styles.header}>
        <h2 className={styles.title}>New countdown</h2>
        <button type="button" onClick={onClose} className={styles.closeButton}>
          <span>Cancel</span>
          <kbd className={styles.escKey}>Esc</kbd>
        </button>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <span className={styles.label}>Event name</span>
          <Input
            id="countdown-panel-label"
            value={labelInput}
            onChange={(event) => setLabelInput(event.target.value)}
            placeholder="“Birthday”"
            autoFocus
          />
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <span className={styles.label}>Date</span>
            <Input
              id="countdown-panel-date"
              type="date"
              value={dateInput}
              onChange={(event) => setDateInput(event.target.value)}
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Recurrence</span>
            <Select
              id="countdown-panel-recurrence"
              value={recurrenceInput}
              onValueChange={(val) => setRecurrenceInput(val as Recurrence)}
            >
              {recurrenceOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </Select>
          </div>
        </div>

        <div className={styles.actions}>
          <Button
            type="submit"
            disabled={saving}
            tooltipLabel="Save countdown"
            shortcut="⌘S"
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    </DockPanel>
  );
}
