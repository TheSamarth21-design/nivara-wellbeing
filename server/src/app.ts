import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { authMiddleware } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';

import { authRouter } from './routes/auth.js';
import { profileRouter } from './routes/profile.js';
import { checkinsRouter } from './routes/checkins.js';
import { companionRouter } from './routes/companion.js';
import { twinRouter } from './routes/twin.js';
import { simulatorRouter } from './routes/simulator.js';
import { supportRouter } from './routes/support.js';
import { counsellorRouter } from './routes/counsellor.js';
import { radarRouter } from './routes/radar.js';
import { privacyRouter } from './routes/privacy.js';
import { safetyRouter } from './routes/safety.js';
import { adminRouter } from './routes/admin.js';

export const app = express();

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false
}));

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-wellbeing-id']
}));

app.use(express.json());

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);

// Mount Public Routes
app.use('/api/auth', authRouter);
app.use('/api/safety', safetyRouter);

// Mount Protected Routes
app.use('/api/profile', authMiddleware, profileRouter);
app.use('/api/checkins', authMiddleware, checkinsRouter);
app.use('/api/companion', authMiddleware, companionRouter);
app.use('/api/twin', authMiddleware, twinRouter);
app.use('/api/simulator', authMiddleware, simulatorRouter);
app.use('/api/support', authMiddleware, supportRouter);
app.use('/api/counsellor', authMiddleware, counsellorRouter);
app.use('/api/radar', authMiddleware, radarRouter);
app.use('/api/privacy', authMiddleware, privacyRouter);
app.use('/api/admin', authMiddleware, adminRouter);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    product: 'Nivara — Digital Twin for Student Wellbeing & Anonymous Campus Radar',
    version: '1.0.0 (SIH 2026)',
    timestamp: new Date().toISOString()
  });
});

app.use(errorHandler);

export default app;
