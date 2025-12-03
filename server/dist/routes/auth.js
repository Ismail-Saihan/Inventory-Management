"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const env_1 = require("../env");
const auth_1 = require("../middleware/auth");
const db_1 = require("../utils/db");
const userRole_1 = require("../utils/userRole");
const router = (0, express_1.Router)();
const userProfileSelect = {
    id: true,
    empId: true,
    name: true,
    designation: true,
    department: true,
    cellNo: true,
    email: true,
    role: true,
    isApproved: true,
    createdAt: true,
    updatedAt: true
};
const registerSchema = zod_1.z.object({
    empId: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    password: zod_1.z.string().min(8),
    designation: zod_1.z.string().min(1),
    department: zod_1.z.string().min(1),
    cellNo: zod_1.z.string().min(4),
    email: zod_1.z.string().email().optional()
});
const loginSchema = zod_1.z.object({
    empId: zod_1.z.string().min(1),
    password: zod_1.z.string().min(1)
});
const sanitizeUser = (user) => ({
    id: user.id,
    empId: user.empId,
    name: user.name,
    designation: user.designation,
    department: user.department,
    cellNo: user.cellNo,
    email: user.email,
    role: user.role,
    isApproved: user.isApproved,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
});
const createToken = (userId) => jsonwebtoken_1.default.sign({ userId }, env_1.env.JWT_SECRET, { expiresIn: '12h' });
const forgotPasswordSchema = zod_1.z.object({
    empId: zod_1.z.string().min(1),
    cellNo: zod_1.z.string().min(4),
    newPassword: zod_1.z.string().min(8)
});
router.post('/register', async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: 'Invalid input', errors: parsed.error.flatten() });
    }
    const { empId, email, password, ...rest } = parsed.data;
    const existingUser = await db_1.prisma.user.findFirst({
        where: {
            OR: email ? [{ empId }, { email }] : [{ empId }]
        }
    });
    if (existingUser) {
        return res.status(409).json({ message: 'User already exists' });
    }
    const passwordHash = await bcryptjs_1.default.hash(password, 10);
    await db_1.prisma.user.create({
        data: {
            empId,
            email,
            passwordHash,
            role: 'USER',
            isApproved: false,
            ...rest
        }
    });
    return res
        .status(201)
        .json({ message: 'Registration received. An administrator will review your account shortly.' });
});
router.post('/login', async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: 'Invalid input', errors: parsed.error.flatten() });
    }
    const { empId, password } = parsed.data;
    const user = await db_1.prisma.user.findUnique({
        where: { empId },
        select: {
            ...userProfileSelect,
            passwordHash: true
        }
    });
    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    const passwordMatches = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!passwordMatches) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (!user.isApproved) {
        return res
            .status(403)
            .json({ message: 'Your account is awaiting administrator approval. Please try again later.' });
    }
    const token = createToken(user.id);
    return res.json({ token, user: sanitizeUser({ ...user, role: (0, userRole_1.normalizeRole)(user.role) }) });
});
router.get('/me', auth_1.authenticate, async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const user = await db_1.prisma.user.findUnique({
        where: { id: req.user.id },
        select: userProfileSelect
    });
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    return res.json({ user: { ...user, role: (0, userRole_1.normalizeRole)(user.role) } });
});
router.post('/forgot-password', async (req, res) => {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: 'Invalid input', errors: parsed.error.flatten() });
    }
    const { empId, cellNo, newPassword } = parsed.data;
    const user = await db_1.prisma.user.findUnique({ where: { empId } });
    if (!user || user.cellNo !== cellNo) {
        return res.status(400).json({ message: 'Employee details did not match our records.' });
    }
    const passwordHash = await bcryptjs_1.default.hash(newPassword, 10);
    await db_1.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash }
    });
    return res.json({ message: 'Password updated successfully. You can now log in with your new password.' });
});
exports.default = router;
