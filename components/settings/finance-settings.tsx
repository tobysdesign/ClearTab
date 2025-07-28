'use client'

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
import { Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { getPaydaySettings, savePaydaySettings } from '@/lib/actions/settings'
import { useQueryClient } from '@tanstack/react-query'
import Image from 'next/image'

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
      const result = await getPaydaySettings()
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
    } catch (error) {
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
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium mb-2">Payday Settings</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Configure your payday schedule to help manage your budget.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="frequency">Payday recurrence</Label>
          <Select
            value={frequency}
            onValueChange={handleFrequencyChange}
          >
            <SelectTrigger id="frequency" className="border-0 focus:ring-0 focus:ring-offset-0 bg-[#8c8c8c] text-black">
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="fortnightly">Fortnightly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Next payday</Label>
          {frequency === 'monthly' ? (
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => setShowCalendar(!showCalendar)}
                className={cn(
                  'justify-start text-left font-normal border-0 focus:ring-0 focus:ring-offset-0 bg-[#8c8c8c] text-black hover:bg-[#7c7c7c] w-full',
                  !paydayDate && 'text-black/70'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {paydayDate ? format(paydayDate, 'do') : 'Pick a day'}
              </Button>
              {showCalendar && (
                <div className="rounded-md border bg-popover p-4">
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
              <SelectTrigger className="border-0 focus:ring-0 focus:ring-offset-0 bg-[#8c8c8c] text-black">
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
          className="w-full"
        >
          {isSubmitting ? (
            <div className="relative w-[45px] h-[25px] mr-2">
              <Image
                src="/assets/loading.gif"
                alt="Loading..."
                fill
                className="object-contain"
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