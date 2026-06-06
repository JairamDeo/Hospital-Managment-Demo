import HmsStructuredPrescription from '../models/hmsStructuredPrescription.model.js';

export const generatePrescriptionCode = async () => {
  const count = await HmsStructuredPrescription.countDocuments();
  const seq = String(count + 1).padStart(4, '0');
  const month = new Date().getMonth() + 1;
  const year = String(new Date().getFullYear()).slice(-2);
  return `RX-${seq}/${String(month).padStart(2, '0')}-${year}`;
};

export const countMedicineDoses = (timing = {}) => {
  const keys = [
    'morningBefore',
    'morningAfter',
    'afternoonBefore',
    'afternoonAfter',
    'eveningBefore',
    'eveningAfter',
    'nightBefore',
    'nightAfter',
    'bedtime',
  ];
  return keys.reduce((sum, key) => sum + (timing[key] ? 1 : 0), 0);
};

export const buildIntakeInstructions = (timing = {}) => {
  const parts = [];
  const slot = (label, before, after) => {
    const bits = [];
    if (before) bits.push('before meal');
    if (after) bits.push('after meal');
    if (bits.length) parts.push(`${label}: ${bits.join(', ')}`);
  };
  slot('Morning', timing.morningBefore, timing.morningAfter);
  slot('Afternoon', timing.afternoonBefore, timing.afternoonAfter);
  slot('Evening', timing.eveningBefore, timing.eveningAfter);
  slot('Night', timing.nightBefore, timing.nightAfter);
  if (timing.bedtime) parts.push('Bedtime');
  return parts.join(' · ');
};

export const computeMedicineTotalQty = (packQuantity, timing = {}) => {
  const perDay = countMedicineDoses(timing);
  const packs = Number(packQuantity) || 1;
  return Math.max(1, perDay * packs);
};
