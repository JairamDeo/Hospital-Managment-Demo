// src/config/db.js
import { connect } from 'mongoose';
import { config } from 'dotenv';
import { logger } from '../utils/logger.js';

config();

const connectDB = async () => {
  try {
    await connect(process.env.MONGO_URI, {
    });
    logger.info('MongoDB connected successfully');
  } catch (err) {
    logger.error('MongoDB connection error: ' + err.message);
    process.exit(1);
  }
};

export default connectDB;
