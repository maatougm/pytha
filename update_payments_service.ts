import * as fs from 'fs';

let content = fs.readFileSync('server/src/payments/payments.service.ts', 'utf-8');

const verifyAccessMethod = `
  async verifyAccess(userId: string, studentId: string): Promise<boolean> {
    // Check if user is the student
    if (userId === studentId) return true;

    // Check if user is parent of student
    const parentLink = await this.prisma.parentStudent.findUnique({
      where: {
        parentId_studentId: {
          parentId: userId,
          studentId,
        },
      },
    });

    if (parentLink) return true;

    // Check if user is admin
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { userRoles: { include: { role: true } } },
    });

    return user?.userRoles.some((ur) => ur.role.name === 'admin') ?? false;
  }
}
`;

content = content.replace(/}\s*$/, verifyAccessMethod);

content = content.replace(
  `// Check if user is authorized (parent who paid or admin)
    if (payment.payerId !== userId && payment.studentId !== userId) {
      // TODO: Check if user is admin
      throw new BadRequestException('You are not authorized to view this receipt');
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
