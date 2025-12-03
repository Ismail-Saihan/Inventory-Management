"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../env");
const db_1 = require("../utils/db");
const userRole_1 = require("../utils/userRole");
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Missing authorization header' });
        }
        const token = authHeader.substring('Bearer '.length);
        const payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        const user = await db_1.prisma.user.findUnique({
            where: { id: payload.userId },
            select: {
                id: true,
                empId: true,
                name: true,
                designation: true,
                department: true,
                cellNo: true,
                email: true,
                role: true,
                isApproved: true
            }
        });
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }
        req.user = {
            ...user,
            role: (0, userRole_1.normalizeRole)(user.role)
        };
        next();
    }
    catch (error) {
        console.error('Authentication error', error);
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};
exports.authenticate = authenticate;
const requireAdmin = (req, res, next) => {
    const authRequest = req;
    if (!authRequest.user || authRequest.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    return next();
};
exports.requireAdmin = requireAdmin;
