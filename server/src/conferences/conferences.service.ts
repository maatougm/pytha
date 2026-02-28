import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type ConferenceStatus = 'requested' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

export interface CreateConferenceInput {
  studentId: string;
  teacherId: string;
  proposedDates: string[];
  durationMinutes?: number;
  notes?: string;
}

@Injectable()
export class ConferencesService {
  constructor(private prisma: PrismaService) {}

  async createConference(input: CreateConferenceInput, parentId: string) {
    // Verify student is linked to parent
    const link = await this.prisma.parentStudent.findUnique({
      where: {
        parentId_studentId: {
          parentId,
          studentId: input.studentId,
        },
      },
    });

    if (!link) {
      throw new BadRequestException('Student not linked to parent');
    }

    // Verify teacher exists
    const teacher = await this.prisma.user.findFirst({
      where: {
        id: input.teacherId,
        userRoles: { some: { role: { name: 'teacher' } } },
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // Verify teacher teaches this student
    const teachesStudent = await this.prisma.classTeacher.findFirst({
      where: {
        teacherId: input.teacherId,
        class: {
          enrollments: {
            some: { studentId: input.studentId },
          },
        },
      },
    });

    if (!teachesStudent) {
      throw new BadRequestException('Teacher does not teach this student');
    }

    return this.prisma.conference.create({
      data: {
        studentId: input.studentId,
        parentId,
        teacherId: input.teacherId,
        proposedDates: input.proposedDates as any,
        durationMinutes: input.durationMinutes || 30,
        status: 'requested',
        notes: input.notes,
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  async getConferencesForStudent(studentId: string, userId: string) {
    // Verify user has access to this student
    const hasAccess = await this.verifyAccess(userId, studentId);
    if (!hasAccess) {
      throw new BadRequestException('No access to this student');
    }

    return this.prisma.conference.findMany({
      where: { studentId },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
        parent: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getConferencesForUser(userId: string, role: 'parent' | 'teacher') {
    const where = role === 'parent' ? { parentId: userId } : { teacherId: userId };

    return this.prisma.conference.findMany({
      where,
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
        parent: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async confirmConference(
    conferenceId: string,
    teacherId: string,
    confirmedDate: string,
    meetingLink?: string,
  ) {
    const conference = await this.prisma.conference.findUnique({
      where: { id: conferenceId },
    });

    if (!conference) {
      throw new NotFoundException('Conference not found');
    }

    if (conference.teacherId !== teacherId) {
      throw new BadRequestException('Only the assigned teacher can confirm');
    }

    if (conference.status !== 'requested') {
      throw new BadRequestException('Conference cannot be confirmed');
    }

    // Verify the confirmed date is in the proposed dates
    const proposedDates = conference.proposedDates as string[];
    if (!proposedDates.includes(confirmedDate)) {
      throw new BadRequestException('Confirmed date must be one of the proposed dates');
    }

    return this.prisma.conference.update({
      where: { id: conferenceId },
      data: {
        status: 'confirmed',
        confirmedDate: new Date(confirmedDate),
        meetingLink,
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
        parent: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async cancelConference(
    conferenceId: string,
    userId: string,
    reason: string,
  ) {
    const conference = await this.prisma.conference.findUnique({
      where: { id: conferenceId },
    });

    if (!conference) {
      throw new NotFoundException('Conference not found');
    }

    // Only parent or teacher can cancel
    if (conference.parentId !== userId && conference.teacherId !== userId) {
      throw new BadRequestException('Not authorized to cancel this conference');
    }

    if (conference.status === 'cancelled' ||
        conference.status === 'completed') {
      throw new BadRequestException('Conference cannot be cancelled');
    }

    return this.prisma.conference.update({
      where: { id: conferenceId },
      data: {
        status: 'cancelled',
        cancelledBy: userId,
        cancelledReason: reason,
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
        parent: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async getUpcomingConferences(userId: string, role: 'parent' | 'teacher') {
    const where = {
      ...(role === 'parent' ? { parentId: userId } : { teacherId: userId }),
      status: 'confirmed',
      confirmedDate: {
        gte: new Date(),
      },
    };

    return this.prisma.conference.findMany({
      where,
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
        parent: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { confirmedDate: 'asc' },
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

    // Check if user is the student
    if (userId === studentId) return true;

    // Check if user is admin
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { userRoles: { include: { role: true } } },
    });

    return user?.userRoles.some((ur) => ur.role.name === 'admin') ?? false;
  }
}
