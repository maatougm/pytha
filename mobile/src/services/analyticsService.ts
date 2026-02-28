import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StudySession {
  id: string;
  courseId: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // minutes
  activity: 'reading' | 'assignment' | 'review' | 'practice' | 'other';
  notes?: string;
}

export interface LearningStreak {
  current: number;
  longest: number;
  lastStudyDate: Date;
}

export interface CourseAnalytics {
  courseId: string;
  courseName: string;
  timeSpent: number; // minutes
  assignmentsCompleted: number;
  assignmentsTotal: number;
  averageScore: number;
  attendance: number;
  lastAccessed: Date;
  studySessions: number;
}

export interface WeeklyProgress {
  week: string;
  studyTime: number;
  assignmentsCompleted: number;
  averageScore: number;
  daysActive: number;
}

export interface UserInsights {
  totalStudyTime: number;
  averageSessionLength: number;
  mostProductiveDay: string;
  mostProductiveTime: string;
  learningStreak: LearningStreak;
  weeklyGoal: { current: number; target: number }; // hours
  courses: CourseAnalytics[];
  weeklyProgress: WeeklyProgress[];
}

const ANALYTICS_KEY = '@user_analytics';
const STUDY_SESSIONS_KEY = '@study_sessions';
const LEARNING_STREAK_KEY = '@learning_streak';
const WEEKLY_GOAL_KEY = '@weekly_goal';

class AnalyticsService {
  private currentSession: StudySession | null = null;

  /**
   * Start a study session
   */
  async startStudySession(
    courseId: string,
    activity: StudySession['activity'],
    notes?: string
  ): Promise<StudySession> {
    const session: StudySession = {
      id: `session_${Date.now()}`,
      courseId,
      startTime: new Date(),
      activity,
      duration: 0,
      notes,
    };

    this.currentSession = session;
    
    // Update learning streak
    await this.updateLearningStreak();

    console.log('[Analytics] Study session started:', session.id);
    return session;
  }

  /**
   * End current study session
   */
  async endStudySession(): Promise<StudySession | null> {
    if (!this.currentSession) return null;

    const endTime = new Date();
    const duration = Math.round(
      (endTime.getTime() - this.currentSession.startTime.getTime()) / 60000
    );

    const completedSession: StudySession = {
      ...this.currentSession,
      endTime,
      duration,
    };

    // Save session
    await this.saveStudySession(completedSession);

    // Update course analytics
    await this.updateCourseAnalytics(completedSession);

    this.currentSession = null;

    console.log('[Analytics] Study session ended:', completedSession.id, `${duration}min`);
    return completedSession;
  }

  /**
   * Save study session
   */
  private async saveStudySession(session: StudySession): Promise<void> {
    const sessions = await this.getStudySessions();
    sessions.push(session);
    
    // Keep only last 100 sessions
    if (sessions.length > 100) {
      sessions.shift();
    }

    await AsyncStorage.setItem(STUDY_SESSIONS_KEY, JSON.stringify(sessions));
  }

  /**
   * Get all study sessions
   */
  async getStudySessions(): Promise<StudySession[]> {
    const stored = await AsyncStorage.getItem(STUDY_SESSIONS_KEY);
    if (!stored) return [];

    return JSON.parse(stored).map((s: any) => ({
      ...s,
      startTime: new Date(s.startTime),
      endTime: s.endTime ? new Date(s.endTime) : undefined,
    }));
  }

  /**
   * Update learning streak
   */
  private async updateLearningStreak(): Promise<void> {
    const stored = await AsyncStorage.getItem(LEARNING_STREAK_KEY);
    const today = new Date().toDateString();
    
    let streak: LearningStreak = stored
      ? JSON.parse(stored)
      : { current: 0, longest: 0, lastStudyDate: new Date(0) };

    const lastDate = new Date(streak.lastStudyDate).toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastDate === today) {
      // Already studied today
      return;
    } else if (lastDate === yesterday.toDateString()) {
      // Continued streak
      streak.current++;
    } else {
      // New streak
      streak.current = 1;
    }

    streak.lastStudyDate = new Date();
    
    if (streak.current > streak.longest) {
      streak.longest = streak.current;
    }

    await AsyncStorage.setItem(LEARNING_STREAK_KEY, JSON.stringify(streak));
  }

  /**
   * Get learning streak
   */
  async getLearningStreak(): Promise<LearningStreak> {
    const stored = await AsyncStorage.getItem(LEARNING_STREAK_KEY);
    if (!stored) {
      return { current: 0, longest: 0, lastStudyDate: new Date(0) };
    }

    const streak = JSON.parse(stored);
    return {
      ...streak,
      lastStudyDate: new Date(streak.lastStudyDate),
    };
  }

  /**
   * Update course analytics
   */
  private async updateCourseAnalytics(session: StudySession): Promise<void> {
    const analytics = await this.getCourseAnalytics(session.courseId);
    
    analytics.timeSpent += session.duration;
    analytics.studySessions++;
    analytics.lastAccessed = new Date();

    await this.saveCourseAnalytics(analytics);
  }

  /**
   * Get course analytics
   */
  async getCourseAnalytics(courseId: string): Promise<CourseAnalytics> {
    const key = `${ANALYTICS_KEY}_${courseId}`;
    const stored = await AsyncStorage.getItem(key);

    if (stored) {
      const data = JSON.parse(stored);
      return {
        ...data,
        lastAccessed: new Date(data.lastAccessed),
      };
    }

    return {
      courseId,
      courseName: '',
      timeSpent: 0,
      assignmentsCompleted: 0,
      assignmentsTotal: 0,
      averageScore: 0,
      attendance: 0,
      lastAccessed: new Date(),
      studySessions: 0,
    };
  }

  /**
   * Save course analytics
   */
  async saveCourseAnalytics(analytics: CourseAnalytics): Promise<void> {
    const key = `${ANALYTICS_KEY}_${analytics.courseId}`;
    await AsyncStorage.setItem(key, JSON.stringify(analytics));
  }

  /**
   * Record assignment completion
   */
  async recordAssignmentCompletion(
    courseId: string,
    score: number,
    maxScore: number
  ): Promise<void> {
    const analytics = await this.getCourseAnalytics(courseId);
    
    analytics.assignmentsCompleted++;
    
    // Update average score
    const totalScore = analytics.averageScore * (analytics.assignmentsCompleted - 1);
    analytics.averageScore = (totalScore + (score / maxScore) * 100) / analytics.assignmentsCompleted;

    await this.saveCourseAnalytics(analytics);
  }

  /**
   * Record attendance
   */
  async recordAttendance(courseId: string, present: boolean): Promise<void> {
    const analytics = await this.getCourseAnalytics(courseId);
    
    // Simple calculation - in production, track total classes
    if (present) {
      analytics.attendance = Math.min(100, analytics.attendance + 2);
    }

    await this.saveCourseAnalytics(analytics);
  }

  /**
   * Get user insights
   */
  async getInsights(): Promise<UserInsights> {
    const sessions = await this.getStudySessions();
    const streak = await this.getLearningStreak();
    const weeklyGoal = await this.getWeeklyGoal();

    // Calculate total study time
    const totalStudyTime = sessions.reduce((sum, s) => sum + s.duration, 0);

    // Calculate average session length
    const averageSessionLength = sessions.length > 0
      ? totalStudyTime / sessions.length
      : 0;

    // Find most productive day
    const dayDistribution = this.calculateDayDistribution(sessions);
    const mostProductiveDay = Object.entries(dayDistribution)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // Find most productive time
    const timeDistribution = this.calculateTimeDistribution(sessions);
    const mostProductiveTime = Object.entries(timeDistribution)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // Get all course analytics
    const courses = await this.getAllCourseAnalytics();

    // Calculate weekly progress
    const weeklyProgress = this.calculateWeeklyProgress(sessions);

    return {
      totalStudyTime,
      averageSessionLength,
      mostProductiveDay,
      mostProductiveTime,
      learningStreak: streak,
      weeklyGoal,
      courses,
      weeklyProgress,
    };
  }

  /**
   * Get all course analytics
   */
  private async getAllCourseAnalytics(): Promise<CourseAnalytics[]> {
    const keys = await AsyncStorage.getAllKeys();
    const courseKeys = keys.filter(k => k.startsWith(ANALYTICS_KEY));
    
    const courses: CourseAnalytics[] = [];
    for (const key of courseKeys) {
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        const data = JSON.parse(stored);
        courses.push({
          ...data,
          lastAccessed: new Date(data.lastAccessed),
        });
      }
    }

    return courses.sort((a, b) => b.timeSpent - a.timeSpent);
  }

  /**
   * Calculate day distribution
   */
  private calculateDayDistribution(sessions: StudySession[]): Record<string, number> {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const distribution: Record<string, number> = {};

    sessions.forEach(session => {
      const day = days[session.startTime.getDay()];
      distribution[day] = (distribution[day] || 0) + session.duration;
    });

    return distribution;
  }

  /**
   * Calculate time distribution
   */
  private calculateTimeDistribution(sessions: StudySession[]): Record<string, number> {
    const distribution: Record<string, number> = {};

    sessions.forEach(session => {
      const hour = session.startTime.getHours();
      const timeBlock = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
      distribution[timeBlock] = (distribution[timeBlock] || 0) + session.duration;
    });

    return distribution;
  }

  /**
   * Calculate weekly progress
   */
  private calculateWeeklyProgress(sessions: StudySession[]): WeeklyProgress[] {
    const weeks: Map<string, WeeklyProgress> = new Map();

    sessions.forEach(session => {
      const weekKey = this.getWeekKey(session.startTime);
      
      if (!weeks.has(weekKey)) {
        weeks.set(weekKey, {
          week: weekKey,
          studyTime: 0,
          assignmentsCompleted: 0,
          averageScore: 0,
          daysActive: 0,
        });
      }

      const week = weeks.get(weekKey)!;
      week.studyTime += session.duration;
    });

    return Array.from(weeks.values())
      .sort((a, b) => b.week.localeCompare(a.week))
      .slice(0, 8); // Last 8 weeks
  }

  /**
   * Get week key from date
   */
  private getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const week = this.getWeekNumber(date);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }

  /**
   * Get week number
   */
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  /**
   * Get weekly goal
   */
  async getWeeklyGoal(): Promise<{ current: number; target: number }> {
    const stored = await AsyncStorage.getItem(WEEKLY_GOAL_KEY);
    const target = stored ? JSON.parse(stored).target : 10; // Default 10 hours

    // Calculate current week progress
    const sessions = await this.getStudySessions();
    const currentWeekSessions = sessions.filter(s => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return s.startTime >= weekAgo;
    });

    const current = currentWeekSessions.reduce((sum, s) => sum + s.duration, 0) / 60; // Convert to hours

    return { current: Math.round(current * 10) / 10, target };
  }

  /**
   * Set weekly goal
   */
  async setWeeklyGoal(hours: number): Promise<void> {
    await AsyncStorage.setItem(WEEKLY_GOAL_KEY, JSON.stringify({ target: hours }));
  }

  /**
   * Get current session
   */
  getCurrentSession(): StudySession | null {
    return this.currentSession;
  }

  /**
   * Check if currently studying
   */
  isStudying(): boolean {
    return this.currentSession !== null;
  }

  /**
   * Clear all analytics data
   */
  async clearAll(): Promise<void> {
    this.currentSession = null;
    const keys = await AsyncStorage.getAllKeys();
    const analyticsKeys = keys.filter(k => 
      k.startsWith(ANALYTICS_KEY) || 
      k === STUDY_SESSIONS_KEY || 
      k === LEARNING_STREAK_KEY ||
      k === WEEKLY_GOAL_KEY
    );
    await AsyncStorage.multiRemove(analyticsKeys);
  }
}

// Export singleton
export const analyticsService = new AnalyticsService();
export default analyticsService;
