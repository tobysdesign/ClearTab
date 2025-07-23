'use client'

import React, { useMemo, useRef, useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, parseISO, isPast, isToday, isAfter, isBefore } from 'date-fns'

import { Card } from '@/components/ui/card'
import Building from 'lucide-react/dist/esm/icons/building'
import Calendar from 'lucide-react/dist/esm/icons/calendar'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'
import { WidgetLoader } from './widget-loader'
import styles from './widget.module.css'
import { ScrollShadows } from '@/components/ui/scroll-shadows'
import Link from 'next/link'
import Settings from 'lucide-react/dist/esm/icons/settings'
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw'

// Interfaces
interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  description?: string
  location?: string
  allDay?: boolean
  color?: string
  calendarId?: string
  calendarName?: string
  source: 'google' | 'local'
}

// Components
function NowIndicator() {
  return <div className="absolute inset-y-0 left-0 w-1 bg-rose-500 rounded-full" />
}

// Current time indicator component
function CurrentTimeIndicator() {
  const [position, setPosition] = useState(0)
  
  useEffect(() => {
    const updatePosition = () => {
      const now = new Date()
      const minutes = now.getHours() * 60 + now.getMinutes()
      const dayMinutes = 24 * 60
      setPosition((minutes / dayMinutes) * 100)
    }
    
    updatePosition()
    const timer = setInterval(updatePosition, 60000) // Update every minute
    return () => clearInterval(timer)
  }, [])
  
  return (
    <div 
      className="absolute left-0 right-0 z-10 pointer-events-none" 
      style={{ top: `${position}%` }}
    >
      <div className="relative">
        <div className="absolute left-0 right-0 h-0.5 bg-rose-500" />
        <div className="absolute -left-1 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-rose-500" />
        <div className="absolute -right-1 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-rose-500" />
      </div>
    </div>
  )
}

// Helper function to generate consistent colors for calendars
function generateCalendarColor(calendarId: string): string {
  // Simple hash function to generate consistent colors for the same calendar
  const calendarIdHash = calendarId.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  
  // List of calendar colors
  const calendarColors = [
    '#3788d8', // blue
    '#47a447', // green
    '#f89406', // yellow/orange
    '#9370db', // purple
    '#ff69b4', // pink
    '#5f9ea0', // teal
    '#d9534f', // red
    '#ff7f50', // coral
  ];
  
  return calendarColors[calendarIdHash % calendarColors.length];
}

function EventCard({ event, isCurrent, isPast }: { event: CalendarEvent; isCurrent: boolean; isPast: boolean }) {
  // Parse start and end times, handling both string and number formats
  const parseEventTime = (timeStr: string) => {
    if (!timeStr) return new Date();
    return timeStr.includes('T') ? parseISO(timeStr) : new Date(parseInt(timeStr));
  };
  
  const startTime = parseEventTime(event.start);
  const endTime = parseEventTime(event.end);
  
  // Get the event color from the event or generate one based on calendarId
  const eventColor = event.color || (event.calendarId ? generateCalendarColor(event.calendarId) : undefined);
  
  return (
    <div className={cn('listItem relative pl-4', { 'opacity-50': isPast, 'font-semibold': isCurrent })}>
      {isCurrent && <NowIndicator />}
      <div className="flex-1 min-w-0 border-l-2" style={{ borderColor: eventColor || 'var(--color-border)' }}>
        <div className="font-medium leading-tight text-sm text-foreground">{event.title}</div>
        <div className="text-xs text-muted-foreground mt-1 font-light tracking-wide">
          {format(startTime, 'p')} – {format(endTime, 'p')}
          {event.calendarName && (
            <span className="ml-2 text-xs opacity-70">• {event.calendarName}</span>
          )}
        </div>
      </div>
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
  onVisible,
}: {
  dayKey: string
  events: CalendarEvent[]
  now: Date
  onVisible: (dayKey: string) => void
}) {
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
      { threshold: 0.5 },
    )

    observer.observe(element)
    return () => {
      if (element) {
        observer.unobserve(element)
      }
    }
  }, [dayKey, onVisible])

  const parseEventTime = (timeStr: string) => {
    if (!timeStr) return new Date();
    return timeStr.includes('T') ? parseISO(timeStr) : new Date(parseInt(timeStr));
  };

  const officeEvent = events.find(e => !e.start.includes('T') && !e.start.match(/^\d+$/))
  const timedEvents = events.filter(e => e.start.includes('T') || e.start.match(/^\d+$/))

  const currentEvent = timedEvents.find(event => {
    const startTime = parseEventTime(event.start);
    const endTime = parseEventTime(event.end);
    return isAfter(now, startTime) && isBefore(now, endTime);
  });

  const eventItems = timedEvents.map(event => (
    <EventCard
      key={event.id}
      event={event}
      isCurrent={currentEvent?.id === event.id}
      isPast={isPast(parseEventTime(event.end))}
    />
  ))

  return (
    <div ref={ref} className="space-y-2">
      {officeEvent && <OfficeEventCard event={officeEvent} />}
      {eventItems}
    </div>
  )
}

export function ScheduleWidget() {
  const {
    data: events = [],
    isLoading,
    error,
    refetch,
  } = useQuery<CalendarEvent[]>({
    queryKey: ['schedule'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/calendar')
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to fetch schedule');
        }
        const json = await res.json()
        const eventsFromServer = json.data || []
        if (!Array.isArray(eventsFromServer)) return []
        return eventsFromServer.map((event: any) => ({
          id: event.id,
          title: event.title,
          start: event.start || event.startTime || '',
          end: event.end || event.endTime || '',
          description: event.description,
          location: event.location,
          allDay: event.allDay,
          color: event.color,
          calendarId: event.calendarId,
          calendarName: event.calendarName,
          source: event.source || 'google',
        }))
      } catch (error) {
        console.error('Error fetching schedule:', error)
        return []
      }
    },
    retry: false,
  })

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setTimeout(() => setRefreshing(false), 500); // Add a small delay to show the refresh animation
    }
  };

  const [now, setNow] = useState(new Date())
  const [visibleDayKey, setVisibleDayKey] = useState<string | null>(null)
  const todayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000) // update 'now' every minute
    return () => clearInterval(timer)
  }, [])

  // Group events by day
  const groupedEvents = useMemo(() => {
    return [...events]
      .sort((a, b) => {
        // Handle both string and number date formats
        const aDate = typeof a.start === 'string' ? 
          (a.start.includes('T') ? new Date(a.start) : new Date(parseInt(a.start))) : 
          new Date();
        const bDate = typeof b.start === 'string' ? 
          (b.start.includes('T') ? new Date(b.start) : new Date(parseInt(b.start))) : 
          new Date();
        return aDate.getTime() - bDate.getTime();
      })
      .reduce((acc, event) => {
        try {
          // Handle both string and number date formats
          const eventDate = typeof event.start === 'string' ? 
            (event.start.includes('T') ? parseISO(event.start) : new Date(parseInt(event.start))) : 
            new Date();
          const dayKey = format(eventDate, 'yyyy-MM-dd')
          if (!acc[dayKey]) acc[dayKey] = []
          acc[dayKey].push(event)
        } catch (e) {
          /* ignore invalid dates */
          console.error('Error processing event date:', e, event)
        }
        return acc
      }, {} as { [key: string]: CalendarEvent[] })
  }, [events])

  // Extract unique calendars for the legend
  const uniqueCalendars = useMemo(() => {
    const calendarsMap = new Map<string, { name: string, color: string }>();
    
    events.forEach(event => {
      if (event.calendarId && event.calendarName && !calendarsMap.has(event.calendarId)) {
        // Generate color for calendar if not provided
        const color = event.color || generateCalendarColor(event.calendarId);
        calendarsMap.set(event.calendarId, { 
          name: event.calendarName,
          color
        });
      }
    });
    
    return Array.from(calendarsMap.values());
  }, [events]);

  const sortedDays = useMemo(() => Object.keys(groupedEvents).sort(), [groupedEvents])

  useEffect(() => {
    if (!visibleDayKey && sortedDays.length > 0) {
      const todayKey = format(new Date(), 'yyyy-MM-dd')
      const initialDay = sortedDays.includes(todayKey) ? todayKey : sortedDays[0]
      setVisibleDayKey(initialDay)
    }
  }, [sortedDays, visibleDayKey])

  useEffect(() => {
    if (!isLoading && todayRef.current) {
      setTimeout(() => {
        todayRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
      }, 100)
    }
  }, [isLoading])
  
  const scrollToToday = () => {
    if (todayRef.current) {
      todayRef.current.scrollIntoView({ block: 'start', behavior: 'smooth' })
    }
  }

  const visibleDayDate = visibleDayKey ? parseISO(visibleDayKey) : new Date()
  const visibleDayEvents = visibleDayKey ? groupedEvents[visibleDayKey] || [] : []

  if (isLoading) {
    return <WidgetLoader className="schedule" />
  }

  if (error) {
    return (
      <div className={styles.widgetContainer}>
        <div className={cn(styles.widgetContent, "flex flex-col items-center justify-center p-6 text-center")}>
          <p className="font-bold text-destructive">Error loading schedule</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.widgetContainer}>
      <div className={styles.widgetContent}>
        <div className="flex flex-row h-full">
          {/* Fixed Sidebar */}
          <div className="flex flex-col w-[90px] h-full justify-between flex-shrink-0 px-3 py-2 border-r" style={{ borderColor: '#323235 !important' }}>
            <div className="flex flex-col">
              <div className="flex items-center justify-between">
                <div className="font-inter-display text-xs font-medium text-muted-foreground tracking-wide uppercase mb-1">
                  {format(visibleDayDate, 'EEE')}
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={isLoading || refreshing}
                  className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  title="Refresh Calendar"
                >
                  <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                </button>
              </div>
              <div className="font-tiny font-light text-[55px] text-white leading-[.8] tracking-tighter mt-1">
                {format(visibleDayDate, 'dd')}
              </div>
              <div className="font-inter-display text-xs font-medium text-muted-foreground tracking-wide uppercase">
                {format(visibleDayDate, 'MMM')}
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex flex-row items-center">
                <div className="font-tiny font-light text-lg text-white leading-[.9]">
                  {visibleDayEvents.length.toString().padStart(2, '0')}
                </div>
                <div className="font-inter-display text-xs font-medium text-muted-foreground mt-1 ml-1">Events</div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <button 
                  onClick={scrollToToday}
                  className="text-rose-400 text-sm hover:text-rose-300 transition-colors font-medium"
                >
                  View Today
                </button>
                <Link 
                  href="/settings"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="Calendar Settings"
                >
                  <Settings size={14} />
                </Link>
              </div>
              
              {/* Calendar Legend */}
              {uniqueCalendars.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">Calendars</div>
                  {uniqueCalendars.map((cal, index) => (
                    <div key={index} className="flex items-center text-xs">
                      <div 
                        className="w-2 h-2 rounded-full mr-1.5 flex-shrink-0" 
                        style={{ backgroundColor: cal.color || 'var(--color-border)' }}
                      />
                      <div className="truncate text-muted-foreground" title={cal.name}>
                        {cal.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-hidden inner-right-shadow relative">
            <CurrentTimeIndicator />
            <ScrollShadows className="h-full" color="#161515">
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
                    renderIcon={() => <Calendar className="h-6 w-6 text-gray-400" />}
                    title="No events scheduled"
                    description="Your calendar is clear. Connect your Google Calendar to see upcoming events."
                    className="pt-20"
                  />
                )}
              </div>
            </ScrollShadows>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ScheduleWidget 