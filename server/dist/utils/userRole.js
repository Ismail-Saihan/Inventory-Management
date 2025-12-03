"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeRole = void 0;
const normalizeRole = (role) => role === 'ADMIN' ? 'ADMIN' : 'USER';
exports.normalizeRole = normalizeRole;
