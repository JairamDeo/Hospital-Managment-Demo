import authenticateToken from './authMiddleware.js';
import User from '../models/user.model.js';
import { customResponse } from '../utils/response.js';
import { ErrorMessages } from '../utils/constants.js';

export const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user || user.role !== 'admin') {
      return customResponse(res, ErrorMessages.ACCESS_DENIED, 403);
    }
    req.admin = user;
    next();
  } catch {
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};

export const adminAuth = [authenticateToken, requireAdmin];

export default adminAuth;
