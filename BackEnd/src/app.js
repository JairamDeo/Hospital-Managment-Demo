import express from 'express';
import { config } from 'dotenv';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import connectDB from './config/db.js';
import patientRoutes from './routes/patient.routes.js';
import userRoutes from './routes/user.routes.js';
import adminRoutes from './admin/routes/admin.routes.js';
import { customResponse } from './utils/response.js';
import { logger } from './utils/logger.js';

config();

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
].filter(Boolean);

const isDev = process.env.NODE_ENV !== 'production';

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (
        isDev &&
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }
      logger.warn(`CORS blocked origin: ${origin}`);
      return callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB();

app.get('/api/health', (_req, res) => {
  customResponse(res, 'OK', 200, { status: 'healthy' });
});

app.use('/api/patient', patientRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);

app.use(
  '/api/upload',
  (req, res, next) => {
    const filePath = path.join(process.cwd(), 'upload', req.path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }
    next();
  },
  express.static(path.join(process.cwd(), 'upload'))
);

app.use((req, res) => {
  logger.warn(`Route not found: ${req.originalUrl}`);
  customResponse(res, 'Route not found', 404);
});

export default app;
