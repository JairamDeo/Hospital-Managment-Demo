import { customResponse } from '../../utils/response.js';
import { ErrorMessages } from '../../utils/constants.js';
import { logger } from '../../utils/logger.js';
import { listRbacConfigs, updateRbacConfig } from '../../utils/rbac.service.js';

export const getRbacConfigs = async (_req, res) => {
  try {
    const configs = await listRbacConfigs();
    return customResponse(res, 'RBAC configuration fetched', 200, { configs });
  } catch (error) {
    logger.error('RBAC list error:', error);
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};

export const patchRbacConfig = async (req, res) => {
  try {
    const { role } = req.params;
    if (!role) {
      return customResponse(res, 'Role is required', 400);
    }
    const config = await updateRbacConfig(role, req.body.modules);
    return customResponse(res, 'RBAC configuration updated', 200, { config });
  } catch (error) {
    if (/Invalid staff role/i.test(String(error.message))) {
      return customResponse(res, error.message, 400);
    }
    logger.error('RBAC update error:', error);
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};
