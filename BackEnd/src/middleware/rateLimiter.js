// middlewares/rateLimiter.js
import rateLimit from 'express-rate-limit';
import { RATE_LIMIT_MESSAGES } from '../utils/constants.js';

//Limit 5 requests per minute for sensitive routes (like registration, login)
export const registerRateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 100,
    handler: (req, res) => {
      return res.status(429).json({
        status: 'error',
        message: RATE_LIMIT_MESSAGES.REGISTER,
      });
    },
  });
  // Limit 3 requests per minute for contact routes
export const contactRateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 3,
    handler: (req, res) => {
      return res.status(429).json({
        status: 'error',
        message: RATE_LIMIT_MESSAGES.CONTACT,
      });
    },
  });

