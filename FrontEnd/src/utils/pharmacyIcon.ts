import type { LucideIcon } from 'lucide-react';
import {
  Droplets,
  FlaskConical,
  Flower2,
  Leaf,
  Pill,
  Sprout,
  Wine,
  Wind,
} from 'lucide-react';

type IconRule = {
  test: (text: string) => boolean;
  icon: LucideIcon;
};

const RULES: IconRule[] = [
  {
    test: (t) => /\b(oil|ghrita|tail|ghee)\b/i.test(t),
    icon: Droplets,
  },
  {
    test: (t) => /\b(juice|tonic|drink|syrup|sharbat)\b/i.test(t),
    icon: Wine,
  },
  {
    test: (t) => /\b(powder|churna|bhasma)\b/i.test(t),
    icon: Sprout,
  },
  {
    test: (t) => /\b(chyawanprash|rasayana|avaleha|jam)\b/i.test(t),
    icon: FlaskConical,
  },
  {
    test: (t) => /\b(triphala|formula|kwath|kashay|tablet|vati|capsule)\b/i.test(t),
    icon: Flower2,
  },
  {
    test: (t) => /\b(ashwagandha|adaptogen|shatavari|brahmi|herb|extract|leaf)\b/i.test(t),
    icon: Leaf,
  },
  {
    test: (t) => /\b(medicated oil)\b/i.test(t),
    icon: Droplets,
  },
  {
    test: (t) => /\b(inhal|nasya|steam)\b/i.test(t),
    icon: Wind,
  },
  {
    test: (t) => /\b(medicine|tablet|pill)\b/i.test(t),
    icon: Pill,
  },
];

const DEFAULT_ICON = Sprout;

/** Pick a pharmacy-related icon from item name and category. */
export const getPharmacyItemIcon = (name: string, category = ''): LucideIcon => {
  const text = `${name} ${category}`.trim();
  for (const rule of RULES) {
    if (rule.test(text)) return rule.icon;
  }
  return DEFAULT_ICON;
};
