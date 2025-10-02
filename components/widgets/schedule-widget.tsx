"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO, isPast, isToday, isAfter, isBefore } from "date-fns";

import Calendar from "lucide-react/dist/esm/icons/calendar";
import { api } from "@/lib/api-client";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { WidgetLoader } from "./widget-loader";
import { WidgetContainer } from "@/components/ui/widget-container";
import { WidgetHeader } from "@/components/ui/widget-header";
import { useAuth } from "@/components/auth/supabase-auth-provider";
import scheduleStyles from "./schedule-widget.module.css";

// Interfaces
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
      : new Date(parseInt(timeStr));
  };

  const startTime = parseEventTime(event.start);
  const endTime = parseEventTime(event.end);

  return (
    <div
      className={cn(
        "widget-list-item widget-list-item--schedule",
        isCurrent && "current",
      )}
    >
      <div className={scheduleStyles.eventTitle}>{event.title}</div>
      <div className={scheduleStyles.eventTime}>
        {format(startTime, "p")} – {format(endTime, "p")}
      </div>
    </div>
  );
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

  // Update the ref when onVisible changes
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
      handleScroll(); // Check initial position

      return () => {
        scrollContainer.removeEventListener("scroll", handleScroll);
      };
    }
  }, [dayKey, todayRef]);

  return (
    <div ref={todayRef || ref} className={scheduleStyles.daySection}>
      {/* Current time indicator - only on today's section */}
      {isCurrentDay && (
        <div
          className={scheduleStyles.currentTimeIndicator}
          style={{
            top: currentEvent ? "50%" : "20%",
            transform: "translateY(-50%)",
          }}
        >
          <div className={scheduleStyles.currentTimeContainer}>
            <div className={scheduleStyles.currentTimeLine} />
            <div className={scheduleStyles.currentTimeDot} />
          </div>
        </div>
      )}

      {/* Inline day header matching Figma design */}
      <div className={scheduleStyles.dayHeader}>
        {dayKey && /^\d{4}-\d{2}-\d{2}$/.test(dayKey)
          ? format(parseISO(dayKey), "EEEE do 'of' MMMM")
          : "Invalid Date"}
      </div>

      {/* Events for this day */}
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
  const { user, session, loading } = useAuth();

  // Check if we have session cookies as a workaround for auth loading issues
  const hasSessionCookies =
    typeof document !== "undefined" &&
    document.cookie.includes("sb-qclvzjiyglvxtctauyhb-auth-token");

  const {
    data: events = [],
    isLoading,
    error,
  } = useQuery<CalendarEvent[]>({
    queryKey: ["schedule"],
    enabled: !loading || hasSessionCookies, // Enable query if not loading OR if we have session cookies
    queryFn: async () => {
      try {
        const res = await api.get("/api/calendar");
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch schedule");
        }
        const json = await res.json();

        // Check if calendar needs reconnection
        if (
          json.success &&
          json.data &&
          json.data.length === 0 &&
          json.message &&
          json.message.includes("Try reconnecting")
        ) {
          throw new Error("Google Calendar not connected");
        }

        const eventsFromServer = json.data || [];
        if (!Array.isArray(eventsFromServer)) return [];
        return eventsFromServer.map((event: any) => ({
          id: event.id,
          title: event.title,
          start: event.start || event.startTime || "",
          end: event.end || event.endTime || "",
          description: event.description,
          location: event.location,
          allDay: event.allDay,
          color: event.color,
          calendarId: event.calendarId,
          calendarName: event.calendarName,
          source: event.source || "google",
        }));
      } catch (error) {
        console.error("Error fetching schedule:", error);
        throw error; // Re-throw to let React Query handle the error
      }
    },
    retry: false,
  });

  const [now, setNow] = useState(new Date());
  const [visibleDayKey, setVisibleDayKey] = useState<string | null>(null);
  const todayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000); // update 'now' every minute
    return () => clearInterval(timer);
  }, []);

  // Get all events grouped by day and sort them
  const groupedEvents = useMemo(() => {
    const now = new Date();
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    return [...events]
      .filter((event) => {
        // Include events from 2 weeks ago onwards
        try {
          const eventDate =
            typeof event.start === "string"
              ? event.start.includes("T")
                ? parseISO(event.start)
                : new Date(parseInt(event.start))
              : new Date();
          return (
            eventDate >=
            new Date(
              twoWeeksAgo.getFullYear(),
              twoWeeksAgo.getMonth(),
              twoWeeksAgo.getDate(),
            )
          );
        } catch (e) {
          return false;
        }
      })
      .sort((a, b) => {
        const aDate =
          typeof a.start === "string"
            ? a.start.includes("T")
              ? parseISO(a.start)
              : new Date(parseInt(a.start))
            : new Date();
        const bDate =
          typeof b.start === "string"
            ? b.start.includes("T")
              ? parseISO(b.start)
              : new Date(parseInt(b.start))
            : new Date();
        return aDate.getTime() - bDate.getTime();
      })
      .reduce(
        (acc, event) => {
          try {
            const eventDate =
              typeof event.start === "string"
                ? event.start.includes("T")
                  ? parseISO(event.start)
                  : new Date(parseInt(event.start))
                : new Date();
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

  // Get today's events for current event detection
  const todayEvents = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    return groupedEvents[today] || [];
  }, [groupedEvents]);

  // Find current event
  const currentEvent = todayEvents.find((event) => {
    const parseEventTime = (timeStr: string) => {
      if (!timeStr) return new Date();
      return timeStr.includes("T")
        ? parseISO(timeStr)
        : new Date(parseInt(timeStr));
    };

    const startTime = parseEventTime(event.start);
    const endTime = parseEventTime(event.end);
    return isAfter(now, startTime) && isBefore(now, endTime);
  });

  // Set initial visible day to today
  useEffect(() => {
    if (!visibleDayKey) {
      const todayKey = format(new Date(), "yyyy-MM-dd");
      setVisibleDayKey(todayKey);
    }
  }, [visibleDayKey]);

  // Scroll to today on initial load
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

  const scrollToToday = () => {
    const todayKey = format(new Date(), "yyyy-MM-dd");
    setVisibleDayKey(todayKey);
    if (todayRef.current) {
      todayRef.current.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  };

  if ((loading && !hasSessionCookies) || isLoading) {
    return <WidgetLoader className="schedule" />;
  }

  if (error) {
    const isAuthError = error.message.includes("Google Calendar not connected");
    return (
      <WidgetContainer>
        <WidgetHeader title="Schedule" />
        <div className={scheduleStyles.emptyStateContainer}>
          {isAuthError ? (
            <EmptyState
              renderIcon={() => (
                <Calendar className={scheduleStyles.emptyStateIcon} />
              )}
              title="Connect your calendar"
              description="See your schedule at a glance by connecting your Google Calendar."
              action={{
                label: "Connect Calendar",
                onClick: async () => {
                  try {
                    console.log("Connecting calendar - starting OAuth flow...");

                    const { createClient } = await import(
                      "@/lib/supabase/client"
                    );
                    const supabase = createClient();

                    const { data, error } = await supabase.auth.signInWithOAuth(
                      {
                        provider: "google",
                        options: {
                          redirectTo: `${window.location.origin}/auth/callback`,
                          scopes:
                            "openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events.readonly",
                          queryParams: {
                            access_type: "offline",
                            prompt: "consent",
                          },
                        },
                      },
                    );

                    console.log("OAuth response:", { data, error });

                    if (error) {
                      console.error("Error connecting calendar:", error);
                      // Try alternative approach if Supabase fails
                      console.log("Trying direct Google OAuth...");
                      const redirectUrl =
                        `https://accounts.google.com/o/oauth2/v2/auth?` +
                        `client_id=${encodeURIComponent("301293553612-42c89kj4s39tckdevgv5o6dttsfulnml.apps.googleusercontent.com")}&` +
                        `redirect_uri=${encodeURIComponent(window.location.origin + "/auth/callback")}&` +
                        `response_type=code&` +
                        `scope=${encodeURIComponent("openid email profile https://www.googleapis.com/auth/calendar.readonly")}&` +
                        `access_type=offline&` +
                        `prompt=consent`;

                      console.log("Redirecting to:", redirectUrl);
                      window.location.href = redirectUrl;
                    } else {
                      console.log("OAuth initiated successfully");
                    }
                  } catch (error) {
                    console.error("Failed to connect calendar:", error);
                  }
                },
              }}
            />
          ) : (
            <>
              <p className={scheduleStyles.errorText}>Error loading schedule</p>
              <p className={scheduleStyles.errorMessage}>{error.message}</p>
            </>
          )}
        </div>
      </WidgetContainer>
    );
  }

  const visibleDate = visibleDayKey ? parseISO(visibleDayKey) : new Date();

  return (
    <WidgetContainer data-widget="schedule">
      <div className={scheduleStyles.scheduleContainer}>
        {/* Left Sidebar */}
        <div className={scheduleStyles.sidebar}>
          <div className={scheduleStyles.sidebarHeader}>
            <h2 className="widget-title">Schedule</h2>
          </div>

          <div className={scheduleStyles.sidebarContent}>
            <div></div>

            <div></div>

            <div className={scheduleStyles.sidebarFooter}>
              <div className={scheduleStyles.dayDateStack}>
                <div className={scheduleStyles.dayLabel}>
                  {isToday(visibleDate) && (
                    <div className={scheduleStyles.todayDot} />
                  )}
                  {format(visibleDate, "EEE")}
                </div>
                <div
                  className="bigNumber"
                  style={{ marginBottom: "0px", lineHeight: "0.9" }}
                >
                  {format(visibleDate, "dd")}
                </div>
              </div>
              <div
                style={{
                  color: "#555454",
                  fontFamily: "Inter Display, sans-serif",
                  fontSize: "12px",
                  fontWeight: 400,
                  lineHeight: 1.2,
                }}
              >
                {format(visibleDate, "MMMM")}
              </div>
            </div>
          </div>
        </div>

        <div className={scheduleStyles.rightPanel}>
          <div className={scheduleStyles.rightPanelContent}>
            {sortedDays.length === 0 ? (
              <EmptyState
                renderIcon={() => (
                  <Calendar className={scheduleStyles.calendarIcon} />
                )}
                title="No events scheduled"
                description="Your calendar is clear. Connect your Google Calendar to see upcoming events."
                className="pt-20"
              />
            ) : (
              sortedDays.map((dayKey) => {
                const dayEvents = groupedEvents[dayKey];
                let isCurrentDay = false;
                try {
                  if (dayKey && /^\d{4}-\d{2}-\d{2}$/.test(dayKey)) {
                    isCurrentDay = isToday(parseISO(dayKey));
                  }
                } catch (e) {
                  console.error(
                    "Error checking isToday for dayKey:",
                    dayKey,
                    e,
                  );
                }

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
