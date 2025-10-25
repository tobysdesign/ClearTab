import React, { useMemo, useRef, useState, useEffect } from "react";
import { format, parseISO, isToday, isAfter, isBefore } from "date-fns";
import styles from "./schedule-widget.module.css";
import { cn } from "../lib/utils";
import { EmptyState } from "../components/ui/empty-state";
import { WidgetContainer, WidgetHeader, WidgetLoader } from "@cleartab/ui";

// --- Mock Data ---

const mockEvents = [
  {
    id: "1",
    title: "Team Standup",
    start: new Date().toISOString(),
    end: new Date(new Date().getTime() + 30 * 60 * 1000).toISOString(),
    source: "google",
  },
  {
    id: "2",
    title: "Design Review",
    start: new Date(new Date().getTime() + 2 * 60 * 60 * 1000).toISOString(),
    end: new Date(new Date().getTime() + 3 * 60 * 60 * 1000).toISOString(),
    source: "google",
  },
  {
    id: "3",
    title: "Lunch with Sarah",
    start: new Date(new Date().getTime() + 4 * 60 * 60 * 1000).toISOString(),
    end: new Date(new Date().getTime() + 5 * 60 * 60 * 1000).toISOString(),
    source: "google",
  },
];

// --- Interfaces ---

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
  allDay?: boolean;
  color?: string;
  calendarId?: string;
  calendarName?: string;
  source: "google" | "local";
}

// --- Components ---

function EventCard({
  event,
  isCurrent,
}: {
  event: CalendarEvent;
  isCurrent: boolean;
}) {
  const parseEventTime = (timeStr: string) => {
    if (!timeStr) return new Date();
    return timeStr.includes("T")
      ? parseISO(timeStr)
      : new Date(parseInt(timeStr, 10));
  };

  const startTime = parseEventTime(event.start);
  const endTime = parseEventTime(event.end);

  return (
    <div
      className={cn(
        "widget-list-item widget-list-item--schedule",
        styles.eventCard,
        {
          [styles.eventCardCurrent]: isCurrent,
          [styles.eventCardDefault]: !isCurrent,
        },
      )}
    >
      <div className={styles.eventTitle}>{event.title}</div>
      <div className={styles.eventTime}>
        {format(startTime, "p")} – {format(endTime, "p")}
      </div>
    </div>
  );
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
  dayKey: string;
  events: CalendarEvent[];
  now: Date;
  isCurrentDay: boolean;
  currentEvent?: CalendarEvent;
  todayRef: React.RefObject<HTMLDivElement> | null;
  onVisible: (dayKey: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onVisibleRef = useRef(onVisible);

  useEffect(() => {
    onVisibleRef.current = onVisible;
  }, [onVisible]);

  useEffect(() => {
    const element = ref.current || todayRef?.current;
    if (!element) return;

    const handleScroll = () => {
      const rect = element.getBoundingClientRect();
      const containerRect = element
        .closest(".overflow-y-auto")
        ?.getBoundingClientRect();

      if (
        containerRect &&
        rect.top <= containerRect.top + 100 &&
        rect.bottom >= containerRect.top + 50
      ) {
        onVisibleRef.current(dayKey);
      }
    };

    const scrollContainer = element.closest(".overflow-y-auto");
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
      handleScroll();

      return () => {
        scrollContainer.removeEventListener("scroll", handleScroll);
      };
    }
  }, [dayKey, todayRef]);

  return (
    <div ref={todayRef || ref} className={styles.daySection}>
      {isCurrentDay && (
        <div className={styles.currentTimeIndicator} style={{ top: "40%" }}>
          <div className={styles.relativeContainer}>
            <div className={styles.currentTimeLine} />
            <div className={styles.currentTimeDot} />
          </div>
        </div>
      )}
      <div className={styles.dayHeader}>
        {format(parseISO(dayKey), "EEEE do 'of' MMMM")}
      </div>
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          isCurrent={currentEvent?.id === event.id}
        />
      ))}
    </div>
  );
}

export function ScheduleWidget() {
  const [events, setEvents] = useState<CalendarEvent[]>(mockEvents);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Simulate fetching data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const [now, setNow] = useState(new Date());
  const [visibleDayKey, setVisibleDayKey] = useState<string | null>(null);
  const todayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const groupedEvents = useMemo(() => {
    const now = new Date();
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    return [...events]
      .filter((event) => {
        try {
          const eventDate = event.start.includes("T")
            ? parseISO(event.start)
            : new Date(parseInt(event.start, 10));
          return (
            eventDate >=
            new Date(
              twoWeeksAgo.getFullYear(),
              twoWeeksAgo.getMonth(),
              twoWeeksAgo.getDate(),
            )
          );
        } catch {
          return false;
        }
      })
      .sort((a, b) => {
        const aDate = a.start.includes("T")
          ? parseISO(a.start)
          : new Date(parseInt(a.start, 10));
        const bDate = b.start.includes("T")
          ? parseISO(b.start)
          : new Date(parseInt(b.start, 10));
        return aDate.getTime() - bDate.getTime();
      })
      .reduce(
        (acc, event) => {
          try {
            const eventDate = event.start.includes("T")
              ? parseISO(event.start)
              : new Date(parseInt(event.start, 10));
            const dayKey = format(eventDate, "yyyy-MM-dd");
            if (!acc[dayKey]) acc[dayKey] = [];
            acc[dayKey].push(event);
          } catch (e) {
            console.error("Error processing event date:", e, event);
          }
          return acc;
        },
        {} as { [key: string]: CalendarEvent[] },
      );
  }, [events]);

  const sortedDays = useMemo(
    () => Object.keys(groupedEvents).sort(),
    [groupedEvents],
  );

  const todayEvents = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    return groupedEvents[today] || [];
  }, [groupedEvents]);

  const currentEvent = todayEvents.find((event) => {
    const parseEventTime = (timeStr: string) => {
      if (!timeStr) return new Date();
      return timeStr.includes("T")
        ? parseISO(timeStr)
        : new Date(parseInt(timeStr, 10));
    };

    const startTime = parseEventTime(event.start);
    const endTime = parseEventTime(event.end);
    return isAfter(now, startTime) && isBefore(now, endTime);
  });

  useEffect(() => {
    if (!visibleDayKey) {
      const todayKey = format(new Date(), "yyyy-MM-dd");
      setVisibleDayKey(todayKey);
    }
  }, [visibleDayKey]);

  useEffect(() => {
    if (!isLoading && todayRef.current) {
      setTimeout(() => {
        todayRef.current?.scrollIntoView({
          block: "start",
          behavior: "smooth",
        });
      }, 100);
    }
  }, [isLoading]);

  if (isLoading) {
    return <WidgetLoader className="schedule" />;
  }

  if (error) {
    const isAuthError = error.message.includes("Google Calendar not connected");
    return (
      <WidgetContainer>
        <WidgetHeader title="Schedule" />
        <div className={styles.errorContainer}>
          {isAuthError ? (
            <EmptyState
              renderIcon={() => <span className={styles.calendarIcon}>◊</span>}
              title="Connect your calendar"
              description="See your schedule at a glance by connecting your Google Calendar."
              action={{
                label: "Connect Calendar",
                onClick: () => console.log("Connect Calendar clicked"),
              }}
            />
          ) : (
            <>
              <p className={styles.errorTitle}>Error loading schedule</p>
              <p className={styles.errorMessage}>{error.message}</p>
            </>
          )}
        </div>
      </WidgetContainer>
    );
  }

  const visibleDate = visibleDayKey ? parseISO(visibleDayKey) : new Date();

  return (
    <WidgetContainer>
      <div className={styles.container}>
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2 className="widget-title">Schedule</h2>
          </div>
          <div className={styles.sidebarContent}>
            <div></div>
            <div></div>
            <div className={styles.sidebarFooter}>
              <div className={styles.dayDateContainer}>
                <div className={styles.dayText}>
                  {isToday(visibleDate) && <div className={styles.todayDot} />}
                  {format(visibleDate, "EEE")}
                </div>
                <div
                  className="bigNumber"
                  style={{ marginBottom: "0px", lineHeight: "0.9" }}
                >
                  {format(visibleDate, "dd")}
                </div>
              </div>
              <div className={styles.monthText}>
                {format(visibleDate, "MMMM")}
              </div>
            </div>
          </div>
        </div>
        <div className={styles.rightContent}>
          <div className={styles.scrollContainer}>
            {sortedDays.length === 0 ? (
              <EmptyState
                renderIcon={() => (
                  <span className={styles.calendarIcon}>◊</span>
                )}
                title="No events scheduled"
                description="Your calendar is clear. Connect your Google Calendar to see upcoming events."
                className={styles.emptyStateContainer}
              />
            ) : (
              sortedDays.map((dayKey) => {
                const dayEvents = groupedEvents[dayKey];
                const isCurrentDay = isToday(parseISO(dayKey));

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
                );
              })
            )}
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}

export default ScheduleWidget;
