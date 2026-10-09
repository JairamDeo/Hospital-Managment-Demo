import { customResponse } from '../../utils/response.js';
import { ErrorMessages } from '../../utils/constants.js';
import { logger } from '../../utils/logger.js';
import {
  getClinicSettingsDto,
  updateClinicSettings,
} from '../services/clinicSettings.service.js';

export const getClinicSettings = async (_req, res) => {
  try {
    const settings = await getClinicSettingsDto();
    return customResponse(res, 'Clinic settings fetched', 200, { settings });
  } catch (error) {
    logger.error('Get clinic settings error:', error);
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};

export const patchClinicSettings = async (req, res) => {
  try {
    const settings = await updateClinicSettings(req.body || {});
    return customResponse(res, 'Clinic settings saved', 200, { settings });
  } catch (error) {
    logger.error('Update clinic settings error:', error);
    return customResponse(res, error.message || ErrorMessages.SERVER_ERROR, 400);
  }
};
