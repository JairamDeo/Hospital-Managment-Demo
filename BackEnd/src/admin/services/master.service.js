import PrakritiMaster from '../../models/prakritiMaster.model.js';
import TreatmentMaster from '../../models/treatmentMaster.model.js';
import PharmacyCategoryMaster from '../../models/pharmacyCategoryMaster.model.js';
import PharmacyUnitMaster from '../../models/pharmacyUnitMaster.model.js';
import PharmacySpoonMaster from '../../models/pharmacySpoonMaster.model.js';
import RoomMaster from '../../models/roomMaster.model.js';
import LabTestCategoryMaster from '../../models/labTestCategoryMaster.model.js';
import LabTestMaster from '../../models/labTestMaster.model.js';
import ChuranCombinationMaster from '../../models/churanCombinationMaster.model.js';
import moment from 'moment';
import AppointmentSlotMaster from '../../models/appointmentSlotMaster.model.js';
import { MASTER_MESSAGES } from '../../utils/constants.js';
import { buildChuranCombination, powderGramsFromSpoons } from '../../utils/prescription.util.js';

/** Normalize to "hh:mm AM/PM" e.g. 07:00 AM */
const formatSlotTimeLabel = (input) => {
  const parsed = moment(
    String(input || '').trim(),
    ['HH:mm', 'H:mm', 'hh:mm A', 'h:mm A', 'hh:mm a', 'h:mm a'],
    true
  );
  if (!parsed.isValid()) throw new Error('Invalid time. Use HH:mm');
  return parsed.format('hh:mm A');
};

const slotSortMinutes = (timeLabel) => {
  const parsed = moment(timeLabel, ['hh:mm A', 'h:mm A', 'HH:mm'], true);
  return parsed.isValid() ? parsed.hours() * 60 + parsed.minutes() : 0;
};

/** Build bookable windows: [start, start+gap), [start+gap, start+2*gap), ... until end */
export const generateSlotRangesInRange = (startTime, endTime, gapMinutes) => {
  const start = moment(formatSlotTimeLabel(startTime), 'hh:mm A', true);
  const end = moment(formatSlotTimeLabel(endTime), 'hh:mm A', true);
  const gap = Number(gapMinutes);
  if (!start.isValid() || !end.isValid()) throw new Error('Invalid start or end time');
  if (!Number.isFinite(gap) || gap < 5 || gap > 240) {
    throw new Error('Gap must be between 5 and 240 minutes');
  }
  if (!end.isAfter(start)) throw new Error('End time must be after start time');

  const ranges = [];
  const cursor = start.clone();
  while (cursor.clone().add(gap, 'minutes').isSameOrBefore(end)) {
    const slotStart = cursor.format('hh:mm A');
    const slotEnd = cursor.clone().add(gap, 'minutes').format('hh:mm A');
    ranges.push({
      time: slotStart,
      endTime: slotEnd,
      label: `${slotStart} – ${slotEnd}`,
    });
    cursor.add(gap, 'minutes');
    if (ranges.length > 200) throw new Error('Too many slots in this range');
  }
  if (!ranges.length) {
    throw new Error('No full slots fit in this range. Widen the range or reduce the gap.');
  }
  return ranges;
};

export const formatSlotRangeLabel = (time, endTime) => {
  if (endTime) return `${time} – ${endTime}`;
  return time;
};

const withSlotLabel = (row) => {
  const maxAppointments = Math.max(1, Number(row.maxAppointments) || 1);
  const endTime = row.endTime || '';
  return {
    ...row,
    endTime,
    maxAppointments,
    label: formatSlotRangeLabel(row.time, endTime),
  };
};

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

export const listAppointmentSlots = async (activeOnly = false) => {
  const filter = activeOnly ? { active: true } : {};
  const rows = await AppointmentSlotMaster.find(filter).lean();
  return rows
    .map(withSlotLabel)
    .sort((a, b) => slotSortMinutes(a.time) - slotSortMinutes(b.time));
};

export const createAppointmentSlot = async (time, maxAppointments = 1, endTime) => {
  const trimmed = formatSlotTimeLabel(time);
  const end = endTime
    ? formatSlotTimeLabel(endTime)
    : moment(trimmed, 'hh:mm A').add(30, 'minutes').format('hh:mm A');
  const max = Math.max(1, Math.min(100, Number(maxAppointments) || 1));
  const exists = await AppointmentSlotMaster.findOne({ time: new RegExp(`^${trimmed}$`, 'i') });
  if (exists) throw new Error('Appointment slot already exists');
  const item = await AppointmentSlotMaster.create({
    time: trimmed,
    endTime: end,
    maxAppointments: max,
  });
  return withSlotLabel(item.toObject());
};

export const createAppointmentSlotsRange = async ({
  startTime,
  endTime,
  gapMinutes,
  maxAppointments = 1,
}) => {
  const ranges = generateSlotRangesInRange(startTime, endTime, gapMinutes);
  const max = Math.max(1, Math.min(100, Number(maxAppointments) || 1));
  const created = [];
  const skipped = [];

  for (const range of ranges) {
    const exists = await AppointmentSlotMaster.findOne({
      time: new RegExp(`^${range.time}$`, 'i'),
    });
    if (exists) {
      exists.endTime = range.endTime;
      exists.maxAppointments = max;
      await exists.save();
      skipped.push(range.label);
      continue;
    }
    const item = await AppointmentSlotMaster.create({
      time: range.time,
      endTime: range.endTime,
      maxAppointments: max,
    });
    created.push(withSlotLabel(item.toObject()));
  }

  return {
    created,
    skipped,
    items: await listAppointmentSlots(false),
  };
};

export const updateAppointmentSlot = async (id, payload) => {
  const item = await AppointmentSlotMaster.findById(id);
  if (!item) throw new Error(MASTER_MESSAGES.NOT_FOUND);
  if (payload.time !== undefined) item.time = formatSlotTimeLabel(payload.time);
  if (payload.endTime !== undefined) item.endTime = formatSlotTimeLabel(payload.endTime);
  if (payload.active !== undefined) item.active = payload.active;
  if (payload.maxAppointments !== undefined) {
    item.maxAppointments = Math.max(1, Math.min(100, Number(payload.maxAppointments) || 1));
  }
  await item.save();
  return withSlotLabel(item.toObject());
};

export const destroyAppointmentSlot = async (id) => {
  const item = await AppointmentSlotMaster.findByIdAndDelete(id);
  if (!item) throw new Error(MASTER_MESSAGES.NOT_FOUND);
  return withSlotLabel(item.toObject ? item.toObject() : item);
};

/** Backfill maxAppointments + endTime on legacy slot docs */
export const ensureSlotMaxAppointments = async () => {
  await AppointmentSlotMaster.updateMany(
    {
      $or: [
        { maxAppointments: { $exists: false } },
        { maxAppointments: null },
        { maxAppointments: { $lt: 1 } },
      ],
    },
    { $set: { maxAppointments: 1 } }
  );

  const missingEnd = await AppointmentSlotMaster.find({
    $or: [{ endTime: { $exists: false } }, { endTime: null }, { endTime: '' }],
  });
  for (const row of missingEnd) {
    const start = moment(row.time, ['hh:mm A', 'h:mm A', 'HH:mm'], true);
    if (!start.isValid()) continue;
    row.endTime = start.clone().add(30, 'minutes').format('hh:mm A');
    await row.save();
  }
};

const nextChuranCode = async () => {
  const count = await ChuranCombinationMaster.countDocuments();
  return `CHU-${String(count + 1).padStart(4, '0')}`;
};

const normalizeMasterPowders = (powders = []) =>
  (powders ?? [])
    .map((p) => {
      const name = String(p?.name || '').trim();
      if (!name) return null;
      const spoonGrams = Number(p.spoonGrams) > 0 ? Number(p.spoonGrams) : 1.5;
      const quantitySpoons = Number(p.quantitySpoons) > 0 ? Number(p.quantitySpoons) : 1;
      const quantityGrams =
        Number(p.quantityGrams) > 0
          ? Number(p.quantityGrams)
          : powderGramsFromSpoons(quantitySpoons, spoonGrams);
      if (!(quantityGrams > 0)) return null;
      return {
        itemCode: String(p.itemCode || '').trim(),
        name,
        quantitySpoons,
        spoonGrams,
        quantityGrams,
      };
    })
    .filter(Boolean);

const formatChuranMaster = (doc) => {
  const row = doc.toObject ? doc.toObject() : { ...doc };
  return {
    _id: String(row._id),
    id: String(row._id),
    code: row.code,
    name: row.name,
    powders: row.powders ?? [],
    combination: row.combination || '',
    howToIntake: row.howToIntake || '',
    active: row.active !== false,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};

export const listChuranCombinations = async (activeOnly = false, q = '') => {
  const filter = {};
  if (activeOnly) filter.active = true;
  const query = String(q || '').trim();
  if (query) {
    filter.$or = [
      { name: new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
      { combination: new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
      { code: new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
    ];
  }
  const rows = await ChuranCombinationMaster.find(filter).sort({ name: 1 }).lean();
  return rows.map(formatChuranMaster);
};

export const createChuranCombination = async (payload) => {
  const name = String(payload.name || '').trim();
  if (!name) throw new Error('Churan name is required');
  const powders = normalizeMasterPowders(payload.powders);
  if (!powders.length) throw new Error('Add at least one medicine / powder');

  const exists = await ChuranCombinationMaster.findOne({
    name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
  });
  if (exists) throw new Error(MASTER_MESSAGES.CHURAN_EXISTS);

  const combination =
    String(payload.combination || '').trim() || buildChuranCombination(powders);

  const row = await ChuranCombinationMaster.create({
    code: await nextChuranCode(),
    name,
    powders,
    combination,
    howToIntake: String(payload.howToIntake || '').trim(),
    active: true,
  });
  return formatChuranMaster(row);
};

export const updateChuranCombination = async (id, payload) => {
  const item = await ChuranCombinationMaster.findById(id);
  if (!item) throw new Error(MASTER_MESSAGES.NOT_FOUND);

  if (payload.name !== undefined) {
    const name = String(payload.name || '').trim();
    if (!name) throw new Error('Churan name is required');
    const exists = await ChuranCombinationMaster.findOne({
      _id: { $ne: item._id },
      name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
    });
    if (exists) throw new Error(MASTER_MESSAGES.CHURAN_EXISTS);
    item.name = name;
  }
  if (payload.powders !== undefined) {
    const powders = normalizeMasterPowders(payload.powders);
    if (!powders.length) throw new Error('Add at least one medicine / powder');
    item.powders = powders;
    item.combination =
      String(payload.combination || '').trim() || buildChuranCombination(powders);
  } else if (payload.combination !== undefined) {
    item.combination = String(payload.combination || '').trim();
  }
  if (payload.howToIntake !== undefined) {
    item.howToIntake = String(payload.howToIntake || '').trim();
  }
  if (payload.active !== undefined) item.active = Boolean(payload.active);

  await item.save();
  return formatChuranMaster(item);
};
