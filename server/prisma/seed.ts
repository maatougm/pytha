import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🗑️  Cleaning database...');
    await prisma.auditLog.deleteMany();
    await prisma.attendanceRecord.deleteMany();
    await prisma.attendanceSession.deleteMany();
    await prisma.grade.deleteMany();
    await prisma.submission.deleteMany();
    await prisma.assignment.deleteMany();
    await prisma.file.deleteMany();
    await prisma.message.deleteMany();
    await prisma.classEnrollment.deleteMany();
    await prisma.schedule.deleteMany();
    await prisma.class.deleteMany();
    await prisma.course.deleteMany();
    await prisma.channelMember.deleteMany();
    await prisma.channel.deleteMany();
    await prisma.parentStudent.deleteMany();
    // specific users are upserted, so we don't strictly need to delete all users, 
    // but deleting prevents phantom users from previous runs if needed. 
    // For now, we'll keep users/roles as upsert to avoid constraint issues if we don't delete them.

    console.log('🌱 Seeding database...\n');

    // ─── Roles ───────────────────────────────────────────────
    const roles = ['admin', 'teacher', 'parent', 'student'];
    const roleRecords: Record<string, any> = {};

    for (const name of roles) {
        roleRecords[name] = await prisma.role.upsert({
            where: { name },
            update: {},
            create: { name },
        });
    }
    console.log('  ✅ Roles created');

    // ─── Users ───────────────────────────────────────────────
    const passwordHash = await bcrypt.hash('Password123!', 12);

    const users = [
        // Admin
        { email: 'admin@school.com', firstName: 'Admin', lastName: 'User', role: 'admin' },

        // Teachers
        { email: 'teacher1@school.com', firstName: 'Sarah', lastName: 'Johnson', role: 'teacher' },
        { email: 'teacher2@school.com', firstName: 'Michael', lastName: 'Chen', role: 'teacher' },
        { email: 'teacher3@school.com', firstName: 'Jennifer', lastName: 'Martinez', role: 'teacher' },

        // Parents
        { email: 'parent1@school.com', firstName: 'David', lastName: 'Williams', role: 'parent' },
        { email: 'parent2@school.com', firstName: 'Emily', lastName: 'Brown', role: 'parent' },
        { email: 'parent3@school.com', firstName: 'Robert', lastName: 'Davis', role: 'parent' },

        // Students
        // Students - REMOVED for test
        // { email: 'student1@school.com', firstName: 'Alex', lastName: 'Williams', role: 'student' },
        // { email: 'student2@school.com', firstName: 'Maya', lastName: 'Brown', role: 'student' },
        // { email: 'student3@school.com', firstName: 'Liam', lastName: 'Davis', role: 'student' },
        // { email: 'student4@school.com', firstName: 'Sophia', lastName: 'Miller', role: 'student' },
        // { email: 'student5@school.com', firstName: 'Ethan', lastName: 'Wilson', role: 'student' },
    ];

    const userRecords: Record<string, any> = {};
    for (const u of users) {
        userRecords[u.email] = await prisma.user.upsert({
            where: { email: u.email },
            update: {},
            create: {
                email: u.email,
                passwordHash,
                firstName: u.firstName,
                lastName: u.lastName,
                userRoles: {
                    create: { roleId: roleRecords[u.role].id },
                },
            },
        });
    }
    console.log('  ✅ Users created');

    // ─── Parent-Student Links ────────────────────────────────
    const parentLinks: any[] = [];
    // const parentLinks = [
    //     { parent: 'parent1@school.com', student: 'student1@school.com' },
    //     { parent: 'parent2@school.com', student: 'student2@school.com' },
    //     { parent: 'parent3@school.com', student: 'student3@school.com' },
    // ];

    for (const link of parentLinks) {
        await prisma.parentStudent.upsert({
            where: {
                parentId_studentId: {
                    parentId: userRecords[link.parent].id,
                    studentId: userRecords[link.student].id,
                },
            },
            update: {},
            create: {
                parentId: userRecords[link.parent].id,
                studentId: userRecords[link.student].id,
            },
        });
    }
    console.log('  ✅ Parent-Student links created');

    // ─── Messaging Channels ──────────────────────────────────
    const generalChannel = await prisma.channel.create({
        data: {
            type: 'admin_broadcast',
            name: '📢 School Announcements',
            createdBy: userRecords['admin@school.com'].id,
            members: {
                create: Object.values(userRecords).map((u: any) => ({
                    userId: u.id,
                    role: u.email === 'admin@school.com' ? 'owner' : 'member',
                })),
            },
        },
    });

    const teacherChannel = await prisma.channel.create({
        data: {
            type: 'teacher_admin',
            name: '👩‍🏫 Teacher Lounge',
            createdBy: userRecords['admin@school.com'].id,
            members: {
                create: [
                    { userId: userRecords['admin@school.com'].id, role: 'owner' },
                    { userId: userRecords['teacher1@school.com'].id, role: 'member' },
                    { userId: userRecords['teacher2@school.com'].id, role: 'member' },
                    { userId: userRecords['teacher3@school.com'].id, role: 'member' },
                ],
            },
        },
    });

    const parentTeacherChannel = await prisma.channel.create({
        data: {
            type: 'teacher_parent',
            name: '👨‍👩‍👦 Parent-Teacher Chat',
            createdBy: userRecords['teacher1@school.com'].id,
            members: {
                create: [
                    { userId: userRecords['teacher1@school.com'].id, role: 'owner' },
                    { userId: userRecords['teacher2@school.com'].id, role: 'member' },
                    { userId: userRecords['parent1@school.com'].id, role: 'member' },
                    { userId: userRecords['parent2@school.com'].id, role: 'member' },
                    { userId: userRecords['parent3@school.com'].id, role: 'member' },
                ],
            },
        },
    });

    // Class-specific channel
    const mathClassChannel = await prisma.channel.create({
        data: {
            type: 'class_broadcast',
            name: '📐 MATH101 - Algebra I',
            createdBy: userRecords['teacher1@school.com'].id,
            members: {
                create: [
                    { userId: userRecords['teacher1@school.com'].id, role: 'owner' },
                    // { userId: userRecords['student1@school.com'].id, role: 'member' },
                    // { userId: userRecords['student2@school.com'].id, role: 'member' },
                    // { userId: userRecords['student3@school.com'].id, role: 'member' },
                    // { userId: userRecords['student4@school.com'].id, role: 'member' },
                ],
            },
        },
    });
    console.log('  ✅ Channels created');

    // ─── Messages (with realistic conversation) ──────────────
    const now = new Date();
    const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000);
    const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

    const messages = [
        // General Channel
        { channelId: generalChannel.id, senderId: userRecords['admin@school.com'].id, content: 'Welcome to School Hub! 🎓 This is our new messaging platform.', createdAt: daysAgo(7) },
        { channelId: generalChannel.id, senderId: userRecords['teacher1@school.com'].id, content: 'Great to have everyone connected!', createdAt: daysAgo(7) },
        { channelId: generalChannel.id, senderId: userRecords['admin@school.com'].id, content: '📅 Important: Parent-teacher conferences will be held on March 15th.', createdAt: daysAgo(3) },
        { channelId: generalChannel.id, senderId: userRecords['parent1@school.com'].id, content: 'Will there be evening slots available?', createdAt: daysAgo(3) },
        { channelId: generalChannel.id, senderId: userRecords['admin@school.com'].id, content: 'Yes! We\'ll have slots from 4PM to 7PM.', createdAt: daysAgo(3) },
        { channelId: generalChannel.id, senderId: userRecords['admin@school.com'].id, content: '📢 Spring break starts April 10th. Mark your calendars!', createdAt: hoursAgo(5) },

        // Teacher Channel
        { channelId: teacherChannel.id, senderId: userRecords['teacher1@school.com'].id, content: 'Has anyone prepared the midterm exams?', createdAt: daysAgo(2) },
        { channelId: teacherChannel.id, senderId: userRecords['teacher2@school.com'].id, content: 'I\'m working on the Math exam. Should be ready by Friday.', createdAt: daysAgo(2) },
        { channelId: teacherChannel.id, senderId: userRecords['teacher3@school.com'].id, content: 'English exam is ready for review.', createdAt: daysAgo(1) },
        { channelId: teacherChannel.id, senderId: userRecords['teacher1@school.com'].id, content: 'Great! Let me know if you need any help.', createdAt: hoursAgo(12) },

        // Parent-Teacher Channel
        { channelId: parentTeacherChannel.id, senderId: userRecords['teacher1@school.com'].id, content: 'Hello parents! Feel free to reach out with any questions.', createdAt: daysAgo(5) },
        { channelId: parentTeacherChannel.id, senderId: userRecords['parent1@school.com'].id, content: 'Thank you Ms. Johnson. How is Alex progressing?', createdAt: daysAgo(4) },
        { channelId: parentTeacherChannel.id, senderId: userRecords['teacher1@school.com'].id, content: 'Alex is doing great! Excellent participation in class.', createdAt: daysAgo(4) },
        { channelId: parentTeacherChannel.id, senderId: userRecords['parent2@school.com'].id, content: 'When will the report cards be available?', createdAt: daysAgo(2) },
        { channelId: parentTeacherChannel.id, senderId: userRecords['teacher2@school.com'].id, content: 'They should be ready by next Monday.', createdAt: daysAgo(2) },

        // Math Class Channel
        // { channelId: mathClassChannel.id, senderId: userRecords['student1@school.com'].id, content: 'Will we be covering quadratic equations next week?', createdAt: hoursAgo(15) },
        { channelId: mathClassChannel.id, senderId: userRecords['teacher1@school.com'].id, content: 'Yes, starting Monday. Make sure to review the prep material.', createdAt: hoursAgo(14) },
        // { channelId: mathClassChannel.id, senderId: userRecords['student2@school.com'].id, content: 'Thanks for the reminder!', createdAt: hoursAgo(10) },
        // { channelId: mathClassChannel.id, senderId: userRecords['student3@school.com'].id, content: 'I have a question about problem #5...', createdAt: hoursAgo(2) },
    ];

    for (const msg of messages) {
        await prisma.message.create({ data: msg });
    }
    console.log('  ✅ Messages created');

    // ─── Courses ─────────────────────────────────────────────
    const courses = [
        { code: 'MATH101', name: 'Algebra I', department: 'Mathematics', credits: 3, description: 'Introduction to algebraic concepts including equations, inequalities, and functions.' },
        { code: 'MATH201', name: 'Calculus I', department: 'Mathematics', credits: 4, description: 'Limits, derivatives, and integrals of single-variable functions.' },
        { code: 'ENG101', name: 'English Composition', department: 'English', credits: 3, description: 'Fundamentals of academic writing and critical reading.' },
        { code: 'SCI101', name: 'General Science', department: 'Science', credits: 3, description: 'Overview of biology, chemistry, and physics concepts.' },
        { code: 'HIS101', name: 'World History', department: 'Social Studies', credits: 3, description: 'Survey of major civilizations and historical events.' },
        { code: 'ART101', name: 'Introduction to Art', department: 'Arts', credits: 2, description: 'Fundamentals of visual arts including drawing, painting, and sculpture.' },
        { code: 'PHY101', name: 'Physics I', department: 'Science', credits: 4, description: 'Mechanics, thermodynamics, and wave motion.' },
        { code: 'CHE101', name: 'Chemistry I', department: 'Science', credits: 4, description: 'Atomic structure, chemical bonding, and reactions.' },
    ];

    const courseRecords: Record<string, any> = {};
    for (const c of courses) {
        courseRecords[c.code] = await prisma.course.create({ data: c });
    }
    console.log('  ✅ Courses created');

    // ─── Classes ─────────────────────────────────────────────
    const classesData = [
        { courseCode: 'MATH101', teacherEmail: 'teacher1@school.com', term: 'Spring 2026', section: 'A', room: 'Room 101', maxStudents: 30 },
        { courseCode: 'MATH101', teacherEmail: 'teacher1@school.com', term: 'Spring 2026', section: 'B', room: 'Room 102', maxStudents: 30 },
        { courseCode: 'MATH201', teacherEmail: 'teacher1@school.com', term: 'Spring 2026', section: 'A', room: 'Room 103', maxStudents: 25 },
        { courseCode: 'ENG101', teacherEmail: 'teacher2@school.com', term: 'Spring 2026', section: 'A', room: 'Room 201', maxStudents: 30 },
        { courseCode: 'ENG101', teacherEmail: 'teacher2@school.com', term: 'Spring 2026', section: 'B', room: 'Room 202', maxStudents: 30 },
        { courseCode: 'SCI101', teacherEmail: 'teacher3@school.com', term: 'Spring 2026', section: 'A', room: 'Room 301', maxStudents: 25 },
        { courseCode: 'PHY101', teacherEmail: 'teacher3@school.com', term: 'Spring 2026', section: 'A', room: 'Lab 1', maxStudents: 20 },
        { courseCode: 'CHE101', teacherEmail: 'teacher2@school.com', term: 'Spring 2026', section: 'A', room: 'Lab 2', maxStudents: 20 },
    ];

    const classRecords: Record<string, any> = {};
    for (const c of classesData) {
        const key = `${c.courseCode}-${c.section}`;
        classRecords[key] = await prisma.class.create({
            data: {
                courseId: courseRecords[c.courseCode].id,
                teacherId: userRecords[c.teacherEmail].id,
                term: c.term,
                section: c.section,
                room: c.room,
                maxStudents: c.maxStudents,
            },
        });
    }
    console.log('  ✅ Classes created');

    // ─── Schedules ───────────────────────────────────────────
    const schedules = [
        { classKey: 'MATH101-A', dayOfWeek: 1, startTime: '09:00', endTime: '10:30' },
        { classKey: 'MATH101-A', dayOfWeek: 3, startTime: '09:00', endTime: '10:30' },
        { classKey: 'MATH101-A', dayOfWeek: 5, startTime: '09:00', endTime: '10:30' },
        { classKey: 'MATH101-B', dayOfWeek: 2, startTime: '09:00', endTime: '10:30' },
        { classKey: 'MATH101-B', dayOfWeek: 4, startTime: '09:00', endTime: '10:30' },
        { classKey: 'MATH201-A', dayOfWeek: 2, startTime: '10:00', endTime: '11:30' },
        { classKey: 'MATH201-A', dayOfWeek: 4, startTime: '10:00', endTime: '11:30' },
        { classKey: 'ENG101-A', dayOfWeek: 1, startTime: '11:00', endTime: '12:30' },
        { classKey: 'ENG101-A', dayOfWeek: 3, startTime: '11:00', endTime: '12:30' },
        { classKey: 'ENG101-B', dayOfWeek: 2, startTime: '13:00', endTime: '14:30' },
        { classKey: 'ENG101-B', dayOfWeek: 4, startTime: '13:00', endTime: '14:30' },
        { classKey: 'SCI101-A', dayOfWeek: 1, startTime: '13:00', endTime: '14:30' },
        { classKey: 'SCI101-A', dayOfWeek: 3, startTime: '13:00', endTime: '14:30' },
        { classKey: 'PHY101-A', dayOfWeek: 2, startTime: '14:00', endTime: '16:00' },
        { classKey: 'CHE101-A', dayOfWeek: 4, startTime: '14:00', endTime: '16:00' },
    ];

    for (const s of schedules) {
        if (classRecords[s.classKey]) {
            await prisma.schedule.create({
                data: {
                    classId: classRecords[s.classKey].id,
                    dayOfWeek: s.dayOfWeek,
                    startTime: s.startTime,
                    endTime: s.endTime,
                },
            });
        }
    }
    console.log('  ✅ Schedules created');

    // ─── Enrollments ─────────────────────────────────────────
    const enrollments: any[] = [];
    // const enrollments = [
    //     { classKey: 'MATH101-A', studentEmails: ['student1@school.com', 'student2@school.com', 'student3@school.com', 'student4@school.com'] },
    //     ...
    // ];

    for (const e of enrollments) {
        for (const email of e.studentEmails) {
            if (classRecords[e.classKey]) {
                await prisma.classEnrollment.create({
                    data: {
                        classId: classRecords[e.classKey].id,
                        studentId: userRecords[email].id,
                    },
                });
            }
        }
    }
    console.log('  ✅ Enrollments created');

    // ─── Assignments ─────────────────────────────────────────
    const futureDate = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const pastDate = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const assignmentsData = [
        // Past assignments (graded)
        { classKey: 'MATH101-A', title: 'Week 1 Practice', description: 'Basic algebra review problems.', dueDate: pastDate(14), maxPoints: 20, type: 'homework', teacherEmail: 'teacher1@school.com' },
        { classKey: 'MATH101-A', title: 'Quiz 1', description: 'Quiz on linear equations.', dueDate: pastDate(7), maxPoints: 50, type: 'quiz', teacherEmail: 'teacher1@school.com' },
        { classKey: 'ENG101-A', title: 'Intro Essay', description: 'Write a 300-word introduction about yourself.', dueDate: pastDate(10), maxPoints: 30, type: 'homework', teacherEmail: 'teacher2@school.com' },

        // Recent past (some submitted, some not)
        { classKey: 'MATH101-A', title: 'Practice Problems Set 1', description: 'Practice with inequalities.', dueDate: pastDate(3), maxPoints: 30, type: 'homework', teacherEmail: 'teacher1@school.com' },
        { classKey: 'SCI101-A', title: 'Lab Safety Quiz', description: 'Safety procedures and protocols.', dueDate: pastDate(2), maxPoints: 20, type: 'quiz', teacherEmail: 'teacher3@school.com' },

        // Future assignments
        { classKey: 'MATH101-A', title: 'Chapter 3 Homework', description: 'Complete problems 1-25 from Chapter 3.', dueDate: futureDate(2), maxPoints: 50, type: 'homework', teacherEmail: 'teacher1@school.com' },
        { classKey: 'MATH101-A', title: 'Midterm Exam', description: 'Comprehensive exam covering Chapters 1-3.', dueDate: futureDate(10), maxPoints: 100, type: 'exam', teacherEmail: 'teacher1@school.com' },
        { classKey: 'ENG101-A', title: 'Essay: My Perspective', description: 'Write a 500-word essay on a topic of your choice.', dueDate: futureDate(7), maxPoints: 100, type: 'project', teacherEmail: 'teacher2@school.com' },
        { classKey: 'ENG101-A', title: 'Research Draft', description: 'Submit first draft of research paper.', dueDate: futureDate(14), maxPoints: 50, type: 'project', teacherEmail: 'teacher2@school.com' },
        { classKey: 'SCI101-A', title: 'Lab Report 1', description: 'Write up the results of the density experiment.', dueDate: futureDate(5), maxPoints: 50, type: 'homework', teacherEmail: 'teacher3@school.com' },
        { classKey: 'SCI101-A', title: 'Science Fair Project', description: 'Design and present a science project.', dueDate: futureDate(30), maxPoints: 200, type: 'project', teacherEmail: 'teacher3@school.com' },
        { classKey: 'PHY101-A', title: 'Mechanics Problem Set', description: 'Solve problems on Newton\'s laws.', dueDate: futureDate(4), maxPoints: 40, type: 'homework', teacherEmail: 'teacher3@school.com' },
        { classKey: 'CHE101-A', title: 'Periodic Table Quiz', description: 'Quiz on element properties.', dueDate: futureDate(3), maxPoints: 30, type: 'quiz', teacherEmail: 'teacher2@school.com' },
        { classKey: 'MATH201-A', title: 'Derivatives Worksheet', description: 'Practice differentiation rules.', dueDate: futureDate(6), maxPoints: 40, type: 'homework', teacherEmail: 'teacher1@school.com' },
    ];

    const assignmentRecords: Record<string, any> = {};
    for (const a of assignmentsData) {
        const key = `${a.classKey}:${a.title}`;
        assignmentRecords[key] = await prisma.assignment.create({
            data: {
                classId: classRecords[a.classKey].id,
                title: a.title,
                description: a.description,
                dueDate: a.dueDate,
                maxPoints: a.maxPoints,
                type: a.type,
                createdById: userRecords[a.teacherEmail].id,
            },
        });
    }
    console.log('  ✅ Assignments created');

    // ─── Submissions & Grades ────────────────────────────────
    // Week 1 Practice - all submitted and graded
    /*
    // Week 1 Practice - all submitted and graded
    const week1Assignment = assignmentRecords['MATH101-A:Week 1 Practice'];
    for (const email of ['student1@school.com', 'student2@school.com', 'student3@school.com', 'student4@school.com']) {
        // ...
    }
    // ... other assignments
    */
    console.log('  ✅ Submissions & Grades created');

    // ─── Files ───────────────────────────────────────────────
    const files = [
        { originalName: 'Syllabus_Spring2026.pdf', size: 245760, mimeType: 'application/pdf', uploaderEmail: 'teacher1@school.com', category: 'document' },
        { originalName: 'Chapter1_Notes.pdf', size: 524288, mimeType: 'application/pdf', uploaderEmail: 'teacher1@school.com', category: 'document' },
        { originalName: 'Lab_Manual.pdf', size: 1048576, mimeType: 'application/pdf', uploaderEmail: 'teacher3@school.com', category: 'document' },
        { originalName: 'Essay_Template.docx', size: 35840, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', uploaderEmail: 'teacher2@school.com', category: 'template' },
        { originalName: 'Project_Rubric.pdf', size: 122880, mimeType: 'application/pdf', uploaderEmail: 'teacher2@school.com', category: 'document' },
        { originalName: 'Study_Guide_Midterm.pdf', size: 786432, mimeType: 'application/pdf', uploaderEmail: 'teacher1@school.com', category: 'study' },
    ];

    for (const f of files) {
        await prisma.file.create({
            data: {
                originalName: f.originalName,
                filename: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                mimeType: f.mimeType,
                size: f.size,
                path: `/uploads/${f.originalName}`,
                uploaderId: userRecords[f.uploaderEmail].id,
                category: f.category,
            },
        });
    }
    console.log('  ✅ Files created');

    // ─── Attendance ──────────────────────────────────────────
    const attendanceDates = [pastDate(10), pastDate(7), pastDate(5), pastDate(3), pastDate(1)];
    const mathClass = classRecords['MATH101-A'];

    for (const date of attendanceDates) {
        const session = await prisma.attendanceSession.create({
            data: {
                classId: mathClass.id,
                date,
                createdById: userRecords['teacher1@school.com'].id,
            },
        });

        // Varying attendance patterns
        const patterns: Record<string, string[]> = {
            [pastDate(10).toISOString().split('T')[0]]: ['present', 'present', 'present', 'present'],
            [pastDate(7).toISOString().split('T')[0]]: ['present', 'present', 'absent', 'present'],
            [pastDate(5).toISOString().split('T')[0]]: ['present', 'late', 'present', 'present'],
            [pastDate(3).toISOString().split('T')[0]]: ['present', 'present', 'present', 'absent'],
            [pastDate(1).toISOString().split('T')[0]]: ['late', 'present', 'present', 'present'],
        };

        const dateKey = date.toISOString().split('T')[0];
        const statuses = patterns[dateKey] || ['present', 'present', 'present', 'present'];
        const studentEmails: string[] = [];
        // const studentEmails = ['student1@school.com', 'student2@school.com', 'student3@school.com', 'student4@school.com'];

        for (let i = 0; i < studentEmails.length; i++) {
            await prisma.attendanceRecord.create({
                data: {
                    sessionId: session.id,
                    studentId: userRecords[studentEmails[i]].id,
                    status: statuses[i],
                    markedById: userRecords['teacher1@school.com'].id,
                },
            });
        }
    }
    console.log('  ✅ Attendance records created');

    // ─── Audit Logs ──────────────────────────────────────────
    const auditLogs = [
        { action: 'user_login', actorId: userRecords['admin@school.com'].id, metadata: { ip: '127.0.0.1' } },
        { action: 'user_login', actorId: userRecords['teacher1@school.com'].id, metadata: { ip: '127.0.0.1' } },
        { action: 'create_channel', actorId: userRecords['admin@school.com'].id, targetId: generalChannel.id, metadata: { channelName: 'School Announcements' } },
        { action: 'send_message', actorId: userRecords['admin@school.com'].id, targetId: generalChannel.id, metadata: { preview: 'Welcome to School Hub' } },
        { action: 'create_assignment', actorId: userRecords['teacher1@school.com'].id, metadata: { title: 'Chapter 1 Homework' } },
        { action: 'grade_submission', actorId: userRecords['teacher1@school.com'].id, metadata: { score: 28, maxScore: 30 } },
        { action: 'upload_file', actorId: userRecords['teacher1@school.com'].id, metadata: { fileName: 'Syllabus_Spring2026.pdf' } },
        { action: 'create_class', actorId: userRecords['admin@school.com'].id, metadata: { course: 'MATH101', section: 'A' } },
    ];

    for (const log of auditLogs) {
        await prisma.auditLog.create({
            data: {
                action: log.action,
                actorId: log.actorId,
                targetId: log.targetId,
                metadata: log.metadata,
            },
        });
    }
    console.log('  ✅ Audit logs created');

    // ─── Summary ─────────────────────────────────────────────
    console.log('\n🎉 Seed completed successfully!\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📧 DEMO ACCOUNTS (password: Password123!)');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n👑 Admin:');
    console.log('   admin@school.com');
    console.log('\n👨‍🏫 Teachers:');
    console.log('   teacher1@school.com (Sarah Johnson)');
    console.log('   teacher2@school.com (Michael Chen)');
    console.log('   teacher3@school.com (Jennifer Martinez)');
    console.log('\n👨‍👩‍👧 Parents:');
    console.log('   parent1@school.com (David Williams)');
    console.log('   parent2@school.com (Emily Brown)');
    console.log('   parent3@school.com (Robert Davis)');
    // console.log('\n🎓 Students:');
    // console.log('   student1@school.com (Alex Williams)');
    // console.log('   student2@school.com (Maya Brown)');
    // console.log('   student3@school.com (Liam Davis)');
    // console.log('   student4@school.com (Sophia Miller)');
    // console.log('   student5@school.com (Ethan Wilson)');
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 DATA SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`   • Users: ${users.length}`);
    console.log(`   • Courses: ${courses.length}`);
    console.log(`   • Classes: ${classesData.length}`);
    console.log(`   • Enrollments: Multiple per class`);
    console.log(`   • Assignments: ${assignmentsData.length}`);
    console.log(`   • Messages: ${messages.length}`);
    console.log(`   • Channels: 4 (various types)`);
    console.log(`   • Files: ${files.length}`);
    console.log(`   • Attendance Sessions: ${attendanceDates.length}`);
    console.log(`   • Audit Logs: ${auditLogs.length}`);
    console.log('═══════════════════════════════════════════════════════════\n');
}

main()
    .then(async () => { await prisma.$disconnect(); })
    .catch(async (e) => {
        console.error('Seed error:', e);
        await prisma.$disconnect();
        process.exit(1);
    });
