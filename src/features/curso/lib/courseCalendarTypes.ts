export type CourseCalendarEventStart = {
  dateTime?: string;
  date?: string;
  timeZone?: string;
};

export type CourseCalendarAttachment = {
  title: string;
  url: string;
  mimeType?: string;
  kind?: 'doc' | 'slides' | 'sheet' | 'recording' | 'chat' | 'gemini' | 'drive' | 'file';
};

export type CourseCalendarEventDto = {
  id: string;
  recurringEventId?: string;
  summary: string;
  description?: string;
  start: CourseCalendarEventStart;
  end: CourseCalendarEventStart;
  hangoutLink?: string;
  htmlLink?: string;
  location?: string;
  status?: string;
  isRecurring?: boolean;
  attachments?: CourseCalendarAttachment[];
};

export type CourseCalendarEventsResponse =
  | {
      success: true;
      program: 'vacacional';
      label: string;
      calendarId: string;
      source?: 'ics' | 'google_api';
      count: number;
      events: CourseCalendarEventDto[];
    }
  | {
      success: false;
      error: string;
      needsAuth?: boolean;
    };
