import PharmacyItem from '../models/pharmacyItem.model.js';

/**
 * Pharmacy item code format: item-001/mm-yy (sequence resets each calendar month)
 */
export const generatePharmacyItemCode = async (date = new Date()) => {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);
  const period = `${mm}-${yy}`;
  const escapedPeriod = period.replace('-', '\\-');

  const last = await PharmacyItem.findOne({
    itemCode: { $regex: new RegExp(`^item-\\d{3}/${escapedPeriod}$`, 'i') },
  })
    .sort({ itemCode: -1 })
    .select('itemCode')
    .lean();

  let seq = 1;
  if (last?.itemCode) {
    const match = last.itemCode.match(/^item-(\d{3})\//i);
    if (match) seq = parseInt(match[1], 10) + 1;
  }

  return `item-${String(seq).padStart(3, '0')}/${period}`;
};
