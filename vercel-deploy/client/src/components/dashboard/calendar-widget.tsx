import { useQuery } from "@tanstack/react-query";
import { Calendar, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

interface CalendarEvent {
  id: number;
  title: string;
  date: string;
  time: string;
}

export default function CalendarWidget() {
  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow'>('today');
  
  const { data: events = [], isLoading } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/calendar"],
  });

  const getEventColor = (index: number) => {
    return index === 0 ? 'border-text-secondary' : 'border-text-muted';
  };

  const handleEventClick = (event: CalendarEvent) => {
    // Open Google Calendar - using dummy URL for now
    window.open('https://calendar.google.com', '_blank');
  };

  const filterEventsByTab = (events: CalendarEvent[]) => {
    const today = new Date();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    return events.filter(event => {
      const eventDate = new Date(event.date);
      if (activeTab === 'today') {
        return eventDate.toDateString() === today.toDateString();
      } else {
        return eventDate.toDateString() === tomorrow.toDateString();
      }
    });
  };

  const filteredEvents = filterEventsByTab(events);

  return (
    <Card className="bg-card text-card-foreground border-border h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('today')}
              className={`px-2 py-1 text-xs font-medium transition-colors rounded ${
                activeTab === 'today'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setActiveTab('tomorrow')}
              className={`px-2 py-1 text-xs font-medium transition-colors rounded ${
                activeTab === 'tomorrow'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              Tomorrow
            </button>
          </div>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border-l-2 border-muted pl-3 animate-pulse">
                <div className="h-4 bg-muted rounded mb-1"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center text-text-muted py-4">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No events {activeTab === 'today' ? 'today' : 'tomorrow'}</p>
          </div>
        ) : (
          filteredEvents.map((event, index) => (
            <div 
              key={event.id} 
              onClick={() => handleEventClick(event)}
              className={`border-l-2 ${getEventColor(index)} pl-3 hover:bg-muted/50 rounded-r transition-colors cursor-pointer p-2`}
            >
              <div className="text-xs font-medium text-text-primary">
                {event.title}
              </div>
              <div className="text-xs text-text-muted">
                {event.time}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
