import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
    CreateAttendanceSessionDto,
    MarkAttendanceDto,
    BulkAttendanceDto,
    AttendanceStatus,
} from './dto/attendance.dto';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

@Injectable()
export class AttendanceService {
    private readonly logger = new Logger(AttendanceService.name);

    constructor(private prisma: PrismaService) { }

    // ─── SESSIONS ────────────────────────────────────────────

    async createSession(classId: string, teacherId: string, dto: CreateAttendanceSessionDto) {
        const cls = await this.prisma.class.findUnique({ where: { id: classId } });
        if (!cls) throw new NotFoundException('Class not found');

        const date = new Date(dto.date);
        // Normalize to start of day to avoid timezone issues
        date.setHours(0, 0, 0, 0);
        const period = dto.period || 1;

        const existing = await this.prisma.attendanceSession.findUnique({
            where: { classId_date_period: { classId, date, period } },
        });
        if (existing) throw new ConflictException(`Attendance session already exists for this date and period ${period}`);

        return this.prisma.attendanceSession.create({
            data: {
                classId,
                date,
                period,
                notes: dto.notes,
                createdById: teacherId,
            },
            include: {
                records: {
                    include: {
                        student: { select: { id: true, firstName: true, lastName: true } },
                    },
                },
            },
        });
    }

    async getClassSessions(
        classId: string,
        startDate?: string,
        endDate?: string,
        page: number = 1,
        limit: number = DEFAULT_PAGE_SIZE,
    ) {
        const pageSize = Math.min(Math.max(1, limit), MAX_PAGE_SIZE);
        const skip = (Math.max(1, page) - 1) * pageSize;

        const where: any = { classId };
        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(startDate);
            if (endDate) where.date.lte = new Date(endDate);
        }

        const [sessions, total] = await Promise.all([
            this.prisma.attendanceSession.findMany({
                where,
                include: {
                    records: {
                        include: {
                            student: { select: { id: true, firstName: true, lastName: true } },
                        },
                    },
                    _count: { select: { records: true } },
                },
                orderBy: [{ date: 'desc' }, { period: 'asc' }],
                skip,
                take: pageSize,
            }),
            this.prisma.attendanceSession.count({ where }),
        ]);

        return {
            data: sessions,
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }

    async getSession(sessionId: string) {
        const session = await this.prisma.attendanceSession.findUnique({
            where: { id: sessionId },
            include: {
                class: {
                    include: {
                        course: { select: { code: true, name: true } },
                        enrollments: {
                            where: { status: 'active' },
                            include: {
                                student: { select: { id: true, firstName: true, lastName: true, email: true } },
                            },
                        },
                    },
                },
                records: {
                    include: {
                        student: { select: { id: true, firstName: true, lastName: true } },
                        markedBy: { select: { firstName: true, lastName: true } },
                    },
                    orderBy: { student: { lastName: 'asc' } },
                },
            },
        });
        if (!session) throw new NotFoundException('Attendance session not found');
        return session;
    }

    // ─── MARKING ─────────────────────────────────────────────

    async markAttendance(sessionId: string, studentId: string, teacherId: string, dto: MarkAttendanceDto) {
        const session = await this.prisma.attendanceSession.findUnique({ where: { id: sessionId } });
        if (!session) throw new NotFoundException('Session not found');

        // Validate status
        const validStatuses = Object.values(AttendanceStatus);
        if (!validStatuses.includes(dto.status as AttendanceStatus)) {
            throw new ConflictException(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }

        return this.prisma.attendanceRecord.upsert({
            where: { sessionId_studentId: { sessionId, studentId } },
            create: {
                sessionId,
                studentId,
                status: dto.status,
                notes: dto.notes,
                markedById: teacherId,
            },
            update: {
                status: dto.status,
                notes: dto.notes,
                markedById: teacherId,
                markedAt: new Date(),
            },
            include: {
                student: { select: { id: true, firstName: true, lastName: true } },
            },
        });
    }

    async bulkMarkAttendance(classId: string, teacherId: string, dto: BulkAttendanceDto) {
        const date = new Date(dto.date);
        date.setHours(0, 0, 0, 0);
        const period = dto.period || 1;

        // Use transaction for consistency
        return this.prisma.$transaction(async (tx) => {
            // Create or find session
            let session = await tx.attendanceSession.findUnique({
                where: { classId_date_period: { classId, date, period } },
            });

            if (!session) {
                session = await tx.attendanceSession.create({
                    data: {
                        classId,
                        date,
                        period,
                        notes: dto.sessionNotes,
                        createdById: teacherId,
                    },
                });
            }

            // Validate all statuses first
            const validStatuses = Object.values(AttendanceStatus);
            for (const record of dto.records) {
                if (!validStatuses.includes(record.status as AttendanceStatus)) {
                    throw new ConflictException(
                        `Invalid status '${record.status}' for student ${record.studentId}. Must be one of: ${validStatuses.join(', ')}`
                    );
                }
            }

            // Use upsert for each record
            const results = await Promise.all(
                dto.records.map((record) =>
                    tx.attendanceRecord.upsert({
                        where: { sessionId_studentId: { sessionId: session.id, studentId: record.studentId } },
                        create: {
                            sessionId: session.id,
                            studentId: record.studentId,
                            status: record.status,
                            notes: record.notes,
                            markedById: teacherId,
                        },
                        update: {
                            status: record.status,
                            notes: record.notes,
                            markedById: teacherId,
                            markedAt: new Date(),
                        },
                        include: {
                            student: { select: { id: true, firstName: true, lastName: true } },
                        },
                    })
                )
            );

            // Calculate summary
            const summary = {
                total: results.length,
                present: results.filter((r) => r.status === AttendanceStatus.PRESENT).length,
                absent: results.filter((r) => r.status === AttendanceStatus.ABSENT).length,
                late: results.filter((r) => r.status === AttendanceStatus.LATE).length,
                excused: results.filter((r) => r.status === AttendanceStatus.EXCUSED).length,
            };

            this.logger.log(`Bulk attendance marked for class ${classId} on ${date.toISOString()} period ${period}: ${summary.total} records`);

            return {
                session,
                records: results,
                summary,
            };
        });
    }

    // ─── ADMIN WEEKLY VIEW ───────────────────────────────────

    async getClassWeeklyAttendance(classId: string, startDate: string, endDate: string) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        // Ensure end date includes the full day
        end.setHours(23, 59, 59, 999);

        // Fetch all sessions in range
        const sessions = await this.prisma.attendanceSession.findMany({
            where: {
                classId,
                date: {
                    gte: start,
                    lte: end,
                },
            },
            include: {
                records: {
                    include: {
                        student: { select: { id: true, firstName: true, lastName: true } },
                    },
                },
            },
            orderBy: [{ date: 'asc' }, { period: 'asc' }],
        });

        // Initialize map with all enrolled students
        const weeklyData = new Map<string, any>();

        const enrollments = await this.prisma.classEnrollment.findMany({
            where: { classId, status: 'active' },
            include: { student: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
            orderBy: { student: { lastName: 'asc' } }
        });

        for (const enrollment of enrollments) {
            weeklyData.set(enrollment.studentId, {
                student: enrollment.student,
                attendance: {}
            });
        }

        // Fill in attendance data
        for (const session of sessions) {
            const dateStr = session.date.toISOString().split('T')[0];
            const period = session.period;

            for (const record of session.records) {
                // Handle student who might have dropped but has record, or if enrollments fetch failed logic
                if (!weeklyData.has(record.studentId)) {
                    weeklyData.set(record.studentId, {
                        student: record.student,
                        attendance: {}
                    });
                }

                const studentEntry = weeklyData.get(record.studentId);
                if (!studentEntry.attendance[dateStr]) {
                    studentEntry.attendance[dateStr] = {};
                }
                studentEntry.attendance[dateStr][period] = record.status;
            }
        }

        return {
            startDate,
            endDate,
            students: Array.from(weeklyData.values()),
        };
    }

    // ─── HISTORY & REPORTS ───────────────────────────────────

    async getStudentAttendance(
        studentId: string,
        classId?: string,
        startDate?: string,
        endDate?: string,
        page: number = 1,
        limit: number = DEFAULT_PAGE_SIZE,
    ) {
        const pageSize = Math.min(Math.max(1, limit), MAX_PAGE_SIZE);
        const skip = (Math.max(1, page) - 1) * pageSize;

        const where: any = { studentId };
        if (classId) where.session = { classId };
        if (startDate || endDate) {
            where.session = where.session || {};
            where.session.date = {};
            if (startDate) where.session.date.gte = new Date(startDate);
            if (endDate) where.session.date.lte = new Date(endDate);
        }

        const [records, total] = await Promise.all([
            this.prisma.attendanceRecord.findMany({
                where,
                include: {
                    session: {
                        include: {
                            class: {
                                select: { id: true, course: { select: { code: true, name: true } } },
                            },
                        },
                    },
                },
                orderBy: { session: { date: 'desc' } },
                skip,
                take: pageSize,
            }),
            this.prisma.attendanceRecord.count({ where }),
        ]);

        // Calculate summary from all records (not just paginated)
        const allRecordsForSummary = await this.prisma.attendanceRecord.findMany({
            where,
            select: { status: true },
        });

        const summary = this.calculateSummary(allRecordsForSummary);

        return {
            data: records,
            summary,
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }

    async getClassAttendanceSummary(classId: string, startDate?: string, endDate?: string) {
        const dateFilter: any = {};
        if (startDate) dateFilter.gte = new Date(startDate);
        if (endDate) dateFilter.lte = new Date(endDate);

        const sessions = await this.prisma.attendanceSession.findMany({
            where: {
                classId,
                ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
            },
            include: {
                records: {
                    include: {
                        student: { select: { id: true, firstName: true, lastName: true } },
                    },
                },
            },
            orderBy: { date: 'desc' },
        });

        // Per-student summary using Map for efficiency
        const studentMap = new Map<string, {
            name: string;
            present: number;
            absent: number;
            late: number;
            excused: number;
            total: number;
        }>();

        for (const session of sessions) {
            for (const record of session.records) {
                const key = record.studentId;
                if (!studentMap.has(key)) {
                    studentMap.set(key, {
                        name: `${record.student.firstName} ${record.student.lastName}`,
                        present: 0, absent: 0, late: 0, excused: 0, total: 0,
                    });
                }
                const stats = studentMap.get(key)!;
                stats.total++;
                switch (record.status) {
                    case AttendanceStatus.PRESENT: stats.present++; break;
                    case AttendanceStatus.ABSENT: stats.absent++; break;
                    case AttendanceStatus.LATE: stats.late++; break;
                    case AttendanceStatus.EXCUSED: stats.excused++; break;
                }
            }
        }

        const studentSummaries = Array.from(studentMap.entries()).map(([id, stats]) => ({
            studentId: id,
            ...stats,
            attendanceRate: stats.total > 0 ? Math.round(((stats.present + stats.late) / stats.total) * 100) : 0,
        }));

        return {
            totalSessions: sessions.length,
            students: studentSummaries.sort((a, b) => a.name.localeCompare(b.name)),
        };
    }

    async getAttendanceReport(filters?: { classId?: string; startDate?: string; endDate?: string }) {
        if (filters?.classId) {
            return this.getClassAttendanceSummary(filters.classId, filters?.startDate, filters?.endDate);
        }

        // School-wide summary
        const dateFilter: any = {};
        if (filters?.startDate) dateFilter.gte = new Date(filters.startDate);
        if (filters?.endDate) dateFilter.lte = new Date(filters.endDate);

        const [sessions, totalRecords] = await Promise.all([
            this.prisma.attendanceSession.findMany({
                where: Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {},
                include: {
                    class: { select: { id: true, course: { select: { code: true, name: true } } } },
                    _count: { select: { records: true } },
                },
                orderBy: { date: 'desc' },
                take: 20,
            }),
            this.prisma.attendanceRecord.groupBy({
                by: ['status'],
                where: Object.keys(dateFilter).length > 0 ? { session: { date: dateFilter } } : {},
                _count: true,
            }),
        ]);

        return {
            totalSessions: await this.prisma.attendanceSession.count({
                where: Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {},
            }),
            breakdown: totalRecords.map((r) => ({ status: r.status, count: r._count })),
            recentSessions: sessions,
        };
    }

    // ─── HELPERS ─────────────────────────────────────────────

    private calculateSummary(records: { status: string }[]) {
        const total = records.length;
        const present = records.filter((r) => r.status === AttendanceStatus.PRESENT).length;
        const absent = records.filter((r) => r.status === AttendanceStatus.ABSENT).length;
        const late = records.filter((r) => r.status === AttendanceStatus.LATE).length;
        const excused = records.filter((r) => r.status === AttendanceStatus.EXCUSED).length;

        return {
            total,
            present,
            absent,
            late,
            excused,
            attendanceRate: total > 0 ? Math.round(((present + late) / total) * 100) : 0,
        };
    }
}
