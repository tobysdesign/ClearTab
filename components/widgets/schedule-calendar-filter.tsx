'use client'

import React from 'react'
import { SimpleDropdown, Checkbox } from '@cleartab/ui'
import { useCalendarVisibility } from '@/hooks/use-calendar-visibility'
import styles from './schedule-calendar-filter.module.css'

export interface ScheduleCalendar {
  /** Visibility store key: `primary-<userId>` for the signed-in account, the account id otherwise */
  key: string
  /** Display name shown in the dropdown row */
  label: string
  isPrimary?: boolean
}

/**
 * Shows under the Schedule heading when more than one calendar is linked: a pill
 * ("N calendars") that opens a checkbox list for toggling each calendar's visibility.
 * Checkboxes write to the same useCalendarVisibility store the Settings switches use,
 * so the agenda filters in real time.
 */
export function ScheduleCalendarFilter({ calendars }: { calendars: ScheduleCalendar[] }) {
  const { isVisible, setVisible } = useCalendarVisibility()

  if (calendars.length <= 1) return null

  const label = `${calendars.length} calendar${calendars.length === 1 ? '' : 's'}`

  return (
    <SimpleDropdown
      align="left"
      trigger={
        <button type="button" className={styles.pill} aria-label="Filter calendars">
          {label}
        </button>
      }
    >
      <div className={styles.menu} role="group" aria-label="Calendars">
        {calendars.map((cal) => {
          const checked = isVisible(cal.key)
          return (
            <label key={cal.key} className={styles.row}>
              <Checkbox
                checked={checked}
                onCheckedChange={(value) => setVisible(cal.key, value === true)}
                aria-label={`Toggle ${cal.label}`}
              />
              <span className={styles.rowLabel}>{cal.label}</span>
              {cal.isPrimary && <span className={styles.primaryTag}>Primary</span>}
            </label>
          )
        })}
      </div>
    </SimpleDropdown>
  )
}

export default ScheduleCalendarFilter
