import PrakritiMaster from '../models/prakritiMaster.model.js';
import TreatmentMaster from '../models/treatmentMaster.model.js';
import { logger } from '../utils/logger.js';

const DEFAULT_PRAKRITI = ['Vata', 'Pitta', 'Kapha'];
const DEFAULT_TREATMENTS = [
  'General Consult',
  'Panchakarma',
  'Follow-up',
  'Diet Consult',
  'Lab Review',
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
};
