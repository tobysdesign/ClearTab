'use client'

// Icons replaced with ASCII placeholders
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { format, getDay } from 'date-fns'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { getPaydaySettings, savePaydaySettings } from '@/lib/actions/settings'
import { useQueryClient } from '@tanstack/react-query'
import Image from 'next/image'
import styles from './finance-settings.module.css'

interface PaydaySettingsData {
  paydayDate?: string | Date
  paydayFrequency?: string
}

const weekDays = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

export function FinanceSettings() {
  const [frequency, setFrequency] = useState<'weekly' | 'fortnightly' | 'monthly'>('fortnightly')
  const [dayOfWeek, setDayOfWeek] = useState<number>()
  const [paydayDate, setPaydayDate] = useState<Date>()
  const [showCalendar, setShowCalendar] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  useEffect(() => {
    async function fetchPaydaySettings() {
      const result = await getPaydaySettings({} as PaydaySettingsData)
      if (result.data) {
        const { paydayDate: date, paydayFrequency: freq } = result.data
        if (freq) setFrequency(freq as 'weekly' | 'fortnightly' | 'monthly')
        if (date) {
          const loadedDate = new Date(date)
          if (freq === 'monthly') {
            setPaydayDate(loadedDate)
          } else {
            setDayOfWeek(getDay(loadedDate))
          }
        }
      }
    }
    fetchPaydaySettings()
  }, [])

  const handleSavePaydaySettings = async () => {
    let dateToSave: Date | undefined

    if (frequency === 'monthly') {
      dateToSave = paydayDate
    } else if (dayOfWeek !== undefined) {
      const today = new Date()
      dateToSave = new Date()
      const currentDay = today.getDay()
      const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7
      dateToSave.setDate(today.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget))
    }

    if (!dateToSave) {
      toast({
        title: 'Error',
        description: 'Please select a payday.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const result = await savePaydaySettings({
        paydayDate: dateToSave,
        paydayFrequency: frequency,
      })

      if (result.serverError) {
        toast({
          title: 'Error',
          description: result.serverError,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Success',
          description: 'Payday settings updated successfully',
        })
        queryClient.invalidateQueries({ queryKey: ['paydaySettings'] })
      }
    } catch {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleFrequencyChange = (value: 'weekly' | 'fortnightly' | 'monthly') => {
    setFrequency(value)
    setDayOfWeek(undefined)
    setPaydayDate(undefined)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.heading}>Payday Settings</h2>
        <p className={styles.description}>
          Configure your payday schedule to help manage your budget.
        </p>
      </div>

      <div className={styles.formContainer}>
        <div className={styles.fieldContainer}>
          <Label htmlFor="frequency">Payday recurrence</Label>
          <Select
            value={frequency}
            onValueChange={handleFrequencyChange}
          >
            <SelectTrigger id="frequency" className={styles.frequencyTrigger}>
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="fortnightly">Fortnightly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className={styles.fieldContainer}>
          <Label>Next payday</Label>
          {frequency === 'monthly' ? (
            <div className={styles.dayPickerContainer}>
              <Button
                variant="outline"
                onClick={() => setShowCalendar(!showCalendar)}
                className={cn(
                  styles.calendarButton,
                  !paydayDate && styles.calendarButtonEmpty
                )}
              >
                <span className={styles.calendarIcon}>◊</span>
                {paydayDate ? format(paydayDate, 'do') : 'Pick a day'}
              </Button>
              {showCalendar && (
                <div className={styles.calendarContainer}>
                  <Calendar
                    mode="single"
                    selected={paydayDate}
                    onSelect={date => {
                      setPaydayDate(date)
                      setShowCalendar(false)
                    }}
                    initialFocus
                  />
                </div>
              )}
            </div>
          ) : (
            <Select
              value={dayOfWeek?.toString()}
              onValueChange={value => setDayOfWeek(Number(value))}
            >
              <SelectTrigger className={styles.daySelectTrigger}>
                <SelectValue placeholder="Pick a day" />
              </SelectTrigger>
              <SelectContent>
                {weekDays.map((day, index) => (
                  <SelectItem key={day} value={index.toString()}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <Button
          onClick={handleSavePaydaySettings}
          disabled={isSubmitting}
          className={styles.saveButton}
        >
          {isSubmitting ? (
            <div className={styles.loadingContainer}>
              <Image
                src="/assets/loading.gif"
                alt="Loading..."
                fill
                className={styles.loadingImage}
                sizes="100vw"
                priority
              />
            </div>
          ) : null}
          {isSubmitting ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
} 