import HmsIpdAdmission from '../models/hmsIpdAdmission.model.js';

export const generateIpdCode = async () => {
  const count = await HmsIpdAdmission.countDocuments();
  return `IPD-${String(count + 1).padStart(4, '0')}`;
};
