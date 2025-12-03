import cors from 'cors';
import express from 'express';

import { env } from './env';
import authRoutes from './routes/auth';
import voucherRoutes from './routes/vouchers';
import userRoutes from './routes/users';
import { authenticate } from './middleware/auth';

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req: express.Request, res: express.Response) => {
  res.json({ status: 'ok', version: '0.1.0' });
});

app.use('/auth', authRoutes);
app.use('/vouchers', authenticate, voucherRoutes);
app.use('/users', authenticate, userRoutes);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

export default app;
