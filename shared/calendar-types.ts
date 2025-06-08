export interface GoogleCalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees?: string[];
  htmlLink?: string;
  source: 'google' | 'local';
}

export interface CalendarSyncStatus {
  connected: boolean;
  lastSync?: Date;
  eventCount?: number;
  error?: string;
}