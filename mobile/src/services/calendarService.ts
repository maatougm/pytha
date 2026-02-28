import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CALENDAR_ID_KEY = '@school_hub_calendar_id';
const EVENTS_SYNC_KEY = '@calendar_last_sync';

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  notes?: string;
  alarms?: number[]; // minutes before
  recurrence?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  isAssignment?: boolean;
  isClass?: boolean;
  courseId?: string;
  assignmentId?: string;
}

class CalendarService {
  private calendarId: string | null = null;
  private isInitialized = false;

  /**
   * Initialize calendar service
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Request permissions
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('[Calendar] Permission denied');
        return false;
      }

      // Load or create calendar
      this.calendarId = await this.getOrCreateCalendar();
      this.isInitialized = true;

      console.log('[Calendar] Initialized with calendar:', this.calendarId);
      return true;
    } catch (error) {
      console.error('[Calendar] Failed to initialize:', error);
      return false;
    }
  }

  /**
   * Get or create School Hub calendar
   */
  private async getOrCreateCalendar(): Promise<string> {
    // Check for existing calendar
    const storedId = await AsyncStorage.getItem(CALENDAR_ID_KEY);
    
    if (storedId) {
      // Verify calendar still exists
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const exists = calendars.some(cal => cal.id === storedId);
      
      if (exists) return storedId;
    }

    // Create new calendar
    let defaultCalendarSource: Calendar.CalendarSource;
    
    if (Platform.OS === 'ios') {
      const defaultCal = await Calendar.getDefaultCalendarAsync();
      const source = (defaultCal as any).source;
      defaultCalendarSource = {
        id: source?.id,
        name: source?.name || 'School Hub',
        type: source?.type || 'LOCAL',
      };
    } else {
      defaultCalendarSource = {
        name: 'School Hub',
        type: 'LOCAL',
        isLocalAccount: true,
      };
    }

    const newCalendarId = await Calendar.createCalendarAsync({
      title: 'School Hub',
      color: '#0066CC',
      entityType: Calendar.EntityTypes.EVENT,
      sourceId: defaultCalendarSource.id,
      source: defaultCalendarSource,
      name: 'school-hub',
      ownerAccount: 'personal',
      accessLevel: Calendar.CalendarAccessLevel.OWNER,
    });

    await AsyncStorage.setItem(CALENDAR_ID_KEY, newCalendarId);
    console.log('[Calendar] Created new calendar:', newCalendarId);
    
    return newCalendarId;
  }

  /**
   * Add an event to the calendar
   */
  async addEvent(event: CalendarEvent): Promise<string | null> {
    if (!this.calendarId) {
      const initialized = await this.initialize();
      if (!initialized) return null;
    }

    try {
      const eventDetails: Calendar.Event = {
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        notes: event.notes,
        calendarId: this.calendarId!,
        alarms: event.alarms?.map(minutes => ({
          relativeOffset: -minutes,
          method: Calendar.AlarmMethod.ALERT,
        })),
      };

      // Add recurrence if specified
      if (event.recurrence) {
        eventDetails.recurrenceRule = {
          frequency: this.getRecurrenceFrequency(event.recurrence),
        };
      }

      const eventId = await Calendar.createEventAsync(this.calendarId!, eventDetails);
      
      // Store mapping for future reference
      if (event.assignmentId) {
        await AsyncStorage.setItem(`@event_assignment_${event.assignmentId}`, eventId);
      }
      if (event.courseId) {
        await AsyncStorage.setItem(`@event_course_${event.courseId}`, eventId);
      }

      console.log('[Calendar] Event created:', eventId);
      return eventId;
    } catch (error) {
      console.error('[Calendar] Failed to create event:', error);
      return null;
    }
  }

  /**
   * Update an existing event
   */
  async updateEvent(eventId: string, event: Partial<CalendarEvent>): Promise<boolean> {
    try {
      const updates: Partial<Calendar.Event> = {};
      
      if (event.title) updates.title = event.title;
      if (event.startDate) updates.startDate = event.startDate;
      if (event.endDate) updates.endDate = event.endDate;
      if (event.location !== undefined) updates.location = event.location;
      if (event.notes !== undefined) updates.notes = event.notes;

      await Calendar.updateEventAsync(eventId, updates);
      return true;
    } catch (error) {
      console.error('[Calendar] Failed to update event:', error);
      return false;
    }
  }

  /**
   * Delete an event
   */
  async deleteEvent(eventId: string): Promise<boolean> {
    try {
      await Calendar.deleteEventAsync(eventId);
      return true;
    } catch (error) {
      console.error('[Calendar] Failed to delete event:', error);
      return false;
    }
  }

  /**
   * Delete events by assignment ID
   */
  async deleteAssignmentEvent(assignmentId: string): Promise<boolean> {
    const eventId = await AsyncStorage.getItem(`@event_assignment_${assignmentId}`);
    if (eventId) {
      await this.deleteEvent(eventId);
      await AsyncStorage.removeItem(`@event_assignment_${assignmentId}`);
      return true;
    }
    return false;
  }

  /**
   * Delete events by course ID
   */
  async deleteCourseEvents(courseId: string): Promise<void> {
    const eventId = await AsyncStorage.getItem(`@event_course_${courseId}`);
    if (eventId) {
      await this.deleteEvent(eventId);
      await AsyncStorage.removeItem(`@event_course_${courseId}`);
    }
  }

  /**
   * Get events for a date range
   */
  async getEvents(startDate: Date, endDate: Date): Promise<Calendar.Event[]> {
    if (!this.calendarId) {
      const initialized = await this.initialize();
      if (!initialized) return [];
    }

    try {
      const events = await Calendar.getEventsAsync(
        [this.calendarId!],
        startDate,
        endDate
      );
      return events;
    } catch (error) {
      console.error('[Calendar] Failed to get events:', error);
      return [];
    }
  }

  /**
   * Get events for today
   */
  async getTodayEvents(): Promise<Calendar.Event[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.getEvents(today, tomorrow);
  }

  /**
   * Get events for this week
   */
  async getWeekEvents(): Promise<Calendar.Event[]> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - start.getDay()); // Start of week (Sunday)

    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    return this.getEvents(start, end);
  }

  /**
   * Add assignment due date to calendar
   */
  async addAssignmentDueDate(
    assignmentId: string,
    title: string,
    dueDate: Date,
    courseName?: string
  ): Promise<string | null> {
    // Delete existing event for this assignment
    await this.deleteAssignmentEvent(assignmentId);

    const event: CalendarEvent = {
      id: '', // Will be assigned by calendar
      title: `📚 Due: ${title}`,
      startDate: dueDate,
      endDate: new Date(dueDate.getTime() + 60 * 60 * 1000), // 1 hour duration
      notes: courseName ? `Course: ${courseName}` : undefined,
      alarms: [1440, 60], // 24 hours and 1 hour before
      isAssignment: true,
      assignmentId,
    };

    return this.addEvent(event);
  }

  /**
   * Add class schedule to calendar
   */
  async addClassSchedule(
    courseId: string,
    courseName: string,
    schedule: {
      dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
      startTime: string; // "HH:mm"
      endTime: string;
      location?: string;
    }[],
    startDate: Date,
    endDate: Date
  ): Promise<void> {
    // Delete existing events for this course
    await this.deleteCourseEvents(courseId);

    for (const session of schedule) {
      const event: CalendarEvent = {
        id: '',
        title: `📖 ${courseName}`,
        startDate: this.combineDateAndTime(startDate, session.startTime),
        endDate: this.combineDateAndTime(startDate, session.endTime),
        location: session.location,
        notes: `Course session`,
        alarms: [15], // 15 minutes before
        recurrence: 'weekly',
        isClass: true,
        courseId,
      };

      await this.addEvent(event);
    }
  }

  /**
   * Check if calendar permissions are granted
   */
  async checkPermissions(): Promise<boolean> {
    const { status } = await Calendar.getCalendarPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Request calendar permissions
   */
  async requestPermissions(): Promise<boolean> {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Open calendar event (platform specific)
   */
  async openEvent(eventId: string): Promise<void> {
    // This would use platform-specific linking
    // For now, just a placeholder
    console.log('[Calendar] Opening event:', eventId);
  }

  /**
   * Get available calendars
   */
  async getAvailableCalendars(): Promise<Calendar.Calendar[]> {
    try {
      return await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    } catch (error) {
      console.error('[Calendar] Failed to get calendars:', error);
      return [];
    }
  }

  /**
   * Convert recurrence string to frequency
   */
  private getRecurrenceFrequency(recurrence: string): Calendar.Frequency {
    switch (recurrence) {
      case 'daily':
        return Calendar.Frequency.DAILY;
      case 'weekly':
        return Calendar.Frequency.WEEKLY;
      case 'monthly':
        return Calendar.Frequency.MONTHLY;
      case 'yearly':
        return Calendar.Frequency.YEARLY;
      default:
        return Calendar.Frequency.WEEKLY;
    }
  }

  /**
   * Combine date and time string
   */
  private combineDateAndTime(date: Date, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }

  /**
   * Get calendar ID
   */
  getCalendarId(): string | null {
    return this.calendarId;
  }
}

// Export singleton
export const calendarService = new CalendarService();
export default calendarService;
