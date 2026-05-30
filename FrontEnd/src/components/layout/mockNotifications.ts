import { ROUTES, appointmentDetailPath } from '@/constants/routes';

export type NotificationType = 'appointment' | 'billing' | 'pharmacy' | 'panchakarma' | 'patient';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  href?: string;
}

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n-1',
    type: 'appointment',
    title: 'Upcoming appointment',
    message: 'Priya Sharma — Panchakarma follow-up at 11:00 AM today.',
    time: '10 min ago',
    read: false,
    href: appointmentDetailPath('APT-002'),
  },
  {
    id: 'n-2',
    type: 'billing',
    title: 'Overdue invoice',
    message: 'INV-1019 for Arjun Patel (₹1,500) is overdue by 3 days.',
    time: '1 hr ago',
    read: false,
    href: '/billing/INV-1019',
  },
  {
    id: 'n-3',
    type: 'pharmacy',
    title: 'Critical stock alert',
    message: 'Brahmi Oil is down to 45 units — reorder recommended.',
    time: '2 hrs ago',
    read: false,
    href: ROUTES.PHARMACY,
  },
  {
    id: 'n-4',
    type: 'panchakarma',
    title: 'Program milestone',
    message: 'Vamana therapy Day 3 completed for Priya Sharma.',
    time: '3 hrs ago',
    read: false,
    href: ROUTES.PANCHAKARMA,
  },
  {
    id: 'n-5',
    type: 'patient',
    title: 'New patient registered',
    message: 'Rahul Singh (AH-10024) added to the patient registry.',
    time: 'Yesterday',
    read: true,
    href: '/patients/AH-10024',
  },
  {
    id: 'n-6',
    type: 'billing',
    title: 'Payment received',
    message: '₹12,500 received for INV-1024 via UPI.',
    time: 'Yesterday',
    read: true,
    href: '/billing/INV-1024',
  },
  {
    id: 'n-7',
    type: 'appointment',
    title: 'Schedule update',
    message: 'Dr. Rekha Nair marked 2 afternoon slots as available.',
    time: '2 days ago',
    read: true,
    href: ROUTES.APPOINTMENTS,
  },
];
