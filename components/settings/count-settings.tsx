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
import CalendarIcon from 'lucide-react/dist/esm/icons/calendar'
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

export function CountSettings() {
  const [frequency, setFrequency] = useState<'weekly' | 'fortnightly' | 'monthly'>('fortnightly')
  const [dayOfWeek, setDayOfWeek] = useState<number>(0) // Default to Sunday
  const [countDate, setCountDate] = useState<Date>()
  const [showCalendar, setShowCalendar] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  useEffect(() => {
    async function fetchCountSettings() {
      const result = await getPaydaySettings({} as any)
      if (result.data) {
        const { paydayDate: date, paydayFrequency: freq } = result.data
        if (freq) setFrequency(freq as 'weekly' | 'fortnightly' | 'monthly')
        if (date) {
          const loadedDate = new Date(date)
          setCountDate(loadedDate)
          setDayOfWeek(getDay(loadedDate))
        }
      }
    }
    fetchCountSettings()
  }, [])

  const handleSaveCountSettings = async () => {
    if (!countDate) {
      toast({
        title: 'Error',
        description: 'Please select a count date.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const result = await savePaydaySettings({
        paydayDate: countDate,
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
          description: 'Count settings updated successfully',
        })
        queryClient.invalidateQueries({ queryKey: ['payday-settings'] })
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
    // Keep the selected date for all frequency types
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-white mb-3">Count Settings</h2>
        <p className="text-sm text-white mb-4">
          Configure your counter.
        </p>
      </div>

      <div className="space-y-6">
        {/* Recurrence Section */}
        <div>
          <h3 className="text-lg font-medium text-white mb-4">Reuccrence</h3>
          <Select
            value={frequency}
            onValueChange={handleFrequencyChange}
          >
            <SelectTrigger className="bg-[#111111] border border-[#2A2A2A] text-white">
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="fortnightly">Fortnightly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Start On Section */}
        <div>
          <h3 className="text-lg font-medium text-white mb-4">Start on</h3>
          <div className="space-y-2">
            <Button
              variant="outline"
              onClick={() => setShowCalendar(!showCalendar)}
              className={cn(
                'justify-start text-left font-normal bg-[#111111] border border-[#2A2A2A] text-white hover:bg-[#1A1A1A] w-full',
                !countDate && 'text-400/40'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {countDate ? format(countDate, frequency === 'monthly' ? 'do' : 'PPP') : 'Pick a date'}
            </Button>
            {showCalendar && (
              <div className="rounded-md border bg-popover p-4">
                <Calendar
                  mode="single"
                  selected={countDate}
                  onSelect={date => {
                    setCountDate(date)
                    setShowCalendar(false)
                  }}
                  initialFocus
                />
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSaveCountSettings}
          disabled={isSubmitting}
          className="w-full bg-white text-black hover:bg-white/40 rounded-full py-3"
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