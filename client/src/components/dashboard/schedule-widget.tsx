import { useQuery } from "@tanstack/react-query";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";

interface CalendarEvent {
  id: number;
  title: string;
  date: string;
  time: string;
  startTime?: string;
  endTime?: string;
}

export default function ScheduleWidget() {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  const { data: events = [], isLoading } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/calendar"],
  });

  // Get today's date info
  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const dayNumber = today.getDate();

  // Filter today's events and sort by time
  const todaysEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate.toDateString() === today.toDateString();
  }).sort((a, b) => {
    // Parse time strings for sorting (assuming format like "9:00 AM")
    const timeA = new Date(`2000/01/01 ${a.time}`).getTime();
    const timeB = new Date(`2000/01/01 ${b.time}`).getTime();
    return timeA - timeB;
  });

  // Parse current time to minutes from start of day
  const getCurrentTimeMinutes = () => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  };

  // Parse event time to minutes from start of day
  const parseEventTime = (timeString: string) => {
    try {
      const time = new Date(`2000/01/01 ${timeString}`);
      return time.getHours() * 60 + time.getMinutes();
    } catch {
      return 0;
    }
  };

  // Check if current time is within an event
  const isCurrentEvent = (event: CalendarEvent) => {
    const currentMinutes = getCurrentTimeMinutes();
    const eventStartMinutes = parseEventTime(event.time);
    
    // Assume 1 hour duration if no end time specified
    let eventEndMinutes = eventStartMinutes + 60;
    
    // If event has end time, parse it
    if (event.endTime) {
      eventEndMinutes = parseEventTime(event.endTime);
    } else if (event.time.includes(' - ')) {
      // Handle time ranges like "9:00 AM - 11:00 AM"
      const [, endTime] = event.time.split(' - ');
      if (endTime) {
        eventEndMinutes = parseEventTime(endTime.trim());
      }
    }
    
    return currentMinutes >= eventStartMinutes && currentMinutes <= eventEndMinutes;
  };

  // Calculate vertical position of red line based on current time and events
  const getRedLinePosition = () => {
    if (todaysEvents.length === 0) return { show: false, top: 0 };
    
    const currentMinutes = getCurrentTimeMinutes();
    const firstEventMinutes = parseEventTime(todaysEvents[0].time);
    const lastEventMinutes = parseEventTime(todaysEvents[todaysEvents.length - 1].time) + 60; // Add 1 hour to last event
    
    // If current time is before first event or after last event, don't show line
    if (currentMinutes < firstEventMinutes || currentMinutes > lastEventMinutes) {
      return { show: false, top: 0 };
    }
    
    // Calculate position between events
    const totalEventTimeSpan = lastEventMinutes - firstEventMinutes;
    const currentTimeFromStart = currentMinutes - firstEventMinutes;
    const percentage = (currentTimeFromStart / totalEventTimeSpan) * 100;
    
    return { show: true, top: Math.min(95, Math.max(5, percentage)) };
  };

  const redLinePosition = getRedLinePosition();

  return (
    <Card className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 h-full flex flex-col relative overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between h-4">
          <CardTitle className="text-[13px] font-aileron-black text-gray-600 dark:text-gray-400 leading-none">
            Schedule
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex p-4 pt-0">
        {/* Left side - Day and Date */}
        <div className="flex flex-col justify-start mr-6 min-w-0 flex-shrink-0">
          <div className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">
            {dayName}
          </div>
          <div className="text-gray-900 dark:text-white text-5xl font-light leading-none mb-4">
            {dayNumber}
          </div>
          <div className="text-gray-600 dark:text-gray-400 text-sm">
            {todaysEvents.length} Events
          </div>
        </div>

        {/* Right side - Events with vertical red line */}
        <div className="flex-1 min-w-0 relative">
          {/* Events */}
          <div className="space-y-3 relative">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="bg-gray-200 dark:bg-black/50 rounded-xl p-4 animate-pulse">
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : todaysEvents.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-600 dark:text-gray-400 text-sm">No events today</div>
              </div>
            ) : (
              todaysEvents.slice(0, 3).map((event) => {
                const isCurrent = isCurrentEvent(event);
                return (
                  <div 
                    key={event.id}
                    className={`rounded-xl p-4 transition-all cursor-pointer relative ${
                      isCurrent 
                        ? 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-500' 
                        : 'bg-gray-100 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600/60'
                    }`}
                  >
                    <div className={`text-base mb-1 leading-tight ${isCurrent ? 'font-semibold text-gray-900 dark:text-white' : 'font-normal text-gray-800 dark:text-gray-200'}`}>
                      {event.title}
                    </div>
                    <div className={`text-sm ${isCurrent ? 'text-gray-700 dark:text-gray-200' : 'text-gray-600 dark:text-gray-400'}`}>
                      {event.time}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Vertical red line that moves through events */}
          {redLinePosition.show && (
            <div 
              className="absolute left-0 w-full flex items-center pointer-events-none transition-all duration-500 ease-out z-20"
              style={{ top: `${redLinePosition.top}%` }}
            >
              {/* Red dot */}
              <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 shadow-sm"></div>
              {/* Red line */}
              <div className="flex-1 h-px bg-red-500 shadow-sm"></div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}