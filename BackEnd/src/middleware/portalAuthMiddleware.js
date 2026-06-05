import authenticateToken from './authMiddleware.js';
import User from '../models/user.model.js';
import HmsStaff from '../models/hmsStaff.model.js';
import { customResponse } from '../utils/response.js';
import { ErrorMessages } from '../utils/constants.js';
import { getPortalPermissions } from '../utils/rbac.service.js';

export const resolvePortalAccount = async (req, res, next) => {
  try {
    const jwtRole = req.user?.role;

    if (jwtRole === 'admin') {
      const user = await User.findById(req.user.id).select('-password -otp -resetToken');
      if (!user || user.role !== 'admin' || !user.status) {
        return customResponse(res, ErrorMessages.ACCESS_DENIED, 403);
      }
      req.admin = user;
      req.accountType = 'admin';
      req.permissions = await getPortalPermissions('admin');
      return next();
    }

    if (jwtRole === 'staff') {
      const staff = await HmsStaff.findById(req.user.id).select('-password');
      if (!staff || !staff.status) {
        return customResponse(res, ErrorMessages.ACCESS_DENIED, 403);
      }
      req.staff = staff;
      req.accountType = 'staff';
      req.permissions = await getPortalPermissions('staff', staff.role);
      return next();
    }

    return customResponse(res, ErrorMessages.ACCESS_DENIED, 403);
  } catch {
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};

export const requireAdminOnly = async (req, res, next) => {
  if (req.accountType !== 'admin') {
    return customResponse(res, ErrorMessages.ACCESS_DENIED, 403);
  }
  next();
};

export const requireModulePermission =
  (moduleKey, action = 'view') =>
  (req, res, next) => {
    if (req.accountType === 'admin') return next();
    const mod = req.permissions?.[moduleKey];
    const allowed = action === 'edit' ? mod?.edit : mod?.view;
    if (!allowed) {
      return customResponse(res, ErrorMessages.ACCESS_DENIED, 403);
    }
    next();
  };

export const portalAuth = [authenticateToken, resolvePortalAccount];

export default portalAuth;
