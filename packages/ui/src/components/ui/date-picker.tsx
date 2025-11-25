"use client";

import * as React from "react";
import { format } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import styles from './date-picker.module.css';

interface DatePickerProps {
  date?: Date;
  onSelect?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: (date: Date) => boolean;
  className?: string;
  hideIcon?: boolean;
}

export function DatePicker({
  date,
  onSelect,
  placeholder = "Pick a date",
  disabled,
  className,
  hideIcon = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect?.(undefined);
  };

  const handleSelect = (selectedDate: Date | undefined) => {
    onSelect?.(selectedDate);
    // Close the popover after selection
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            styles.trigger,
            open && styles.triggerOpen,
            !date && styles.placeholder,
            className
          )}
        >
          <span>
            {date ? format(date, "dd/MM/yy") : placeholder}
          </span>
          <span className={styles.iconContainer}>
            {date ? (
              <span
                onClick={handleClear}
                className={styles.clearButton}
                title="Clear date"
              >
                ✕
              </span>
            ) : (
              <span className={styles.dropdownIcon}>▼</span>
            )}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className={styles.calendarPopover}
        align="start"
        style={{ zIndex: 9999 }}
      >
        <CalendarComponent
          mode="single"
          selected={date}
          onSelect={handleSelect}
          disabled={disabled}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
