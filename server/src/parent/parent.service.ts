import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ParentService {
  constructor(private prisma: PrismaService) {}

  async getLinkedChildren(parentId: string) {
    const parentStudents = await this.prisma.parentStudent.findMany({
      where: { parentId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            gradeLevel: true,
            avatarUrl: true,
          },
        },
      },
    });

    return parentStudents.map((ps) => ps.student);
  }

  async getStudentProgress(parentId: string, studentId: string) {
    // Verify parent is linked to student
    const link = await this.prisma.parentStudent.findUnique({
      where: {
        parentId_studentId: {
          parentId,
          studentId,
        },
      },
    });

    if (!link) {
      throw new NotFoundException('Student not found or not linked to parent');
    }

    // Get student details
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        gradeLevel: true,
        avatarUrl: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Get enrolled courses with grades
    const enrollments = await this.prisma.classEnrollment.findMany({
      where: {
        studentId,
        status: 'active',
      },
      include: {
        class: {
          include: {
            course: true,
            assignments: {
              include: {
                grades: {
                  where: { studentId },
                },
              },
            },
          },
        },
      },
    });

    // Calculate course grades
    const courses = enrollments.map((enrollment) => {
      const classAssignments = enrollment.class.assignments;
      const grades = classAssignments
        .flatMap((a) => a.grades)
        .filter((g) => g.score !== null);

      const totalScore = grades.reduce((sum, g) => sum + g.score, 0);
      const totalMaxScore = grades.reduce((sum, g) => sum + g.maxScore, 0);
      const percentage = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;

      // Calculate letter grade
      const letterGrade = this.calculateLetterGrade(percentage);

      // Calculate progress (completed assignments / total assignments)
      const totalAssignments = classAssignments.length;
      const completedAssignments = classAssignments.filter((a) =>
        a.grades.some((g) => g.studentId === studentId)
      ).length;
      const progress = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0;

      return {
        id: enrollment.class.course.id,
        name: enrollment.class.course.name,
        code: enrollment.class.course.code,
        grade: percentage,
        letterGrade,
        progress,
      };
    });

    // Calculate overall GPA
    const gpa = courses.length > 0
      ? courses.reduce((sum, c) => sum + this.letterGradeToGPA(c.letterGrade), 0) / courses.length
      : 0;

    // Get recent grades
    const recentGrades = await this.prisma.grade.findMany({
      where: { studentId },
      include: {
        assignment: {
          select: {
            title: true,
            class: {
              select: {
                course: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
      orderBy: { gradedAt: 'desc' },
      take: 5,
    });

    // Get attendance summary
    const attendanceRecords = await this.prisma.attendanceRecord.findMany({
      where: { studentId },
    });

    const present = attendanceRecords.filter((r) => r.status === 'present').length;
    const absent = attendanceRecords.filter((r) => r.status === 'absent').length;
    const late = attendanceRecords.filter((r) => r.status === 'late').length;
    const excused = attendanceRecords.filter((r) => r.status === 'excused').length;
    const total = attendanceRecords.length;
    const attendanceRate = total > 0 ? ((present + late) / total) * 100 : 0;

    // Get assignment stats
    const allAssignments = await this.prisma.assignment.findMany({
      where: {
        class: {
          enrollments: {
            some: { studentId },
          },
        },
      },
    });

    const submissions = await this.prisma.submission.findMany({
      where: { studentId },
    });

    return {
      ...student,
      gpa: parseFloat(gpa.toFixed(2)),
      attendanceRate: parseFloat(attendanceRate.toFixed(1)),
      totalAssignments: allAssignments.length,
      completedAssignments: submissions.length,
      courses,
      recentGrades: recentGrades.map((g) => ({
        id: g.id,
        assignmentName: g.assignment.title,
        courseName: g.assignment.class.course.name,
        score: g.score,
        maxScore: g.maxScore,
        earnedAt: g.gradedAt,
      })),
      attendanceSummary: {
        present,
        absent,
        late,
        excused,
        rate: parseFloat(attendanceRate.toFixed(1)),
      },
    };
  }

  async getTeacherContacts(parentId: string, studentId: string) {
    // Verify parent is linked to student
    const link = await this.prisma.parentStudent.findUnique({
      where: {
        parentId_studentId: {
          parentId,
          studentId,
        },
      },
    });

    if (!link) {
      throw new NotFoundException('Student not found or not linked to parent');
    }

    // Get student's classes and teachers
    const enrollments = await this.prisma.classEnrollment.findMany({
      where: { studentId },
      include: {
        class: {
          include: {
            teachers: {
              include: {
                teacher: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    avatarUrl: true,
                  },
                },
              },
            },
            course: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    // Group teachers with their courses
    const teacherMap = new Map();

    for (const enrollment of enrollments) {
      for (const classTeacher of enrollment.class.teachers) {
        const teacher = classTeacher.teacher;
        if (!teacherMap.has(teacher.id)) {
          teacherMap.set(teacher.id, {
            ...teacher,
            courses: [],
          });
        }
        teacherMap.get(teacher.id).courses.push({
          id: enrollment.class.course.id,
          name: enrollment.class.course.name,
          code: enrollment.class.course.code,
        });
      }
    }

    // Check for existing direct message channels
    const teachers = Array.from(teacherMap.values());
    for (const teacher of teachers) {
      const channel = await this.prisma.channel.findFirst({
        where: {
          type: 'direct_message',
          members: {
            every: {
              userId: { in: [parentId, teacher.id] },
            },
          },
        },
      });
      teacher.channelId = channel?.id;
    }

    return teachers;
  }

  async getDashboardStats(parentId: string) {
    // Get linked children
    const children = await this.getLinkedChildren(parentId);

    // Calculate total outstanding fees
    let totalOutstandingFees = 0;
    for (const child of children) {
      const invoices = await this.prisma.feeInvoice.findMany({
        where: {
          studentId: child.id,
          status: { in: ['pending', 'partial', 'overdue'] },
        },
      });
      totalOutstandingFees += invoices.reduce(
        (sum, inv) => sum + (Number(inv.totalAmount) - Number(inv.paidAmount)),
        0
      );
    }

    // Get upcoming conferences
    const upcomingConferences = await this.prisma.conference.count({
      where: {
        parentId,
        status: 'confirmed',
        confirmedDate: {
          gte: new Date(),
        },
      },
    });

    // Get unread messages (simplified - count channels with unread messages)
    const unreadChannels = await this.prisma.channelMember.findMany({
      where: {
        userId: parentId,
      },
      include: {
        channel: {
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    const unreadMessages = unreadChannels.filter((cm) => {
      const lastMessage = cm.channel.messages[0];
      return lastMessage && (!cm.lastReadAt || cm.lastReadAt < lastMessage.createdAt);
    }).length;

    // Get pending assignments across all children
    let pendingAssignments = 0;
    for (const child of children) {
      const assignments = await this.prisma.assignment.findMany({
        where: {
          class: {
            enrollments: {
              some: { studentId: child.id },
            },
          },
          dueDate: { gte: new Date() },
        },
        include: {
          submissions: {
            where: { studentId: child.id },
          },
        },
      });
      pendingAssignments += assignments.filter((a) => a.submissions.length === 0).length;
    }

    // Get recent activity
    const recentActivity = await this.getRecentActivity(parentId, children);

    return {
      totalChildren: children.length,
      totalOutstandingFees,
      upcomingConferences,
      unreadMessages,
      pendingAssignments,
      recentActivity,
    };
  }

  private async getRecentActivity(
    parentId: string,
    children: Array<{ id: string; firstName: string; lastName: string }>,
  ) {
    const activity: Array<{
      id: string;
      type: string;
      title: string;
      description: string;
      studentName: string;
      timestamp: Date;
    }> = [];
    const childIds = children.map((c) => c.id);

    // Recent grades
    const recentGrades = await this.prisma.grade.findMany({
      where: { studentId: { in: childIds } },
      include: {
        student: { select: { firstName: true, lastName: true } },
        assignment: { select: { title: true } },
      },
      orderBy: { gradedAt: 'desc' },
      take: 3,
    });

    for (const grade of recentGrades) {
      activity.push({
        id: `grade-${grade.id}`,
        type: 'grade',
        title: 'New Grade Posted',
        description: `${grade.assignment.title}: ${grade.score}/${grade.maxScore}`,
        studentName: `${grade.student.firstName} ${grade.student.lastName}`,
        timestamp: grade.gradedAt,
      });
    }

    // Recent attendance
    const recentAttendance = await this.prisma.attendanceRecord.findMany({
      where: {
        studentId: { in: childIds },
        status: { in: ['absent', 'late'] },
      },
      include: {
        student: { select: { firstName: true, lastName: true } },
        session: { select: { date: true } },
      },
      orderBy: { markedAt: 'desc' },
      take: 2,
    });

    for (const record of recentAttendance) {
      activity.push({
        id: `attendance-${record.id}`,
        type: 'attendance',
        title: `Marked ${record.status}`,
        description: `Attendance on ${record.session.date.toLocaleDateString()}`,
        studentName: `${record.student.firstName} ${record.student.lastName}`,
        timestamp: record.markedAt,
      });
    }

    // Sort by timestamp descending
    return activity.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5);
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
