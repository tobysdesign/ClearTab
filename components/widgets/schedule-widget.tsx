'use client'

// Icons replaced with ASCII placeholders
import React, { useMemo, useRef, useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, parseISO, isToday, isAfter, isBefore } from '@/lib/date-utils'

import { api } from '@/lib/api-client'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'
import { WidgetLoader } from './widget-loader'
import { WidgetContainer } from '@/components/ui/widget-container'
import { WidgetHeader } from '@/components/ui/widget-header'
import { useAuth } from '@/components/auth/supabase-auth-provider'
import { getSupabaseClient, isExtensionEnvironment } from '@/lib/extension-utils'
import styles from './schedule-widget.module.css'

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
  const { loading, user } = useAuth()
  
  
  // Check if we have session cookies as a workaround for auth loading issues
  const hasSessionCookies = typeof document !== 'undefined' && document.cookie.includes('sb-qclvzjiyglvxtctauyhb-auth-token')
  
  const {
    data: events = [],
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
    queryFn: async (): Promise<CalendarEvent[]> => {
      try {
        const res = await api.get('/api/calendar')
        if (!res.ok) {
          const errorData = await res.json();
          // Create error with additional metadata
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
        
        // Check if calendar needs reconnection
        if (json.success && json.data && json.data.length === 0 && json.message && json.message.includes('Try reconnecting')) {
          throw new Error('Google Calendar not connected');
        }
        
        const eventsFromServer = json.data || []
        if (!Array.isArray(eventsFromServer)) return []
        return eventsFromServer.map((event: { id: string; title: string; start?: string; startTime?: string; end?: string; endTime?: string; description?: string; location?: string; allDay?: boolean; color?: string; calendarId?: string; calendarName?: string; source?: string }): CalendarEvent => ({
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
        }))
      } catch (error) {
        console.error('Error fetching schedule:', error)
        throw error // Re-throw to let React Query handle the error
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

  // Scroll to today on initial load
  useEffect(() => {
    if (!isLoading && todayRef.current) {
      setTimeout(() => {
        todayRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
      }, 100)
    }
  }, [isLoading])

  if ((loading && !hasSessionCookies) || isLoading) {
    return <WidgetLoader className="schedule" />
  }

  if (error) {
    const errorWithMeta = error as Error & { errorType?: string; userMessage?: string; status?: number; userEmail?: string };
    const isAuthError = error.message.includes('Google Calendar not connected') || errorWithMeta.errorType === 'AUTH_EXPIRED';
    const isAuthExpired = errorWithMeta.errorType === 'AUTH_EXPIRED';
    const displayEmail = errorWithMeta.userEmail || user?.email || 'your account';
    
    return (
      <WidgetContainer>
        <WidgetHeader title="Schedule" />
        <div className={styles.errorContainer}>
          {isAuthError ? (
             <EmptyState
              renderIcon={() => <span className={styles.calendarIcon}>◊</span>}
              title={isAuthExpired ? "Calendar connection expired" : "Connect your calendar"}
              description={isAuthExpired 
                ? `Calendar access for ${displayEmail} has expired. We're attempting to refresh it automatically, or you can reconnect manually.`
                : "See your schedule at a glance by connecting your Google Calendar."
              }
              action={{
                label: isAuthExpired ? "Reconnect Calendar" : "Connect Calendar",
                onClick: async () => {
                  try {
                    console.log('Connecting calendar - starting OAuth flow...');
                    
                    const supabase = await getSupabaseClient();
                    
                    const { data, error } = await supabase.auth.signInWithOAuth({
                      provider: 'google',
                      options: {
                        redirectTo: `${window.location.origin}/auth/callback`,
                        scopes: 'openid email profile https://www.googleapis.com/auth/calendar.readonly',
                        queryParams: {
                          access_type: 'offline',
                          prompt: 'consent'
                        }
                      },
                    });
                    
                    console.log('OAuth response:', { data, error });
                    
                    if (error) {
                      console.error('Error connecting calendar:', error);
                      // Try alternative approach if Supabase fails
                      console.log('Trying direct Google OAuth...');
                      const redirectUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
                        `client_id=${encodeURIComponent('301293553612-42c89kj4s39tckdevgv5o6dttsfulnml.apps.googleusercontent.com')}&` +
                        `redirect_uri=${encodeURIComponent(window.location.origin + '/auth/callback')}&` +
                        `response_type=code&` +
                        `scope=${encodeURIComponent('openid email profile https://www.googleapis.com/auth/calendar.readonly')}&` +
                        `access_type=offline&` +
                        `prompt=consent`;
                      
                      console.log('Redirecting to:', redirectUrl);
                      window.location.href = redirectUrl;
                    } else {
                      console.log('OAuth initiated successfully');
                    }
                    
                  } catch (error) {
                    console.error('Failed to connect calendar:', error);
                  }
                }
              }}
            />
          ) : (
            <>
              <p className={styles.errorTitle}>Error loading schedule</p>
              <p className={styles.errorMessage}>{errorWithMeta.userMessage || error.message}</p>
            </>
          )}
        </div>
      </WidgetContainer>
    )
  }

  const visibleDate = visibleDayKey ? parseISO(visibleDayKey) : new Date()

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
              onClick={() => {
                // Scroll to today
                if (todayRef.current) {
                  todayRef.current.scrollIntoView({ block: 'start', behavior: 'smooth' })
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
                renderIcon={() => <span className={styles.calendarIcon}>◊</span>}
                title="No events scheduled"
                description="Your calendar is clear. Connect your Google Calendar to see upcoming events."
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
  )
}

export default ScheduleWidget