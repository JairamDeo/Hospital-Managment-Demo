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
  listPharmacySpoons,
  createPharmacySpoon,
  updatePharmacySpoon,
  setDefaultPharmacySpoon,
  listRooms,
  createRoom,
  updateRoom,
  listLabTestCategories,
  createLabTestCategory,
  updateLabTestCategory,
  listLabTests,
  createLabTest,
  updateLabTest,
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

export const getPharmacySpoonList = async (req, res) => {
  try {
    const activeOnly = req.query.active === 'true';
    const items = await listPharmacySpoons(activeOnly);
    return customResponse(res, MASTER_MESSAGES.PHARMACY_SPOON_LIST, 200, { items });
  } catch {
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};

export const postPharmacySpoon = async (req, res) => {
  try {
    const item = await createPharmacySpoon(req.body);
    return customResponse(res, MASTER_MESSAGES.PHARMACY_SPOON_CREATED, 201, { item });
  } catch (error) {
    if (error.message === MASTER_MESSAGES.PHARMACY_SPOON_EXISTS) {
      return customResponse(res, error.message, 409);
    }
    return customResponse(res, error.message || ErrorMessages.SERVER_ERROR, 400);
  }
};

export const patchPharmacySpoon = async (req, res) => {
  try {
    const item = await updatePharmacySpoon(req.params.id, req.body);
    return customResponse(res, MASTER_MESSAGES.PHARMACY_SPOON_UPDATED, 200, { item });
  } catch (error) {
    if (error.message === MASTER_MESSAGES.NOT_FOUND) {
      return customResponse(res, error.message, 404);
    }
    return customResponse(res, error.message || ErrorMessages.SERVER_ERROR, 400);
  }
};

export const postPharmacySpoonDefault = async (req, res) => {
  try {
    const item = await setDefaultPharmacySpoon(req.params.id);
    return customResponse(res, MASTER_MESSAGES.PHARMACY_SPOON_DEFAULT_SET, 200, { item });
  } catch (error) {
    if (error.message === MASTER_MESSAGES.NOT_FOUND) {
      return customResponse(res, error.message, 404);
    }
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};

export const getRoomList = async (req, res) => {
  try {
    const activeOnly = req.query.active === 'true';
    const roomType = req.query.roomType || undefined;
    const items = await listRooms(activeOnly, roomType);
    return customResponse(res, MASTER_MESSAGES.ROOM_LIST, 200, { items });
  } catch {
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};

export const postRoom = async (req, res) => {
  try {
    const item = await createRoom(req.body);
    return customResponse(res, MASTER_MESSAGES.ROOM_CREATED, 201, { item });
  } catch (error) {
    if (error.message === MASTER_MESSAGES.ROOM_EXISTS) {
      return customResponse(res, error.message, 409);
    }
    return customResponse(res, error.message || ErrorMessages.SERVER_ERROR, 400);
  }
};

export const patchRoom = async (req, res) => {
  try {
    const item = await updateRoom(req.params.id, req.body);
    return customResponse(res, MASTER_MESSAGES.ROOM_UPDATED, 200, { item });
  } catch (error) {
    if (error.message === MASTER_MESSAGES.NOT_FOUND) {
      return customResponse(res, error.message, 404);
    }
    if (error.message === MASTER_MESSAGES.ROOM_EXISTS) {
      return customResponse(res, error.message, 409);
    }
    return customResponse(res, error.message || ErrorMessages.SERVER_ERROR, 400);
  }
};

export const getLabCategoryList = async (_req, res) => {
  try {
    const items = await listLabTestCategories(false);
    return customResponse(res, MASTER_MESSAGES.LAB_CATEGORY_LIST, 200, { items });
  } catch {
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};

export const postLabCategory = async (req, res) => {
  try {
    const item = await createLabTestCategory(req.body.name);
    return customResponse(res, MASTER_MESSAGES.LAB_CATEGORY_CREATED, 201, { item });
  } catch (error) {
    if (error.message === MASTER_MESSAGES.LAB_CATEGORY_EXISTS) {
      return customResponse(res, error.message, 409);
    }
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};

export const patchLabCategory = async (req, res) => {
  try {
    const item = await updateLabTestCategory(req.params.id, req.body);
    return customResponse(res, MASTER_MESSAGES.LAB_CATEGORY_UPDATED, 200, { item });
  } catch (error) {
    if (error.message === MASTER_MESSAGES.NOT_FOUND) {
      return customResponse(res, error.message, 404);
    }
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};

export const getLabTestList = async (req, res) => {
  try {
    const activeOnly = req.query.active === 'true';
    const items = await listLabTests(activeOnly, req.query.categoryId);
    return customResponse(res, MASTER_MESSAGES.LAB_TEST_LIST, 200, { items });
  } catch {
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};

export const postLabTest = async (req, res) => {
  try {
    const item = await createLabTest({
      name: req.body.name,
      categoryId: req.body.categoryId,
    });
    return customResponse(res, MASTER_MESSAGES.LAB_TEST_CREATED, 201, { item });
  } catch (error) {
    if (error.message === MASTER_MESSAGES.LAB_TEST_EXISTS) {
      return customResponse(res, error.message, 409);
    }
    if (error.message === MASTER_MESSAGES.NOT_FOUND) {
      return customResponse(res, error.message, 404);
    }
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};

export const patchLabTest = async (req, res) => {
  try {
    const item = await updateLabTest(req.params.id, req.body);
    return customResponse(res, MASTER_MESSAGES.LAB_TEST_UPDATED, 200, { item });
  } catch (error) {
    if (error.message === MASTER_MESSAGES.NOT_FOUND) {
      return customResponse(res, error.message, 404);
    }
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};
