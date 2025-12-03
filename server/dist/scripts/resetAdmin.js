"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetAdminUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("../utils/db");
const ADMIN_EMP_ID = 'admin';
const ADMIN_PASSWORD = 'admin@456';
const resetAdminUser = async () => {
    console.info('Clearing existing vouchers and users...');
    await db_1.prisma.voucherLine.deleteMany();
    await db_1.prisma.voucher.deleteMany();
    await db_1.prisma.user.deleteMany();
    console.info('Creating administrator account...');
    const passwordHash = await bcryptjs_1.default.hash(ADMIN_PASSWORD, 10);
    await db_1.prisma.user.create({
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
exports.resetAdminUser = resetAdminUser;
if (require.main === module) {
    (0, exports.resetAdminUser)()
        .catch((error) => {
        console.error('Failed to reset administrator user', error);
        process.exitCode = 1;
    })
        .finally(async () => {
        await db_1.prisma.$disconnect();
    });
}
