import os from 'os';

import app from './app';
import { env } from './env';

const port = env.PORT;
const host = env.HOST;

const getLocalUrls = (listenHost: string, listenPort: number) => {
  if (listenHost !== '0.0.0.0' && listenHost !== '::') {
    return [`http://${listenHost}:${listenPort}`];
  }

  const interfaces = os.networkInterfaces();
  const urls: string[] = ['http://localhost:' + listenPort];
  for (const entries of Object.values(interfaces)) {
    if (!entries) continue;
    for (const entry of entries) {
      if (entry.family === 'IPv4' && !entry.internal) {
        urls.push(`http://${entry.address}:${listenPort}`);
      }
    }
  }
  return Array.from(new Set(urls));
};

app.listen(port, host, () => {
  const urls = getLocalUrls(host, port);
  console.log('🚀 Server ready on:');
  urls.forEach((url) => console.log(`   • ${url}`));
});
