import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateReportCardInput {
  studentId: string;
  academicYearId: string;
  term: string;
  courseGrades: Array<{
    courseId: string;
    courseName: string;
    grade: number;
    letterGrade: string;
    comments?: string;
  }>;
  gpa?: number;
  behaviorSummary?: {
    positive: number;
    negative: number;
    totalPoints: number;
  };
  teacherComments?: string;
  attendanceSummary?: {
    present: number;
    absent: number;
    late: number;
    excused: number;
    rate: number;
  };
}

@Injectable()
export class ReportCardsService {
  constructor(private prisma: PrismaService) {}

  async createReportCard(input: CreateReportCardInput) {
    // Verify student exists
    const student = await this.prisma.user.findFirst({
      where: {
        id: input.studentId,
        userRoles: { some: { role: { name: 'student' } } },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Verify academic year exists
    const academicYear = await this.prisma.academicYear.findUnique({
      where: { id: input.academicYearId },
    });

    if (!academicYear) {
      throw new NotFoundException('Academic year not found');
    }

    // Check for duplicate report card
    const existing = await this.prisma.reportCard.findUnique({
      where: {
        studentId_academicYearId_term: {
          studentId: input.studentId,
          academicYearId: input.academicYearId,
          term: input.term,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Report card already exists for this term');
    }

    return this.prisma.reportCard.create({
      data: {
        studentId: input.studentId,
        academicYearId: input.academicYearId,
        term: input.term,
        courseGrades: input.courseGrades as any,
        gpa: input.gpa,
        behaviorSummary: input.behaviorSummary as any,
        teacherComments: input.teacherComments,
        attendanceSummary: input.attendanceSummary as any,
      },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        academicYear: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async getReportCardsForStudent(studentId: string, userId: string) {
    // Verify access
    const hasAccess = await this.verifyAccess(userId, studentId);
    if (!hasAccess) {
      throw new BadRequestException('No access to this student');
    }

    return this.prisma.reportCard.findMany({
      where: { studentId },
      include: {
        academicYear: {
          select: { id: true, name: true },
        },
        acknowledgedUser: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: [{ academicYear: { startDate: 'desc' } }, { term: 'desc' }],
    });
  }

  async getLatestReportCard(studentId: string, userId: string) {
    // Verify access
    const hasAccess = await this.verifyAccess(userId, studentId);
    if (!hasAccess) {
      throw new BadRequestException('No access to this student');
    }

    return this.prisma.reportCard.findFirst({
      where: { studentId },
      include: {
        academicYear: {
          select: { id: true, name: true },
        },
        acknowledgedUser: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: [{ academicYear: { startDate: 'desc' } }, { term: 'desc' }],
    });
  }

  async getReportCardById(reportCardId: string, userId: string) {
    const reportCard = await this.prisma.reportCard.findUnique({
      where: { id: reportCardId },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true },
        },
        academicYear: {
          select: { id: true, name: true },
        },
        acknowledgedUser: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!reportCard) {
      throw new NotFoundException('Report card not found');
    }

    // Verify access
    const hasAccess = await this.verifyAccess(userId, reportCard.studentId);
    if (!hasAccess) {
      throw new BadRequestException('No access to this report card');
    }

    return reportCard;
  }

  async acknowledgeReportCard(reportCardId: string, parentId: string) {
    const reportCard = await this.prisma.reportCard.findUnique({
      where: { id: reportCardId },
    });

    if (!reportCard) {
      throw new NotFoundException('Report card not found');
    }

    // Verify parent is linked to student
    const link = await this.prisma.parentStudent.findUnique({
      where: {
        parentId_studentId: {
          parentId,
          studentId: reportCard.studentId,
        },
      },
    });

    if (!link) {
      throw new BadRequestException('Parent not linked to student');
    }

    return this.prisma.reportCard.update({
      where: { id: reportCardId },
      data: {
        parentAcknowledgedAt: new Date(),
        acknowledgedBy: parentId,
      },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true },
        },
        academicYear: {
          select: { id: true, name: true },
        },
        acknowledgedUser: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async generateReportCard(studentId: string, academicYearId: string, term: string) {
    // Get student info
    const student = await this.prisma.user.findFirst({
      where: {
        id: studentId,
        userRoles: { some: { role: { name: 'student' } } },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Get all grades for the student in this academic year
    const grades = await this.prisma.grade.findMany({
      where: { studentId },
      include: {
        assignment: {
          include: {
            class: {
              include: {
                course: true,
              },
            },
          },
        },
      },
    });

    // Group by course
    const courseGradesMap = new Map();
    for (const grade of grades) {
      const course = grade.assignment.class.course;
      if (!courseGradesMap.has(course.id)) {
        courseGradesMap.set(course.id, {
          courseId: course.id,
          courseName: course.name,
          grades: [],
        });
      }
      courseGradesMap.get(course.id).grades.push(grade);
    }

    // Calculate course averages
    const courseGrades = Array.from(courseGradesMap.values()).map((course: any) => {
      const totalScore = course.grades.reduce((sum: number, g: any) => sum + g.score, 0);
      const totalMax = course.grades.reduce((sum: number, g: any) => sum + g.maxScore, 0);
      const percentage = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;

      return {
        courseId: course.courseId,
        courseName: course.courseName,
        grade: parseFloat(percentage.toFixed(2)),
        letterGrade: this.calculateLetterGrade(percentage),
      };
    });

    // Calculate GPA
    const gpa = courseGrades.length > 0
      ? courseGrades.reduce((sum, c) => sum + this.letterGradeToGPA(c.letterGrade), 0) / courseGrades.length
      : 0;

    // Get attendance summary
    const attendanceRecords = await this.prisma.attendanceRecord.findMany({
      where: { studentId },
    });

    const present = attendanceRecords.filter((r) => r.status === 'present').length;
    const absent = attendanceRecords.filter((r) => r.status === 'absent').length;
    const late = attendanceRecords.filter((r) => r.status === 'late').length;
    const excused = attendanceRecords.filter((r) => r.status === 'excused').length;
    const total = attendanceRecords.length;

    const attendanceSummary = {
      present,
      absent,
      late,
      excused,
      rate: total > 0 ? parseFloat((((present + late) / total) * 100).toFixed(1)) : 0,
    };

    // Get behavior summary
    const behaviorRecords = await this.prisma.behaviorRecord.findMany({
      where: { studentId },
    });

    const positive = behaviorRecords.filter((r) => r.type === 'positive').length;
    const negative = behaviorRecords.filter((r) => r.type === 'negative').length;
    const totalPoints = behaviorRecords.reduce((sum, r) => sum + r.points, 0);

    const behaviorSummary = {
      positive,
      negative,
      totalPoints,
    };

    return this.createReportCard({
      studentId,
      academicYearId,
      term,
      courseGrades,
      gpa: parseFloat(gpa.toFixed(2)),
      behaviorSummary,
      attendanceSummary,
    });
  }

  private async verifyAccess(userId: string, studentId: string): Promise<boolean> {
    // Check if user is parent of student
    const parentLink = await this.prisma.parentStudent.findUnique({
      where: {
        parentId_studentId: {
          parentId: userId,
          studentId,
        },
      },
    });

    if (parentLink) return true;

    // Check if user is the student
    if (userId === studentId) return true;

    // Check if user is teacher of student
    const teacherLink = await this.prisma.classTeacher.findFirst({
      where: {
        teacherId: userId,
        class: {
          enrollments: {
            some: { studentId },
          },
        },
      },
    });

    if (teacherLink) return true;

    // Check if user is admin
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { userRoles: { include: { role: true } } },
    });

    return user?.userRoles.some((ur) => ur.role.name === 'admin') ?? false;
  }

  private calculateLetterGrade(percentage: number): string {
    if (percentage >= 97) return 'A+';
    if (percentage >= 93) return 'A';
    if (percentage >= 90) return 'A-';
    if (percentage >= 87) return 'B+';
    if (percentage >= 83) return 'B';
    if (percentage >= 80) return 'B-';
    if (percentage >= 77) return 'C+';
    if (percentage >= 73) return 'C';
    if (percentage >= 70) return 'C-';
    if (percentage >= 67) return 'D+';
    if (percentage >= 63) return 'D';
    if (percentage >= 60) return 'D-';
    return 'F';
  }

  private letterGradeToGPA(letterGrade: string): number {
    const gpaMap: Record<string, number> = {
      'A+': 4.0, 'A': 4.0, 'A-': 3.7,
      'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7,
      'D+': 1.3, 'D': 1.0, 'D-': 0.7,
      'F': 0.0,
    };
    return gpaMap[letterGrade] || 0;
  }
}
