export type SettingsSectionId =
  | 'clinic'
  | 'account'
  | 'appointments'
  | 'billing'
  | 'panchakarma'
  | 'notifications'
  | 'security'
  | 'rbac';

export interface ClinicSettings {
  name: string;
  tagline: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  registrationNo: string;
  timezone: string;
}

export interface AppointmentSettings {
  openTime: string;
  closeTime: string;
  slotMinutes: number;
  maxDailyAppointments: number;
  weekendClosed: boolean;
}

export interface BillingSettings {
  taxPercent: number;
  invoicePrefix: string;
  paymentDueDays: number;
  autoPaymentReminder: boolean;
  acceptInsurance: boolean;
}

export interface PanchakarmaSettings {
  defaultProgramDays: number;
  maxConcurrentPatients: number;
  therapyRooms: number;
  requireConsentForm: boolean;
}

export interface NotificationSettings {
  appointmentReminders: boolean;
  billingAlerts: boolean;
  pharmacyLowStock: boolean;
  panchakarmaUpdates: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

export interface SecuritySettings {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AppSettings {
  clinic: ClinicSettings;
  appointments: AppointmentSettings;
  billing: BillingSettings;
  panchakarma: PanchakarmaSettings;
  notifications: NotificationSettings;
}

export const DEFAULT_SETTINGS: AppSettings = {
  clinic: {
    name: 'Ayurveda Health',
    tagline: 'Integrative Ayurveda Hospital & Wellness Centre',
    address: '42 Wellness Lane, Koregaon Park',
    city: 'Pune, Maharashtra 411001',
    phone: '+91 20 2567 8900',
    email: 'admin@ayurvedahealth.com',
    registrationNo: 'MH-AH-2019-0842',
    timezone: 'Asia/Kolkata (IST)',
  },
  appointments: {
    openTime: '08:00',
    closeTime: '20:00',
    slotMinutes: 30,
    maxDailyAppointments: 40,
    weekendClosed: true,
  },
  billing: {
    taxPercent: 5,
    invoicePrefix: 'INV',
    paymentDueDays: 15,
    autoPaymentReminder: true,
    acceptInsurance: true,
  },
  panchakarma: {
    defaultProgramDays: 7,
    maxConcurrentPatients: 12,
    therapyRooms: 4,
    requireConsentForm: true,
  },
  notifications: {
    appointmentReminders: true,
    billingAlerts: true,
    pharmacyLowStock: true,
    panchakarmaUpdates: true,
    emailNotifications: true,
    smsNotifications: false,
  },
};

export const TIMEZONE_OPTIONS = [
  'Asia/Kolkata (IST)',
  'Asia/Dubai (GST)',
  'Asia/Singapore (SGT)',
];

export const SLOT_OPTIONS = [15, 20, 30, 45, 60];
