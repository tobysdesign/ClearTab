'use client'

// Icons replaced with ASCII placeholders
import React, { useMemo, useRef, useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, parseISO, isToday, isAfter, isBefore } from '@/lib/date-utils'
import { motion } from 'framer-motion'

import { api } from '@/lib/api-client'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'
import { WidgetLoader, WidgetContainer, WidgetHeader, WidgetContent } from "@cleartab/ui";
import { useAuth } from '@/components/auth/auth-provider'
import { getSupabaseClient, isExtensionEnvironment } from '@/lib/extension-utils'
import styles from './schedule-widget.module.css'
import { useWidgetHeight } from '@/hooks/use-widget-height'

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

interface ScheduleQueryResult {
  events: CalendarEvent[];
  needsReconnection?: boolean;
  message?: string;
}

function EventCard({ event, isCurrent }: { event: CalendarEvent; isCurrent: boolean }) {
  const parseEventTime = (timeStr: string) => {
    if (!timeStr) return new Date();
    return timeStr.includes('T') ? parseISO(timeStr) : new Date(parseInt(timeStr));
  };

  const startTime = parseEventTime(event.start);
  const endTime = parseEventTime(event.end);

  return (
    <motion.div
      className={cn('widget-list-item widget-list-item--schedule', styles.eventCard, {
        [styles.eventCardCurrent]: isCurrent,
        [styles.eventCardDefault]: !isCurrent
      })}
      whileHover={{ x: 2 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <div className={styles.eventTitle}>{event.title}</div>
      <div className={styles.eventTime}>
        {event.allDay ? 'All day' : `${format(startTime, 'p')} – ${format(endTime, 'p')}`}
      </div>
    </motion.div>
  )
}

function DaySection({
  dayKey,
  events,
  now: _now,
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
  // Use auth
  const { loading, signIn } = useAuth()
  const { ref, isMini } = useWidgetHeight()

  // Check if calendar was just connected (from URL param)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('calendar') === 'connected') {
        console.log('✅ PRIMARY: Calendar connection successful! Reloading data...');
        // Remove the param from URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
        // Refetch will happen automatically via React Query
      }
    }
  }, []);

  // Check if we have session cookies as a workaround for auth loading issues
  const hasSessionCookies = typeof document !== 'undefined' && document.cookie.includes('sb-qclvzjiyglvxtctauyhb-auth-token')

  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['schedule'],
    enabled: !loading || hasSessionCookies, // Enable query if not loading OR if we have session cookies
    retry: (failureCount, error) => {
      const errorWithMeta = error as Error & { errorType?: string; status?: number };
      // Retry auth errors up to 2 times (token refresh might fix it)
      if (errorWithMeta.errorType === 'AUTH_EXPIRED' && failureCount < 2) {
        return true;
      }
      // Don't retry other errors
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    queryFn: async (): Promise<ScheduleQueryResult> => {
      try {
        const res = await api.get('/api/calendar')
        if (!res.ok) {
          const errorData = await res.json();
          const error = new Error(errorData.error || 'Failed to fetch schedule') as Error & {
            errorType?: string;
            userMessage?: string;
            status?: number;
            userEmail?: string;
          };
          error.errorType = errorData.errorType;
          error.userMessage = errorData.message;
          error.status = res.status;
          error.userEmail = errorData.userEmail;
          throw error;
        }
        const json = await res.json()
        console.log('API response:', json);

        // Check if calendar needs reconnection - handle gracefully without throwing
        if (json.success && json.needsReconnection) {
          console.warn('Google Calendar disconnection detected');
          return { events: [], needsReconnection: true, message: json.message };
        }

        const eventsFromServer = json.data || []
        console.log('Events from server:', eventsFromServer);
        if (!Array.isArray(eventsFromServer)) return { events: [] }
        const mappedEvents = eventsFromServer.map((event: any): CalendarEvent => ({
          id: event.id,
          title: event.title,
          start: event.start || event.startTime || '',
          end: event.end || event.endTime || '',
          description: event.description || '',
          location: event.location || '',
          allDay: event.allDay || false,
          color: event.color || '',
          calendarId: event.calendarId || '',
          calendarName: event.calendarName || '',
          source: (event.source as 'google' | 'local') || 'google',
        }));
        console.log('Mapped events:', mappedEvents);
        return { events: mappedEvents, needsReconnection: false, message: json.message };
      } catch (error) {
        console.error('Error fetching schedule:', error)
        throw error
      }
    },
  })

  // Destructure events, needsReconnection, and optional message from data
  const events = data?.events || [];
  const needsReconnection = data?.needsReconnection;
  const disconnectionMessage = data?.message;

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
    const eventsArray = Array.isArray(events) ? events : []
    return [...eventsArray]
      .filter(event => {
        // Include events from 2 weeks ago onwards
        try {
          const eventDate = typeof event.start === 'string' ?
            (event.start.includes('T') ? parseISO(event.start) : new Date(parseInt(event.start))) :
            new Date();
          return eventDate >= new Date(twoWeeksAgo.getFullYear(), twoWeeksAgo.getMonth(), twoWeeksAgo.getDate())
        } catch {
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

  // Scroll to today on initial load - scroll within container, not page
  useEffect(() => {
    if (!isLoading && todayRef.current) {
      const scrollContainer = todayRef.current.closest('.overflow-y-auto') ||
        todayRef.current.closest('[class*="scrollContainer"]')
      if (scrollContainer) {
        setTimeout(() => {
          const elementTop = todayRef.current?.offsetTop || 0
          scrollContainer.scrollTop = Math.max(0, elementTop - 50)
        }, 100)
      }
    }
  }, [isLoading])

  // Find next upcoming event for mini view - Moved here to follow Rules of Hooks
  const nextEvent = useMemo(() => {
    return todayEvents.find(e => {
      const endTime = e.end.includes('T') ? parseISO(e.end) : new Date(parseInt(e.end));
      return isBefore(now, endTime);
    }) || todayEvents[0];
  }, [todayEvents, now]);

  if ((loading && !hasSessionCookies) || isLoading) {
    return (
      <div ref={ref} style={{ width: '100%', height: '100%' }}>
        <WidgetLoader className="schedule" />
      </div>
    )
  }

  if (error || needsReconnection) {
    // Show connection UI for reconnection state or specific auth errors
    const isConnectionError = needsReconnection ||
      error?.message?.includes('not connected') ||
      error?.message?.includes('Invalid authentication');

    if (isConnectionError) {
      return (
        <div ref={ref} style={{ width: '100%', height: '100%' }}>
          <WidgetContainer>
            <WidgetHeader title="Schedule" />
            <WidgetContent scrollable={false}>
              <EmptyState
                title="Connect Calendar"
                description={disconnectionMessage || "Connect your Google Calendar to see your schedule."}
                action={{
                  label: "Connect",
                  onClick: () => window.location.href = '/api/auth/connect-primary-calendar?next=/',
                }}
              />
            </WidgetContent>
          </WidgetContainer>
        </div>
      )
    }

    // Generic error fallback
    console.log('Schedule widget error:', error);
    return (
      <div ref={ref} style={{ width: '100%', height: '100%' }}>
        <WidgetContainer>
          <WidgetHeader title="Schedule" />
          <WidgetContent scrollable={false}>
            <div className="p-4 text-sm text-red-400">
              <p className="font-bold mb-2">Error loading schedule</p>
              <pre className="whitespace-pre-wrap text-xs opacity-70">
                {error instanceof Error ? error.message : 'Unknown error'}
              </pre>
            </div>
          </WidgetContent>
        </WidgetContainer>
      </div>
    )
  }

  const visibleDate = visibleDayKey ? parseISO(visibleDayKey) : new Date()

  return (
    <div ref={ref} style={{ width: '100%', height: '100%' }}>
      {isMini ? (
        <WidgetContainer>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            height: '100%',
            padding: '0 1rem',
            gap: '1rem'
          }}>
            {/* Date */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
              <span style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.4)' }}>{format(now, 'EEE')}</span>
              <span style={{ fontSize: '18px', fontWeight: 600, color: '#c4c4c4' }}>{format(now, 'dd')}</span>
            </div>

            {/* Event Info */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {nextEvent ? (
                <>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#c4c4c4', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nextEvent.title}</span>
                  <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)' }}>
                    {nextEvent.allDay ? 'All day' : `${format(nextEvent.start.includes('T') ? parseISO(nextEvent.start) : new Date(parseInt(nextEvent.start)), 'h:mm a')}`}
                  </span>
                </>
              ) : (
                <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.4)' }}>No events today</span>
              )}
            </div>
          </div>
        </WidgetContainer>
      ) : (
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
                  onClick={() => {
                    // Scroll to today within container
                    if (todayRef.current) {
                      const scrollContainer = todayRef.current.closest('.overflow-y-auto') ||
                        todayRef.current.closest('[class*="scrollContainer"]')
                      if (scrollContainer) {
                        const elementTop = todayRef.current.offsetTop
                        scrollContainer.scrollTo({
                          top: Math.max(0, elementTop - 50),
                          behavior: 'smooth'
                        })
                      }
                    }
                  }}
                  style={{ cursor: 'pointer' }}
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
              <div className={styles.scrollContainer}>
                {sortedDays.length === 0 ? (
                  <EmptyState
                    title="No events scheduled"
                    description="Your calendar is clear for the next 30 days."
                    className={styles.emptyStateContainer}
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
      )}
    </div>
  )
}

export default ScheduleWidget
