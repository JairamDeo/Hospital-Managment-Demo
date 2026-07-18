import PrakritiMaster from '../../models/prakritiMaster.model.js';
import TreatmentMaster from '../../models/treatmentMaster.model.js';
import PharmacyCategoryMaster from '../../models/pharmacyCategoryMaster.model.js';
import PharmacyUnitMaster from '../../models/pharmacyUnitMaster.model.js';
import PharmacySpoonMaster from '../../models/pharmacySpoonMaster.model.js';
import RoomMaster from '../../models/roomMaster.model.js';
import LabTestCategoryMaster from '../../models/labTestCategoryMaster.model.js';
import LabTestMaster from '../../models/labTestMaster.model.js';
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

const nextPharmacySpoonCode = async () => {
  const count = await PharmacySpoonMaster.countDocuments();
  return `PHS-${String(count + 1).padStart(3, '0')}`;
};

const nextRoomCode = async () => {
  const count = await RoomMaster.countDocuments();
  return `ROM-${String(count + 1).padStart(3, '0')}`;
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

export const listPharmacySpoons = async (activeOnly = false) => {
  const filter = activeOnly ? { active: true } : {};
  return PharmacySpoonMaster.find(filter).sort({ grams: 1 }).lean();
};

export const createPharmacySpoon = async ({ name, grams }) => {
  const trimmed = name.trim();
  const exists = await PharmacySpoonMaster.findOne({
    name: new RegExp(`^${trimmed}$`, 'i'),
  });
  if (exists) throw new Error(MASTER_MESSAGES.PHARMACY_SPOON_EXISTS);

  const value = Number(grams);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error('Spoon grams must be greater than 0');
  }

  const isFirst = (await PharmacySpoonMaster.countDocuments()) === 0;
  return PharmacySpoonMaster.create({
    code: await nextPharmacySpoonCode(),
    name: trimmed,
    grams: value,
    isDefault: isFirst,
  });
};

export const updatePharmacySpoon = async (id, payload) => {
  const item = await PharmacySpoonMaster.findById(id);
  if (!item) throw new Error(MASTER_MESSAGES.NOT_FOUND);
  if (payload.name !== undefined) item.name = payload.name.trim();
  if (payload.grams !== undefined) {
    const value = Number(payload.grams);
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error('Spoon grams must be greater than 0');
    }
    item.grams = value;
  }
  if (payload.active !== undefined) item.active = payload.active;
  await item.save();
  return item;
};

export const setDefaultPharmacySpoon = async (id) => {
  const item = await PharmacySpoonMaster.findById(id);
  if (!item) throw new Error(MASTER_MESSAGES.NOT_FOUND);
  await PharmacySpoonMaster.updateMany({}, { isDefault: false });
  item.isDefault = true;
  item.active = true;
  await item.save();
  return item;
};

export const listRooms = async (activeOnly = false, roomType) => {
  const filter = {};
  if (activeOnly) filter.active = true;
  if (roomType) filter.roomType = roomType;
  return RoomMaster.find(filter).sort({ roomNumber: 1 }).lean();
};

export const createRoom = async (payload) => {
  const roomNumber = payload.roomNumber.trim();
  const exists = await RoomMaster.findOne({
    roomNumber: new RegExp(`^${roomNumber}$`, 'i'),
  });
  if (exists) throw new Error(MASTER_MESSAGES.ROOM_EXISTS);

  const capacity = Number(payload.capacity);
  if (!Number.isFinite(capacity) || capacity < 1) {
    throw new Error('Room capacity must be at least 1');
  }

  return RoomMaster.create({
    code: await nextRoomCode(),
    roomNumber,
    name: payload.name.trim(),
    roomType: payload.roomType,
    capacity,
  });
};

export const updateRoom = async (id, payload) => {
  const item = await RoomMaster.findById(id);
  if (!item) throw new Error(MASTER_MESSAGES.NOT_FOUND);

  if (payload.roomNumber !== undefined) {
    const roomNumber = payload.roomNumber.trim();
    const exists = await RoomMaster.findOne({
      roomNumber: new RegExp(`^${roomNumber}$`, 'i'),
      _id: { $ne: id },
    });
    if (exists) throw new Error(MASTER_MESSAGES.ROOM_EXISTS);
    item.roomNumber = roomNumber;
  }
  if (payload.name !== undefined) item.name = payload.name.trim();
  if (payload.roomType !== undefined) item.roomType = payload.roomType;
  if (payload.active !== undefined) item.active = payload.active;
  await item.save();
  return item;
};

const nextLabCategoryCode = async () => {
  const count = await LabTestCategoryMaster.countDocuments();
  return `LTC-${String(count + 1).padStart(3, '0')}`;
};

const nextLabTestCode = async () => {
  const count = await LabTestMaster.countDocuments();
  return `LBT-${String(count + 1).padStart(3, '0')}`;
};

export const listLabTestCategories = async (activeOnly = false) => {
  const filter = activeOnly ? { active: true } : {};
  return LabTestCategoryMaster.find(filter).sort({ name: 1 }).lean();
};

export const createLabTestCategory = async (name) => {
  const trimmed = name.trim();
  const exists = await LabTestCategoryMaster.findOne({ name: new RegExp(`^${trimmed}$`, 'i') });
  if (exists) throw new Error(MASTER_MESSAGES.LAB_CATEGORY_EXISTS);
  return LabTestCategoryMaster.create({ code: await nextLabCategoryCode(), name: trimmed });
};

export const updateLabTestCategory = async (id, payload) => {
  const item = await LabTestCategoryMaster.findById(id);
  if (!item) throw new Error(MASTER_MESSAGES.NOT_FOUND);
  if (payload.name !== undefined) item.name = payload.name.trim();
  if (payload.active !== undefined) item.active = payload.active;
  await item.save();

  if (payload.name !== undefined || payload.active !== undefined) {
    await LabTestMaster.updateMany(
      { category: item._id },
      {
        ...(payload.name !== undefined ? { categoryName: item.name } : {}),
        ...(payload.active === false ? { active: false } : {}),
      }
    );
  }
  return item;
};

export const listLabTests = async (activeOnly = false, categoryId) => {
  const filter = {};
  if (activeOnly) filter.active = true;
  if (categoryId) filter.category = categoryId;
  return LabTestMaster.find(filter).sort({ categoryName: 1, name: 1 }).lean();
};

export const createLabTest = async ({ name, categoryId }) => {
  const trimmed = name.trim();
  const category = await LabTestCategoryMaster.findById(categoryId);
  if (!category || !category.active) throw new Error(MASTER_MESSAGES.NOT_FOUND);

  const exists = await LabTestMaster.findOne({
    category: category._id,
    name: new RegExp(`^${trimmed}$`, 'i'),
  });
  if (exists) throw new Error(MASTER_MESSAGES.LAB_TEST_EXISTS);

  return LabTestMaster.create({
    code: await nextLabTestCode(),
    name: trimmed,
    category: category._id,
    categoryCode: category.code,
    categoryName: category.name,
  });
};

export const updateLabTest = async (id, payload) => {
  const item = await LabTestMaster.findById(id);
  if (!item) throw new Error(MASTER_MESSAGES.NOT_FOUND);

  if (payload.categoryId) {
    const category = await LabTestCategoryMaster.findById(payload.categoryId);
    if (!category) throw new Error(MASTER_MESSAGES.NOT_FOUND);
    item.category = category._id;
    item.categoryCode = category.code;
    item.categoryName = category.name;
  }
  if (payload.name !== undefined) item.name = payload.name.trim();
  if (payload.active !== undefined) item.active = payload.active;
  await item.save();
  return item;
};
