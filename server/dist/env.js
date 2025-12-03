"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isProduction = exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'test', 'production']).default('development'),
    PORT: zod_1.z.coerce.number().default(4000),
    HOST: zod_1.z.string().default('0.0.0.0'),
    JWT_SECRET: zod_1.z.string().min(10, 'JWT_SECRET must be at least 10 characters'),
    DATABASE_URL: zod_1.z.string().default('file:./dev.db')
});
const rawEnv = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    HOST: process.env.HOST,
    JWT_SECRET: process.env.JWT_SECRET ?? 'change-me-in-production',
    DATABASE_URL: process.env.DATABASE_URL
};
const parsed = envSchema.safeParse(rawEnv);
if (!parsed.success) {
    console.error('❌ Invalid environment configuration', parsed.error.flatten().fieldErrors);
    process.exit(1);
}
exports.env = parsed.data;
exports.isProduction = exports.env.NODE_ENV === 'production';
