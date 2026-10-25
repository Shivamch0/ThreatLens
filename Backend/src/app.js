import express from 'express';
import cors from 'cors';
import { parseCookies } from './middleware/cookies.js';
import authRoutes from './routes/auth.routes.js';
import eventRoutes from './routes/event.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',').map((origin) => origin.trim()).filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(parseCookies);
app.get('/api/health', (_req, res) => res.json({ success: true, message: 'ThreatLens API is healthy' }));
app.use('/api/auth', authRoutes);
app.use('/api', eventRoutes);
app.use(errorHandler);

export default app;
