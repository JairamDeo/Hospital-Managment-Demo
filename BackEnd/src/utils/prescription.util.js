import HmsStructuredPrescription from '../models/hmsStructuredPrescription.model.js';

export const generatePrescriptionCode = async () => {
  const count = await HmsStructuredPrescription.countDocuments();
  const seq = String(count + 1).padStart(4, '0');
  const month = new Date().getMonth() + 1;
  const year = String(new Date().getFullYear()).slice(-2);
  return `RX-${seq}/${String(month).padStart(2, '0')}-${year}`;
};

/** Active slots used for dosing (evening removed from UI) */
const ACTIVE_TIMING_KEYS = [
  'morningBefore',
  'morningAfter',
  'afternoonBefore',
  'nightBefore',
  'nightAfter',
  'bedtime',
];

export const countMedicineDoses = (timing = {}) =>
  ACTIVE_TIMING_KEYS.reduce((sum, key) => sum + (timing[key] ? 1 : 0), 0);

export const buildIntakeInstructions = (timing = {}, extras = {}) => {
  const parts = [];
  const slot = (label, before, after) => {
    const bits = [];
    if (before) bits.push('before meal');
    if (after) bits.push('after meal');
    if (bits.length) parts.push(`${label}: ${bits.join(', ')}`);
  };
  slot('Morning', timing.morningBefore, timing.morningAfter);
  if (timing.afternoonBefore) parts.push('Afternoon: before meal');
  if (timing.afternoonAfter) parts.push('Afternoon: after meal');
  slot('Night', timing.nightBefore, timing.nightAfter);
  if (timing.bedtime) parts.push('Bedtime');

  if (extras.isLiquid && Number(extras.mlIntake) > 0) {
    parts.unshift(`${Number(extras.mlIntake)} ml per dose`);
  }
  const days = Math.max(1, Number(extras.durationDays) || 1);
  const frequency = extras.frequency === 'weekly' ? 'weekly' : 'daily';
  parts.push(frequency === 'weekly' ? `${days} week(s)` : `${days} day(s)`);

  return parts.join(' · ');
};

export const computeMedicineTotalQty = (
  packQuantity,
  timing = {},
  { durationDays = 1, frequency = 'daily', mlIntake, isLiquid } = {}
) => {
  const perDay = countMedicineDoses(timing);
  const duration = Math.max(1, Number(durationDays) || 1);
  const qty = isLiquid
    ? Math.max(1, Number(mlIntake) || 1)
    : Math.max(1, Number(packQuantity) || 1);
  void frequency;
  return Math.max(1, perDay * qty * duration);
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
  const base =
    Number.isFinite(grams) && grams > 0
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
