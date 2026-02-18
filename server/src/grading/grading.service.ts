import { Injectable, NotFoundException, ForbiddenException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
    CreateAssignmentDto, UpdateAssignmentDto,
    CreateSubmissionDto,
    GradeSubmissionDto, BulkGradeDto,
} from './dto/grading.dto';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

@Injectable()
export class GradingService {
    private readonly logger = new Logger(GradingService.name);

    constructor(private prisma: PrismaService) { }

    // ─── ASSIGNMENTS ─────────────────────────────────────────

    async createAssignment(classId: string, teacherId: string, dto: CreateAssignmentDto) {
        const cls = await this.prisma.class.findUnique({ where: { id: classId } });
        if (!cls) throw new NotFoundException('Class not found');

        return this.prisma.assignment.create({
            data: {
                classId,
                title: dto.title,
                description: dto.description,
                dueDate: new Date(dto.dueDate),
                maxPoints: dto.maxPoints ?? 100,
                type: dto.type ?? 'homework',
                createdById: teacherId,
            },
            include: {
                class: { select: { id: true, course: { select: { code: true, name: true } } } },
            },
        });
    }

    async getClassAssignments(classId: string, filters?: { type?: string }, page: number = 1, limit: number = DEFAULT_PAGE_SIZE) {
        const pageSize = Math.min(Math.max(1, limit), MAX_PAGE_SIZE);
        const skip = (Math.max(1, page) - 1) * pageSize;

        const where: any = { classId };
        if (filters?.type) where.type = filters.type;

        const [assignments, total] = await Promise.all([
            this.prisma.assignment.findMany({
                where,
                include: {
                    _count: { select: { submissions: true, grades: true } },
                    createdBy: { select: { firstName: true, lastName: true } },
                },
                orderBy: { dueDate: 'asc' },
                skip,
                take: pageSize,
            }),
            this.prisma.assignment.count({ where }),
        ]);

        return {
            data: assignments,
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }

    async getAssignment(id: string) {
        const assignment = await this.prisma.assignment.findUnique({
            where: { id },
            include: {
                class: {
                    select: {
                        id: true,
                        teacherId: true,
                        course: { select: { code: true, name: true } },
                    },
                },
                submissions: {
                    include: {
                        student: { select: { id: true, firstName: true, lastName: true } },
                        grade: true,
                    },
                    orderBy: { student: { lastName: 'asc' } },
                },
                _count: { select: { submissions: true, grades: true } },
            },
        });
        if (!assignment) throw new NotFoundException('Assignment not found');
        return assignment;
    }

    async updateAssignment(id: string, teacherId: string, dto: UpdateAssignmentDto) {
        const assignment = await this.getAssignment(id);
        if (assignment.class.teacherId !== teacherId) {
            throw new ForbiddenException('Only the class teacher can update assignments');
        }

        const data: any = { ...dto };
        if (dto.dueDate) data.dueDate = new Date(dto.dueDate);

        return this.prisma.assignment.update({ where: { id }, data });
    }

    async deleteAssignment(id: string, teacherId: string, roles: string[]) {
        const assignment = await this.getAssignment(id);
        if (assignment.class.teacherId !== teacherId && !roles.includes('admin')) {
            throw new ForbiddenException('Only the class teacher or admin can delete assignments');
        }

        return this.prisma.assignment.delete({ where: { id } });
    }

    // ─── SUBMISSIONS ─────────────────────────────────────────

    async submitAssignment(assignmentId: string, studentId: string, dto: CreateSubmissionDto) {
        const assignment = await this.prisma.assignment.findUnique({
            where: { id: assignmentId },
            include: { class: { include: { enrollments: { where: { studentId, status: 'active' } } } } },
        });
        if (!assignment) throw new NotFoundException('Assignment not found');

        if (assignment.class.enrollments.length === 0) {
            throw new ForbiddenException('You are not enrolled in this class');
        }

        const isLate = new Date() > assignment.dueDate;

        // Check if student already submitted
        const existing = await this.prisma.submission.findUnique({
            where: { assignmentId_studentId: { assignmentId, studentId } },
        });

        if (existing) {
            // Update existing submission
            return this.prisma.submission.update({
                where: { id: existing.id },
                data: {
                    content: dto.content,
                    fileIds: dto.fileIds || [],
                    isLate,
                    submittedAt: new Date(),
                },
                include: { grade: true },
            });
        }

        return this.prisma.submission.create({
            data: {
                assignmentId,
                studentId,
                content: dto.content,
                fileIds: dto.fileIds || [],
                isLate,
            },
            include: { grade: true },
        });
    }

    async getSubmissions(assignmentId: string, page: number = 1, limit: number = DEFAULT_PAGE_SIZE) {
        const pageSize = Math.min(Math.max(1, limit), MAX_PAGE_SIZE);
        const skip = (Math.max(1, page) - 1) * pageSize;

        const [submissions, total] = await Promise.all([
            this.prisma.submission.findMany({
                where: { assignmentId },
                include: {
                    student: { select: { id: true, firstName: true, lastName: true, email: true } },
                    grade: true,
                },
                orderBy: { student: { lastName: 'asc' } },
                skip,
                take: pageSize,
            }),
            this.prisma.submission.count({ where: { assignmentId } }),
        ]);

        return {
            data: submissions,
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }

    async getStudentSubmission(assignmentId: string, studentId: string) {
        const submission = await this.prisma.submission.findUnique({
            where: { assignmentId_studentId: { assignmentId, studentId } },
            include: { grade: true, assignment: true },
        });
        if (!submission) throw new NotFoundException('Submission not found');
        return submission;
    }

    // ─── GRADING ─────────────────────────────────────────────

    async gradeSubmission(submissionId: string, graderId: string, dto: GradeSubmissionDto) {
        const submission = await this.prisma.submission.findUnique({
            where: { id: submissionId },
            include: { assignment: true, grade: true },
        });
        if (!submission) throw new NotFoundException('Submission not found');

        // Validate score doesn't exceed max points
        if (dto.score > submission.assignment.maxPoints) {
            throw new ConflictException(
                `Score cannot exceed maximum points (${submission.assignment.maxPoints})`
            );
        }

        const letterGrade = dto.letterGrade || this.calculateLetterGrade(dto.score, submission.assignment.maxPoints);

        if (submission.grade) {
            // Update existing grade
            return this.prisma.grade.update({
                where: { id: submission.grade.id },
                data: {
                    score: dto.score,
                    maxScore: submission.assignment.maxPoints,
                    feedback: dto.feedback,
                    letterGrade,
                    gradedById: graderId,
                    gradedAt: new Date(),
                },
                include: {
                    student: { select: { id: true, firstName: true, lastName: true } },
                },
            });
        }

        return this.prisma.grade.create({
            data: {
                assignmentId: submission.assignmentId,
                studentId: submission.studentId,
                submissionId: submission.id,
                score: dto.score,
                maxScore: submission.assignment.maxPoints,
                feedback: dto.feedback,
                letterGrade,
                gradedById: graderId,
            },
            include: {
                student: { select: { id: true, firstName: true, lastName: true } },
            },
        });
    }

    async bulkGrade(assignmentId: string, graderId: string, dto: BulkGradeDto) {
        const assignment = await this.prisma.assignment.findUnique({ where: { id: assignmentId } });
        if (!assignment) throw new NotFoundException('Assignment not found');

        // Use transaction for atomicity
        type BulkGradeResult =
            | { studentId: string; status: 'graded'; grade: any }
            | { studentId: string; status: 'failed'; error: string };

        const results = await this.prisma.$transaction(async (tx) => {
            const processed: BulkGradeResult[] = [];
            
            for (const g of dto.grades) {
                // Validate score
                if (g.score > assignment.maxPoints) {
                    processed.push({
                        studentId: g.studentId,
                        status: 'failed',
                        error: `Score cannot exceed maximum points (${assignment.maxPoints})`,
                    });
                    continue;
                }

                const letterGrade = g.letterGrade || this.calculateLetterGrade(g.score, assignment.maxPoints);

                try {
                    const grade = await tx.grade.upsert({
                        where: { assignmentId_studentId: { assignmentId, studentId: g.studentId } },
                        create: {
                            assignmentId,
                            studentId: g.studentId,
                            score: g.score,
                            maxScore: assignment.maxPoints,
                            feedback: g.feedback,
                            letterGrade,
                            gradedById: graderId,
                        },
                        update: {
                            score: g.score,
                            feedback: g.feedback,
                            letterGrade,
                            gradedById: graderId,
                            gradedAt: new Date(),
                        },
                        include: {
                            student: { select: { id: true, firstName: true, lastName: true } },
                        },
                    });
                    processed.push({ studentId: g.studentId, status: 'graded', grade });
                } catch (err: any) {
                    processed.push({ studentId: g.studentId, status: 'failed', error: err.message });
                }
            }
            
            return processed;
        });

        this.logger.log(`Bulk grading completed for assignment ${assignmentId}: ${results.filter(r => r.status === 'graded').length} graded, ${results.filter(r => r.status === 'failed').length} failed`);
        
        return results;
    }

    // ─── GRADEBOOK ───────────────────────────────────────────

    async getClassGradebook(classId: string) {
        const assignments = await this.prisma.assignment.findMany({
            where: { classId },
            orderBy: { dueDate: 'asc' },
            select: { id: true, title: true, maxPoints: true, type: true, dueDate: true },
        });

        const enrollments = await this.prisma.classEnrollment.findMany({
            where: { classId, status: 'active' },
            include: {
                student: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
            orderBy: { student: { lastName: 'asc' } },
        });

        const grades = await this.prisma.grade.findMany({
            where: { assignmentId: { in: assignments.map((a) => a.id) } },
        });

        // Build gradebook matrix using Map for O(1) lookups
        const gradeMap = new Map<string, Map<string, any>>();
        for (const g of grades) {
            if (!gradeMap.has(g.studentId)) gradeMap.set(g.studentId, new Map());
            gradeMap.get(g.studentId)!.set(g.assignmentId, {
                score: g.score,
                maxScore: g.maxScore,
                letterGrade: g.letterGrade,
                percentage: Math.round((g.score / g.maxScore) * 100),
            });
        }

        const students = enrollments.map((e) => {
            const studentGrades = gradeMap.get(e.studentId) || new Map();
            const assignmentGrades = assignments.map((a) => ({
                assignmentId: a.id,
                ...(studentGrades.get(a.id) || { score: null, maxScore: a.maxPoints, letterGrade: null, percentage: null }),
            }));

            // Compute overall average
            const scored = assignmentGrades.filter((g) => g.score !== null);
            const totalScore = scored.reduce((sum, g) => sum + g.score, 0);
            const totalMax = scored.reduce((sum, g) => sum + g.maxScore, 0);
            const overallPercentage = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : null;
            const overallGrade = overallPercentage !== null ? this.calculateLetterGrade(totalScore, totalMax) : null;

            return {
                student: e.student,
                grades: assignmentGrades,
                overall: { totalScore, totalMax, percentage: overallPercentage, letterGrade: overallGrade },
            };
        });

        return { assignments, students };
    }

    async getStudentGrades(studentId: string, classId?: string, page: number = 1, limit: number = DEFAULT_PAGE_SIZE) {
        const pageSize = Math.min(Math.max(1, limit), MAX_PAGE_SIZE);

        // Get assignment IDs for the class if specified
        let assignmentIds: string[] = [];
        if (classId) {
            const assignments = await this.prisma.assignment.findMany({
                where: { classId },
                select: { id: true },
            });
            assignmentIds = assignments.map((a) => a.id);
        }

        const where: any = { studentId };
        if (classId) where.assignmentId = { in: assignmentIds };

        const [grades, total] = await Promise.all([
            this.prisma.grade.findMany({
                where,
                include: {
                    assignment: {
                        include: {
                            class: { select: { id: true, course: { select: { code: true, name: true } } } },
                        },
                    },
                    gradedBy: { select: { firstName: true, lastName: true } },
                },
                orderBy: { gradedAt: 'desc' },
                take: pageSize,
                skip: (page - 1) * pageSize,
            }),
            this.prisma.grade.count({ where }),
        ]);

        return {
            data: grades,
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }

    // ─── HELPERS ─────────────────────────────────────────────

    private calculateLetterGrade(score: number, maxScore: number): string {
        const pct = (score / maxScore) * 100;
        if (pct >= 93) return 'A';
        if (pct >= 90) return 'A-';
        if (pct >= 87) return 'B+';
        if (pct >= 83) return 'B';
        if (pct >= 80) return 'B-';
        if (pct >= 77) return 'C+';
        if (pct >= 73) return 'C';
        if (pct >= 70) return 'C-';
        if (pct >= 67) return 'D+';
        if (pct >= 63) return 'D';
        if (pct >= 60) return 'D-';
        return 'F';
    }
}
