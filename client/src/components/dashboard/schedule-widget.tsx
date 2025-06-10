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

  // Calculate progress through the day (0-100%)
  const getTimeProgress = () => {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    
    const totalMinutes = (endOfDay.getTime() - startOfDay.getTime()) / (1000 * 60);
    const currentMinutes = (now.getTime() - startOfDay.getTime()) / (1000 * 60);
    
    return Math.min(100, Math.max(0, (currentMinutes / totalMinutes) * 100));
  };

  // Filter today's events
  const todaysEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate.toDateString() === today.toDateString();
  });

  const timeProgress = getTimeProgress();

  return (
    <Card className="bg-gray-800 dark:bg-gray-900 text-white border-0 h-full flex flex-col relative overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between h-4">
          <CardTitle className="text-[13px] font-aileron-black text-gray-400 leading-none">
            Schedule
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-white">
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex p-4 pt-0">
        {/* Left side - Day and Date */}
        <div className="flex flex-col justify-start mr-6 min-w-0 flex-shrink-0">
          <div className="text-gray-400 text-sm font-medium mb-1">
            {dayName}
          </div>
          <div className="text-white text-5xl font-light leading-none mb-4">
            {dayNumber}
          </div>
          <div className="text-gray-400 text-sm">
            {todaysEvents.length} Events
          </div>
        </div>

        {/* Right side - Progress bar and events */}
        <div className="flex-1 min-w-0">
          {/* Red progress bar */}
          <div className="mb-6">
            <div className="w-full bg-gray-700 h-1 rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-500 transition-all duration-1000 ease-out relative"
                style={{ width: `${timeProgress}%` }}
              >
                {/* Red dot at the end of progress bar */}
                <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Events */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="bg-black/50 rounded-xl p-4 animate-pulse">
                    <div className="h-4 bg-gray-700 rounded mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : todaysEvents.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-sm">No events today</div>
              </div>
            ) : (
              todaysEvents.slice(0, 3).map((event) => (
                <div 
                  key={event.id}
                  className="bg-black/50 rounded-xl p-4 hover:bg-black/70 transition-colors cursor-pointer"
                >
                  <div className="text-white font-medium text-base mb-1">
                    {event.title}
                  </div>
                  <div className="text-gray-400 text-sm">
                    {event.time}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}