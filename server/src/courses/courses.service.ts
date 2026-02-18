import { Injectable, NotFoundException, ConflictException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
    CreateCourseDto, UpdateCourseDto,
    CreateClassDto, UpdateClassDto,
    EnrollStudentDto,
    CreateScheduleDto,
} from './dto/courses.dto';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

@Injectable()
export class CoursesService {
    private readonly logger = new Logger(CoursesService.name);

    constructor(private prisma: PrismaService) { }

    // ─── COURSES ─────────────────────────────────────────────

    async createCourse(dto: CreateCourseDto) {
        const existing = await this.prisma.course.findUnique({ where: { code: dto.code.toUpperCase() } });
        if (existing) throw new ConflictException(`Course code ${dto.code} already exists`);

        return this.prisma.course.create({
            data: {
                code: dto.code.toUpperCase(),
                name: dto.name,
                description: dto.description,
                credits: dto.credits ?? 1,
                department: dto.department,
            },
        });
    }

    async findAllCourses(
        filters?: { department?: string; isActive?: boolean; search?: string; includeDeleted?: boolean },
        page: number = 1,
        limit: number = DEFAULT_PAGE_SIZE,
    ) {
        const pageSize = Math.min(Math.max(1, limit), MAX_PAGE_SIZE);
        const skip = (Math.max(1, page) - 1) * pageSize;

        const where: any = {};
        
        // By default, exclude soft-deleted courses
        if (!filters?.includeDeleted) {
            where.deletedAt = null;
        }
        
        if (filters?.department) where.department = filters.department;
        if (filters?.isActive !== undefined) where.isActive = filters.isActive;
        if (filters?.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { code: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        const [courses, total] = await Promise.all([
            this.prisma.course.findMany({
                where,
                include: { classes: { select: { id: true, term: true, section: true } } },
                orderBy: { code: 'asc' },
                skip,
                take: pageSize,
            }),
            this.prisma.course.count({ where }),
        ]);

        return {
            data: courses,
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }

    async findCourseById(id: string, includeDeleted: boolean = false) {
        const where: any = { id };
        if (!includeDeleted) {
            where.deletedAt = null;
        }
        
        const course = await this.prisma.course.findFirst({
            where,
            include: {
                classes: {
                    include: {
                        teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
                        _count: { select: { enrollments: true } },
                        schedules: true,
                    },
                },
            },
        });
        if (!course) throw new NotFoundException('Course not found');
        return course;
    }

    async updateCourse(id: string, dto: UpdateCourseDto) {
        await this.findCourseById(id);
        return this.prisma.course.update({ where: { id }, data: dto });
    }

    async deleteCourse(id: string, softDelete: boolean = true, deletedBy?: string) {
        const course = await this.findCourseById(id, true);
        
        if (softDelete) {
            // Soft delete - set deletedAt and isActive
            return this.prisma.course.update({
                where: { id },
                data: {
                    deletedAt: new Date(),
                    isActive: false,
                },
            });
        } else {
            // Hard delete
            return this.prisma.course.delete({ where: { id } });
        }
    }

    // ─── CLASSES ─────────────────────────────────────────────

    async createClass(dto: CreateClassDto) {
        // Verify course exists
        const course = await this.prisma.course.findUnique({ where: { id: dto.courseId } });
        if (!course) throw new NotFoundException('Course not found');

        return this.prisma.class.create({
            data: {
                courseId: dto.courseId,
                teacherId: dto.teacherId,
                term: dto.term,
                section: dto.section,
                room: dto.room,
                maxStudents: dto.maxStudents,
            },
            include: {
                course: { select: { code: true, name: true } },
                teacher: { select: { id: true, firstName: true, lastName: true } },
            },
        });
    }

    async findAllClasses(
        filters?: { term?: string; teacherId?: string; courseId?: string; studentId?: string; includeDeleted?: boolean },
        page: number = 1,
        limit: number = DEFAULT_PAGE_SIZE,
    ) {
        const pageSize = Math.min(Math.max(1, limit), MAX_PAGE_SIZE);
        const skip = (Math.max(1, page) - 1) * pageSize;

        const where: any = { isActive: true };
        
        // By default, exclude soft-deleted classes
        if (!filters?.includeDeleted) {
            where.deletedAt = null;
        }
        
        if (filters?.term) where.term = filters.term;
        if (filters?.teacherId) where.teacherId = filters.teacherId;
        if (filters?.courseId) where.courseId = filters.courseId;
        if (filters?.studentId) {
            where.enrollments = { some: { studentId: filters.studentId, status: 'active' } };
        }

        const [classes, total] = await Promise.all([
            this.prisma.class.findMany({
                where,
                include: {
                    course: { select: { code: true, name: true, department: true } },
                    teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
                    schedules: true,
                    _count: { select: { enrollments: true, assignments: true } },
                },
                orderBy: [{ term: 'desc' }, { course: { code: 'asc' } }],
                skip,
                take: pageSize,
            }),
            this.prisma.class.count({ where }),
        ]);

        return {
            data: classes,
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }

    async findClassById(id: string, includeDeleted: boolean = false) {
        const where: any = { id };
        if (!includeDeleted) {
            where.deletedAt = null;
        }
        
        const cls = await this.prisma.class.findFirst({
            where,
            include: {
                course: true,
                teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
                schedules: true,
                enrollments: {
                    where: { status: 'active' },
                    include: {
                        student: { select: { id: true, firstName: true, lastName: true, email: true } },
                    },
                    orderBy: { student: { lastName: 'asc' } },
                },
                _count: { select: { enrollments: true, assignments: true, attendance: true } },
            },
        });
        if (!cls) throw new NotFoundException('Class not found');
        return cls;
    }

    async updateClass(id: string, dto: UpdateClassDto) {
        await this.findClassById(id);
        return this.prisma.class.update({
            where: { id },
            data: dto,
            include: {
                course: { select: { code: true, name: true } },
                teacher: { select: { id: true, firstName: true, lastName: true } },
            },
        });
    }

    async deleteClass(id: string, softDelete: boolean = true, deletedBy?: string) {
        await this.findClassById(id, true);
        
        if (softDelete) {
            // Soft delete - set deletedAt and isActive
            return this.prisma.class.update({
                where: { id },
                data: {
                    deletedAt: new Date(),
                    isActive: false,
                },
            });
        } else {
            // Hard delete
            return this.prisma.class.delete({ where: { id } });
        }
    }

    // ─── ENROLLMENT ──────────────────────────────────────────

    async enrollStudent(classId: string, dto: EnrollStudentDto) {
        const cls = await this.prisma.class.findUnique({
            where: { id: classId },
            include: { _count: { select: { enrollments: true } } },
        });
        if (!cls) throw new NotFoundException('Class not found');

        if (cls.maxStudents && cls._count.enrollments >= cls.maxStudents) {
            throw new ConflictException('Class is full');
        }

        const existing = await this.prisma.classEnrollment.findUnique({
            where: { classId_studentId: { classId, studentId: dto.studentId } },
        });
        if (existing) {
            if (existing.status === 'active') throw new ConflictException('Student already enrolled');
            // Re-enroll if dropped
            return this.prisma.classEnrollment.update({
                where: { id: existing.id },
                data: { status: 'active', enrolledAt: new Date() },
                include: { student: { select: { id: true, firstName: true, lastName: true } } },
            });
        }

        return this.prisma.classEnrollment.create({
            data: { classId, studentId: dto.studentId },
            include: { student: { select: { id: true, firstName: true, lastName: true } } },
        });
    }

    async bulkEnroll(classId: string, studentIds: string[]) {
        // Limit batch size
        const MAX_BATCH_SIZE = 100;
        if (studentIds.length > MAX_BATCH_SIZE) {
            throw new ConflictException(`Cannot enroll more than ${MAX_BATCH_SIZE} students at once`);
        }

        const cls = await this.prisma.class.findUnique({
            where: { id: classId },
            include: { _count: { select: { enrollments: true } } },
        });
        if (!cls) throw new NotFoundException('Class not found');

        const availableSlots = cls.maxStudents ? cls.maxStudents - cls._count.enrollments : Infinity;
        if (availableSlots < studentIds.length) {
            throw new ConflictException(`Only ${availableSlots} slots available in this class`);
        }

        // Use transaction for atomicity
        type BulkEnrollResult =
            | { studentId: string; status: 'already_enrolled' }
            | { studentId: string; status: 're_enrolled'; enrollment: any }
            | { studentId: string; status: 'enrolled'; enrollment: any }
            | { studentId: string; status: 'failed'; error: string };

        const results = await this.prisma.$transaction(async (tx) => {
            const processed: BulkEnrollResult[] = [];

            for (const studentId of studentIds) {
                try {
                    const existing = await tx.classEnrollment.findUnique({
                        where: { classId_studentId: { classId, studentId } },
                    });

                    if (existing) {
                        if (existing.status === 'active') {
                            processed.push({ studentId, status: 'already_enrolled' });
                        } else {
                            const enrollment = await tx.classEnrollment.update({
                                where: { id: existing.id },
                                data: { status: 'active', enrolledAt: new Date() },
                            });
                            processed.push({ studentId, status: 're_enrolled', enrollment });
                        }
                    } else {
                        const enrollment = await tx.classEnrollment.create({
                            data: { classId, studentId },
                            include: { student: { select: { id: true, firstName: true, lastName: true } } },
                        });
                        processed.push({ studentId, status: 'enrolled', enrollment });
                    }
                } catch (err: any) {
                    processed.push({ studentId, status: 'failed', error: err.message });
                }
            }

            return processed;
        });

        this.logger.log(`Bulk enrollment completed for class ${classId}: ${results.filter(r => r.status === 'enrolled' || r.status === 're_enrolled').length} enrolled`);

        return results;
    }

    async dropStudent(classId: string, studentId: string) {
        const enrollment = await this.prisma.classEnrollment.findUnique({
            where: { classId_studentId: { classId, studentId } },
        });
        if (!enrollment) throw new NotFoundException('Enrollment not found');

        return this.prisma.classEnrollment.update({
            where: { id: enrollment.id },
            data: { status: 'dropped' },
        });
    }

    async getClassRoster(classId: string, page: number = 1, limit: number = DEFAULT_PAGE_SIZE) {
        const pageSize = Math.min(Math.max(1, limit), MAX_PAGE_SIZE);
        const skip = (Math.max(1, page) - 1) * pageSize;

        const [roster, total] = await Promise.all([
            this.prisma.classEnrollment.findMany({
                where: { classId, status: 'active' },
                include: {
                    student: { select: { id: true, firstName: true, lastName: true, email: true } },
                },
                orderBy: { student: { lastName: 'asc' } },
                skip,
                take: pageSize,
            }),
            this.prisma.classEnrollment.count({ where: { classId, status: 'active' } }),
        ]);

        return {
            data: roster,
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }

    async getStudentClasses(studentId: string, term?: string, page: number = 1, limit: number = DEFAULT_PAGE_SIZE) {
        const pageSize = Math.min(Math.max(1, limit), MAX_PAGE_SIZE);
        const skip = (Math.max(1, page) - 1) * pageSize;

        const where: any = { studentId, status: 'active' };
        if (term) where.class = { term };

        const [enrollments, total] = await Promise.all([
            this.prisma.classEnrollment.findMany({
                where,
                include: {
                    class: {
                        include: {
                            course: { select: { code: true, name: true, department: true } },
                            teacher: { select: { id: true, firstName: true, lastName: true } },
                            schedules: true,
                        },
                    },
                },
                orderBy: { class: { course: { code: 'asc' } } },
                skip,
                take: pageSize,
            }),
            this.prisma.classEnrollment.count({ where }),
        ]);

        return {
            data: enrollments,
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }

    // ─── SCHEDULES ───────────────────────────────────────────

    async addSchedules(classId: string, schedules: CreateScheduleDto[]) {
        // Limit batch size
        if (schedules.length > 7) {
            throw new ConflictException('Cannot add more than 7 schedules at once');
        }

        await this.findClassById(classId);

        return this.prisma.$transaction(
            schedules.map((s) =>
                this.prisma.schedule.create({
                    data: {
                        classId,
                        dayOfWeek: s.dayOfWeek,
                        startTime: s.startTime,
                        endTime: s.endTime,
                    },
                }),
            ),
        );
    }

    async getSchedules(classId: string) {
        return this.prisma.schedule.findMany({
            where: { classId },
            orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        });
    }

    async deleteSchedule(scheduleId: string) {
        return this.prisma.schedule.delete({ where: { id: scheduleId } });
    }

    // ─── TEACHER HELPERS ─────────────────────────────────────

    async getTeacherClasses(teacherId: string, term?: string, page: number = 1, limit: number = DEFAULT_PAGE_SIZE) {
        const pageSize = Math.min(Math.max(1, limit), MAX_PAGE_SIZE);
        const skip = (Math.max(1, page) - 1) * pageSize;

        const where: any = { teacherId, isActive: true };
        if (term) where.term = term;

        const [classes, total] = await Promise.all([
            this.prisma.class.findMany({
                where,
                include: {
                    course: { select: { code: true, name: true } },
                    schedules: true,
                    _count: { select: { enrollments: true, assignments: true } },
                },
                orderBy: { course: { code: 'asc' } },
                skip,
                take: pageSize,
            }),
            this.prisma.class.count({ where }),
        ]);

        return {
            data: classes,
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }

    async getAdminClasses() {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const classes = await this.prisma.class.findMany({
            where: { isActive: true },
            include: {
                course: { select: { code: true, name: true } },
                teacher: { select: { firstName: true, lastName: true } },
                _count: { select: { enrollments: true } },
                attendance: {
                    where: {
                        date: {
                            gte: startOfDay,
                            lte: endOfDay,
                        },
                    },
                    include: {
                        records: { select: { status: true, studentId: true } },
                    },
                },
            },
            orderBy: { term: 'desc' },
        });

        // Group by term
        const grouped: Record<string, any[]> = {};

        for (const cls of classes) {
            const term = cls.term || 'Unknown Term';
            if (!grouped[term]) grouped[term] = [];

            // Calculate unique students present today across all sessions
            const presentStudents = new Set<string>();
            cls.attendance.forEach(session => {
                session.records.forEach(r => {
                    if (r.status === 'present' || r.status === 'late') {
                        presentStudents.add(r.studentId);
                    }
                });
            });

            grouped[term].push({
                id: cls.id,
                name: cls.course.name,
                code: cls.course.code,
                teacher: cls.teacher ? `${cls.teacher.firstName} ${cls.teacher.lastName}` : 'Unassigned',
                enrollmentCount: cls._count.enrollments,
                todayPresent: presentStudents.size,
                activeSessions: cls.attendance.length,
            });
        }

        return grouped;
    }
}
