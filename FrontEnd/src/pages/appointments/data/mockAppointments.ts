/** @deprecated List data comes from API. Types moved to @/types/appointment.types */
export type {
  AppointmentType,
  AppointmentStatus,
  CalendarDotType,
  Appointment,
  AppointmentFormValues,
  AppointmentStats,
} from '@/types/appointment.types';

export {
  APPOINTMENT_TYPE_OPTIONS,
  TIME_SLOTS,
} from '@/types/appointment.types';

export { emptyAppointmentForm } from '@/utils/appointmentHelpers';

export const APPOINTMENT_STATS = {
  scheduledToday: 0,
  completed: 0,
  panchakarma: 0,
  cancelled: 0,
};

export const CALENDAR_DOTS: Record<number, import('@/types/appointment.types').CalendarDotType[]> = {};

export const MOCK_APPOINTMENTS: import('@/types/appointment.types').Appointment[] = [];
