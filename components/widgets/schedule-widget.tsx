'use client'

import React, { useMemo, useRef, useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, parseISO, isPast, isToday, isAfter, isBefore } from 'date-fns'

import Calendar from 'lucide-react/dist/esm/icons/calendar'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'
import { WidgetLoader } from './widget-loader'
import { WidgetContainer } from '@/components/ui/widget-container'
import { WidgetHeader } from '@/components/ui/widget-header'

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

function EventCard({ event, isCurrent }: { event: CalendarEvent; isCurrent: boolean }) {
  const parseEventTime = (timeStr: string) => {
    if (!timeStr) return new Date();
    return timeStr.includes('T') ? parseISO(timeStr) : new Date(parseInt(timeStr));
  };
  
  const startTime = parseEventTime(event.start);
  const endTime = parseEventTime(event.end);
  
  return (
    <div className={cn('relative p-3 rounded-lg bg-[#2a2a2a] mb-3', {
      'bg-[#3a2a3a]': isCurrent
    })}>
      <div className="text-white font-medium mb-1">{event.title}</div>
      <div className="text-gray-400 text-sm">
        {format(startTime, 'p')} – {format(endTime, 'p')}
      </div>
    </div>
  )
}

function DaySection({
  dayKey,
  events,
  now,
  isCurrentDay,
  currentEvent,
  todayRef,
  onVisible,
}: {
  dayKey: string
  events: CalendarEvent[]
  now: Date
  isCurrentDay: boolean
  currentEvent?: CalendarEvent
  todayRef: React.RefObject<HTMLDivElement> | null
  onVisible: (dayKey: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const onVisibleRef = useRef(onVisible)
  
  // Update the ref when onVisible changes
  useEffect(() => {
    onVisibleRef.current = onVisible
  }, [onVisible])
  
  useEffect(() => {
    const element = ref.current || todayRef?.current
    if (!element) return

    const handleScroll = () => {
      const rect = element.getBoundingClientRect()
      const containerRect = element.closest('.overflow-y-auto')?.getBoundingClientRect()
      
      if (containerRect && rect.top <= containerRect.top + 100 && rect.bottom >= containerRect.top + 50) {
        onVisibleRef.current(dayKey)
      }
    }

    const scrollContainer = element.closest('.overflow-y-auto')
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll)
      handleScroll() // Check initial position
      
      return () => {
        scrollContainer.removeEventListener('scroll', handleScroll)
      }
    }
  }, [dayKey, todayRef])

  return (
    <div ref={todayRef || ref} className="mb-6 relative">
      {/* Current time indicator - only on today's section */}
      {isCurrentDay && (
        <div 
          className="absolute left-0 right-0 z-20 pointer-events-none" 
          style={{ top: '40%' }}
        >
          <div className="relative">
            <div className="absolute left-0 right-0 h-0.5 bg-rose-400" />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-rose-400 rounded-full -ml-1" />
          </div>
        </div>
      )}
      
      {/* Inline day header matching Figma design */}
      <div className="text-sm font-medium text-gray-300 mb-4 px-1">
        {format(parseISO(dayKey), 'EEEE do \'of\' MMMM')}
      </div>
      
      {/* Events for this day */}
      {events.map(event => (
        <EventCard
          key={event.id}
          event={event}
          isCurrent={currentEvent?.id === event.id}
        />
      ))}
    </div>
  )
}


export function ScheduleWidget() {
  const {
    data: events = [],
    isLoading,
    error,
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

  const [now, setNow] = useState(new Date())
  const [visibleDayKey, setVisibleDayKey] = useState<string | null>(null)
  const todayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000) // update 'now' every minute
    return () => clearInterval(timer)
  }, [])

  // Get all events grouped by day and sort them
  const groupedEvents = useMemo(() => {
    const now = new Date()
    const twoWeeksAgo = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000))
    return [...events]
      .filter(event => {
        // Include events from 2 weeks ago onwards
        try {
          const eventDate = typeof event.start === 'string' ? 
            (event.start.includes('T') ? parseISO(event.start) : new Date(parseInt(event.start))) : 
            new Date();
          return eventDate >= new Date(twoWeeksAgo.getFullYear(), twoWeeksAgo.getMonth(), twoWeeksAgo.getDate())
        } catch (e) {
          return false
        }
      })
      .sort((a, b) => {
        const aDate = typeof a.start === 'string' ? 
          (a.start.includes('T') ? parseISO(a.start) : new Date(parseInt(a.start))) : 
          new Date();
        const bDate = typeof b.start === 'string' ? 
          (b.start.includes('T') ? parseISO(b.start) : new Date(parseInt(b.start))) : 
          new Date();
        return aDate.getTime() - bDate.getTime();
      })
      .reduce((acc, event) => {
        try {
          const eventDate = typeof event.start === 'string' ? 
            (event.start.includes('T') ? parseISO(event.start) : new Date(parseInt(event.start))) : 
            new Date();
          const dayKey = format(eventDate, 'yyyy-MM-dd')
          if (!acc[dayKey]) acc[dayKey] = []
          acc[dayKey].push(event)
        } catch (e) {
          console.error('Error processing event date:', e, event)
        }
        return acc
      }, {} as { [key: string]: CalendarEvent[] })
  }, [events])

  const sortedDays = useMemo(() => Object.keys(groupedEvents).sort(), [groupedEvents])
  
  // Get today's events for current event detection
  const todayEvents = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd')
    return groupedEvents[today] || []
  }, [groupedEvents])

  // Find current event
  const currentEvent = todayEvents.find(event => {
    const parseEventTime = (timeStr: string) => {
      if (!timeStr) return new Date();
      return timeStr.includes('T') ? parseISO(timeStr) : new Date(parseInt(timeStr));
    };
    
    const startTime = parseEventTime(event.start);
    const endTime = parseEventTime(event.end);
    return isAfter(now, startTime) && isBefore(now, endTime);
  });

  // Set initial visible day to today
  useEffect(() => {
    if (!visibleDayKey) {
      const todayKey = format(new Date(), 'yyyy-MM-dd')
      setVisibleDayKey(todayKey)
    }
  }, [visibleDayKey])

  // Scroll to today on initial load
  useEffect(() => {
    if (!isLoading && todayRef.current) {
      setTimeout(() => {
        todayRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
      }, 100)
    }
  }, [isLoading])

  const scrollToToday = () => {
    const todayKey = format(new Date(), 'yyyy-MM-dd')
    setVisibleDayKey(todayKey)
    if (todayRef.current) {
      todayRef.current.scrollIntoView({ block: 'start', behavior: 'smooth' })
    }
  }

  if (isLoading) {
    return <WidgetLoader className="schedule" />
  }

  if (error) {
    const isAuthError = error.message.includes('Google Calendar not connected');
    return (
      <WidgetContainer>
        <WidgetHeader title="Schedule" className='widget-title'/>
        <div className="flex flex-col items-center justify-center p-6 text-center">
          {isAuthError ? (
             <EmptyState
              renderIcon={() => <Calendar className="h-6 w-6 text-gray-400" />}
              title="Connect your calendar"
              description="See your schedule at a glance by connecting your Google Calendar."
              action={{
                label: "Go to Settings",
                onClick: () => window.location.href = '/settings'
              }}
            />
          ) : (
            <>
              <p className="font-bold text-destructive">Error loading schedule</p>
              <p className="text-sm text-muted-foreground">{error.message}</p>
            </>
          )}
        </div>
      </WidgetContainer>
    )
  }

  const visibleDate = visibleDayKey ? parseISO(visibleDayKey) : new Date()

  return (
    <WidgetContainer>
      <div className="flex h-full">
        {/* Left Sidebar */}
        <div className="flex flex-col w-[12 0px] h-full justify-between flex-shrink-0 pb-[24px] border-r border-[#323235] pt-[14px]">
          {/* Header in first column */}
          <div className="mb-4">
            <h2 className="text-white font-medium widget-title text-center h-[60px] ">Schedule</h2>
          </div>
          
          <div className="flex flex-col items-center justify-center flex-1">
            <div className="flex items-center text-xs font-medium text-gray-400 uppercase mb-1">
              {isToday(visibleDate) && <div className="w-2 h-2 rounded-full bg-rose-400 mr-2" />}
              {format(visibleDate, 'EEE')}
            </div>
            <div className="bigNumber">
              {format(visibleDate, 'dd')}
            </div>
            <div className="text-xs font-medium text-gray-400 uppercase">
              {format(visibleDate, 'MMM')}
            </div>
          </div>
          <button 
            onClick={scrollToToday}
            className="text-rose-400 text-sm hover:text-rose-300 transition-colors font-medium"
          >
            Goto Today
          </button>
        </div>

        {/* Right Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto p-3">
            {sortedDays.length === 0 ? (
              <EmptyState
                renderIcon={() => <Calendar className="h-6 w-6 text-gray-400" />}
                title="No events scheduled"
                description="Your calendar is clear. Connect your Google Calendar to see upcoming events."
                className="pt-20"
              />
            ) : (
              sortedDays.map(dayKey => {
                const dayEvents = groupedEvents[dayKey]
                const isCurrentDay = isToday(parseISO(dayKey))
                
                return (
                  <DaySection
                    key={dayKey}
                    dayKey={dayKey}
                    events={dayEvents}
                    now={now}
                    isCurrentDay={isCurrentDay}
                    currentEvent={currentEvent}
                    todayRef={isCurrentDay ? todayRef : null}
                    onVisible={setVisibleDayKey}
                  />
                )
              })
            )}
          </div>
        </div>
      </div>
    </WidgetContainer>
  )
}

export default ScheduleWidget