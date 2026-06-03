import PrakritiMaster from '../../models/prakritiMaster.model.js';
import TreatmentMaster from '../../models/treatmentMaster.model.js';
import PharmacyCategoryMaster from '../../models/pharmacyCategoryMaster.model.js';
import PharmacyUnitMaster from '../../models/pharmacyUnitMaster.model.js';
import { MASTER_MESSAGES } from '../../utils/constants.js';

const nextPrakritiCode = async () => {
  const count = await PrakritiMaster.countDocuments();
  return `PRK-${String(count + 1).padStart(3, '0')}`;
};

const nextTreatmentCode = async () => {
  const count = await TreatmentMaster.countDocuments();
  return `TRT-${String(count + 1).padStart(3, '0')}`;
};

const nextPharmacyCategoryCode = async () => {
  const count = await PharmacyCategoryMaster.countDocuments();
  return `PHC-${String(count + 1).padStart(3, '0')}`;
};

const nextPharmacyUnitCode = async () => {
  const count = await PharmacyUnitMaster.countDocuments();
  return `PHU-${String(count + 1).padStart(3, '0')}`;
};

export const listPrakriti = async (activeOnly = false) => {
  const filter = activeOnly ? { active: true } : {};
  return PrakritiMaster.find(filter).sort({ createdAt: 1 }).lean();
};

export const listTreatments = async (activeOnly = false) => {
  const filter = activeOnly ? { active: true } : {};
  return TreatmentMaster.find(filter).sort({ createdAt: 1 }).lean();
};

export const createPrakriti = async (name) => {
  const trimmed = name.trim();
  const exists = await PrakritiMaster.findOne({ name: new RegExp(`^${trimmed}$`, 'i') });
  if (exists) throw new Error(MASTER_MESSAGES.PRAKRITI_EXISTS);
  return PrakritiMaster.create({ code: await nextPrakritiCode(), name: trimmed });
};

export const createTreatment = async (name) => {
  const trimmed = name.trim();
  const exists = await TreatmentMaster.findOne({ name: new RegExp(`^${trimmed}$`, 'i') });
  if (exists) throw new Error(MASTER_MESSAGES.TREATMENT_EXISTS);
  return TreatmentMaster.create({ code: await nextTreatmentCode(), name: trimmed });
};

export const updatePrakriti = async (id, payload) => {
  const item = await PrakritiMaster.findById(id);
  if (!item) throw new Error(MASTER_MESSAGES.NOT_FOUND);
  if (payload.name !== undefined) item.name = payload.name.trim();
  if (payload.active !== undefined) item.active = payload.active;
  await item.save();
  return item;
};

export const updateTreatment = async (id, payload) => {
  const item = await TreatmentMaster.findById(id);
  if (!item) throw new Error(MASTER_MESSAGES.NOT_FOUND);
  if (payload.name !== undefined) item.name = payload.name.trim();
  if (payload.active !== undefined) item.active = payload.active;
  await item.save();
  return item;
};

export const listPharmacyCategories = async (activeOnly = false) => {
  const filter = activeOnly ? { active: true } : {};
  return PharmacyCategoryMaster.find(filter).sort({ createdAt: 1 }).lean();
};

export const createPharmacyCategory = async (name) => {
  const trimmed = name.trim();
  const exists = await PharmacyCategoryMaster.findOne({
    name: new RegExp(`^${trimmed}$`, 'i'),
  });
  if (exists) throw new Error(MASTER_MESSAGES.PHARMACY_CATEGORY_EXISTS);
  return PharmacyCategoryMaster.create({
    code: await nextPharmacyCategoryCode(),
    name: trimmed,
  });
};

export const updatePharmacyCategory = async (id, payload) => {
  const item = await PharmacyCategoryMaster.findById(id);
  if (!item) throw new Error(MASTER_MESSAGES.NOT_FOUND);
  if (payload.name !== undefined) item.name = payload.name.trim();
  if (payload.active !== undefined) item.active = payload.active;
  await item.save();
  return item;
};

export const listPharmacyUnits = async (activeOnly = false) => {
  const filter = activeOnly ? { active: true } : {};
  return PharmacyUnitMaster.find(filter).sort({ createdAt: 1 }).lean();
};

export const createPharmacyUnit = async (name) => {
  const trimmed = name.trim();
  const exists = await PharmacyUnitMaster.findOne({
    name: new RegExp(`^${trimmed}$`, 'i'),
  });
  if (exists) throw new Error(MASTER_MESSAGES.PHARMACY_UNIT_EXISTS);
  return PharmacyUnitMaster.create({
    code: await nextPharmacyUnitCode(),
    name: trimmed,
  });
};

export const updatePharmacyUnit = async (id, payload) => {
  const item = await PharmacyUnitMaster.findById(id);
  if (!item) throw new Error(MASTER_MESSAGES.NOT_FOUND);
  if (payload.name !== undefined) item.name = payload.name.trim();
  if (payload.active !== undefined) item.active = payload.active;
  await item.save();
  return item;
};
