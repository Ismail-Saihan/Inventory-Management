"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("./routes/auth"));
const vouchers_1 = __importDefault(require("./routes/vouchers"));
const users_1 = __importDefault(require("./routes/users"));
const auth_2 = require("./middleware/auth");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '1mb' }));
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', version: '0.1.0' });
});
app.use('/auth', auth_1.default);
app.use('/vouchers', auth_2.authenticate, vouchers_1.default);
app.use('/users', auth_2.authenticate, users_1.default);
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
});
exports.default = app;
