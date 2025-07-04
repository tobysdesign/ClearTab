export interface GoogleCalendarEvent {
  id: string;
  title: string;
  description: string;
  start: string;
  end: string;
  location: string;
  attendees: string[];
  startTime?: string;
  endTime?: string;
  source?: string;
}

export interface CalendarSyncStatus {
  connected: boolean;
  lastSync?: Date;
  eventCount?: number;
  error?: string;
}