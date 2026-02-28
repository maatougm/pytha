import { useState, useEffect, useCallback } from 'react';
import { calendarService, CalendarEvent } from '@/src/services/calendarService';
import * as Calendar from 'expo-calendar';

// Define CalendarEventType locally since expo-calendar doesn't export Event type
interface CalendarEventType {
  id?: string;
  title: string;
  startDate: string | Date;
  endDate: string | Date;
  location?: string;
  notes?: string;
  calendarId?: string;
}

export interface CalendarState {
  isReady: boolean;
  hasPermission: boolean;
  isLoading: boolean;
  events: CalendarEventType[];
  todayEvents: CalendarEventType[];
  error: string | null;
}

export interface CalendarActions {
  requestPermission: () => Promise<boolean>;
  addEvent: (event: CalendarEvent) => Promise<string | null>;
  addAssignment: (
    assignmentId: string,
    title: string,
    dueDate: Date,
    courseName?: string
  ) => Promise<string | null>;
  addClassSchedule: (
    courseId: string,
    courseName: string,
    schedule: {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      location?: string;
    }[],
    startDate: Date,
    endDate: Date
  ) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<boolean>;
  deleteAssignment: (assignmentId: string) => Promise<boolean>;
  refreshEvents: () => Promise<void>;
  getEventsForRange: (startDate: Date, endDate: Date) => Promise<CalendarEventType[]>;
}

/**
 * Hook for calendar integration
 */
export function useCalendar(): CalendarState & CalendarActions {
  const [state, setState] = useState<CalendarState>({
    isReady: false,
    hasPermission: false,
    isLoading: true,
    events: [],
    todayEvents: [],
    error: null,
  });

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const hasPermission = await calendarService.checkPermissions();
      
      if (hasPermission) {
        const initialized = await calendarService.initialize();
        if (initialized) {
          await loadTodayEvents();
        }
        setState(prev => ({
          ...prev,
          isReady: initialized,
          hasPermission: true,
          isLoading: false,
        }));
      } else {
        setState(prev => ({
          ...prev,
          isReady: false,
          hasPermission: false,
          isLoading: false,
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to initialize calendar',
      }));
    }
  };

  /**
   * Load today's events
   */
  const loadTodayEvents = async () => {
    try {
      const events = await calendarService.getTodayEvents();
      setState(prev => ({ ...prev, todayEvents: events }));
    } catch (error) {
      console.error('[useCalendar] Failed to load today events:', error);
    }
  };

  /**
   * Request calendar permission
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await calendarService.requestPermissions();
      
      if (granted) {
        const initialized = await calendarService.initialize();
        if (initialized) {
          await loadTodayEvents();
        }
        setState(prev => ({
          ...prev,
          isReady: initialized,
          hasPermission: true,
        }));
      }
      
      return granted;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Permission request failed',
      }));
      return false;
    }
  }, []);

  /**
   * Add an event
   */
  const addEvent = useCallback(async (event: CalendarEvent): Promise<string | null> => {
    try {
      const eventId = await calendarService.addEvent(event);
      if (eventId) {
        await loadTodayEvents();
      }
      return eventId;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to add event',
      }));
      return null;
    }
  }, []);

  /**
   * Add assignment due date
   */
  const addAssignment = useCallback(
    async (
      assignmentId: string,
      title: string,
      dueDate: Date,
      courseName?: string
    ): Promise<string | null> => {
      try {
        const eventId = await calendarService.addAssignmentDueDate(
          assignmentId,
          title,
          dueDate,
          courseName
        );
        if (eventId) {
          await loadTodayEvents();
        }
        return eventId;
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to add assignment',
        }));
        return null;
      }
    },
    []
  );

  /**
   * Add class schedule
   */
  const addClassSchedule = useCallback(
    async (
      courseId: string,
      courseName: string,
      schedule: {
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        location?: string;
      }[],
      startDate: Date,
      endDate: Date
    ): Promise<void> => {
      try {
        await calendarService.addClassSchedule(
          courseId,
          courseName,
          schedule,
          startDate,
          endDate
        );
        await loadTodayEvents();
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to add schedule',
        }));
      }
    },
    []
  );

  /**
   * Delete an event
   */
  const deleteEvent = useCallback(async (eventId: string): Promise<boolean> => {
    try {
      const success = await calendarService.deleteEvent(eventId);
      if (success) {
        await loadTodayEvents();
      }
      return success;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to delete event',
      }));
      return false;
    }
  }, []);

  /**
   * Delete assignment event
   */
  const deleteAssignment = useCallback(async (assignmentId: string): Promise<boolean> => {
    try {
      const success = await calendarService.deleteAssignmentEvent(assignmentId);
      if (success) {
        await loadTodayEvents();
      }
      return success;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to delete assignment',
      }));
      return false;
    }
  }, []);

  /**
   * Refresh events
   */
  const refreshEvents = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      await loadTodayEvents();
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to refresh',
      }));
    }
  }, []);

  /**
   * Get events for a date range
   */
  const getEventsForRange = useCallback(
    async (startDate: Date, endDate: Date): Promise<CalendarEventType[]> => {
      try {
        return await calendarService.getEvents(startDate, endDate);
      } catch (error) {
        console.error('[useCalendar] Failed to get events:', error);
        return [];
      }
    },
    []
  );

  return {
    ...state,
    requestPermission,
    addEvent,
    addAssignment,
    addClassSchedule,
    deleteEvent,
    deleteAssignment,
    refreshEvents,
    getEventsForRange,
  };
}

/**
 * Hook to get upcoming events
 */
export function useUpcomingEvents(limit: number = 5) {
  const [events, setEvents] = useState<CalendarEventType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, [limit]);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      const allEvents = await calendarService.getEvents(today, nextWeek);
      setEvents(allEvents.slice(0, limit));
    } catch (error) {
      console.error('[useUpcomingEvents] Failed to load:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return { events, isLoading, refresh: loadEvents };
}
