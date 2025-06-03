import { useQuery } from "@tanstack/react-query";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CalendarEvent {
  id: number;
  title: string;
  date: string;
  time: string;
}

export default function CalendarWidget() {
  const { data: events = [], isLoading } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/calendar"],
  });

  const getEventColor = (index: number) => {
    return index === 0 ? 'border-text-secondary' : 'border-text-muted';
  };

  return (
    <div className="widget">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-muted-foreground">#Events</h2>
        <Calendar className="h-5 w-5 text-text-secondary" />
      </div>
      
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border-l-2 border-muted pl-3 animate-pulse">
                <div className="h-4 bg-muted rounded mb-1"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center text-text-muted py-4">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No upcoming events</p>
          </div>
        ) : (
          events.map((event, index) => (
            <div 
              key={event.id} 
              className={`border-l-2 ${getEventColor(index)} pl-3 hover:bg-dark-primary rounded-r transition-colors cursor-pointer p-1`}
            >
              <div className="text-sm font-medium text-text-primary">
                {event.title}
              </div>
              <div className="text-xs text-text-muted">
                {new Date(event.date).toDateString() === new Date().toDateString() 
                  ? `Today, ${event.time}`
                  : new Date(event.date).toDateString() === new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString()
                  ? `Tomorrow, ${event.time}`
                  : `${new Date(event.date).toLocaleDateString()}, ${event.time}`
                }
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="mt-auto pt-3 border-t border-border">
        <Button 
          variant="ghost" 
          className="w-full text-left text-xs text-text-muted hover:text-text-secondary"
        >
          View all events →
        </Button>
      </div>
    </div>
  );
}
