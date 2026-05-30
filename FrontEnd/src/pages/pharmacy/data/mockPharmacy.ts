import type { LucideIcon } from 'lucide-react';
import {
  Droplets,
  FlaskConical,
  Flower2,
  Leaf,
  Sprout,
  Wine,
} from 'lucide-react';

export type StockStatus = 'Critical' | 'Low' | 'OK';

export type InventoryFilter = 'all' | 'critical' | 'low';

export interface PharmacyItem {
  id: string;
  name: string;
  subtitle: string;
  category: string;
  stock: number;
  maxStock: number;
  level: number;
  status: StockStatus;
  icon: LucideIcon;
}

export interface StockAlert {
  id: string;
  itemName: string;
  status: 'Critical' | 'Low';
  message: string;
}

export interface MonthlyUsageItem {
  id: string;
  name: string;
  usage: number;
}

export interface PharmacyItemFormValues {
  name: string;
  category: string;
  stock: number;
  maxStock: number;
}

export const PHARMACY_STATS = {
  totalItems: 248,
  lowStock: 12,
  critical: 3,
  pendingOrders: 7,
};

export const CATEGORY_OPTIONS = [
  'Medicated Oil',
  'Adaptogen',
  'Herbal Formula',
  'Rasayana',
  'Herbal Extract',
  'Health Tonic',
];

export const MOCK_INVENTORY: PharmacyItem[] = [
  {
    id: 'PH-001',
    name: 'Brahmi Oil',
    subtitle: 'Medicated Oil · 200ml',
    category: 'Medicated Oil',
    stock: 98,
    maxStock: 700,
    level: 14,
    status: 'Critical',
    icon: Droplets,
  },
  {
    id: 'PH-002',
    name: 'Ashwagandha Powder',
    subtitle: 'Adaptogen · 500g',
    category: 'Adaptogen',
    stock: 215,
    maxStock: 720,
    level: 30,
    status: 'Low',
    icon: Sprout,
  },
  {
    id: 'PH-003',
    name: 'Triphala Churna',
    subtitle: 'Herbal Formula · 250g',
    category: 'Herbal Formula',
    stock: 380,
    maxStock: 530,
    level: 72,
    status: 'OK',
    icon: Flower2,
  },
  {
    id: 'PH-004',
    name: 'Chyawanprash',
    subtitle: 'Rasayana · 500g',
    category: 'Rasayana',
    stock: 275,
    maxStock: 460,
    level: 60,
    status: 'OK',
    icon: FlaskConical,
  },
  {
    id: 'PH-005',
    name: 'Shatavari',
    subtitle: 'Herbal Extract · 100g',
    category: 'Herbal Extract',
    stock: 88,
    maxStock: 400,
    level: 22,
    status: 'Low',
    icon: Leaf,
  },
  {
    id: 'PH-006',
    name: 'Amla Juice',
    subtitle: 'Health Tonic · 1L',
    category: 'Health Tonic',
    stock: 95,
    maxStock: 1050,
    level: 9,
    status: 'Critical',
    icon: Wine,
  },
];

export const MOCK_STOCK_ALERTS: StockAlert[] = [
  {
    id: 'AL-1',
    itemName: 'Brahmi Oil',
    status: 'Critical',
    message: 'Only 98 units left. Reorder immediately.',
  },
  {
    id: 'AL-2',
    itemName: 'Ashwagandha',
    status: 'Low',
    message: '215 units remaining. Reorder soon.',
  },
  {
    id: 'AL-3',
    itemName: 'Amla Juice',
    status: 'Critical',
    message: 'Only 95 units left. Reorder immediately.',
  },
  {
    id: 'AL-4',
    itemName: 'Shatavari',
    status: 'Low',
    message: '88 units remaining. Reorder soon.',
  },
];

export const MOCK_MONTHLY_USAGE: MonthlyUsageItem[] = [
  { id: 'MU-1', name: 'Triphala', usage: 95 },
  { id: 'MU-2', name: 'Ashwagandha', usage: 88 },
  { id: 'MU-3', name: 'Brahmi Oil', usage: 82 },
  { id: 'MU-4', name: 'Amla Juice', usage: 75 },
  { id: 'MU-5', name: 'Shatavari', usage: 72 },
];

export const emptyPharmacyItemForm = (): PharmacyItemFormValues => ({
  name: '',
  category: 'Herbal Formula',
  stock: 100,
  maxStock: 500,
});

export const getStockStatus = (level: number): StockStatus => {
  if (level <= 15) return 'Critical';
  if (level <= 35) return 'Low';
  return 'OK';
};
