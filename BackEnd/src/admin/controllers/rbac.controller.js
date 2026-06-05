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
    const config = await updateRbacConfig(role, req.body.modules);
    return customResponse(res, 'RBAC configuration updated', 200, { config });
  } catch (error) {
    logger.error('RBAC update error:', error);
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};
