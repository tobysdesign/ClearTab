'use client'

import React, { useCallback, useState } from 'react'
import { SimpleDropdown, Checkbox } from '@cleartab/ui'
import { AddIcon } from '@/components/icons'
import { useCalendarVisibility } from '@/hooks/use-calendar-visibility'
import { apiFetch } from '@/lib/api-fetch'
import { IS_EXTENSION, siteUrl } from '@/lib/platform'
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
 * ("N calendars") that opens a checkbox list for toggling each calendar's visibility,
 * plus an "Add account" action mirroring the one in Settings. Checkboxes write to the
 * same useCalendarVisibility store the Settings switches use, so the agenda filters live.
 */
export function ScheduleCalendarFilter({ calendars }: { calendars: ScheduleCalendar[] }) {
  const { isVisible, setVisible } = useCalendarVisibility()
  const [isAdding, setIsAdding] = useState(false)

  // Mirror of the Settings "Add account" flow: the extension opens the website (linking
  // needs the website session); the web app resolves the Google auth URL and redirects.
  const handleAddAccount = useCallback(async () => {
    if (isAdding) return
    if (IS_EXTENSION) {
      window.open(siteUrl('/settings'), '_blank', 'noopener')
      return
    }
    setIsAdding(true)
    try {
      const res = await apiFetch('/api/auth/google-link-url?next=/settings', { credentials: 'include' })
      const payload = await res.json().catch(() => ({} as Record<string, unknown>))
      const authUrl = [payload.authUrl, payload.url, payload.authorizationUrl].find(
        (v): v is string => typeof v === 'string' && v.length > 0,
      )
      if (!res.ok || !authUrl) {
        throw new Error(typeof payload.message === 'string' ? payload.message : 'Failed to get authorization URL')
      }
      window.location.href = authUrl
    } catch (err) {
      console.error('Failed to start account linking', err)
      setIsAdding(false)
    }
  }, [isAdding])

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
        <div className={styles.menuLabel}>Visible:</div>
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
        <button
          type="button"
          className={styles.addRow}
          onClick={handleAddAccount}
          disabled={isAdding}
        >
          <AddIcon size={14} aria-hidden />
          <span className={styles.rowLabel}>Add account</span>
        </button>
      </div>
    </SimpleDropdown>
  )
}

export default ScheduleCalendarFilter
