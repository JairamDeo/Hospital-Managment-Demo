import authenticateToken from './authMiddleware.js';
import Customer from '../models/customer.model.js';
import { customResponse } from '../utils/response.js';
import { ErrorMessages } from '../utils/constants.js';

export const requireCustomer = async (req, res, next) => {
  try {
    if (req.user?.role !== 'customer') {
      return customResponse(res, ErrorMessages.ACCESS_DENIED, 403);
    }
    const customer = await Customer.findById(req.user.id).select('-otp -otpExpiresAt -lastOtpSentAt');
    if (!customer || !customer.status) {
      return customResponse(res, ErrorMessages.ACCESS_DENIED, 403);
    }
    req.customer = customer;
    next();
  } catch {
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};

export const customerAuth = [authenticateToken, requireCustomer];

export default customerAuth;
