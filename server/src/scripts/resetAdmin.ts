import bcrypt from 'bcryptjs';

import { prisma } from '../utils/db';

const ADMIN_EMP_ID = 'admin';
const ADMIN_PASSWORD = 'admin@456';

export const resetAdminUser = async () => {
  console.info('Clearing existing vouchers and users...');
  await prisma.voucherLine.deleteMany();
  await prisma.voucher.deleteMany();
  await prisma.user.deleteMany();

  console.info('Creating administrator account...');
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  await prisma.user.create({
    data: {
      empId: ADMIN_EMP_ID,
      name: 'Admin User',
      designation: 'System Administrator',
      department: 'Administration',
      cellNo: 'N/A',
      email: 'admin@example.com',
      passwordHash,
      role: 'ADMIN',
      isApproved: true
    }
  });

  console.info('Administrator account created successfully.');
};

if (require.main === module) {
  resetAdminUser()
    .catch((error) => {
      console.error('Failed to reset administrator user', error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
