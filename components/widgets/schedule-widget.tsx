'use client'

// Icons replaced with ASCII placeholders
import React, { useMemo, useRef, useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, parseISO, isToday, isAfter, isBefore } from '@/lib/date-utils'
import { motion, AnimatePresence } from 'framer-motion'

import { api } from '@/lib/api-client'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'
import { WidgetLoader, WidgetContainer, WidgetHeader, WidgetContent, Tooltip, TooltipTrigger, TooltipContent } from "@cleartab/ui";
import { useAuth } from '@/components/auth/auth-provider'
import { isExtensionEnvironment } from '@/lib/extension-utils'
import styles from './schedule-widget.module.css'
import { useWidgetHeight } from '@/hooks/use-widget-height'
import { useCalendarVisibility } from '@/hooks/use-calendar-visibility'

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
  /** Which account it came from, for hiding accounts in Settings */
  accountId?: string
}

interface ScheduleQueryResult {
  events: CalendarEvent[];
  needsReconnection?: boolean;
  reconnectReason?: 'revoked' | 'not_connected';
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
  const { isVisible } = useCalendarVisibility()
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

function getInitialCachedSchedule(): ScheduleQueryResult | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const cachedRaw = window.localStorage.getItem('cleartab_cached_schedule_v1');
    if (cachedRaw) {
      const cachedEvents = JSON.parse(cachedRaw);
      if (Array.isArray(cachedEvents) && cachedEvents.length > 0) {
        return { events: cachedEvents, needsReconnection: false };
      }
    }
  } catch {}
  return undefined;
}

  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['schedule'],
    initialData: getInitialCachedSchedule,
    initialDataUpdatedAt: () => 0,
    enabled: !loading || hasSessionCookies, // Enable query if not loading OR if we have session cookies
    retry: (failureCount, error) => {
      const errorWithMeta = error as Error & { errorType?: string; status?: number };
      if (errorWithMeta.status === 401 || errorWithMeta.status === 403) {
        return errorWithMeta.errorType === 'AUTH_EXPIRED' && failureCount < 2;
      }
      // Automatically retry transient network / 5xx errors up to 2 times
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(800 * 2 ** attemptIndex, 5000),
    queryFn: async (): Promise<ScheduleQueryResult> => {
      try {
        const res = await api.get('/api/calendar')
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
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
        // Keep whatever events the server returned (e.g. healthy connected accounts) even when
        // one account needs reconnecting — don't blank the whole schedule.
        const needsReconnection = Boolean(json.success && json.needsReconnection)
        if (needsReconnection) console.warn('Google Calendar reconnection needed for an account')

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
          accountId: event.accountId,
        }));
        console.log('Mapped events:', mappedEvents);
        try {
          window.localStorage.setItem('cleartab_cached_schedule_v1', JSON.stringify(mappedEvents))
        } catch {
          // Ignore storage quota / sandboxed errors
        }
        return { events: mappedEvents, needsReconnection, reconnectReason: json.reason, message: json.message };
      } catch (error) {
        console.error('Error fetching schedule:', error)
        try {
          const cachedRaw = window.localStorage.getItem('cleartab_cached_schedule_v1')
          if (cachedRaw) {
            const cachedEvents = JSON.parse(cachedRaw)
            if (Array.isArray(cachedEvents) && cachedEvents.length > 0) {
              return { events: cachedEvents, needsReconnection: false }
            }
          }
        } catch {
          // Ignore cache read errors
        }
        throw error
      }
    },
  })

  // Destructure events, needsReconnection, and optional message from data
  const events = data?.events || [];
  const needsReconnection = data?.needsReconnection;
  const disconnectionMessage = data?.message;
  const isRevoked = data?.reconnectReason === 'revoked';

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
      // Accounts switched off in Settings
      .filter(event => !event.accountId || isVisible(event.accountId))
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
  }, [events, isVisible])

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

  // Only take over the whole widget with the reconnect prompt when there are no events to show;
  // if other (healthy) accounts returned events, keep showing them.
  if (error || (needsReconnection && events.length === 0)) {
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
                title={isRevoked ? "Calendar access expired" : "Connect Calendar"}
                description={disconnectionMessage || "Connect your Google Calendar to see your schedule."}
                action={{
                  label: isRevoked ? "Reauthorise" : "Connect",
                  onClick: () => signIn('google'),
                }}
              />
            </WidgetContent>
          </WidgetContainer>
        </div>
      )
    }

    // Graceful error state with Try again button
    return (
      <div ref={ref} style={{ width: '100%', height: '100%' }}>
        <WidgetContainer>
          <WidgetHeader title="Schedule" />
          <WidgetContent scrollable={false}>
            <EmptyState
              title="Couldn't load schedule"
              description="Couldn't reach your calendar right now."
              action={{
                label: "Try again",
                onClick: () => {
                  void refetch()
                },
              }}
            />
          </WidgetContent>
        </WidgetContainer>
      </div>
    )
  }

  const visibleDate = visibleDayKey ? parseISO(visibleDayKey) : new Date()

  return (
    <div ref={ref} className={styles.modeWrapper}>
      <AnimatePresence mode="wait" initial={false}>
        {isMini ? (
          <motion.div
            key="mini"
            className={styles.modeWrapper}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <WidgetContainer>
              <div className={styles.miniContainer}>
                {/* Date */}
                <div className={styles.miniDateBadge}>
                  <span className={styles.miniWeekday}>{format(now, 'EEE')}</span>
                  <span className={styles.miniDayNumber}>{format(now, 'dd')}</span>
                </div>

                {/* Event Info */}
                <div className={styles.miniEventContent}>
                  {nextEvent ? (
                    <>
                      <span className={styles.miniEventTitle}>{nextEvent.title}</span>
                      <span className={styles.miniEventTime}>
                        {nextEvent.allDay ? 'All day' : `${format(nextEvent.start.includes('T') ? parseISO(nextEvent.start) : new Date(parseInt(nextEvent.start)), 'h:mm a')}`}
                      </span>
                    </>
                  ) : (
                    <span className={styles.miniNoEvents}>No events today</span>
                  )}
                </div>
              </div>
            </WidgetContainer>
          </motion.div>
        ) : (
          <motion.div
            key="normal"
            className={styles.modeWrapper}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
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
                    <Tooltip>
                      <TooltipTrigger asChild>
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
                      </TooltipTrigger>
                      <TooltipContent>Goto todays date</TooltipContent>
                    </Tooltip>
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ScheduleWidget
