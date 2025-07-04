'use client'

import React, { useMemo, useRef, useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, parseISO, isPast, isToday, isAfter, isBefore } from 'date-fns'

import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Building, Calendar } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'
import { WidgetLoader } from './widget-loader'

// Interfaces
interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
}

// Components
function TimeIndicator({ now, event, gap }: { now: Date; event?: CalendarEvent; gap?: { start: Date; end: Date } }) {
  if (event) {
    // Time indicator within an event
    const start = parseISO(event.start)
    const end = parseISO(event.end)
    const duration = end.getTime() - start.getTime()
    if (duration <= 0) return null

    const elapsed = now.getTime() - start.getTime()
    const progress = (elapsed / duration) * 100
    
    return (
      <div className="absolute inset-0" style={{ top: `${progress}%`, zIndex: 10 }}>
        <div className="absolute left-[-20px] top-1/2 -translate-y-1/2 w-3 h-3 bg-[#FA531C] rounded-full" />
        <div className="absolute left-[-8px] top-1/2 -translate-y-1/2 h-[2px] w-[calc(100%+8px)] bg-[#FA531C]" />
      </div>
    )
  } else if (gap) {
    // Time indicator in a gap between events
    return (
      <div className="relative w-full flex items-center" style={{ zIndex: 10 }}>
        <div className="absolute left-[-20px] w-3 h-3 bg-[#FA531C] rounded-full" />
        <div className="absolute left-[-8px] h-[2px] w-[calc(100%+8px)] bg-[#FA531C]" />
      </div>
    )
  }
  
  return null
}

function GapIndicator({ gap, now }: { gap: { start: Date; end: Date }; now: Date }) {
  const durationMinutes = (gap.end.getTime() - gap.start.getTime()) / (1000 * 60)
  const height = Math.max(8, durationMinutes * 0.5) // 0.5px per minute, min 8px
  
  // Check if current time is within this gap
  const isCurrentTimeInGap = now >= gap.start && now <= gap.end
  
  return (
    <div style={{ height: `${height}px` }} className="relative">
      {isCurrentTimeInGap && (
        <div className="absolute top-1/2 -translate-y-1/2 w-full">
          <TimeIndicator now={now} gap={gap} />
        </div>
      )}
    </div>
  )
}

function EventCard({ event, isCurrent, now }: { event: CalendarEvent; isCurrent: boolean; now: Date }) {
  return (
    <div className={cn('listItem relative', { 'opacity-60': isPast(parseISO(event.end)) })}>
      <div className="flex-1 min-w-0">
        <div className="font-medium leading-tight text-sm text-foreground">{event.title}</div>
        <div className="text-xs text-muted-foreground mt-1 font-light tracking-wide">
          {format(parseISO(event.start), 'p')} – {format(parseISO(event.end), 'p')}
      </div>
      </div>
      {isCurrent && <TimeIndicator now={now} event={event} />}
    </div>
  )
}

function OfficeEventCard({ event }: { event: CalendarEvent }) {
    return (
      <div className="border border-[#3C3C3C] rounded-lg p-3 flex flex-row items-center shadow-sm mb-2 bg-transparent hover:bg-[#252525] transition-colors">
        <Building className="text-muted-foreground" size={14} />
        <div className="font-medium text-sm text-white ml-2.5">{event.title}</div>
    </div>
  )
}

function DaySection({
  dayKey,
  events, 
  now,
  onVisible 
}: {
  dayKey: string; 
  events: CalendarEvent[]; 
  now: Date;
  onVisible: (dayKey: string) => void;
}) {
  const dayDate = parseISO(dayKey)
    const officeEvent = events.find(e => !e.start.includes('T'))
    const timedEvents = events.filter(e => e.start.includes('T'))

    const currentEvent = timedEvents.find(
      event => isAfter(now, parseISO(event.start)) && isBefore(now, parseISO(event.end))
    )

    const eventItems: React.ReactNode[] = []
    let lastEventEnd: Date | null = null

    // Check if we need to show indicator before the first event
    if (timedEvents.length > 0) {
      const firstEventStart = parseISO(timedEvents[0].start)
      const dayStart = new Date(dayDate)
      dayStart.setHours(0, 0, 0, 0)
      
      if (now < firstEventStart && now >= dayStart) {
        eventItems.push(
          <div key="before-first" className="py-1">
            <TimeIndicator now={now} gap={{ start: dayStart, end: firstEventStart }} />
          </div>
        )
      }
    }

    timedEvents.forEach((event, index) => {
        const eventStart = parseISO(event.start)
        const eventEnd = parseISO(event.end)
        
        // Add gap indicator if there's a gap between events
        if (lastEventEnd && isAfter(eventStart, lastEventEnd)) {
            eventItems.push(
              <GapIndicator 
                key={`gap-${event.id}`} 
                gap={{ start: lastEventEnd, end: eventStart }} 
                now={now}
              />
            )
        }
        
        eventItems.push(
          <EventCard 
            key={event.id} 
            event={event} 
            isCurrent={currentEvent?.id === event.id} 
            now={now}
          />
        )
        lastEventEnd = eventEnd
        
        // Check if we need to show indicator after the last event
        if (index === timedEvents.length - 1) {
          const dayEnd = new Date(dayDate)
          dayEnd.setHours(23, 59, 59, 999)
          
          if (now > eventEnd && now <= dayEnd) {
            eventItems.push(
              <div key="after-last" className="py-1">
                <TimeIndicator now={now} gap={{ start: eventEnd, end: dayEnd }} />
              </div>
            )
    }
        }
    })

    // Use intersection observer to detect when this day becomes visible
    const ref = useRef<HTMLDivElement>(null)
    useEffect(() => {
        const element = ref.current
        if (!element) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    onVisible(dayKey)
                }
            },
            { threshold: 0.5 }
        )

        observer.observe(element)
        return () => observer.unobserve(element)
    }, [dayKey, onVisible])

  return (
        <div ref={ref} className="space-y-2">
            {officeEvent && <OfficeEventCard event={officeEvent} />}
            {eventItems}
    </div>
  )
}

export function ScheduleWidget() {
  const { data: events = [], isLoading, error } = useQuery<CalendarEvent[]>({
    queryKey: ['schedule'],
    queryFn: async () => {
      const res = await fetch('/api/calendar')
      if (!res.ok) throw new Error('Failed to fetch schedule')
      return (await res.json())?.data ?? []
    },
    retry: false,
  })

  const [now, setNow] = useState(new Date())
  const [visibleDayKey, setVisibleDayKey] = useState<string | null>(null)
  const todayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000) // update 'now' every minute
    return () => clearInterval(timer)
  }, [])

  const groupedEvents = useMemo(() => {
    const sortedEvents = [...events].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    return sortedEvents.reduce((acc, event) => {
      try {
        const dayKey = format(parseISO(event.start), 'yyyy-MM-dd')
        if (!acc[dayKey]) acc[dayKey] = []
        acc[dayKey].push(event)
      } catch (e) { /* ignore invalid dates */ }
      return acc
    }, {} as { [key: string]: CalendarEvent[] })
  }, [events])

  const sortedDays = useMemo(() => Object.keys(groupedEvents).sort(), [groupedEvents])

  // Set initial visible day to today or first day with events
  useEffect(() => {
    if (!visibleDayKey && sortedDays.length > 0) {
      const todayKey = format(new Date(), 'yyyy-MM-dd')
      const initialDay = sortedDays.includes(todayKey) ? todayKey : sortedDays[0]
      setVisibleDayKey(initialDay)
    }
  }, [sortedDays, visibleDayKey])

  useEffect(() => {
    if (!isLoading && todayRef.current) {
        todayRef.current.scrollIntoView({ block: 'start', behavior: 'smooth' })
    }
  }, [isLoading])

  // Get visible day info for left column
  const visibleDayDate = visibleDayKey ? parseISO(visibleDayKey) : new Date()
  const visibleDayEvents = visibleDayKey ? groupedEvents[visibleDayKey] || [] : []

  if (isLoading) {
    return <WidgetLoader className="schedule" />
  }

  if (error) {
    return (
      <Card className="dashCard flex-col items-center justify-center p-6 text-center">
        <p className="font-bold text-destructive">Error loading schedule</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </Card>
    )
  }

  return (
    <Card className="dashCard h-full flex flex-col overflow-hidden">
      <div className="flex flex-row flex-1 min-h-0">
        {/* Sticky Left Column */}
        <div className="flex flex-col w-[90px] h-full justify-between flex-shrink-0 px-3 py-2">
          <div className="flex flex-col">
            <div className="font-inter-display text-xs font-medium text-muted-foreground tracking-wide uppercase mb-1">
              {format(visibleDayDate, 'EEE')}
            </div>
            <div className="font-tiny font-normal text-[55px] text-white leading-[.8] tracking-tighter mt-1">
              {format(visibleDayDate, 'dd')}
            </div>
            <div className="font-inter-display text-xs font-medium text-muted-foreground tracking-wide uppercase">
              {format(visibleDayDate, 'MMM')}
            </div>
          </div>
          <div className="flex flex-row items-center">
            <div className="font-tiny font-thin text-lg text-white leading-[.9]">{visibleDayEvents.length.toString().padStart(2, '0')}</div>
            <div className="font-inter-display text-xs font-medium text-muted-foreground mt-1 ml-1">Events</div>
        </div>
      </div>

        {/* Scrollable Right Column */}
        <div className="flex flex-col flex-1 min-w-0 border-l border-border/50">
          <ScrollArea className="flex-1">
            <div className="px-3 py-2 space-y-3">
            {sortedDays.map(dayKey => (
                <div key={dayKey} ref={isToday(parseISO(dayKey)) ? todayRef : null}>
              <DaySection
                dayKey={dayKey}
                    events={groupedEvents[dayKey]}
                now={now}
                    onVisible={setVisibleDayKey}
                  />
                </div>
              ))}
              {sortedDays.length === 0 && (
                <EmptyState
                  icon={Calendar}
                  title="No events scheduled"
                  description="Your calendar is clear. Connect your Google Calendar to see upcoming events and appointments."
                  className="pt-20"
                />
              )}
          </div>
        </ScrollArea>
        </div>
      </div>
    </Card>
  )
}

export default ScheduleWidget 