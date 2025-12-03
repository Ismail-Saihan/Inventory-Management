"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = __importDefault(require("os"));
const app_1 = __importDefault(require("./app"));
const env_1 = require("./env");
const port = env_1.env.PORT;
const host = env_1.env.HOST;
const getLocalUrls = (listenHost, listenPort) => {
    if (listenHost !== '0.0.0.0' && listenHost !== '::') {
        return [`http://${listenHost}:${listenPort}`];
    }
    const interfaces = os_1.default.networkInterfaces();
    const urls = ['http://localhost:' + listenPort];
    for (const entries of Object.values(interfaces)) {
        if (!entries)
            continue;
        for (const entry of entries) {
            if (entry.family === 'IPv4' && !entry.internal) {
                urls.push(`http://${entry.address}:${listenPort}`);
            }
        }
    }
    return Array.from(new Set(urls));
};
app_1.default.listen(port, host, () => {
    const urls = getLocalUrls(host, port);
    console.log('🚀 Server ready on:');
    urls.forEach((url) => console.log(`   • ${url}`));
});
