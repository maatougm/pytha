import apiClient from './api-client';
import offlineDB from './offlineDatabase';

export interface Student {
  id: string;
  name: string;
  grade: string;
  section: string;
  rollNumber: string;
  avatar?: string;
  dateOfBirth: Date;
  bloodGroup?: string;
  allergies?: string[];
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface StudentProgress {
  studentId: string;
  overallGrade: string;
  gpa: number;
  attendance: {
    present: number;
    absent: number;
    late: number;
    rate: number;
  };
  courseProgress: {
    courseId: string;
    courseName: string;
    teacher: string;
    currentGrade: string;
    percentage: number;
    assignmentsCompleted: number;
    assignmentsTotal: number;
    lastAssignment?: {
      name: string;
      score: number;
      maxScore: number;
      submittedAt: Date;
    };
    trend: 'up' | 'down' | 'stable';
  }[];
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'grade' | 'attendance' | 'assignment' | 'behavior' | 'announcement';
  title: string;
  description: string;
  timestamp: Date;
  courseName?: string;
  metadata?: any;
}

export interface BehaviorRecord {
  id: string;
  studentId: string;
  type: 'positive' | 'negative' | 'neutral';
  category: 'academic' | 'behavior' | 'attendance' | 'participation';
  description: string;
  points: number;
  recordedBy: string;
  recordedAt: Date;
  courseName?: string;
}

export interface FeePayment {
  id: string;
  studentId: string;
  type: 'tuition' | 'transport' | 'library' | 'lab' | 'activity' | 'other';
  description: string;
  amount: number;
  dueDate: Date;
  paidAmount?: number;
  paidDate?: Date;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  paymentMethod?: string;
  transactionId?: string;
}

export interface ParentTeacherConference {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherSubject: string;
  studentId: string;
  proposedDates: Date[];
  selectedDate?: Date;
  duration: number; // minutes
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  meetingLink?: string;
}

export interface ReportCard {
  id: string;
  studentId: string;
  semester: string;
  academicYear: string;
  issueDate: Date;
  courses: {
    courseId: string;
    courseName: string;
    teacher: string;
    grades: {
      term: string;
      score: number;
      grade: string;
    }[];
    finalGrade: string;
    finalPercentage: number;
    attendance: number;
    comments?: string;
  }[];
  overallGPA: number;
  overallAttendance: number;
  behaviorSummary: string;
  teacherComments: string;
  principalSignature?: string;
}

class ParentService {
  /**
   * Get all children for the parent
   */
  async getChildren(): Promise<Student[]> {
    try {
      const response = await apiClient.get<any>('/api/parent/children');
      return response.map((s: any) => ({
        ...s,
        dateOfBirth: new Date(s.dateOfBirth),
      }));
    } catch (error) {
      console.error('[ParentService] Failed to get children:', error);
      // Return cached data if available
      return await offlineDB.getCache<Student[]>('parent_children') || [];
    }
  }

  /**
   * Get student progress
   */
  async getStudentProgress(studentId: string): Promise<StudentProgress | null> {
    try {
      const response = await apiClient.get<any>(`/api/parent/students/${studentId}/progress`);
      const progress: StudentProgress = {
        ...response,
        recentActivity: response.recentActivity.map((a: any) => ({
          ...a,
          timestamp: new Date(a.timestamp),
        })),
      };

      // Cache for offline
      await offlineDB.setCache(`student_progress_${studentId}`, progress, 60);
      return progress;
    } catch (error) {
      console.error('[ParentService] Failed to get progress:', error);
      return await offlineDB.getCache<StudentProgress>(`student_progress_${studentId}`);
    }
  }

  /**
   * Get behavior records
   */
  async getBehaviorRecords(studentId: string, limit = 20): Promise<BehaviorRecord[]> {
    try {
      const response = await apiClient.get<any>(`/api/parent/students/${studentId}/behavior`, {
        params: { limit },
      });
      return response.map((r: any) => ({
        ...r,
        recordedAt: new Date(r.recordedAt),
      }));
    } catch (error) {
      console.error('[ParentService] Failed to get behavior records:', error);
      return [];
    }
  }

  /**
   * Get fee payments
   */
  async getFeePayments(studentId?: string): Promise<FeePayment[]> {
    try {
      const params = studentId ? { studentId } : {};
      const response = await apiClient.get<any>('/api/parent/payments', { params });
      return response.map((p: any) => ({
        ...p,
        dueDate: new Date(p.dueDate),
        paidDate: p.paidDate ? new Date(p.paidDate) : undefined,
      }));
    } catch (error) {
      console.error('[ParentService] Failed to get payments:', error);
      return [];
    }
  }

  /**
   * Make a payment
   */
  async makePayment(
    paymentId: string,
    amount: number,
    paymentMethod: string,
    paymentDetails: any
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const response = await apiClient.post<any>(`/api/parent/payments/${paymentId}/pay`, {
        amount,
        paymentMethod,
        paymentDetails,
      });
      return {
        success: true,
        transactionId: response.transactionId,
      };
    } catch (error) {
      console.error('[ParentService] Payment failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed',
      };
    }
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(studentId?: string): Promise<FeePayment[]> {
    try {
      const params = studentId ? { studentId, status: 'paid' } : { status: 'paid' };
      const response = await apiClient.get<any>('/api/parent/payments', { params });
      return response.map((p: any) => ({
        ...p,
        dueDate: new Date(p.dueDate),
        paidDate: p.paidDate ? new Date(p.paidDate) : undefined,
      }));
    } catch (error) {
      console.error('[ParentService] Failed to get payment history:', error);
      return [];
    }
  }

  /**
   * Schedule parent-teacher conference
   */
  async scheduleConference(
    teacherId: string,
    studentId: string,
    proposedDates: Date[],
    notes?: string
  ): Promise<{ success: boolean; conferenceId?: string; error?: string }> {
    try {
      const response = await apiClient.post<any>('/api/parent/conferences', {
        teacherId,
        studentId,
        proposedDates: proposedDates.map(d => d.toISOString()),
        notes,
      });
      return {
        success: true,
        conferenceId: response.id,
      };
    } catch (error) {
      console.error('[ParentService] Failed to schedule conference:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to schedule',
      };
    }
  }

  /**
   * Get conferences
   */
  async getConferences(studentId?: string): Promise<ParentTeacherConference[]> {
    try {
      const params = studentId ? { studentId } : {};
      const response = await apiClient.get<any>('/api/parent/conferences', { params });
      return response.map((c: any) => ({
        ...c,
        proposedDates: c.proposedDates.map((d: string) => new Date(d)),
        selectedDate: c.selectedDate ? new Date(c.selectedDate) : undefined,
      }));
    } catch (error) {
      console.error('[ParentService] Failed to get conferences:', error);
      return [];
    }
  }

  /**
   * Confirm conference date
   */
  async confirmConference(
    conferenceId: string,
    selectedDate: Date
  ): Promise<boolean> {
    try {
      await apiClient.post<any>(`/api/parent/conferences/${conferenceId}/confirm`, {
        selectedDate: selectedDate.toISOString(),
      });
      return true;
    } catch (error) {
      console.error('[ParentService] Failed to confirm conference:', error);
      return false;
    }
  }

  /**
   * Cancel conference
   */
  async cancelConference(conferenceId: string, reason?: string): Promise<boolean> {
    try {
      await apiClient.post<any>(`/api/parent/conferences/${conferenceId}/cancel`, { reason });
      return true;
    } catch (error) {
      console.error('[ParentService] Failed to cancel conference:', error);
      return false;
    }
  }

  /**
   * Get report cards
   */
  async getReportCards(studentId: string): Promise<ReportCard[]> {
    try {
      const response = await apiClient.get<any>(`/api/parent/students/${studentId}/report-cards`);
      return response.map((r: any) => ({
        ...r,
        issueDate: new Date(r.issueDate),
      }));
    } catch (error) {
      console.error('[ParentService] Failed to get report cards:', error);
      return [];
    }
  }

  /**
   * Get latest report card
   */
  async getLatestReportCard(studentId: string): Promise<ReportCard | null> {
    try {
      const response = await apiClient.get<any>(`/api/parent/students/${studentId}/report-cards/latest`);
      return {
        ...response,
        issueDate: new Date(response.issueDate),
      };
    } catch (error) {
      console.error('[ParentService] Failed to get latest report card:', error);
      return null;
    }
  }

  /**
   * Acknowledge report card
   */
  async acknowledgeReportCard(reportCardId: string): Promise<boolean> {
    try {
      await apiClient.post<any>(`/api/parent/report-cards/${reportCardId}/acknowledge`);
      return true;
    } catch (error) {
      console.error('[ParentService] Failed to acknowledge report card:', error);
      return false;
    }
  }

  /**
   * Get recent activity for all children
   */
  async getRecentActivity(limit = 10): Promise<ActivityItem[]> {
    try {
      const response = await apiClient.get<any>('/api/parent/activity', { params: { limit } });
      return response.map((a: any) => ({
        ...a,
        timestamp: new Date(a.timestamp),
      }));
    } catch (error) {
      console.error('[ParentService] Failed to get activity:', error);
      return [];
    }
  }

  /**
   * Send message to teacher
   */
  async sendMessageToTeacher(
    teacherId: string,
    studentId: string,
    message: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const response = await apiClient.post<any>('/api/parent/messages', {
        teacherId,
        studentId,
        content: message,
      });
      return {
        success: true,
        messageId: response.id,
      };
    } catch (error) {
      console.error('[ParentService] Failed to send message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message',
      };
    }
  }

  /**
   * Get teacher list for student's courses
   */
  async getTeachers(studentId: string): Promise<{ id: string; name: string; subject: string; avatar?: string }[]> {
    try {
      const response = await apiClient.get<any>(`/api/parent/students/${studentId}/teachers`);
      return response;
    } catch (error) {
      console.error('[ParentService] Failed to get teachers:', error);
      return [];
    }
  }

  /**
   * Get attendance summary
   */
  async getAttendanceSummary(studentId: string, period: 'week' | 'month' | 'semester' = 'month'): Promise<{
    present: number;
    absent: number;
    late: number;
    excused: number;
    rate: number;
    trend: 'improving' | 'declining' | 'stable';
  }> {
    try {
      const response = await apiClient.get<any>(`/api/parent/students/${studentId}/attendance/summary`, {
        params: { period },
      });
      return response;
    } catch (error) {
      console.error('[ParentService] Failed to get attendance summary:', error);
      return { present: 0, absent: 0, late: 0, excused: 0, rate: 0, trend: 'stable' };
    }
  }
}

// Export singleton
export const parentService = new ParentService();
export default parentService;
