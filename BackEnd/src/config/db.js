// src/config/db.js
import { connect } from 'mongoose';
import { config } from 'dotenv';
import { logger } from '../utils/logger.js';

config();

const syncRazorpayPaymentIndexes = async () => {
  const { default: HmsRazorpayPayment } = await import('../models/hmsRazorpayPayment.model.js');
  const coll = HmsRazorpayPayment.collection;

  // Empty strings are indexed (unlike null/missing) and break sparse unique indexes.
  await coll.updateMany({ razorpayOrderId: '' }, { $unset: { razorpayOrderId: '' } });
  await coll.updateMany({ razorpayQrCodeId: '' }, { $unset: { razorpayQrCodeId: '' } });
  await HmsRazorpayPayment.syncIndexes();
  logger.info('HmsRazorpayPayment indexes synced');
};

const connectDB = async () => {
  try {
    await connect(process.env.MONGO_URI, {
    });
    logger.info('MongoDB connected successfully');
    await syncRazorpayPaymentIndexes();
  } catch (err) {
    logger.error('MongoDB connection error: ' + err.message);
    process.exit(1);
  }
};

export default connectDB;
