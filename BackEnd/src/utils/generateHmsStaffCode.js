import HmsStaff from '../models/hmsStaff.model.js';

/** Staff code format: STF-001, STF-002, … */
export const generateHmsStaffCode = async () => {
  const last = await HmsStaff.findOne({ staffCode: { $regex: /^STF-\d{3}$/ } })
    .sort({ staffCode: -1 })
    .select('staffCode')
    .lean();

  let seq = 1;
  if (last?.staffCode) {
    const match = last.staffCode.match(/^STF-(\d{3})$/);
    if (match) seq = parseInt(match[1], 10) + 1;
  }

  return `STF-${String(seq).padStart(3, '0')}`;
};
