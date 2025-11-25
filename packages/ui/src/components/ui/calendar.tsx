// Calendar component using CSS Modules (no Tailwind)
import * as React from "react"
import { DayButton, DayPicker } from "react-day-picker"
import { cn } from "@/lib/utils"
import styles from './calendar.module.css'

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(styles.calendar, className)}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: styles.calendar,
        months: styles.months,
        month: styles.month,
        nav: styles.nav,
        button_previous: `${styles.navButton} ${styles.navButtonPrev}`,
        button_next: `${styles.navButton} ${styles.navButtonNext}`,
        month_caption: styles.monthCaption,
        dropdowns: styles.dropdowns,
        dropdown_root: styles.dropdownRoot,
        dropdown: styles.dropdown,
        caption_label: styles.captionLabel,
        table: styles.table,
        weekdays: styles.weekdays,
        weekday: styles.weekday,
        week: styles.week,
        week_number_header: styles.weekNumber,
        week_number: styles.weekNumber,
        day: styles.day,
        range_start: styles.rangeStart,
        range_middle: styles.rangeMiddle,
        range_end: styles.rangeEnd,
        today: styles.dayToday,
        outside: styles.dayOutside,
        disabled: styles.dayDisabled,
        hidden: styles.hidden,
        ...classNames,
      }}
      components={{
        Root: ({ className: rootClassName, rootRef, ...rootProps }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(styles.calendar, rootClassName)}
              {...rootProps}
            />
          )
        },
        Chevron: ({ orientation, ...chevronProps }) => {
          return (
            <span {...chevronProps}>
              {orientation === "left" ? "‹" : "›"}
            </span>
          )
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...weekProps }) => {
          return (
            <td {...weekProps}>
              <div className={styles.weekNumber}>
                {children}
              </div>
            </td>
          )
        },
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const ref = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  const buttonClasses = cn(
    styles.dayButton,
    modifiers.selected && styles.daySelected,
    modifiers.today && styles.dayToday,
    modifiers.outside && styles.dayOutside,
    modifiers.disabled && styles.dayDisabled,
    modifiers.range_start && styles.rangeStart,
    modifiers.range_middle && styles.rangeMiddle,
    modifiers.range_end && styles.rangeEnd,
    className
  )

  return (
    <button
      ref={ref}
      type="button"
      className={buttonClasses}
      data-day={day.date.toLocaleDateString()}
      data-selected={modifiers.selected}
      data-today={modifiers.today}
      data-outside={modifiers.outside}
      data-disabled={modifiers.disabled}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
