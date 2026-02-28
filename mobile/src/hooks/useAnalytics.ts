import { useState, useEffect, useCallback, useRef } from 'react';
import { analyticsService, StudySession, UserInsights, CourseAnalytics, LearningStreak } from '@/src/services/analyticsService';

export interface AnalyticsState {
  isStudying: boolean;
  currentSession: StudySession | null;
  insights: UserInsights | null;
  streak: LearningStreak | null;
  isLoading: boolean;
  studyTimeToday: number; // minutes
}

export interface AnalyticsActions {
  startStudySession: (courseId: string, activity: StudySession['activity'], notes?: string) => Promise<void>;
  endStudySession: () => Promise<void>;
  recordAssignment: (courseId: string, score: number, maxScore: number) => Promise<void>;
  recordAttendance: (courseId: string, present: boolean) => Promise<void>;
  refreshInsights: () => Promise<void>;
  setWeeklyGoal: (hours: number) => Promise<void>;
}

/**
 * Hook for analytics and study tracking
 */
export function useAnalytics(): AnalyticsState & AnalyticsActions {
  const [state, setState] = useState<AnalyticsState>({
    isStudying: false,
    currentSession: null,
    insights: null,
    streak: null,
    isLoading: true,
    studyTimeToday: 0,
  });

  const refreshInterval = useRef<NodeJS.Timeout | null>(null);

  // Initialize analytics
  useEffect(() => {
    initialize();

    // Set up refresh interval
    refreshInterval.current = setInterval(() => {
      refreshCurrentSession();
    }, 60000); // Update every minute

    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, []);

  const initialize = async () => {
    await refreshInsights();
    updateStudyTimeToday();
  };

  /**
   * Refresh current session state
   */
  const refreshCurrentSession = () => {
    const currentSession = analyticsService.getCurrentSession();
    setState(prev => ({
      ...prev,
      isStudying: analyticsService.isStudying(),
      currentSession,
    }));
    
    if (currentSession) {
      updateStudyTimeToday();
    }
  };

  /**
   * Calculate study time today
   */
  const updateStudyTimeToday = async () => {
    const sessions = await analyticsService.getStudySessions();
    const today = new Date().toDateString();
    
    const todayMinutes = sessions
      .filter(s => s.startTime.toDateString() === today)
      .reduce((sum, s) => sum + s.duration, 0);

    // Add current session time if studying
    if (analyticsService.isStudying()) {
      const currentSession = analyticsService.getCurrentSession();
      if (currentSession) {
        const currentMinutes = Math.round(
          (Date.now() - currentSession.startTime.getTime()) / 60000
        );
        setState(prev => ({ ...prev, studyTimeToday: todayMinutes + currentMinutes }));
        return;
      }
    }

    setState(prev => ({ ...prev, studyTimeToday: todayMinutes }));
  };

  /**
   * Start a study session
   */
  const startStudySession = useCallback(
    async (courseId: string, activity: StudySession['activity'], notes?: string) => {
      const session = await analyticsService.startStudySession(courseId, activity, notes);
      
      setState(prev => ({
        ...prev,
        isStudying: true,
        currentSession: session,
      }));

      // Refresh streak
      const streak = await analyticsService.getLearningStreak();
      setState(prev => ({ ...prev, streak }));
    },
    []
  );

  /**
   * End current study session
   */
  const endStudySession = useCallback(async () => {
    await analyticsService.endStudySession();
    
    setState(prev => ({
      ...prev,
      isStudying: false,
      currentSession: null,
    }));

    // Refresh insights
    await refreshInsights();
    updateStudyTimeToday();
  }, []);

  /**
   * Record assignment completion
   */
  const recordAssignment = useCallback(
    async (courseId: string, score: number, maxScore: number) => {
      await analyticsService.recordAssignmentCompletion(courseId, score, maxScore);
      await refreshInsights();
    },
    []
  );

  /**
   * Record attendance
   */
  const recordAttendance = useCallback(async (courseId: string, present: boolean) => {
    await analyticsService.recordAttendance(courseId, present);
    await refreshInsights();
  }, []);

  /**
   * Refresh insights
   */
  const refreshInsights = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const [insights, streak] = await Promise.all([
        analyticsService.getInsights(),
        analyticsService.getLearningStreak(),
      ]);

      setState(prev => ({
        ...prev,
        insights,
        streak,
        isLoading: false,
      }));
    } catch (error) {
      console.error('[useAnalytics] Failed to refresh insights:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  /**
   * Set weekly goal
   */
  const setWeeklyGoal = useCallback(async (hours: number) => {
    await analyticsService.setWeeklyGoal(hours);
    await refreshInsights();
  }, [refreshInsights]);

  return {
    ...state,
    startStudySession,
    endStudySession,
    recordAssignment,
    recordAttendance,
    refreshInsights,
    setWeeklyGoal,
  };
}

/**
 * Hook for course-specific analytics
 */
export function useCourseAnalytics(courseId: string) {
  const [analytics, setAnalytics] = useState<CourseAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [courseId]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const data = await analyticsService.getCourseAnalytics(courseId);
      setAnalytics(data);
    } catch (error) {
      console.error('[useCourseAnalytics] Failed to load:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const recordStudyTime = async (minutes: number) => {
    if (!analytics) return;
    
    analytics.timeSpent += minutes;
    analytics.studySessions++;
    
    await analyticsService.saveCourseAnalytics(analytics);
    setAnalytics({ ...analytics });
  };

  return { analytics, isLoading, refresh: loadAnalytics, recordStudyTime };
}

/**
 * Hook for learning streak display
 */
export function useLearningStreak() {
  const [streak, setStreak] = useState<LearningStreak | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStreak();
  }, []);

  const loadStreak = async () => {
    setIsLoading(true);
    try {
      const data = await analyticsService.getLearningStreak();
      setStreak(data);
    } catch (error) {
      console.error('[useLearningStreak] Failed to load:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isStreakActive = useCallback(() => {
    if (!streak) return false;
    
    const lastDate = new Date(streak.lastStudyDate).toDateString();
    const today = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    return lastDate === today || lastDate === yesterday.toDateString();
  }, [streak]);

  return { streak, isLoading, isActive: isStreakActive(), refresh: loadStreak };
}

/**
 * Hook for study timer
 */
export function useStudyTimer() {
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  const start = useCallback(() => {
    setIsRunning(true);
    startTimeRef.current = new Date();
    
    intervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Math.floor(
          (Date.now() - startTimeRef.current.getTime()) / 60000
        );
        setElapsedMinutes(elapsed);
      }
    }, 60000); // Update every minute
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  const resume = useCallback(() => {
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Math.floor(
          (Date.now() - startTimeRef.current.getTime()) / 60000
        );
        setElapsedMinutes(elapsed);
      }
    }, 60000);
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    const finalMinutes = elapsedMinutes;
    setElapsedMinutes(0);
    startTimeRef.current = null;
    return finalMinutes;
  }, [elapsedMinutes]);

  const reset = useCallback(() => {
    setElapsedMinutes(0);
    startTimeRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    elapsedMinutes,
    isRunning,
    start,
    pause,
    resume,
    stop,
    reset,
    formattedTime: `${Math.floor(elapsedMinutes / 60)}h ${elapsedMinutes % 60}m`,
  };
}

export default useAnalytics;
