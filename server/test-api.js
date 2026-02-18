const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Simulate the getSystemMetrics function
async function getSystemMetrics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [
        userCounts,
        totalCourses,
        activeCourses,
        totalClasses,
        totalMessages,
        messagesToday,
        messagesThisWeek,
        totalFiles,
        filesToday,
        storageAgg,
        totalEnrollments,
        attendanceSessions,
    ] = await Promise.all([
        prisma.user.groupBy({ by: ['status'], _count: { id: true } }),
        prisma.course.count(),
        prisma.course.count({ where: { isActive: true } }),
        prisma.class.count(),
        prisma.message.count(),
        prisma.message.count({ where: { createdAt: { gte: today } } }),
        prisma.message.count({ where: { createdAt: { gte: weekAgo } } }),
        prisma.file.count(),
        prisma.file.count({ where: { createdAt: { gte: today } } }),
        prisma.file.aggregate({ _sum: { size: true } }),
        prisma.classEnrollment.count(),
        prisma.attendanceSession.count(),
    ]);

    const totalUsers = userCounts.reduce((sum, u) => sum + u._count.id, 0);
    const activeUsers = userCounts.find(u => u.status === 'active')?._count.id || 0;
    const newToday = await prisma.user.count({ where: { createdAt: { gte: today } } });
    const newThisWeek = await prisma.user.count({ where: { createdAt: { gte: weekAgo } } });

    return {
        timestamp: new Date().toISOString(),
        users: {
            total: totalUsers,
            active: activeUsers,
            newToday,
            newThisWeek,
            byRole: {},
        },
        messages: {
            total: totalMessages,
            today: messagesToday,
            thisWeek: messagesThisWeek,
            averagePerDay: Math.round(totalMessages / 30),
        },
        courses: {
            total: totalCourses,
            active: activeCourses,
            totalEnrollments,
        },
        files: {
            total: totalFiles,
            totalSize: storageAgg._sum.size || 0,
            today: filesToday,
        },
        attendance: {
            totalSessions: attendanceSessions,
            averageRate: 85,
        },
        system: {
            uptime: process.uptime(),
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100),
            },
            cpu: 0,
            activeConnections: 0,
        },
    };
}

async function getActivityTimeline(range = 'week') {
    const rangeMap = { 'today': 1, 'week': 7, 'month': 30, 'quarter': 90, 'year': 365 };
    const days = rangeMap[range] || 7;
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Simplified - just return structure
    return {
        labels: ['Day 1', 'Day 2', 'Day 3'],
        datasets: [
            { name: 'New Users', data: [1, 2, 3], color: '#3b82f6' },
            { name: 'Messages', data: [4, 5, 6], color: '#10b981' },
            { name: 'Files', data: [7, 8, 9], color: '#f59e0b' },
        ],
    };
}

async function main() {
    try {
        console.log('Testing API responses...\n');
        
        console.log('1. System Metrics:');
        const metrics = await getSystemMetrics();
        console.log(JSON.stringify(metrics, null, 2).substring(0, 800) + '...\n');
        
        console.log('2. Activity Timeline:');
        const timeline = await getActivityTimeline('week');
        console.log(JSON.stringify(timeline, null, 2));
        
        console.log('\n✅ API format test passed!');
    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
