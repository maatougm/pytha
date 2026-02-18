const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDashboard() {
  try {
    console.log('Testing dashboard queries...\n');
    
    // Test user counts
    console.log('1. Testing user counts...');
    const userCounts = await prisma.user.groupBy({
      by: ['status'],
      _count: { id: true },
    });
    console.log('   User counts:', userCounts);
    
    // Test message count
    console.log('\n2. Testing message count...');
    const msgCount = await prisma.message.count();
    console.log('   Messages:', msgCount);
    
    // Test raw query for timeline
    console.log('\n3. Testing timeline query...');
    try {
      const result = await prisma.$queryRaw`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM messages
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date
      `;
      console.log('   Timeline data:', result);
    } catch (e) {
      console.error('   Timeline query failed:', e.message);
    }
    
    // Test audit logs
    console.log('\n4. Testing audit logs...');
    const auditLogs = await prisma.auditLog.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
    });
    console.log('   Recent audit logs:', auditLogs.length);
    
    console.log('\n✅ All queries completed!');
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    console.error(err.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testDashboard();
