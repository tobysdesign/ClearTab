'use client'

import { useState, useEffect, useId } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Edit2Icon, SaveIcon } from 'lucide-react'

// This will be in its own file, e.g., components/ui/circular-progress.tsx
function CircularProgress({ percentage, daysLeft }: { percentage: number, daysLeft: number }) {
  const radius = 80
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference
  const id = useId()

  return (
    <div className="relative flex items-center justify-center">
      <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
        <defs>
          <pattern id={id} patternUnits="userSpaceOnUse" width="200" height="200">
            <image href="/dibs.svg" x="0" y="0" width="200" height="200" />
          </pattern>
        </defs>
        {/* Track with dibs */}
        <circle
          stroke={`url(#${id})`}
          fill="transparent"
          strokeWidth="12"
          strokeDasharray="2 6" // This is a fallback if the image doesn't load
          r={radius}
          cx="100"
          cy="100"
          className="opacity-20"
        />
        {/* Progress */}
        <circle
          stroke="hsl(173 80% 50%)"
          fill="transparent"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          r={radius}
          cx="100"
          cy="100"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-5xl font-bold text-white">{daysLeft}</span>
        <span className="text-lg text-neutral-400">days</span>
      </div>
    </div>
  )
}


export function FinanceWidget() {
  const [nextPayday, setNextPayday] = useState<string>('')
  const [payFrequency, setPayFrequency] = useState<string>('bi-weekly')
  const [daysLeft, setDaysLeft] = useState(0)
  const [totalDaysInCycle, setTotalDaysInCycle] = useState(14)
  const [editMode, setEditMode] = useState(false)

  useEffect(() => {
    const savedPayday = localStorage.getItem('nextPayday')
    const savedFrequency = localStorage.getItem('payFrequency')
    if (savedPayday && savedFrequency) {
      setNextPayday(savedPayday)
      setPayFrequency(savedFrequency)
    }
    // Don't force edit mode - show empty state instead
  }, [])

  useEffect(() => {
    if (!nextPayday) return

    const calculateDaysLeft = () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      let payday = new Date(nextPayday)
      payday.setHours(0, 0, 0, 0)
      
      const freqDays = payFrequency === 'weekly' ? 7 : payFrequency === 'bi-weekly' ? 14 : 30
      setTotalDaysInCycle(freqDays)

      // If payday is in the past, calculate the next one
      while (payday < today) {
        payday.setDate(payday.getDate() + freqDays)
      }
      
      // Save the next valid payday for consistency
      if (payday.toISOString().split('T')[0] !== nextPayday) {
        setNextPayday(payday.toISOString().split('T')[0]);
      }

      const diffTime = payday.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      setDaysLeft(diffDays)
    }

    calculateDaysLeft()
    const interval = setInterval(calculateDaysLeft, 1000 * 60 * 60) // Update every hour
    return () => clearInterval(interval)
  }, [nextPayday, payFrequency])

  function handleSave() {
    localStorage.setItem('nextPayday', nextPayday)
    localStorage.setItem('payFrequency', payFrequency)
    setEditMode(false)
  }
  
  const percentage = totalDaysInCycle > 0 ? ((totalDaysInCycle - daysLeft) / totalDaysInCycle) * 100 : 0

  return (
    <Card className="h-full flex flex-col border border-border">
      <CardHeader className="flex flex-row items-center justify-between flex-shrink-0 px-6 pt-6 pb-1.5">
        <CardTitle>Finance</CardTitle>
        {(nextPayday || editMode) && (
          <Button variant="ghost" size="icon" onClick={editMode ? handleSave : () => setEditMode(true)}>
            {editMode ? <SaveIcon className="h-4 w-4"/> : <Edit2Icon className="h-4 w-4" />}
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto relative">
        {editMode ? (
          <div className="space-y-4 w-full p-4">
            <div>
              <label className="text-sm font-medium">Next Pay Day</label>
              <Input 
                type="date" 
                value={nextPayday}
                onChange={(e) => setNextPayday(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Pay Frequency</label>
               <Select value={payFrequency} onValueChange={setPayFrequency}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : nextPayday ? (
          <div className="flex flex-col items-center justify-center h-full">
             <CircularProgress percentage={percentage} daysLeft={daysLeft} />
            <p className="mt-4 text-lg text-subtext">Until pay day</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-medium text-foreground">Set up your payday tracker</h3>
              <p className="text-sm text-subtext mt-2">Track days until your next payday</p>
            </div>
            <Button onClick={() => setEditMode(true)}>
              Set up payday
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 