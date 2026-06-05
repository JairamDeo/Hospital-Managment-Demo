import HmsStaff from '../models/hmsStaff.model.js';
import RbacRoleConfig from '../models/rbacRoleConfig.model.js';
import { DEFAULT_RBAC_BY_ROLE } from '../utils/rbacDefaults.js';
import { logger } from '../utils/logger.js';

/** Remove pharmacist staff and obsolete RBAC role (run via npm run seed). */
export const purgePharmacistRole = async () => {
  const staffResult = await HmsStaff.deleteMany({ role: 'Pharmacist' });
  const allowedRoles = Object.keys(DEFAULT_RBAC_BY_ROLE);
  const rbacResult = await RbacRoleConfig.deleteMany({ role: { $nin: allowedRoles } });

  if (staffResult.deletedCount || rbacResult.deletedCount) {
    logger.info(
      `Pharmacist role purge: ${staffResult.deletedCount} staff removed, ${rbacResult.deletedCount} RBAC config(s) removed`
    );
  }
};
