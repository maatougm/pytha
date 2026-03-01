import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

function generateSecurePassword(): string {
    const randomBytes = crypto.randomBytes(16);
    return randomBytes.toString('base64url').slice(0, 20) + 'Aa1!';
}

const SEED_PASSWORD = process.env.SEED_PASSWORD || generateSecurePassword();

async function main() {
    console.log('🌱 Creating NEW demo data...\n');

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

    // ─── Users (NEW NAMES) ───────────────────────────────────
    const passwordHash = await bcrypt.hash(SEED_PASSWORD, 12);
    
    if (process.env.NODE_ENV !== 'production') {
        console.log(`  🔐 New Seed password: ${SEED_PASSWORD}`);
        console.log('  ⚠️  Save this password - it was randomly generated!\n');
    }

    const users = [
        // Admin
        { email: 'admin@academy.edu', firstName: 'Principal', lastName: 'Thompson', role: 'admin' },

        // Teachers (NEW NAMES)
        { email: 'j.rodriguez@academy.edu', firstName: 'Jessica', lastName: 'Rodriguez', role: 'teacher' },
        { email: 'k.patel@academy.edu', firstName: 'Kevin', lastName: 'Patel', role: 'teacher' },
        { email: 'a.kim@academy.edu', firstName: 'Amanda', lastName: 'Kim', role: 'teacher' },
        { email: 'm.oconnor@academy.edu', firstName: 'Marcus', lastName: 'OConnor', role: 'teacher' },

        // Parents (NEW NAMES)
        { email: 'l.garcia@email.com', firstName: 'Laura', lastName: 'Garcia', role: 'parent' },
        { email: 'j.smith@email.com', firstName: 'James', lastName: 'Smith', role: 'parent' },
        { email: 's.johnson@email.com', firstName: 'Sarah', lastName: 'Johnson', role: 'parent' },
        { email: 'r.chen@email.com', firstName: 'Richard', lastName: 'Chen', role: 'parent' },

        // Students (NEW NAMES)
        { email: 'carlos.garcia@student.academy.edu', firstName: 'Carlos', lastName: 'Garcia', role: 'student' },
        { email: 'emma.smith@student.academy.edu', firstName: 'Emma', lastName: 'Smith', role: 'student' },
        { email: 'noah.johnson@student.academy.edu', firstName: 'Noah', lastName: 'Johnson', role: 'student' },
        { email: 'lily.chen@student.academy.edu', firstName: 'Lily', lastName: 'Chen', role: 'student' },
        { email: 'james.wilson@student.academy.edu', firstName: 'James', lastName: 'Wilson', role: 'student' },
        { email: 'olivia.brown@student.academy.edu', firstName: 'Olivia', lastName: 'Brown', role: 'student' },
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
    console.log('  ✅ Users created (NEW names)');

    // ─── Parent-Student Links ────────────────────────────────
    const parentLinks = [
        { parent: 'l.garcia@email.com', student: 'carlos.garcia@student.academy.edu' },
        { parent: 'j.smith@email.com', student: 'emma.smith@student.academy.edu' },
        { parent: 's.johnson@email.com', student: 'noah.johnson@student.academy.edu' },
        { parent: 'r.chen@email.com', student: 'lily.chen@student.academy.edu' },
    ];

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
            name: '📢 Academy Announcements',
            createdBy: userRecords['admin@academy.edu'].id,
            members: {
                create: Object.values(userRecords).map((u: any) => ({
                    userId: u.id,
                    role: u.email === 'admin@academy.edu' ? 'owner' : 'member',
                })),
            },
        },
    });

    const teacherChannel = await prisma.channel.create({
        data: {
            type: 'teacher_admin',
            name: '👩‍🏫 Faculty Lounge',
            createdBy: userRecords['admin@academy.edu'].id,
            members: {
                create: [
                    { userId: userRecords['admin@academy.edu'].id, role: 'owner' },
                    { userId: userRecords['j.rodriguez@academy.edu'].id, role: 'member' },
                    { userId: userRecords['k.patel@academy.edu'].id, role: 'member' },
                    { userId: userRecords['a.kim@academy.edu'].id, role: 'member' },
                    { userId: userRecords['m.oconnor@academy.edu'].id, role: 'member' },
                ],
            },
        },
    });

    const parentTeacherChannel = await prisma.channel.create({
        data: {
            type: 'teacher_parent',
            name: '👨‍👩‍👧 Parent-Teacher Connection',
            createdBy: userRecords['j.rodriguez@academy.edu'].id,
            members: {
                create: [
                    { userId: userRecords['j.rodriguez@academy.edu'].id, role: 'owner' },
                    { userId: userRecords['k.patel@academy.edu'].id, role: 'member' },
                    { userId: userRecords['l.garcia@email.com'].id, role: 'member' },
                    { userId: userRecords['j.smith@email.com'].id, role: 'member' },
                    { userId: userRecords['s.johnson@email.com'].id, role: 'member' },
                ],
            },
        },
    });

    const bioClassChannel = await prisma.channel.create({
        data: {
            type: 'class_broadcast',
            name: '🔬 BIO201 - Advanced Biology',
            createdBy: userRecords['a.kim@academy.edu'].id,
            members: {
                create: [
                    { userId: userRecords['a.kim@academy.edu'].id, role: 'owner' },
                    { userId: userRecords['carlos.garcia@student.academy.edu'].id, role: 'member' },
                    { userId: userRecords['emma.smith@student.academy.edu'].id, role: 'member' },
                    { userId: userRecords['noah.johnson@student.academy.edu'].id, role: 'member' },
                    { userId: userRecords['lily.chen@student.academy.edu'].id, role: 'member' },
                ],
            },
        },
    });
    console.log('  ✅ Channels created');

    // ─── Messages (NEW CONVERSATIONS) ────────────────────────
    const now = new Date();
    const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000);
    const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

    const messages = [
        // General Channel
        { channelId: generalChannel.id, senderId: userRecords['admin@academy.edu'].id, content: 'Welcome to Academy Portal! 🎓 This is our official communication platform.', createdAt: daysAgo(10) },
        { channelId: generalChannel.id, senderId: userRecords['j.rodriguez@academy.edu'].id, content: 'Excited to use this for our classes!', createdAt: daysAgo(10) },
        { channelId: generalChannel.id, senderId: userRecords['admin@academy.edu'].id, content: '📅 Reminder: Spring break starts March 20th. No classes that week!', createdAt: daysAgo(5) },
        { channelId: generalChannel.id, senderId: userRecords['l.garcia@email.com'].id, content: 'Will there be make-up sessions for labs during break?', createdAt: daysAgo(4) },
        { channelId: generalChannel.id, senderId: userRecords['admin@academy.edu'].id, content: 'No make-up sessions scheduled, but optional study groups will be available.', createdAt: daysAgo(4) },
        { channelId: generalChannel.id, senderId: userRecords['admin@academy.edu'].id, content: '🏆 Congratulations to our debate team for winning regionals!', createdAt: hoursAgo(8) },

        // Teacher Channel
        { channelId: teacherChannel.id, senderId: userRecords['j.rodriguez@academy.edu'].id, content: 'Has everyone submitted their curriculum updates?', createdAt: daysAgo(3) },
        { channelId: teacherChannel.id, senderId: userRecords['k.patel@academy.edu'].id, content: 'Math department is almost done. Just finishing the calculus modules.', createdAt: daysAgo(3) },
        { channelId: teacherChannel.id, senderId: userRecords['a.kim@academy.edu'].id, content: 'Science labs need new equipment orders. I will send the list by Friday.', createdAt: daysAgo(2) },
        { channelId: teacherChannel.id, senderId: userRecords['m.oconnor@academy.edu'].id, content: 'English department would like to coordinate with History for a joint project.', createdAt: hoursAgo(20) },

        // Parent-Teacher Channel
        { channelId: parentTeacherChannel.id, senderId: userRecords['j.rodriguez@academy.edu'].id, content: 'Hello parents! Feel free to reach out anytime.', createdAt: daysAgo(7) },
        { channelId: parentTeacherChannel.id, senderId: userRecords['l.garcia@email.com'].id, content: 'Thank you Ms. Rodriguez. How is Carlos doing in class?', createdAt: daysAgo(6) },
        { channelId: parentTeacherChannel.id, senderId: userRecords['j.rodriguez@academy.edu'].id, content: 'Carlos is doing excellent work! Very engaged in discussions.', createdAt: daysAgo(6) },
        { channelId: parentTeacherChannel.id, senderId: userRecords['j.smith@email.com'].id, content: 'When will the midterm grades be posted?', createdAt: daysAgo(3) },
        { channelId: parentTeacherChannel.id, senderId: userRecords['k.patel@academy.edu'].id, content: 'They will be available by this Friday evening.', createdAt: daysAgo(3) },

        // Biology Class Channel
        { channelId: bioClassChannel.id, senderId: userRecords['carlos.garcia@student.academy.edu'].id, content: 'Will we be dissecting specimens next week?', createdAt: hoursAgo(20) },
        { channelId: bioClassChannel.id, senderId: userRecords['a.kim@academy.edu'].id, content: 'Yes! We start with the frog dissection on Tuesday. Bring your lab notebooks.', createdAt: hoursAgo(19) },
        { channelId: bioClassChannel.id, senderId: userRecords['emma.smith@student.academy.edu'].id, content: 'Do we need to bring our own safety goggles?', createdAt: hoursAgo(15) },
        { channelId: bioClassChannel.id, senderId: userRecords['a.kim@academy.edu'].id, content: 'No, the school provides them. Just bring your enthusiasm! 🔬', createdAt: hoursAgo(14) },
        { channelId: bioClassChannel.id, senderId: userRecords['noah.johnson@student.academy.edu'].id, content: 'Can\'t wait! Biology is my favorite subject.', createdAt: hoursAgo(5) },
    ];

    for (const msg of messages) {
        await prisma.message.create({ data: msg });
    }
    console.log('  ✅ Messages created (NEW conversations)');

    // ─── Courses (NEW COURSES) ───────────────────────────────
    const courses = [
        { code: 'BIO201', name: 'Advanced Biology', department: 'Science', credits: 4, description: 'In-depth study of cellular biology, genetics, and ecology with laboratory components.' },
        { code: 'CHEM301', name: 'Organic Chemistry', department: 'Science', credits: 4, description: 'Structure, properties, and reactions of organic compounds.' },
        { code: 'CALC201', name: 'Calculus II', department: 'Mathematics', credits: 4, description: 'Integration techniques, series, and multivariable calculus.' },
        { code: 'LIT205', name: 'American Literature', department: 'English', credits: 3, description: 'Survey of American literature from colonial to contemporary periods.' },
        { code: 'HIST301', name: 'World History II', department: 'History', credits: 3, description: 'Major global events from 1500 to present day.' },
        { code: 'SPAN101', name: 'Spanish I', department: 'Languages', credits: 3, description: 'Introduction to Spanish language and Hispanic cultures.' },
        { code: 'CS101', name: 'Computer Science Fundamentals', department: 'Technology', credits: 3, description: 'Programming basics, algorithms, and problem-solving.' },
        { code: 'ART150', name: 'Digital Photography', department: 'Arts', credits: 2, description: 'Digital camera techniques and photo editing fundamentals.' },
        { code: 'PE101', name: 'Health & Fitness', department: 'Physical Education', credits: 1, description: 'Personal fitness, nutrition, and wellness strategies.' },
    ];

    const courseRecords: Record<string, any> = {};
    for (const c of courses) {
        courseRecords[c.code] = await prisma.course.create({ data: c });
    }
    console.log('  ✅ Courses created (NEW courses)');

    // ─── Classes ─────────────────────────────────────────────
    const classesData = [
        { courseCode: 'BIO201', teacherEmail: 'a.kim@academy.edu', term: 'Spring 2026', section: 'A', room: 'Lab 201', maxStudents: 24 },
        { courseCode: 'BIO201', teacherEmail: 'a.kim@academy.edu', term: 'Spring 2026', section: 'B', room: 'Lab 202', maxStudents: 24 },
        { courseCode: 'CHEM301', teacherEmail: 'k.patel@academy.edu', term: 'Spring 2026', section: 'A', room: 'Lab 301', maxStudents: 20 },
        { courseCode: 'CALC201', teacherEmail: 'k.patel@academy.edu', term: 'Spring 2026', section: 'A', room: 'Room 105', maxStudents: 30 },
        { courseCode: 'LIT205', teacherEmail: 'm.oconnor@academy.edu', term: 'Spring 2026', section: 'A', room: 'Room 301', maxStudents: 28 },
        { courseCode: 'HIST301', teacherEmail: 'j.rodriguez@academy.edu', term: 'Spring 2026', section: 'A', room: 'Room 205', maxStudents: 32 },
        { courseCode: 'SPAN101', teacherEmail: 'j.rodriguez@academy.edu', term: 'Spring 2026', section: 'A', room: 'Room 102', maxStudents: 25 },
        { courseCode: 'CS101', teacherEmail: 'k.patel@academy.edu', term: 'Spring 2026', section: 'A', room: 'Computer Lab', maxStudents: 22 },
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
        { classKey: 'BIO201-A', dayOfWeek: 1, startTime: '09:00', endTime: '11:00' },
        { classKey: 'BIO201-A', dayOfWeek: 3, startTime: '09:00', endTime: '11:00' },
        { classKey: 'BIO201-B', dayOfWeek: 2, startTime: '09:00', endTime: '11:00' },
        { classKey: 'BIO201-B', dayOfWeek: 4, startTime: '09:00', endTime: '11:00' },
        { classKey: 'CHEM301-A', dayOfWeek: 1, startTime: '13:00', endTime: '15:00' },
        { classKey: 'CHEM301-A', dayOfWeek: 3, startTime: '13:00', endTime: '15:00' },
        { classKey: 'CALC201-A', dayOfWeek: 2, startTime: '10:00', endTime: '11:30' },
        { classKey: 'CALC201-A', dayOfWeek: 4, startTime: '10:00', endTime: '11:30' },
        { classKey: 'LIT205-A', dayOfWeek: 1, startTime: '11:00', endTime: '12:30' },
        { classKey: 'LIT205-A', dayOfWeek: 3, startTime: '11:00', endTime: '12:30' },
        { classKey: 'HIST301-A', dayOfWeek: 2, startTime: '13:00', endTime: '14:30' },
        { classKey: 'HIST301-A', dayOfWeek: 4, startTime: '13:00', endTime: '14:30' },
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
    const enrollments = [
        { classKey: 'BIO201-A', studentEmails: ['carlos.garcia@student.academy.edu', 'emma.smith@student.academy.edu', 'noah.johnson@student.academy.edu'] },
        { classKey: 'CALC201-A', studentEmails: ['carlos.garcia@student.academy.edu', 'lily.chen@student.academy.edu', 'james.wilson@student.academy.edu'] },
        { classKey: 'LIT205-A', studentEmails: ['emma.smith@student.academy.edu', 'noah.johnson@student.academy.edu', 'olivia.brown@student.academy.edu'] },
        { classKey: 'HIST301-A', studentEmails: ['lily.chen@student.academy.edu', 'james.wilson@student.academy.edu', 'olivia.brown@student.academy.edu'] },
        { classKey: 'CS101-A', studentEmails: ['noah.johnson@student.academy.edu', 'lily.chen@student.academy.edu', 'carlos.garcia@student.academy.edu'] },
    ];

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

    // ─── Assignments (NEW ASSIGNMENTS) ───────────────────────
    const futureDate = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const pastDate = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const assignmentsData = [
        { classKey: 'BIO201-A', title: 'Cell Structure Lab Report', description: 'Document observations from microscope lab.', dueDate: pastDate(10), maxPoints: 50, type: 'homework', teacherEmail: 'a.kim@academy.edu' },
        { classKey: 'BIO201-A', title: 'Genetics Quiz', description: 'Mendelian genetics and Punnett squares.', dueDate: pastDate(5), maxPoints: 30, type: 'quiz', teacherEmail: 'a.kim@academy.edu' },
        { classKey: 'CALC201-A', title: 'Integration Practice', description: 'Problems 1-30 from Chapter 7.', dueDate: pastDate(7), maxPoints: 40, type: 'homework', teacherEmail: 'k.patel@academy.edu' },
        { classKey: 'LIT205-A', title: 'Hemingway Analysis', description: '500-word essay on The Old Man and the Sea.', dueDate: pastDate(3), maxPoints: 100, type: 'project', teacherEmail: 'm.oconnor@academy.edu' },
        { classKey: 'BIO201-A', title: 'Frog Dissection Report', description: 'Detailed report on anatomy observations.', dueDate: futureDate(3), maxPoints: 75, type: 'project', teacherEmail: 'a.kim@academy.edu' },
        { classKey: 'CALC201-A', title: 'Series Convergence Quiz', description: 'Test on convergence tests and series sums.', dueDate: futureDate(5), maxPoints: 50, type: 'quiz', teacherEmail: 'k.patel@academy.edu' },
        { classKey: 'HIST301-A', title: 'WWII Research Paper', description: '1500-word paper on a WWII topic of choice.', dueDate: futureDate(14), maxPoints: 150, type: 'project', teacherEmail: 'j.rodriguez@academy.edu' },
        { classKey: 'CS101-A', title: 'Python Programming Assignment', description: 'Create a simple calculator program.', dueDate: futureDate(2), maxPoints: 50, type: 'homework', teacherEmail: 'k.patel@academy.edu' },
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
    const cellBioAssignment = assignmentRecords['BIO201-A:Cell Structure Lab Report'];
    for (const email of ['carlos.garcia@student.academy.edu', 'emma.smith@student.academy.edu', 'noah.johnson@student.academy.edu']) {
        const student = userRecords[email];
        if (student) {
            const gradePoints = Math.floor(Math.random() * 10) + 40; // 40-50 points
            await prisma.submission.create({
                data: {
                    assignmentId: cellBioAssignment.id,
                    studentId: student.id,
                    content: "Lab report submitted",
                    grade: {
                        create: {
                            score: gradePoints,
                            maxScore: cellBioAssignment.maxPoints,
                            feedback: "Excellent work! Great attention to detail.",
                            assignmentId: cellBioAssignment.id,
                            studentId: student.id,
                            gradedById: userRecords['a.kim@academy.edu'].id,
                        }
                    }
                }
            });
        }
    }
    console.log('  ✅ Submissions & Grades created');

    // ─── Files ───────────────────────────────────────────────
    const files = [
        { originalName: 'Academy_Syllabus_2026.pdf', size: 312000, mimeType: 'application/pdf', uploaderEmail: 'admin@academy.edu', category: 'document' },
        { originalName: 'Biology_Lab_Manual.pdf', size: 850000, mimeType: 'application/pdf', uploaderEmail: 'a.kim@academy.edu', category: 'document' },
        { originalName: 'Calculus_Formula_Sheet.pdf', size: 180000, mimeType: 'application/pdf', uploaderEmail: 'k.patel@academy.edu', category: 'study' },
        { originalName: 'Essay_Guidelines.docx', size: 42000, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', uploaderEmail: 'm.oconnor@academy.edu', category: 'template' },
        { originalName: 'Spring_Break_Assignment.pdf', size: 95000, mimeType: 'application/pdf', uploaderEmail: 'j.rodriguez@academy.edu', category: 'document' },
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
    const bioClass = classRecords['BIO201-A'];

    for (const date of attendanceDates) {
        const session = await prisma.attendanceSession.create({
            data: {
                classId: bioClass.id,
                date,
                createdById: userRecords['a.kim@academy.edu'].id,
            },
        });

        const patterns: Record<string, string[]> = {
            [pastDate(10).toISOString().split('T')[0]]: ['present', 'present', 'present'],
            [pastDate(7).toISOString().split('T')[0]]: ['present', 'late', 'present'],
            [pastDate(5).toISOString().split('T')[0]]: ['present', 'present', 'absent'],
            [pastDate(3).toISOString().split('T')[0]]: ['present', 'present', 'present'],
            [pastDate(1).toISOString().split('T')[0]]: ['late', 'present', 'present'],
        };

        const dateKey = date.toISOString().split('T')[0];
        const statuses = patterns[dateKey] || ['present', 'present', 'present'];
        const studentEmails = ['carlos.garcia@student.academy.edu', 'emma.smith@student.academy.edu', 'noah.johnson@student.academy.edu'];

        for (let i = 0; i < studentEmails.length; i++) {
            await prisma.attendanceRecord.create({
                data: {
                    sessionId: session.id,
                    studentId: userRecords[studentEmails[i]].id,
                    status: statuses[i],
                    markedById: userRecords['a.kim@academy.edu'].id,
                },
            });
        }
    }
    console.log('  ✅ Attendance records created');

    // ─── Audit Logs ──────────────────────────────────────────
    const auditLogs = [
        { action: 'user_login', actorId: userRecords['admin@academy.edu'].id, metadata: { ip: '127.0.0.1' } },
        { action: 'user_login', actorId: userRecords['j.rodriguez@academy.edu'].id, metadata: { ip: '127.0.0.1' } },
        { action: 'create_channel', actorId: userRecords['admin@academy.edu'].id, targetId: generalChannel.id, metadata: { channelName: 'Academy Announcements' } },
        { action: 'send_message', actorId: userRecords['admin@academy.edu'].id, targetId: generalChannel.id, metadata: { preview: 'Welcome to Academy Portal' } },
        { action: 'create_assignment', actorId: userRecords['a.kim@academy.edu'].id, metadata: { title: 'Cell Structure Lab Report' } },
        { action: 'upload_file', actorId: userRecords['a.kim@academy.edu'].id, metadata: { fileName: 'Biology_Lab_Manual.pdf' } },
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
    console.log('\n🎉 NEW demo data created successfully!\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📧 NEW DEMO ACCOUNTS');
    console.log('═══════════════════════════════════════════════════════════');
    if (process.env.NODE_ENV !== 'production') {
        console.log(`🔐 Password: ${SEED_PASSWORD}`);
        console.log('⚠️  Save this password - it was randomly generated!\n');
    }
    console.log('\n👑 Admin:');
    console.log('   admin@academy.edu (Principal Thompson)');
    console.log('\n👨‍🏫 Teachers:');
    console.log('   j.rodriguez@academy.edu (Jessica Rodriguez)');
    console.log('   k.patel@academy.edu (Kevin Patel)');
    console.log('   a.kim@academy.edu (Amanda Kim)');
    console.log('   m.oconnor@academy.edu (Marcus OConnor)');
    console.log('\n👨‍👩‍👧 Parents:');
    console.log('   l.garcia@email.com (Laura Garcia)');
    console.log('   j.smith@email.com (James Smith)');
    console.log('   s.johnson@email.com (Sarah Johnson)');
    console.log('   r.chen@email.com (Richard Chen)');
    console.log('\n🎓 Students:');
    console.log('   carlos.garcia@student.academy.edu');
    console.log('   emma.smith@student.academy.edu');
    console.log('   noah.johnson@student.academy.edu');
    console.log('   lily.chen@student.academy.edu');
    console.log('   james.wilson@student.academy.edu');
    console.log('   olivia.brown@student.academy.edu');
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 NEW DATA SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`   • Users: ${users.length}`);
    console.log(`   • Courses: ${courses.length} (NEW courses like Biology, Organic Chemistry)`);
    console.log(`   • Classes: ${classesData.length}`);
    console.log(`   • Messages: ${messages.length} (NEW conversations)`);
    console.log(`   • Channels: 4 (NEW names)`);
    console.log(`   • Assignments: ${assignmentsData.length}`);
    console.log('═══════════════════════════════════════════════════════════\n');
}

main()
    .then(async () => { await prisma.$disconnect(); })
    .catch(async (e) => {
        console.error('Seed error:', e);
        await prisma.$disconnect();
        process.exit(1);
    });
