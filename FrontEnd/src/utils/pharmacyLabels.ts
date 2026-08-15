import type { PharmacyItemType } from '@/types/pharmacy.types';

/** UI labels — internal type `strip` means tablet box (not blister strip). */
export const PHARMACY_ITEM_TYPE_OPTIONS: { value: PharmacyItemType; label: string }[] = [
  { value: 'unit', label: 'Single item' },
  { value: 'strip', label: 'Box' },
  { value: 'weight', label: 'Powder / Churan' },
];

export const itemTypeDisplayLabel = (type?: PharmacyItemType) =>
  PHARMACY_ITEM_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? 'Single item';
