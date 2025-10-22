'use client'

import React, { useMemo, useRef } from 'react'
import { format, parseISO, isToday } from '@/lib/date-utils'
import { WidgetContainer } from '@/components/ui/widget-container'
import { cn } from '@/lib/utils'
import styles from './schedule-widget.module.css'

// Mock calendar events
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

// Generate mock events with static times to avoid hydration issues
function generateMockEvents(): CalendarEvent[] {
  const today = new Date('2025-10-21');
  
  return [
    {
      id: 'event-1',
      title: 'Team Standup',
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 30).toISOString(), // 9:30 AM
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 40).toISOString(), // 9:40 AM
      description: 'Daily team sync meeting',
      location: 'Conference Room A',
      allDay: false,
      color: '#4285f4',
      calendarId: 'primary',
      calendarName: 'Work Calendar',
      source: 'google'
    },
    {
      id: 'event-2',
      title: 'Check Fantasy Football Squad',
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 45).toISOString(), // 11:45 AM
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0).toISOString(), // 12:00 PM
      description: 'Review and update fantasy team',
      location: '',
      allDay: false,
      color: '#fbbc05',
      calendarId: 'personal',
      calendarName: 'Personal Calendar',
      source: 'google'
    },
    {
      id: 'event-3',
      title: 'Lunch',
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0).toISOString(), // 12:00 PM
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 13, 0).toISOString(), // 1:00 PM
      description: 'Lunch break',
      location: 'Downtown Cafe',
      allDay: false,
      color: '#34a853',
      calendarId: 'personal',
      calendarName: 'Personal Calendar',
      source: 'google'
    },
    {
      id: 'event-4',
      title: 'Meet Jack @ Pub',
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0).toISOString(), // 12:00 PM
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 13, 0).toISOString(), // 1:00 PM
      description: 'Catch up with Jack',
      location: 'The Local Pub',
      allDay: false,
      color: '#ff9800',
      calendarId: 'personal',
      calendarName: 'Personal Calendar',
      source: 'google'
    },
    {
      id: 'event-5',
      title: 'Focus Time',
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 13, 0).toISOString(), // 1:00 PM
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 0).toISOString(), // 4:00 PM
      description: 'Deep work session',
      location: '',
      allDay: false,
      color: '#9c27b0',
      calendarId: 'primary',
      calendarName: 'Work Calendar',
      source: 'google'
    },
    {
      id: 'event-6',
      title: 'Engineering Review',
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 10, 0).toISOString(), // Tomorrow 10:00 AM
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 11, 0).toISOString(), // Tomorrow 11:00 AM
      description: 'Weekly engineering review',
      location: 'Conference Room B',
      allDay: false,
      color: '#ea4335',
      calendarId: 'primary',
      calendarName: 'Work Calendar',
      source: 'google'
    }
  ];
}

const mockEvents: CalendarEvent[] = generateMockEvents();

function EventCard({ event, isCurrent }: { event: CalendarEvent; isCurrent: boolean }) {
  const parseEventTime = (timeStr: string) => {
    if (!timeStr) return new Date();
    return timeStr.includes('T') ? parseISO(timeStr) : new Date(parseInt(timeStr));
  };

  const startTime = parseEventTime(event.start);
  const endTime = parseEventTime(event.end);

  return (
    <div className={cn('widget-list-item widget-list-item--schedule', styles.eventCard, {
      [styles.eventCardCurrent]: isCurrent,
      [styles.eventCardDefault]: !isCurrent
    })}>
      <div className={styles.eventTitle}>{event.title}</div>
      <div className={styles.eventTime}>
        {event.allDay ? 'All day' : `${format(startTime, 'p')} – ${format(endTime, 'p')}`}
      </div>
    </div>
  )
}

function DaySection({
  dayKey,
  events,
  isCurrentDay,
  currentEvent,
  todayRef,
}: {
  dayKey: string
  events: CalendarEvent[]
  isCurrentDay: boolean
  currentEvent?: CalendarEvent
  todayRef: React.RefObject<HTMLDivElement> | null
}) {
  const ref = useRef<HTMLDivElement>(null)

  return (
    <div ref={todayRef || ref} className={styles.daySection}>
      {/* Current time indicator - only on today's section */}
      {isCurrentDay && (
        <div
          className={styles.currentTimeIndicator}
          style={{ top: '40%' }}
        >
          <div className={styles.relativeContainer}>
            <div className={styles.currentTimeLine} />
            <div className={styles.currentTimeDot} />
          </div>
        </div>
      )}

      {/* Inline day header matching Figma design */}
      <div className={styles.dayHeader}>
        {format(parseISO(dayKey), "EEEE do 'of' MMMM")}
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

export function LoginScheduleWidget() {
  const todayRef = useRef<HTMLDivElement>(null)
  const now = new Date()

  // Get all events grouped by day and sort them
  const groupedEvents = useMemo(() => {
    return mockEvents
      .sort((a, b) => {
        const aDate = parseISO(a.start);
        const bDate = parseISO(b.start);
        return aDate.getTime() - bDate.getTime();
      })
      .reduce((acc, event) => {
        try {
          const eventDate = parseISO(event.start);
          const dayKey = format(eventDate, 'yyyy-MM-dd')
          if (!acc[dayKey]) acc[dayKey] = []
          acc[dayKey].push(event)
        } catch (e) {
          console.error('Error processing event date:', e, event)
        }
        return acc
      }, {} as { [key: string]: CalendarEvent[] })
  }, [])

  const sortedDays = useMemo(() => Object.keys(groupedEvents).sort(), [groupedEvents])

  // Get today's events for current event detection
  const todayEvents = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd')
    return groupedEvents[today] || []
  }, [groupedEvents])

  // Find current event (mock - set Fantasy Football as current for demo)
  const currentEvent = todayEvents.find(event => event.title === 'Check Fantasy Football Squad');

  const visibleDate = new Date()

  return (
    <WidgetContainer>
      <div className={styles.container}>
        {/* Left Sidebar */}
        <div className={styles.sidebar}>
          {/* Header matching other widgets' positioning */}
          <div className={styles.sidebarHeader}>
            <h2 className="widget-title">Schedule</h2>
          </div>

          <div className={styles.sidebarContent}>
            {/* Empty top spacer */}
            <div></div>

            {/* Center spacer */}
            <div></div>

            {/* Footer with day/date stacked and month */}
            <div
              className={styles.sidebarFooter}
              style={{ cursor: 'pointer', pointerEvents: 'none' }}
            >
              {/* Day and date stacked */}
              <div className={styles.dayDateContainer}>
                <div className={styles.dayText}>
                  {isToday(visibleDate) && <div className={styles.todayDot} />}
                  {format(visibleDate, 'EEE')}
                </div>
                <div className="bigNumber">
                  {format(visibleDate, 'dd')}
                </div>
              </div>
              {/* Month */}
              <div className={styles.monthText}>
                {format(visibleDate, 'MMMM')}
              </div>
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div className={styles.rightContent}>
          <div className={styles.scrollContainer} style={{ pointerEvents: 'none' }}>
            {sortedDays.map(dayKey => {
              const dayEvents = groupedEvents[dayKey]
              const isCurrentDay = isToday(parseISO(dayKey))

              return (
                <DaySection
                  key={dayKey}
                  dayKey={dayKey}
                  events={dayEvents}
                  isCurrentDay={isCurrentDay}
                  currentEvent={currentEvent}
                  todayRef={isCurrentDay ? todayRef : null}
                />
              )
            })}
          </div>
        </div>
      </div>
    </WidgetContainer>
  )
}