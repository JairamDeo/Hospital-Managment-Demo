import PrakritiMaster from '../models/prakritiMaster.model.js';
import TreatmentMaster from '../models/treatmentMaster.model.js';
import RoomMaster from '../models/roomMaster.model.js';
import { logger } from '../utils/logger.js';

const DEFAULT_PRAKRITI = ['Vata', 'Pitta', 'Kapha'];
const DEFAULT_TREATMENTS = [
  'General Consult',
  'Panchakarma',
  'Follow-up',
  'Diet Consult',
  'Lab Review',
];

const DEFAULT_ROOMS = [
  { roomNumber: 'PK-01', name: 'Room 1', roomType: 'Panchakarma', capacity: 1 },
  { roomNumber: 'PK-02', name: 'Room 2', roomType: 'Panchakarma', capacity: 1 },
  { roomNumber: 'PK-03', name: 'Room 3', roomType: 'Panchakarma', capacity: 1 },
  { roomNumber: 'PK-04', name: 'Room 4', roomType: 'Panchakarma', capacity: 1 },
  { roomNumber: 'IPD-01', name: 'IPD Ward A', roomType: 'IPD', capacity: 5 },
  { roomNumber: 'IPD-02', name: 'IPD Ward B', roomType: 'IPD', capacity: 3 },
];

const nextCode = async (Model, prefix) => {
  const count = await Model.countDocuments();
  return `${prefix}-${String(count + 1).padStart(3, '0')}`;
};

export const seedMastersIfEmpty = async () => {
  const prakritiCount = await PrakritiMaster.countDocuments();
  if (prakritiCount === 0) {
    for (const name of DEFAULT_PRAKRITI) {
      const code = await nextCode(PrakritiMaster, 'PRK');
      await PrakritiMaster.create({ code, name });
    }
    logger.info('Seeded default Prakriti master data');
  }

  const treatmentCount = await TreatmentMaster.countDocuments();
  if (treatmentCount === 0) {
    for (const name of DEFAULT_TREATMENTS) {
      const code = await nextCode(TreatmentMaster, 'TRT');
      await TreatmentMaster.create({ code, name });
    }
    logger.info('Seeded default Treatment master data');
  }

  const roomCount = await RoomMaster.countDocuments();
  if (roomCount === 0) {
    for (const row of DEFAULT_ROOMS) {
      const code = await nextCode(RoomMaster, 'ROM');
      await RoomMaster.create({ code, ...row });
    }
    logger.info('Seeded default Room master data');
  }
};
