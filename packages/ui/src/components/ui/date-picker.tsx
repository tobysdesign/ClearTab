"use client";

// Icons replaced with ASCII placeholders
import * as React from "react";
import { format } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-between text-left font-normal h-auto px-3 py-2 text-sm transition-all duration-200",
            "bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] text-white",
            "hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.4)]",
            "focus:bg-[rgba(255,255,255,0.08)] focus:border-[rgba(255,255,255,0.4)] focus:shadow-[0_0_0_1px_rgba(255,255,255,0.1)]",
            "data-[state=open]:bg-[rgba(255,255,255,0.08)] data-[state=open]:border-[rgba(255,255,255,0.4)]",
            !date && "text-[rgba(255,255,255,0.5)]",
            className,
          )}
          style={{ borderRadius: '0.375rem' }}
        >
          <span>
            {date ? format(date, "dd/MM/yy") : <span>{placeholder}</span>}
          </span>
          <span className="text-white/60 ml-2">⌄</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <CalendarComponent
          mode="single"
          selected={date}
          onSelect={onSelect}
          disabled={disabled}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
