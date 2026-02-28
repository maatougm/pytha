import { useState, useCallback } from 'react';
import { pdfExportService, GradeReport, AttendanceReport, ProgressReport } from '@/src/services/pdfExportService';

export interface PDFExportState {
  isGenerating: boolean;
  error: string | null;
  lastExportedFile: string | null;
}

export interface PDFExportActions {
  exportGradeReport: (report: GradeReport) => Promise<void>;
  exportAttendanceReport: (report: AttendanceReport) => Promise<void>;
  exportProgressReport: (report: ProgressReport) => Promise<void>;
  previewPDF: (html: string) => Promise<void>;
  clearError: () => void;
}

/**
 * Hook for PDF export functionality
 */
export function usePDFExport(): PDFExportState & PDFExportActions {
  const [state, setState] = useState<PDFExportState>({
    isGenerating: false,
    error: null,
    lastExportedFile: null,
  });

  /**
   * Export grade report as PDF
   */
  const exportGradeReport = useCallback(async (report: GradeReport): Promise<void> => {
    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      await pdfExportService.exportGradeReport(report);
      setState(prev => ({
        ...prev,
        isGenerating: false,
        lastExportedFile: `grades_${report.courseCode}.pdf`,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: error instanceof Error ? error.message : 'Failed to export grade report',
      }));
    }
  }, []);

  /**
   * Export attendance report as PDF
   */
  const exportAttendanceReport = useCallback(async (report: AttendanceReport): Promise<void> => {
    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      await pdfExportService.exportAttendanceReport(report);
      setState(prev => ({
        ...prev,
        isGenerating: false,
        lastExportedFile: `attendance_${report.studentName}.pdf`,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: error instanceof Error ? error.message : 'Failed to export attendance report',
      }));
    }
  }, []);

  /**
   * Export progress report as PDF
   */
  const exportProgressReport = useCallback(async (report: ProgressReport): Promise<void> => {
    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      await pdfExportService.exportProgressReport(report);
      setState(prev => ({
        ...prev,
        isGenerating: false,
        lastExportedFile: `progress_${report.semester}.pdf`,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: error instanceof Error ? error.message : 'Failed to export progress report',
      }));
    }
  }, []);

  /**
   * Preview PDF before exporting
   */
  const previewPDF = useCallback(async (html: string): Promise<void> => {
    try {
      await pdfExportService.previewPDF(html);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to preview PDF',
      }));
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    exportGradeReport,
    exportAttendanceReport,
    exportProgressReport,
    previewPDF,
    clearError,
  };
}

/**
 * Hook for generating grade report data
 */
export function useGradeReportData(
  studentId: string,
  courseId: string,
  semester: string
) {
  const [report, setReport] = useState<GradeReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pdfExport = usePDFExport();

  const generateReport = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // This would fetch data from your API
      // For now, using mock data structure
      const mockReport: GradeReport = {
        studentName: 'John Doe',
        studentId,
        courseName: 'Mathematics 101',
        courseCode: 'MATH101',
        instructor: 'Dr. Smith',
        semester,
        grades: [],
        summary: {
          currentGrade: 'A-',
          percentage: 91.5,
          completed: 8,
          total: 10,
        },
      };

      setReport(mockReport);
      return mockReport;
    } catch (error) {
      console.error('[useGradeReportData] Failed to generate:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [studentId, courseId, semester]);

  const exportToPDF = useCallback(async () => {
    if (report) {
      await pdfExport.exportGradeReport(report);
    }
  }, [report, pdfExport]);

  return {
    report,
    isLoading,
    isGenerating: pdfExport.isGenerating,
    generateReport,
    exportToPDF,
  };
}

/**
 * Hook for generating attendance report data
 */
export function useAttendanceReportData(
  studentId: string,
  courseId: string,
  startDate: Date,
  endDate: Date
) {
  const [report, setReport] = useState<AttendanceReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pdfExport = usePDFExport();

  const generateReport = useCallback(async () => {
    setIsLoading(true);

    try {
      // Fetch attendance data
      const mockReport: AttendanceReport = {
        studentName: 'John Doe',
        courseName: 'Mathematics 101',
        semester: 'Fall 2024',
        period: { start: startDate, end: endDate },
        records: [],
        summary: {
          present: 15,
          absent: 2,
          late: 1,
          excused: 1,
          rate: 88.2,
        },
      };

      setReport(mockReport);
      return mockReport;
    } catch (error) {
      console.error('[useAttendanceReportData] Failed to generate:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [studentId, courseId, startDate, endDate]);

  const exportToPDF = useCallback(async () => {
    if (report) {
      await pdfExport.exportAttendanceReport(report);
    }
  }, [report, pdfExport]);

  return {
    report,
    isLoading,
    isGenerating: pdfExport.isGenerating,
    generateReport,
    exportToPDF,
  };
}

/**
 * Hook for generating progress report data
 */
export function useProgressReportData(studentId: string, semester: string) {
  const [report, setReport] = useState<ProgressReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pdfExport = usePDFExport();

  const generateReport = useCallback(async () => {
    setIsLoading(true);

    try {
      const mockReport: ProgressReport = {
        studentName: 'John Doe',
        studentId,
        semester,
        date: new Date(),
        courses: [],
        overallGPA: 3.7,
        overallAttendance: 92,
        teacherComments: 'Good progress overall. Keep up the good work!',
      };

      setReport(mockReport);
      return mockReport;
    } catch (error) {
      console.error('[useProgressReportData] Failed to generate:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [studentId, semester]);

  const exportToPDF = useCallback(async () => {
    if (report) {
      await pdfExport.exportProgressReport(report);
    }
  }, [report, pdfExport]);

  return {
    report,
    isLoading,
    isGenerating: pdfExport.isGenerating,
    generateReport,
    exportToPDF,
  };
}

export default usePDFExport;
