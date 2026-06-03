import { customResponse } from '../../utils/response.js';
import { ErrorMessages, MASTER_MESSAGES } from '../../utils/constants.js';
import {
  listPrakriti,
  listTreatments,
  listPharmacyCategories,
  listPharmacyUnits,
  createPrakriti,
  createTreatment,
  createPharmacyCategory,
  createPharmacyUnit,
  updatePrakriti,
  updateTreatment,
  updatePharmacyCategory,
  updatePharmacyUnit,
} from '../services/master.service.js';

export const getPrakritiList = async (_req, res) => {
  try {
    const items = await listPrakriti(false);
    return customResponse(res, MASTER_MESSAGES.PRAKRITI_LIST, 200, { items });
  } catch {
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};

export const postPrakriti = async (req, res) => {
  try {
    const item = await createPrakriti(req.body.name);
    return customResponse(res, MASTER_MESSAGES.PRAKRITI_CREATED, 201, { item });
  } catch (error) {
    if (error.message === MASTER_MESSAGES.PRAKRITI_EXISTS) {
      return customResponse(res, error.message, 409);
    }
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};

export const patchPrakriti = async (req, res) => {
  try {
    const item = await updatePrakriti(req.params.id, req.body);
    return customResponse(res, MASTER_MESSAGES.PRAKRITI_UPDATED, 200, { item });
  } catch (error) {
    if (error.message === MASTER_MESSAGES.NOT_FOUND) {
      return customResponse(res, error.message, 404);
    }
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};

export const getTreatmentList = async (_req, res) => {
  try {
    const items = await listTreatments(false);
    return customResponse(res, MASTER_MESSAGES.TREATMENT_LIST, 200, { items });
  } catch {
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};

export const postTreatment = async (req, res) => {
  try {
    const item = await createTreatment(req.body.name);
    return customResponse(res, MASTER_MESSAGES.TREATMENT_CREATED, 201, { item });
  } catch (error) {
    if (error.message === MASTER_MESSAGES.TREATMENT_EXISTS) {
      return customResponse(res, error.message, 409);
    }
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};

export const patchTreatment = async (req, res) => {
  try {
    const item = await updateTreatment(req.params.id, req.body);
    return customResponse(res, MASTER_MESSAGES.TREATMENT_UPDATED, 200, { item });
  } catch (error) {
    if (error.message === MASTER_MESSAGES.NOT_FOUND) {
      return customResponse(res, error.message, 404);
    }
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};

export const getPharmacyCategoryList = async (req, res) => {
  try {
    const activeOnly = req.query.active === 'true';
    const items = await listPharmacyCategories(activeOnly);
    return customResponse(res, MASTER_MESSAGES.PHARMACY_CATEGORY_LIST, 200, { items });
  } catch {
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};

export const postPharmacyCategory = async (req, res) => {
  try {
    const item = await createPharmacyCategory(req.body.name);
    return customResponse(res, MASTER_MESSAGES.PHARMACY_CATEGORY_CREATED, 201, { item });
  } catch (error) {
    if (error.message === MASTER_MESSAGES.PHARMACY_CATEGORY_EXISTS) {
      return customResponse(res, error.message, 409);
    }
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};

export const patchPharmacyCategory = async (req, res) => {
  try {
    const item = await updatePharmacyCategory(req.params.id, req.body);
    return customResponse(res, MASTER_MESSAGES.PHARMACY_CATEGORY_UPDATED, 200, { item });
  } catch (error) {
    if (error.message === MASTER_MESSAGES.NOT_FOUND) {
      return customResponse(res, error.message, 404);
    }
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};

export const getPharmacyUnitList = async (req, res) => {
  try {
    const activeOnly = req.query.active === 'true';
    const items = await listPharmacyUnits(activeOnly);
    return customResponse(res, MASTER_MESSAGES.PHARMACY_UNIT_LIST, 200, { items });
  } catch {
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};

export const postPharmacyUnit = async (req, res) => {
  try {
    const item = await createPharmacyUnit(req.body.name);
    return customResponse(res, MASTER_MESSAGES.PHARMACY_UNIT_CREATED, 201, { item });
  } catch (error) {
    if (error.message === MASTER_MESSAGES.PHARMACY_UNIT_EXISTS) {
      return customResponse(res, error.message, 409);
    }
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};

export const patchPharmacyUnit = async (req, res) => {
  try {
    const item = await updatePharmacyUnit(req.params.id, req.body);
    return customResponse(res, MASTER_MESSAGES.PHARMACY_UNIT_UPDATED, 200, { item });
  } catch (error) {
    if (error.message === MASTER_MESSAGES.NOT_FOUND) {
      return customResponse(res, error.message, 404);
    }
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};
