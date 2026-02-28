import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export interface GradeReport {
  studentName: string;
  studentId: string;
  courseName: string;
  courseCode: string;
  instructor: string;
  semester: string;
  grades: {
    assignment: string;
    type: string;
    score: number;
    maxScore: number;
    percentage: number;
    date: Date;
    feedback?: string;
  }[];
  summary: {
    currentGrade: string;
    percentage: number;
    completed: number;
    total: number;
  };
}

export interface AttendanceReport {
  studentName: string;
  courseName: string;
  semester: string;
  period: { start: Date; end: Date };
  records: {
    date: Date;
    status: 'present' | 'absent' | 'late' | 'excused';
    notes?: string;
  }[];
  summary: {
    present: number;
    absent: number;
    late: number;
    excused: number;
    rate: number;
  };
}

export interface ProgressReport {
  studentName: string;
  studentId: string;
  semester: string;
  date: Date;
  courses: {
    name: string;
    code: string;
    grade: string;
    percentage: number;
    attendance: number;
    assignmentsCompleted: string;
    status: 'on_track' | 'at_risk' | 'excellent';
    comments?: string;
  }[];
  overallGPA: number;
  overallAttendance: number;
  teacherComments: string;
}

class PDFExportService {
  /**
   * Generate and share a grade report
   */
  async exportGradeReport(report: GradeReport): Promise<void> {
    const html = this.generateGradeReportHTML(report);
    await this.generateAndSharePDF(html, `grades_${report.courseCode}_${Date.now()}.pdf`);
  }

  /**
   * Generate and share an attendance report
   */
  async exportAttendanceReport(report: AttendanceReport): Promise<void> {
    const html = this.generateAttendanceReportHTML(report);
    await this.generateAndSharePDF(html, `attendance_${Date.now()}.pdf`);
  }

  /**
   * Generate and share a progress report
   */
  async exportProgressReport(report: ProgressReport): Promise<void> {
    const html = this.generateProgressReportHTML(report);
    await this.generateAndSharePDF(html, `progress_${report.semester}_${Date.now()}.pdf`);
  }

  /**
   * Generate PDF from HTML and share
   */
  private async generateAndSharePDF(html: string, filename: string): Promise<void> {
    try {
      // Generate PDF
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      // Rename file
      const newUri = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.moveAsync({
        from: uri,
        to: newUri,
      });

      // Share
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(newUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Export Report',
          UTI: 'com.adobe.pdf',
        });
      } else {
        throw new Error('Sharing is not available on this device');
      }
    } catch (error) {
      console.error('[PDFExport] Failed to generate PDF:', error);
      throw error;
    }
  }

  /**
   * Generate grade report HTML
   */
  private generateGradeReportHTML(report: GradeReport): string {
    const gradesHTML = report.grades.map(g => `
      <tr>
        <td>${g.assignment}</td>
        <td>${g.type}</td>
        <td>${g.score}/${g.maxScore}</td>
        <td>${g.percentage.toFixed(1)}%</td>
        <td>${g.date.toLocaleDateString()}</td>
        <td>${g.feedback || '-'}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Grade Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { color: #0066CC; margin-bottom: 5px; }
          .info { margin-bottom: 20px; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
          .label { font-weight: bold; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #0066CC; color: white; padding: 12px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #ddd; }
          tr:nth-child(even) { background: #f9f9f9; }
          .summary { margin-top: 30px; padding: 20px; background: #f0f8ff; border-radius: 8px; }
          .summary h2 { color: #0066CC; margin-top: 0; }
          .grade-display { font-size: 48px; font-weight: bold; color: #0066CC; text-align: center; }
          .footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎓 Grade Report</h1>
          <p>${report.semester}</p>
        </div>

        <div class="info">
          <div class="info-row">
            <span><span class="label">Student:</span> ${report.studentName}</span>
            <span><span class="label">ID:</span> ${report.studentId}</span>
          </div>
          <div class="info-row">
            <span><span class="label">Course:</span> ${report.courseName}</span>
            <span><span class="label">Code:</span> ${report.courseCode}</span>
          </div>
          <div class="info-row">
            <span><span class="label">Instructor:</span> ${report.instructor}</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Assignment</th>
              <th>Type</th>
              <th>Score</th>
              <th>Percentage</th>
              <th>Date</th>
              <th>Feedback</th>
            </tr>
          </thead>
          <tbody>
            ${gradesHTML}
          </tbody>
        </table>

        <div class="summary">
          <h2>Summary</h2>
          <div class="grade-display">${report.summary.currentGrade}</div>
          <p style="text-align: center;">
            ${report.summary.percentage.toFixed(1)}% | 
            ${report.summary.completed} of ${report.summary.total} assignments completed
          </p>
        </div>

        <div class="footer">
          <p>Generated by School Hub on ${new Date().toLocaleString()}</p>
          <p>This is an official academic record.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate attendance report HTML
   */
  private generateAttendanceReportHTML(report: AttendanceReport): string {
    const recordsHTML = report.records.map(r => {
      const statusColor = {
        present: '#22c55e',
        absent: '#ef4444',
        late: '#f59e0b',
        excused: '#3b82f6',
      }[r.status];

      return `
        <tr>
          <td>${r.date.toLocaleDateString()}</td>
          <td style="color: ${statusColor}; font-weight: bold; text-transform: uppercase;">${r.status}</td>
          <td>${r.notes || '-'}</td>
        </tr>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Attendance Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { color: #0066CC; margin-bottom: 5px; }
          .summary-cards { display: flex; justify-content: space-around; margin: 20px 0; }
          .card { text-align: center; padding: 20px; border-radius: 8px; min-width: 100px; }
          .card.present { background: #dcfce7; color: #166534; }
          .card.absent { background: #fee2e2; color: #991b1b; }
          .card.late { background: #fef3c7; color: #92400e; }
          .card.excused { background: #dbeafe; color: #1e40af; }
          .card .number { font-size: 36px; font-weight: bold; }
          .card .label { font-size: 14px; text-transform: uppercase; }
          .rate { text-align: center; font-size: 24px; margin: 20px 0; }
          .rate .percentage { font-size: 48px; font-weight: bold; color: #0066CC; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #0066CC; color: white; padding: 12px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #ddd; }
          tr:nth-child(even) { background: #f9f9f9; }
          .footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📋 Attendance Report</h1>
          <p>${report.courseName}</p>
          <p>${report.period.start.toLocaleDateString()} - ${report.period.end.toLocaleDateString()}</p>
        </div>

        <div class="summary-cards">
          <div class="card present">
            <div class="number">${report.summary.present}</div>
            <div class="label">Present</div>
          </div>
          <div class="card absent">
            <div class="number">${report.summary.absent}</div>
            <div class="label">Absent</div>
          </div>
          <div class="card late">
            <div class="number">${report.summary.late}</div>
            <div class="label">Late</div>
          </div>
          <div class="card excused">
            <div class="number">${report.summary.excused}</div>
            <div class="label">Excused</div>
          </div>
        </div>

        <div class="rate">
          <div class="percentage">${report.summary.rate.toFixed(1)}%</div>
          <p>Attendance Rate</p>
        </div>

        <h2>Attendance Records</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Status</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${recordsHTML}
          </tbody>
        </table>

        <div class="footer">
          <p>Generated by School Hub on ${new Date().toLocaleString()}</p>
          <p>Student: ${report.studentName}</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate progress report HTML
   */
  private generateProgressReportHTML(report: ProgressReport): string {
    const coursesHTML = report.courses.map(c => {
      const statusColor = {
        on_track: '#22c55e',
        at_risk: '#ef4444',
        excellent: '#0066CC',
      }[c.status];

      const statusText = {
        on_track: 'On Track',
        at_risk: 'At Risk',
        excellent: 'Excellent',
      }[c.status];

      return `
        <tr>
          <td><strong>${c.name}</strong><br><small>${c.code}</small></td>
          <td style="font-size: 24px; font-weight: bold; color: ${statusColor};">${c.grade}</td>
          <td>${c.percentage.toFixed(1)}%</td>
          <td>${c.attendance.toFixed(0)}%</td>
          <td>${c.assignmentsCompleted}</td>
          <td style="color: ${statusColor}; font-weight: bold;">${statusText}</td>
          <td>${c.comments || '-'}</td>
        </tr>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Progress Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { color: #0066CC; margin-bottom: 5px; }
          .student-info { display: flex; justify-content: space-between; margin-bottom: 20px; padding: 15px; background: #f0f8ff; border-radius: 8px; }
          .info-item { text-align: center; }
          .info-item .label { color: #666; font-size: 12px; }
          .info-item .value { font-size: 18px; font-weight: bold; color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
          th { background: #0066CC; color: white; padding: 12px; text-align: left; }
          td { padding: 12px; border-bottom: 1px solid #ddd; }
          tr:nth-child(even) { background: #f9f9f9; }
          .comments { margin-top: 30px; padding: 20px; background: #f9f9f9; border-radius: 8px; }
          .comments h3 { color: #0066CC; margin-top: 0; }
          .footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 Student Progress Report</h1>
          <p>${report.semester}</p>
        </div>

        <div class="student-info">
          <div class="info-item">
            <div class="label">STUDENT</div>
            <div class="value">${report.studentName}</div>
          </div>
          <div class="info-item">
            <div class="label">STUDENT ID</div>
            <div class="value">${report.studentId}</div>
          </div>
          <div class="info-item">
            <div class="label">GPA</div>
            <div class="value">${report.overallGPA.toFixed(2)}</div>
          </div>
          <div class="info-item">
            <div class="label">ATTENDANCE</div>
            <div class="value">${report.overallAttendance.toFixed(1)}%</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Course</th>
              <th>Grade</th>
              <th>Score</th>
              <th>Attendance</th>
              <th>Assignments</th>
              <th>Status</th>
              <th>Comments</th>
            </tr>
          </thead>
          <tbody>
            ${coursesHTML}
          </tbody>
        </table>

        <div class="comments">
          <h3>Teacher Comments</h3>
          <p>${report.teacherComments}</p>
        </div>

        <div class="footer">
          <p>Generated by School Hub on ${report.date.toLocaleString()}</p>
          <p>This report reflects academic performance for ${report.semester}.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Preview PDF (print)
   */
  async previewPDF(html: string): Promise<void> {
    await Print.printAsync({ html });
  }

  /**
   * Save PDF to device
   */
  async savePDF(html: string, filename: string): Promise<string> {
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    const newUri = `${FileSystem.documentDirectory}${filename}`;
    await FileSystem.moveAsync({
      from: uri,
      to: newUri,
    });

    return newUri;
  }
}

// Export singleton
export const pdfExportService = new PDFExportService();
export default pdfExportService;
