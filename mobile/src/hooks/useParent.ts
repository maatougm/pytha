import { useState, useEffect, useCallback } from 'react';
import { parentService, Student, StudentProgress, ActivityItem, FeePayment, ParentTeacherConference, ReportCard, BehaviorRecord } from '@/src/services/parentService';

export interface ParentState {
  children: Student[];
  selectedChild: Student | null;
  progress: StudentProgress | null;
  recentActivity: ActivityItem[];
  isLoading: boolean;
  error: string | null;
}

export interface ParentActions {
  selectChild: (student: Student) => Promise<void>;
  refreshChildren: () => Promise<void>;
  refreshProgress: () => Promise<void>;
  getActivity: (limit?: number) => Promise<ActivityItem[]>;
}

/**
 * Hook for parent dashboard functionality
 */
export function useParent(): ParentState & ParentActions {
  const [state, setState] = useState<ParentState>({
    children: [],
    selectedChild: null,
    progress: null,
    recentActivity: [],
    isLoading: true,
    error: null,
  });

  // Load children on mount
  useEffect(() => {
    loadChildren();
  }, []);

  /**
   * Load parent's children
   */
  const loadChildren = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const children = await parentService.getChildren();
      
      setState(prev => ({
        ...prev,
        children,
        isLoading: false,
        // Auto-select first child if none selected
        selectedChild: prev.selectedChild || (children.length > 0 ? children[0] : null),
      }));

      // Load progress for first child
      if (children.length > 0 && !state.selectedChild) {
        await loadProgress(children[0].id);
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load children',
      }));
    }
  };

  /**
   * Load progress for a student
   */
  const loadProgress = async (studentId: string) => {
    try {
      const progress = await parentService.getStudentProgress(studentId);
      setState(prev => ({ ...prev, progress }));
    } catch (error) {
      console.error('[useParent] Failed to load progress:', error);
    }
  };

  /**
   * Select a child
   */
  const selectChild = useCallback(async (student: Student) => {
    setState(prev => ({ ...prev, selectedChild: student, progress: null }));
    await loadProgress(student.id);
  }, []);

  /**
   * Refresh children list
   */
  const refreshChildren = useCallback(async () => {
    await loadChildren();
  }, []);

  /**
   * Refresh progress for selected child
   */
  const refreshProgress = useCallback(async () => {
    if (state.selectedChild) {
      await loadProgress(state.selectedChild.id);
    }
  }, [state.selectedChild]);

  /**
   * Get recent activity
   */
  const getActivity = useCallback(async (limit = 10): Promise<ActivityItem[]> => {
    return await parentService.getRecentActivity(limit);
  }, []);

  return {
    ...state,
    selectChild,
    refreshChildren,
    refreshProgress,
    getActivity,
  };
}

/**
 * Hook for student progress details
 */
export function useStudentProgress(studentId: string) {
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProgress();
  }, [studentId]);

  const loadProgress = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await parentService.getStudentProgress(studentId);
      setProgress(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load progress');
    } finally {
      setIsLoading(false);
    }
  };

  return { progress, isLoading, error, refresh: loadProgress };
}

/**
 * Hook for fee payments
 */
export function useFeePayments(studentId?: string) {
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [history, setHistory] = useState<FeePayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalDue, setTotalDue] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);

  useEffect(() => {
    loadPayments();
  }, [studentId]);

  const loadPayments = async () => {
    setIsLoading(true);

    try {
      const [pendingPayments, paidPayments] = await Promise.all([
        parentService.getFeePayments(studentId),
        parentService.getPaymentHistory(studentId),
      ]);

      setPayments(pendingPayments);
      setHistory(paidPayments);

      // Calculate totals
      const due = pendingPayments.reduce((sum, p) => sum + (p.amount - (p.paidAmount || 0)), 0);
      const paid = paidPayments.reduce((sum, p) => sum + (p.paidAmount || 0), 0);

      setTotalDue(due);
      setTotalPaid(paid);
    } catch (error) {
      console.error('[useFeePayments] Failed to load:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const makePayment = async (
    paymentId: string,
    amount: number,
    paymentMethod: string,
    details: any
  ) => {
    const result = await parentService.makePayment(paymentId, amount, paymentMethod, details);
    if (result.success) {
      await loadPayments();
    }
    return result;
  };

  return {
    payments,
    history,
    isLoading,
    totalDue,
    totalPaid,
    refresh: loadPayments,
    makePayment,
  };
}

/**
 * Hook for parent-teacher conferences
 */
export function useConferences(studentId?: string) {
  const [conferences, setConferences] = useState<ParentTeacherConference[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConferences();
  }, [studentId]);

  const loadConferences = async () => {
    setIsLoading(true);
    try {
      const data = await parentService.getConferences(studentId);
      setConferences(data);
    } catch (error) {
      console.error('[useConferences] Failed to load:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const scheduleConference = async (
    teacherId: string,
    studentId: string,
    proposedDates: Date[],
    notes?: string
  ) => {
    const result = await parentService.scheduleConference(teacherId, studentId, proposedDates, notes);
    if (result.success) {
      await loadConferences();
    }
    return result;
  };

  const confirmConference = async (conferenceId: string, selectedDate: Date) => {
    const success = await parentService.confirmConference(conferenceId, selectedDate);
    if (success) {
      await loadConferences();
    }
    return success;
  };

  const cancelConference = async (conferenceId: string, reason?: string) => {
    const success = await parentService.cancelConference(conferenceId, reason);
    if (success) {
      await loadConferences();
    }
    return success;
  };

  return {
    conferences,
    isLoading,
    refresh: loadConferences,
    scheduleConference,
    confirmConference,
    cancelConference,
  };
}

/**
 * Hook for report cards
 */
export function useReportCards(studentId: string) {
  const [reportCards, setReportCards] = useState<ReportCard[]>([]);
  const [latestReport, setLatestReport] = useState<ReportCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReportCards();
  }, [studentId]);

  const loadReportCards = async () => {
    setIsLoading(true);
    try {
      const [allReports, latest] = await Promise.all([
        parentService.getReportCards(studentId),
        parentService.getLatestReportCard(studentId),
      ]);
      setReportCards(allReports);
      setLatestReport(latest);
    } catch (error) {
      console.error('[useReportCards] Failed to load:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const acknowledgeReport = async (reportCardId: string) => {
    const success = await parentService.acknowledgeReportCard(reportCardId);
    if (success) {
      await loadReportCards();
    }
    return success;
  };

  return {
    reportCards,
    latestReport,
    isLoading,
    refresh: loadReportCards,
    acknowledgeReport,
  };
}

/**
 * Hook for behavior records
 */
export function useBehaviorRecords(studentId: string) {
  const [records, setRecords] = useState<BehaviorRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState({
    positive: 0,
    negative: 0,
    neutral: 0,
    totalPoints: 0,
  });

  useEffect(() => {
    loadRecords();
  }, [studentId]);

  const loadRecords = async () => {
    setIsLoading(true);
    try {
      const data = await parentService.getBehaviorRecords(studentId, 50);
      setRecords(data);

      // Calculate summary
      const summary = data.reduce(
        (acc, record) => ({
          positive: acc.positive + (record.type === 'positive' ? 1 : 0),
          negative: acc.negative + (record.type === 'negative' ? 1 : 0),
          neutral: acc.neutral + (record.type === 'neutral' ? 1 : 0),
          totalPoints: acc.totalPoints + record.points,
        }),
        { positive: 0, negative: 0, neutral: 0, totalPoints: 0 }
      );

      setSummary(summary);
    } catch (error) {
      console.error('[useBehaviorRecords] Failed to load:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return { records, summary, isLoading, refresh: loadRecords };
}

/**
 * Hook for attendance summary
 */
export function useAttendanceSummary(studentId: string, period: 'week' | 'month' | 'semester' = 'month') {
  const [summary, setSummary] = useState({
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    rate: 0,
    trend: 'stable' as 'improving' | 'declining' | 'stable',
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, [studentId, period]);

  const loadSummary = async () => {
    setIsLoading(true);
    try {
      const data = await parentService.getAttendanceSummary(studentId, period);
      setSummary(data);
    } catch (error) {
      console.error('[useAttendanceSummary] Failed to load:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return { summary, isLoading, refresh: loadSummary };
}

/**
 * Hook for teacher communication
 */
export function useTeacherCommunication(studentId: string) {
  const [teachers, setTeachers] = useState<{ id: string; name: string; subject: string; avatar?: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTeachers();
  }, [studentId]);

  const loadTeachers = async () => {
    setIsLoading(true);
    try {
      const data = await parentService.getTeachers(studentId);
      setTeachers(data);
    } catch (error) {
      console.error('[useTeacherCommunication] Failed to load:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (teacherId: string, message: string) => {
    return await parentService.sendMessageToTeacher(teacherId, studentId, message);
  };

  return { teachers, isLoading, refresh: loadTeachers, sendMessage };
}

export default useParent;
