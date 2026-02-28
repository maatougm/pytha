import * as fs from 'fs';

let content = fs.readFileSync('server/src/payments/payments.service.ts', 'utf-8');

content = content.replace(
  `// Check if user is authorized (parent who paid, student, or admin)
    if (payment.payerId !== userId && payment.studentId !== userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { userRoles: { include: { role: true } } },
      });
      const isAdmin = user?.userRoles.some((ur) => ur.role.name === 'admin') ?? false;

      if (!isAdmin) {
        throw new BadRequestException('You are not authorized to view this receipt');
      }
    }`,
  `// Check if user is authorized (parent who paid, student, or admin)
    if (payment.payerId !== userId && payment.studentId !== userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { userRoles: { include: { role: true } } },
      });
      const isAdmin = user?.userRoles.some((ur) => ur.role.name === 'admin') ?? false;

      if (!isAdmin) {
        throw new BadRequestException('You are not authorized to view this receipt');
      }
    }`
);

fs.writeFileSync('server/src/payments/payments.service.ts', content);
