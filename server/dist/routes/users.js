"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const db_1 = require("../utils/db");
const userRole_1 = require("../utils/userRole");
const router = (0, express_1.Router)();
const userApprovalSelect = {
    id: true,
    empId: true,
    name: true,
    designation: true,
    department: true,
    cellNo: true,
    email: true,
    role: true,
    isApproved: true,
    createdAt: true
};
router.use(auth_1.requireAdmin);
router.get('/pending', async (_req, res) => {
    const users = await db_1.prisma.user.findMany({
        where: { isApproved: false },
        orderBy: { createdAt: 'asc' },
        select: userApprovalSelect
    });
    return res.json({
        users: users.map((user) => ({
            ...user,
            role: (0, userRole_1.normalizeRole)(user.role)
        }))
    });
});
router.post('/:id/approve', async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        return res.status(400).json({ message: 'Invalid user id' });
    }
    const existing = await db_1.prisma.user.findUnique({
        where: { id },
        select: userApprovalSelect
    });
    if (!existing) {
        return res.status(404).json({ message: 'User not found' });
    }
    if ((0, userRole_1.normalizeRole)(existing.role) === 'ADMIN') {
        return res.status(400).json({ message: 'Cannot modify administrator accounts through this endpoint.' });
    }
    if (existing.isApproved) {
        return res.json({ user: { ...existing, role: (0, userRole_1.normalizeRole)(existing.role) } });
    }
    const updated = await db_1.prisma.user.update({
        where: { id },
        data: { isApproved: true },
        select: userApprovalSelect
    });
    return res.json({ user: { ...updated, role: (0, userRole_1.normalizeRole)(updated.role) } });
});
exports.default = router;
