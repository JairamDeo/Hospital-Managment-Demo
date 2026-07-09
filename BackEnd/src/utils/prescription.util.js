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

export const buildChuranCombination = (powders = []) =>
  powders
    .filter((p) => p?.name?.trim() && Number(p.quantityGrams) > 0)
    .map((p) => {
      const spoons = Number(p.quantitySpoons);
      const spoonGrams = Number(p.spoonGrams);
      const grams = Number(p.quantityGrams);
      if (Number.isFinite(spoons) && spoons > 0 && Number.isFinite(spoonGrams) && spoonGrams > 0) {
        const spoonLabel = spoons === 1 ? 'spoon' : 'spoons';
        return `${p.name.trim()} ${spoons} ${spoonLabel} (${grams}g)`;
      }
      return `${p.name.trim()} ${grams}g`;
    })
    .join(', ');

export const buildChuranIntakeText = (intakeSpoons, intakeSpoonGrams, note = '') => {
  const spoons = Number(intakeSpoons);
  const grams = Number(intakeSpoonGrams);
  if (!Number.isFinite(spoons) || spoons <= 0) return String(note || '').trim();

  const spoonLabel = spoons === 1 ? 'spoon' : 'spoons';
  const base = Number.isFinite(grams) && grams > 0
    ? `Take ${spoons} ${spoonLabel} (${grams}g each)`
    : `Take ${spoons} ${spoonLabel}`;
  const extra = String(note || '').trim();
  return extra ? `${base}. ${extra}` : base;
};

export const powderGramsFromSpoons = (quantitySpoons, spoonGrams) => {
  const spoons = Number(quantitySpoons);
  const perSpoon = Number(spoonGrams);
  if (!Number.isFinite(spoons) || spoons <= 0 || !Number.isFinite(perSpoon) || perSpoon <= 0) {
    return 0;
  }
  return Math.round(spoons * perSpoon * 1000) / 1000;
};
