import express from 'express';
import { config } from 'dotenv';
import cors from 'cors';
import patientRoutes from './routes/patient.routes.js';
import userRoutes from './routes/user.routes.js';
import adminRoutes from './admin/routes/admin.routes.js';
import patientPortalRoutes from './patient-portal/routes/patientPortal.routes.js';
import hmsPatientRoutes from './admin/routes/hmsPatient.routes.js';
import hmsStaffRoutes from './admin/routes/hmsStaff.routes.js';
import hmsAppointmentRoutes from './admin/routes/hmsAppointment.routes.js';
import hmsPanchakarmaRoutes from './admin/routes/hmsPanchakarma.routes.js';
import rbacRoutes from './admin/routes/rbac.routes.js';
import masterRoutes from './admin/routes/master.routes.js';
import pharmacyRoutes from './admin/routes/pharmacy.routes.js';
import hmsBillingRoutes from './admin/routes/hmsBilling.routes.js';
import { postRazorpayWebhook } from './admin/controllers/hmsBilling.controller.js';
import hmsIpdRoutes from './admin/routes/hmsIpd.routes.js';
import hmsLabRoutes from './admin/routes/hmsLab.routes.js';
import connectDB from './config/db.js';
import { customResponse } from './utils/response.js';
import { logger } from './utils/logger.js';

config();

const app = express();

const vercelUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : null;

const allowedOrigins = [
  process.env.FRONTEND_URL,
  vercelUrl,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

const isDev = process.env.NODE_ENV !== 'production';
const isVercelOrigin = (origin) =>
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin);

// On Vercel, connect Mongo once per warm instance before handling requests.
if (process.env.VERCEL) {
  app.use(async (_req, res, next) => {
    try {
      await connectDB();
      next();
    } catch (error) {
      logger.error(`DB middleware failed: ${error.message}`);
      return customResponse(res, 'Database unavailable', 503);
    }
  });
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (isVercelOrigin(origin)) return callback(null, true);
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

app.post(
  '/api/admin/billing/razorpay/webhook',
  express.raw({ type: 'application/json' }),
  postRazorpayWebhook
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => {
  customResponse(res, 'OK', 200, { status: 'healthy' });
});

app.use('/api/patient', patientRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/patients', hmsPatientRoutes);
app.use('/api/admin/staff', hmsStaffRoutes);
app.use('/api/admin/appointments', hmsAppointmentRoutes);
app.use('/api/admin/panchakarma', hmsPanchakarmaRoutes);
app.use('/api/admin/rbac', rbacRoutes);
app.use('/api/admin/master', masterRoutes);
app.use('/api/admin/pharmacy', pharmacyRoutes);
app.use('/api/admin/billing', hmsBillingRoutes);
app.use('/api/admin/ipd', hmsIpdRoutes);
app.use('/api/admin/lab', hmsLabRoutes);
app.use('/api/patient-portal', patientPortalRoutes);

// Legacy local /api/upload paths — files now go to Cloudinary
app.use('/api/upload', (_req, res) =>
  customResponse(
    res,
    'This file was stored locally and is no longer available. Re-upload the report (Cloudinary).',
    410
  )
);

app.use((req, res) => {
  logger.warn(`Route not found: ${req.originalUrl}`);
  customResponse(res, 'Route not found', 404);
});

export default app;
