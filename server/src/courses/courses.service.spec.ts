import { Test, TestingModule } from '@nestjs/testing';
import { CoursesService } from './courses.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

describe('CoursesService', () => {
    let service: CoursesService;
    let mockPrisma: DeepMockProxy<PrismaClient>;

    beforeEach(async () => {
        mockPrisma = mockDeep<PrismaClient>();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CoursesService,
                { provide: PrismaService, useValue: mockPrisma },
            ],
        }).compile();

        service = module.get<CoursesService>(CoursesService);
        jest.clearAllMocks();
    });

    describe('createCourse', () => {
        const createCourseDto = {
            code: 'CS101',
            name: 'Introduction to Computer Science',
            description: 'Basic programming concepts',
            credits: 3,
            department: 'Computer Science',
        };

        it('should create a course successfully', async () => {
            mockPrisma.course.findUnique.mockResolvedValue(null);
            mockPrisma.course.create.mockResolvedValue({
                id: 'course-id',
                code: 'CS101',
                name: createCourseDto.name,
                description: createCourseDto.description,
                credits: 3,
                department: 'Computer Science',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            } as any);

            const result = await service.createCourse(createCourseDto);

            expect(result).toBeDefined();
            expect(result.code).toBe('CS101');
            expect(mockPrisma.course.create).toHaveBeenCalledWith({
                data: {
                    code: 'CS101',
                    name: createCourseDto.name,
                    description: createCourseDto.description,
                    credits: 3,
                    department: 'Computer Science',
                },
            });
        });

        it('should convert code to uppercase', async () => {
            mockPrisma.course.findUnique.mockResolvedValue(null);
            mockPrisma.course.create.mockResolvedValue({
                id: 'course-id',
                code: 'CS101',
            } as any);

            await service.createCourse({ ...createCourseDto, code: 'cs101' });

            expect(mockPrisma.course.findUnique).toHaveBeenCalledWith({
                where: { code: 'CS101' },
            });
        });

        it('should throw ConflictException if course code exists', async () => {
            mockPrisma.course.findUnique.mockResolvedValue({
                id: 'existing-course',
                code: 'CS101',
            } as any);

            await expect(service.createCourse(createCourseDto))
                .rejects.toThrow(ConflictException);
            await expect(service.createCourse(createCourseDto))
                .rejects.toThrow('Course code CS101 already exists');
        });

        it('should use default credits when not provided', async () => {
            mockPrisma.course.findUnique.mockResolvedValue(null);
            mockPrisma.course.create.mockResolvedValue({
                id: 'course-id',
                credits: 1,
            } as any);

            const { credits, ...dtoWithoutCredits } = createCourseDto;
            await service.createCourse(dtoWithoutCredits as any);

            expect(mockPrisma.course.create).toHaveBeenCalledWith({
                data: expect.objectContaining({ credits: 1 }),
            });
        });
    });

    describe('findAllCourses', () => {
        it('should return paginated courses', async () => {
            mockPrisma.course.findMany.mockResolvedValue([
                { id: 'course-1', code: 'CS101', name: 'Course 1', classes: [] },
                { id: 'course-2', code: 'CS102', name: 'Course 2', classes: [] },
            ] as any);
            mockPrisma.course.count.mockResolvedValue(2);

            const result = await service.findAllCourses({}, 1, 10);

            expect(result.data).toHaveLength(2);
            expect(result.meta.total).toBe(2);
            expect(result.meta.page).toBe(1);
            expect(result.meta.pageSize).toBe(10);
            expect(result.meta.totalPages).toBe(1);
        });

        it('should filter by department', async () => {
            mockPrisma.course.findMany.mockResolvedValue([] as any);
            mockPrisma.course.count.mockResolvedValue(0);

            await service.findAllCourses({ department: 'Computer Science' });

            expect(mockPrisma.course.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ department: 'Computer Science', deletedAt: null }),
                })
            );
        });

        it('should filter by isActive', async () => {
            mockPrisma.course.findMany.mockResolvedValue([] as any);
            mockPrisma.course.count.mockResolvedValue(0);

            await service.findAllCourses({ isActive: true });

            expect(mockPrisma.course.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ isActive: true, deletedAt: null }),
                })
            );
        });

        it('should search by name or code', async () => {
            mockPrisma.course.findMany.mockResolvedValue([] as any);
            mockPrisma.course.count.mockResolvedValue(0);

            await service.findAllCourses({ search: 'computer' });

            expect(mockPrisma.course.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        deletedAt: null,
                        OR: [
                            { name: { contains: 'computer', mode: 'insensitive' } },
                            { code: { contains: 'computer', mode: 'insensitive' } },
                        ],
                    }),
                })
            );
        });

        it('should include deleted courses when flag is true', async () => {
            mockPrisma.course.findMany.mockResolvedValue([] as any);
            mockPrisma.course.count.mockResolvedValue(0);

            await service.findAllCourses({ includeDeleted: true });

            expect(mockPrisma.course.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.not.objectContaining({ deletedAt: null }),
                })
            );
        });

        it('should enforce maximum page size', async () => {
            mockPrisma.course.findMany.mockResolvedValue([] as any);
            mockPrisma.course.count.mockResolvedValue(0);

            await service.findAllCourses({}, 1, 500);

            expect(mockPrisma.course.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ take: 200 })
            );
        });
    });

    describe('findCourseById', () => {
        it('should return course by id', async () => {
            const mockCourse = {
                id: 'course-1',
                code: 'CS101',
                name: 'Course 1',
                classes: [],
            };

            mockPrisma.course.findFirst.mockResolvedValue(mockCourse as any);

            const result = await service.findCourseById('course-1');

            expect(result).toBeDefined();
            expect(result.id).toBe('course-1');
        });

        it('should include classes with teacher info', async () => {
            mockPrisma.course.findFirst.mockResolvedValue({
                id: 'course-1',
                classes: [
                    {
                        id: 'class-1',
                        teacher: { id: 'teacher-1', firstName: 'John', lastName: 'Doe' },
                        _count: { enrollments: 20 },
                    },
                ],
            } as any);

            const result = await service.findCourseById('course-1');

            expect(result.classes).toBeDefined();
            expect(result.classes[0].teacher).toBeDefined();
        });

        it('should throw NotFoundException for non-existent course', async () => {
            mockPrisma.course.findFirst.mockResolvedValue(null);

            await expect(service.findCourseById('non-existent'))
                .rejects.toThrow(NotFoundException);
        });

        it('should return deleted course when flag is true', async () => {
            mockPrisma.course.findFirst.mockResolvedValue({
                id: 'course-1',
                deletedAt: new Date(),
            } as any);

            const result = await service.findCourseById('course-1', true);

            expect(result).toBeDefined();
        });
    });

    describe('updateCourse', () => {
        const updateDto = {
            name: 'Updated Course Name',
            description: 'Updated description',
        };

        it('should update course successfully', async () => {
            mockPrisma.course.findFirst.mockResolvedValue({ id: 'course-1' } as any);
            mockPrisma.course.update.mockResolvedValue({
                id: 'course-1',
                ...updateDto,
            } as any);

            const result = await service.updateCourse('course-1', updateDto);

            expect(result).toBeDefined();
            expect(result.name).toBe(updateDto.name);
            expect(mockPrisma.course.update).toHaveBeenCalledWith({
                where: { id: 'course-1' },
                data: updateDto,
            });
        });

        it('should throw NotFoundException if course does not exist', async () => {
            mockPrisma.course.findFirst.mockResolvedValue(null);

            await expect(service.updateCourse('non-existent', updateDto))
                .rejects.toThrow(NotFoundException);
        });
    });

    describe('deleteCourse', () => {
        it('should soft delete course by default', async () => {
            mockPrisma.course.findFirst.mockResolvedValue({ id: 'course-1' } as any);
            mockPrisma.course.update.mockResolvedValue({ id: 'course-1' } as any);

            const result = await service.deleteCourse('course-1');

            expect(mockPrisma.course.update).toHaveBeenCalledWith({
                where: { id: 'course-1' },
                data: {
                    deletedAt: expect.any(Date),
                    isActive: false,
                },
            });
        });

        it('should hard delete when specified', async () => {
            mockPrisma.course.findFirst.mockResolvedValue({ id: 'course-1' } as any);
            mockPrisma.course.delete.mockResolvedValue({ id: 'course-1' } as any);

            await service.deleteCourse('course-1', false);

            expect(mockPrisma.course.delete).toHaveBeenCalledWith({
                where: { id: 'course-1' },
            });
        });

        it('should throw NotFoundException if course does not exist', async () => {
            mockPrisma.course.findFirst.mockResolvedValue(null);

            await expect(service.deleteCourse('non-existent'))
                .rejects.toThrow(NotFoundException);
        });
    });

    describe('createClass', () => {
        const createClassDto = {
            courseId: 'course-1',
            teacherId: 'teacher-1',
            term: 'Fall 2026',
            section: 'A',
            room: '101',
            maxStudents: 30,
        };

        it('should create class successfully', async () => {
            mockPrisma.course.findUnique.mockResolvedValue({ id: 'course-1' } as any);
            mockPrisma.class.create.mockResolvedValue({
                id: 'class-1',
                ...createClassDto,
                course: { code: 'CS101', name: 'Intro to CS' },
                teacher: { id: 'teacher-1', firstName: 'John', lastName: 'Doe' },
            } as any);

            const result = await service.createClass(createClassDto);

            expect(result).toBeDefined();
            expect(result.id).toBe('class-1');
            expect(result.course).toBeDefined();
            expect(result.teacher).toBeDefined();
        });

        it('should throw NotFoundException if course does not exist', async () => {
            mockPrisma.course.findUnique.mockResolvedValue(null);

            await expect(service.createClass(createClassDto))
                .rejects.toThrow(NotFoundException);
        });
    });

    describe('findAllClasses', () => {
        it('should return paginated classes', async () => {
            mockPrisma.class.findMany.mockResolvedValue([
                { id: 'class-1', course: {}, teacher: {}, schedules: [], _count: {} },
            ] as any);
            mockPrisma.class.count.mockResolvedValue(1);

            const result = await service.findAllClasses();

            expect(result.data).toHaveLength(1);
            expect(result.meta.total).toBe(1);
        });

        it('should filter by term', async () => {
            mockPrisma.class.findMany.mockResolvedValue([] as any);
            mockPrisma.class.count.mockResolvedValue(0);

            await service.findAllClasses({ term: 'Fall 2026' });

            expect(mockPrisma.class.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ term: 'Fall 2026', isActive: true, deletedAt: null }),
                })
            );
        });

        it('should filter by teacherId', async () => {
            mockPrisma.class.findMany.mockResolvedValue([] as any);
            mockPrisma.class.count.mockResolvedValue(0);

            await service.findAllClasses({ teacherId: 'teacher-1' });

            expect(mockPrisma.class.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ teacherId: 'teacher-1' }),
                })
            );
        });

        it('should filter by student enrollments', async () => {
            mockPrisma.class.findMany.mockResolvedValue([] as any);
            mockPrisma.class.count.mockResolvedValue(0);

            await service.findAllClasses({ studentId: 'student-1' });

            expect(mockPrisma.class.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        enrollments: { some: { studentId: 'student-1', status: 'active' } },
                    }),
                })
            );
        });
    });

    describe('findClassById', () => {
        it('should return class with enrollments', async () => {
            mockPrisma.class.findFirst.mockResolvedValue({
                id: 'class-1',
                course: {},
                teacher: {},
                schedules: [],
                enrollments: [
                    { student: { id: 'student-1', firstName: 'Jane', lastName: 'Doe' } },
                ],
                _count: {},
            } as any);

            const result = await service.findClassById('class-1');

            expect(result).toBeDefined();
            expect(result.enrollments).toBeDefined();
        });

        it('should throw NotFoundException for non-existent class', async () => {
            mockPrisma.class.findFirst.mockResolvedValue(null);

            await expect(service.findClassById('non-existent'))
                .rejects.toThrow(NotFoundException);
        });
    });

    describe('enrollStudent', () => {
        const enrollDto = {
            studentId: 'student-1',
        };

        it('should enroll student successfully', async () => {
            mockPrisma.class.findUnique.mockResolvedValue({
                id: 'class-1',
                maxStudents: 30,
                _count: { enrollments: 10 },
            } as any);
            mockPrisma.classEnrollment.findUnique.mockResolvedValue(null);
            mockPrisma.classEnrollment.create.mockResolvedValue({
                id: 'enrollment-1',
                classId: 'class-1',
                studentId: 'student-1',
                student: { id: 'student-1', firstName: 'Jane', lastName: 'Doe' },
            } as any);

            const result = await service.enrollStudent('class-1', enrollDto);

            expect(result).toBeDefined();
            expect(result.studentId).toBe('student-1');
        });

        it('should throw ConflictException if class is full', async () => {
            mockPrisma.class.findUnique.mockResolvedValue({
                id: 'class-1',
                maxStudents: 30,
                _count: { enrollments: 30 },
            } as any);

            await expect(service.enrollStudent('class-1', enrollDto))
                .rejects.toThrow(ConflictException);
        });

        it('should throw ConflictException if already enrolled', async () => {
            mockPrisma.class.findUnique.mockResolvedValue({
                id: 'class-1',
                maxStudents: 30,
                _count: { enrollments: 10 },
            } as any);
            mockPrisma.classEnrollment.findUnique.mockResolvedValue({
                id: 'existing',
                status: 'active',
            } as any);

            await expect(service.enrollStudent('class-1', enrollDto))
                .rejects.toThrow(ConflictException);
        });

        it('should re-enroll dropped student', async () => {
            mockPrisma.class.findUnique.mockResolvedValue({
                id: 'class-1',
                maxStudents: 30,
                _count: { enrollments: 10 },
            } as any);
            mockPrisma.classEnrollment.findUnique.mockResolvedValue({
                id: 'existing',
                status: 'dropped',
            } as any);
            mockPrisma.classEnrollment.update.mockResolvedValue({
                id: 'existing',
                status: 'active',
            } as any);

            const result = await service.enrollStudent('class-1', enrollDto);

            expect(result.status).toBe('active');
        });
    });

    describe('bulkEnroll', () => {
        it('should enroll multiple students', async () => {
            mockPrisma.class.findUnique.mockResolvedValue({
                id: 'class-1',
                maxStudents: 30,
                _count: { enrollments: 10 },
            } as any);
            mockPrisma.$transaction.mockImplementation(async (callback: any) => {
                return callback(mockPrisma);
            });
            mockPrisma.classEnrollment.findUnique.mockResolvedValue(null);
            mockPrisma.classEnrollment.create.mockResolvedValue({ id: 'enrollment-1' } as any);

            const result = await service.bulkEnroll('class-1', ['student-1', 'student-2']);

            expect(result).toHaveLength(2);
            expect(result[0].status).toBe('enrolled');
        });

        it('should throw ConflictException if batch size exceeds limit', async () => {
            const studentIds = Array(101).fill(0).map((_, i) => `student-${i}`);

            await expect(service.bulkEnroll('class-1', studentIds))
                .rejects.toThrow(ConflictException);
        });

        it('should handle already enrolled students', async () => {
            mockPrisma.class.findUnique.mockResolvedValue({
                id: 'class-1',
                maxStudents: 30,
                _count: { enrollments: 10 },
            } as any);
            mockPrisma.$transaction.mockImplementation(async (callback: any) => {
                return callback(mockPrisma);
            });
            mockPrisma.classEnrollment.findUnique.mockResolvedValue({
                id: 'existing',
                status: 'active',
            } as any);

            const result = await service.bulkEnroll('class-1', ['student-1']);

            expect(result[0].status).toBe('already_enrolled');
        });
    });

    describe('dropStudent', () => {
        it('should drop student successfully', async () => {
            mockPrisma.classEnrollment.findUnique.mockResolvedValue({
                id: 'enrollment-1',
                status: 'active',
            } as any);
            mockPrisma.classEnrollment.update.mockResolvedValue({
                id: 'enrollment-1',
                status: 'dropped',
            } as any);

            const result = await service.dropStudent('class-1', 'student-1');

            expect(result.status).toBe('dropped');
        });

        it('should throw NotFoundException if enrollment does not exist', async () => {
            mockPrisma.classEnrollment.findUnique.mockResolvedValue(null);

            await expect(service.dropStudent('class-1', 'student-1'))
                .rejects.toThrow(NotFoundException);
        });
    });

    describe('getClassRoster', () => {
        it('should return paginated roster', async () => {
            mockPrisma.classEnrollment.findMany.mockResolvedValue([
                { student: { id: 'student-1', firstName: 'Jane', lastName: 'Doe' } },
            ] as any);
            mockPrisma.classEnrollment.count.mockResolvedValue(1);

            const result = await service.getClassRoster('class-1');

            expect(result.data).toHaveLength(1);
            expect(result.meta.total).toBe(1);
        });
    });

    describe('getStudentClasses', () => {
        it('should return student enrollments with class details', async () => {
            mockPrisma.classEnrollment.findMany.mockResolvedValue([
                {
                    class: {
                        course: { code: 'CS101', name: 'Intro to CS' },
                        teacher: { firstName: 'John', lastName: 'Doe' },
                        schedules: [],
                    },
                },
            ] as any);
            mockPrisma.classEnrollment.count.mockResolvedValue(1);

            const result = await service.getStudentClasses('student-1');

            expect(result.data).toHaveLength(1);
            expect(result.data[0].class.course).toBeDefined();
        });

        it('should filter by term', async () => {
            mockPrisma.classEnrollment.findMany.mockResolvedValue([] as any);
            mockPrisma.classEnrollment.count.mockResolvedValue(0);

            await service.getStudentClasses('student-1', 'Fall 2026');

            expect(mockPrisma.classEnrollment.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        studentId: 'student-1',
                        status: 'active',
                        class: { term: 'Fall 2026' },
                    }),
                })
            );
        });
    });

    describe('schedules', () => {
        it('should add schedules to class', async () => {
            mockPrisma.class.findFirst.mockResolvedValue({ id: 'class-1' } as any);
            mockPrisma.$transaction.mockImplementation(async (operations: any) => {
                return operations.map(() => ({ id: 'schedule-1' }));
            });
            mockPrisma.schedule.create.mockResolvedValue({ id: 'schedule-1' } as any);

            const schedules = [
                { dayOfWeek: 1, startTime: '09:00', endTime: '10:30' },
                { dayOfWeek: 3, startTime: '09:00', endTime: '10:30' },
            ];

            const result = await service.addSchedules('class-1', schedules);

            expect(result).toHaveLength(2);
        });

        it('should throw ConflictException if more than 7 schedules', async () => {
            const schedules = Array(8).fill({ dayOfWeek: 1, startTime: '09:00', endTime: '10:30' });

            await expect(service.addSchedules('class-1', schedules))
                .rejects.toThrow(ConflictException);
        });

        it('should get class schedules', async () => {
            mockPrisma.schedule.findMany.mockResolvedValue([
                { id: 'schedule-1', dayOfWeek: 1, startTime: '09:00', endTime: '10:30' },
            ] as any);

            const result = await service.getSchedules('class-1');

            expect(result).toHaveLength(1);
        });

        it('should delete schedule', async () => {
            mockPrisma.schedule.delete.mockResolvedValue({ id: 'schedule-1' } as any);

            await service.deleteSchedule('schedule-1');

            expect(mockPrisma.schedule.delete).toHaveBeenCalledWith({
                where: { id: 'schedule-1' },
            });
        });
    });

    describe('getTeacherClasses', () => {
        it('should return teacher classes', async () => {
            mockPrisma.class.findMany.mockResolvedValue([
                { id: 'class-1', course: {}, schedules: [], _count: {} },
            ] as any);
            mockPrisma.class.count.mockResolvedValue(1);

            const result = await service.getTeacherClasses('teacher-1');

            expect(result.data).toHaveLength(1);
        });

        it('should filter by term', async () => {
            mockPrisma.class.findMany.mockResolvedValue([] as any);
            mockPrisma.class.count.mockResolvedValue(0);

            await service.getTeacherClasses('teacher-1', 'Fall 2026');

            expect(mockPrisma.class.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        teacherId: 'teacher-1',
                        isActive: true,
                        term: 'Fall 2026',
                    }),
                })
            );
        });
    });

    describe('getAdminClasses', () => {
        it('should return classes grouped by term', async () => {
            mockPrisma.class.findMany.mockResolvedValue([
                {
                    id: 'class-1',
                    term: 'Fall 2026',
                    course: { code: 'CS101', name: 'Intro to CS' },
                    teacher: { firstName: 'John', lastName: 'Doe' },
                    _count: { enrollments: 20 },
                    attendance: [],
                },
            ] as any);

            const result = await service.getAdminClasses();

            expect(result).toHaveProperty('Fall 2026');
            expect(result['Fall 2026']).toHaveLength(1);
        });

        it('should calculate present students from attendance', async () => {
            mockPrisma.class.findMany.mockResolvedValue([
                {
                    id: 'class-1',
                    term: 'Fall 2026',
                    course: { code: 'CS101', name: 'Intro to CS' },
                    teacher: { firstName: 'John', lastName: 'Doe' },
                    _count: { enrollments: 20 },
                    attendance: [
                        {
                            records: [
                                { status: 'present', studentId: 'student-1' },
                                { status: 'present', studentId: 'student-2' },
                                { status: 'absent', studentId: 'student-3' },
                                { status: 'late', studentId: 'student-4' },
                            ],
                        },
                    ],
                },
            ] as any);

            const result = await service.getAdminClasses();

            expect(result['Fall 2026'][0].todayPresent).toBe(3); // present + late
        });
    });
});
