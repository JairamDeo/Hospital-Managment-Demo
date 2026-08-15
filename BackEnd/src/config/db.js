import mongoose from 'mongoose';
import { config } from 'dotenv';
import { logger } from '../utils/logger.js';

config();

const globalCache = globalThis;
if (!globalCache.__hmsMongoose) {
  globalCache.__hmsMongoose = { conn: null, promise: null };
}

const syncRazorpayPaymentIndexes = async () => {
  // Heavy index migration — run once via SYNC_RAZORPAY_INDEXES=true, not on every restart.
  if (process.env.SYNC_RAZORPAY_INDEXES !== 'true') {
    return;
  }

  const { default: HmsRazorpayPayment } = await import('../models/hmsRazorpayPayment.model.js');
  const coll = HmsRazorpayPayment.collection;

  await coll.updateMany({ razorpayOrderId: '' }, { $unset: { razorpayOrderId: '' } });
  await coll.updateMany({ razorpayQrCodeId: '' }, { $unset: { razorpayQrCodeId: '' } });
  await coll.updateMany({ razorpayPaymentLinkId: '' }, { $unset: { razorpayPaymentLinkId: '' } });
  await HmsRazorpayPayment.syncIndexes();
  logger.info('HmsRazorpayPayment indexes synced');
};

const connectDB = async () => {
  const cached = globalCache.__hmsMongoose;

  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not set');
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGO_URI, {
        bufferCommands: false,
        maxPoolSize: process.env.VERCEL ? 5 : 10,
      })
      .then(async (connection) => {
        logger.info('MongoDB connected successfully');
        await syncRazorpayPaymentIndexes();
        try {
          const { mergeRbacDefaults } = await import('../utils/rbac.service.js');
          await mergeRbacDefaults();
        } catch (error) {
          logger.warn(`RBAC merge skipped: ${error.message}`);
        }
        return connection;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    cached.conn = null;
    logger.error('MongoDB connection error: ' + err.message);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
    throw err;
  }
};

export default connectDB;
