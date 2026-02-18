const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.count();
        const courses = await prisma.course.count();
        const messages = await prisma.message.count();
        const files = await prisma.file.count();
        console.log('Database Status:');
        console.log('  Users:', users);
        console.log('  Courses:', courses);
        console.log('  Messages:', messages);
        console.log('  Files:', files);
        
        if (users === 0) {
            console.log('\nWARNING: No users found! Database may need seeding.');
        } else {
            console.log('\nDatabase has data. Checking recent users...');
            const recentUsers = await prisma.user.findMany({ take: 3, select: { email: true, status: true } });
            console.log('Recent users:', recentUsers);
        }
    } catch (error) {
        console.error('Database error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
